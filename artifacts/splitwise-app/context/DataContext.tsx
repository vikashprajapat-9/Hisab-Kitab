import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import * as api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export interface GroupMember {
  id: string;
  user_id: string;
  balance: number;
  user: UserProfile;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  currency: string;
  created_by: string;
  is_settled: boolean;
  total_expenses: number;
  created_at: string;
  group_members: GroupMember[];
}

export interface ExpenseSplit {
  user_id: string;
  amount: number;
  percentage?: number | null;
  user: UserProfile;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: string;
  category: string;
  notes?: string | null;
  created_by: string;
  created_at: string;
  payer: UserProfile;
  expense_splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id?: string | null;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  note?: string | null;
  created_at: string;
  from_user: UserProfile;
  to_user: UserProfile;
}

export interface Activity {
  id: string;
  type: string;
  user_id: string;
  group_id?: string | null;
  expense_id?: string | null;
  settlement_id?: string | null;
  description: string;
  amount?: number | null;
  currency?: string | null;
  created_at: string;
}

export interface DebtEntry {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

interface DataContextType {
  groups: Group[];
  activities: Activity[];
  friends: UserProfile[];
  pendingRequests: any[];
  isLoading: boolean;
  error: string | null;

  loadGroups: () => Promise<void>;
  loadActivities: () => Promise<void>;
  loadGroup: (groupId: string) => Promise<Group | null>;
  createGroup: (input: { name: string; description?: string; category: string; currency: string; memberIds: string[] }) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;

  loadGroupExpenses: (groupId: string) => Promise<Expense[]>;
  addExpense: (input: {
    groupId: string;
    description: string;
    amount: number;
    currency: string;
    paidBy: string;
    splitType: string;
    category: string;
    notes?: string;
    splits: { userId: string; amount: number; percentage?: number }[];
  }) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  loadGroupSettlements: (groupId: string) => Promise<Settlement[]>;
  addSettlement: (input: { groupId?: string; toUserId: string; amount: number; currency: string; note?: string }) => Promise<void>;

  loadFriends: () => Promise<void>;
  searchUsers: (email: string) => Promise<UserProfile[]>;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  respondToRequest: (requestId: string, status: "accepted" | "rejected") => Promise<void>;

  simplifyDebts: (members: GroupMember[]) => DebtEntry[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsRef = useRef<any[]>([]);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await api.fetchGroups(user.id);
      setGroups(data as Group[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetchActivities(user.id);
      setActivities(data as Activity[]);
    } catch {}
  }, [user]);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const [friendData, pendingData] = await Promise.all([
        api.fetchFriends(user.id),
        api.fetchPendingRequests(user.id),
      ]);
      setFriends(friendData as UserProfile[]);
      setPendingRequests(pendingData);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGroups([]);
      setActivities([]);
      setFriends([]);
      return;
    }
    loadGroups();
    loadActivities();
    loadFriends();
  }, [isAuthenticated, user?.id]);

  // Realtime subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel("hk-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => {
        loadGroups();
        loadActivities();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settlements" }, () => {
        loadGroups();
        loadActivities();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => {
        loadGroups();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "friends" }, () => {
        loadFriends();
      })
      .subscribe();

    subscriptionsRef.current.push(channel);

    return () => {
      subscriptionsRef.current.forEach((sub) => supabase.removeChannel(sub));
      subscriptionsRef.current = [];
    };
  }, [isAuthenticated, user?.id]);

  const loadGroup = useCallback(async (groupId: string): Promise<Group | null> => {
    try {
      const data = await api.fetchGroupById(groupId);
      return data as Group;
    } catch {
      return null;
    }
  }, []);

  const createGroup = useCallback(async (input: any): Promise<Group> => {
    if (!user) throw new Error("Not authenticated");
    const group = await api.createGroup({ ...input, createdBy: user.id });
    await loadGroups();
    return group as Group;
  }, [user, loadGroups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    await api.deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const loadGroupExpenses = useCallback(async (groupId: string): Promise<Expense[]> => {
    const data = await api.fetchGroupExpenses(groupId);
    return data as Expense[];
  }, []);

  const addExpense = useCallback(async (input: any) => {
    if (!user) throw new Error("Not authenticated");
    await api.addExpense({ ...input, createdBy: user.id });
    await Promise.all([loadGroups(), loadActivities()]);
  }, [user, loadGroups, loadActivities]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!user) throw new Error("Not authenticated");
    await api.deleteExpense(expenseId, user.id);
    await Promise.all([loadGroups(), loadActivities()]);
  }, [user, loadGroups, loadActivities]);

  const loadGroupSettlements = useCallback(async (groupId: string): Promise<Settlement[]> => {
    const data = await api.fetchGroupSettlements(groupId);
    return data as Settlement[];
  }, []);

  const addSettlement = useCallback(async (input: any) => {
    if (!user) throw new Error("Not authenticated");
    await api.addSettlement({ ...input, fromUserId: user.id });
    await Promise.all([loadGroups(), loadActivities()]);
  }, [user, loadGroups, loadActivities]);

  const searchUsers = useCallback(async (email: string): Promise<UserProfile[]> => {
    return await api.searchUsersByEmail(email) as UserProfile[];
  }, []);

  const sendFriendRequest = useCallback(async (addresseeId: string) => {
    if (!user) throw new Error("Not authenticated");
    await api.sendFriendRequest(user.id, addresseeId);
    await loadFriends();
  }, [user, loadFriends]);

  const respondToRequest = useCallback(async (requestId: string, status: "accepted" | "rejected") => {
    await api.respondToFriendRequest(requestId, status);
    await loadFriends();
  }, [loadFriends]);

  const simplifyDebts = useCallback((members: GroupMember[]): DebtEntry[] => {
    const balances = members.map((m) => ({
      id: m.user_id,
      name: m.user?.name || "Unknown",
      balance: Number(m.balance),
    }));
    const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const debts: DebtEntry[] = [];

    const creds = creditors.map((c) => ({ ...c }));
    const dbtrs = debtors.map((d) => ({ ...d }));
    let i = 0, j = 0;

    while (i < creds.length && j < dbtrs.length) {
      const settle = Math.min(creds[i].balance, Math.abs(dbtrs[j].balance));
      debts.push({
        from: dbtrs[j].id, fromName: dbtrs[j].name,
        to: creds[i].id, toName: creds[i].name,
        amount: parseFloat(settle.toFixed(2)),
      });
      creds[i].balance -= settle;
      dbtrs[j].balance += settle;
      if (Math.abs(creds[i].balance) < 0.01) i++;
      if (Math.abs(dbtrs[j].balance) < 0.01) j++;
    }

    return debts;
  }, []);

  return (
    <DataContext.Provider value={{
      groups, activities, friends, pendingRequests, isLoading, error,
      loadGroups, loadActivities, loadGroup, createGroup, deleteGroup,
      loadGroupExpenses, addExpense, deleteExpense,
      loadGroupSettlements, addSettlement,
      loadFriends, searchUsers, sendFriendRequest, respondToRequest,
      simplifyDebts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
