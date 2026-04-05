import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ActivityItem, Expense, ExpenseSplit, Group, GroupMember, Settlement, SplitType, User } from "@/types";
import { useAuth } from "./AuthContext";

interface DataContextType {
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: ActivityItem[];
  friends: User[];
  isLoading: boolean;
  createGroup: (data: Omit<Group, "id" | "createdAt" | "isSettled" | "totalExpenses" | "members"> & { memberIds: string[] }) => Promise<Group>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMemberToGroup: (groupId: string, user: User) => Promise<void>;
  addExpense: (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addSettlement: (data: Omit<Settlement, "id" | "createdAt">) => Promise<void>;
  addFriend: (user: User) => Promise<void>;
  getGroupBalance: (groupId: string, userId: string) => number;
  getFriendBalance: (friendId: string) => number;
  getGroupExpenses: (groupId: string) => Expense[];
  simplifyDebts: (groupId: string) => { from: User; to: User; amount: number; currency: string }[];
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const GROUPS_KEY = "splitease_groups";
const EXPENSES_KEY = "splitease_expenses";
const SETTLEMENTS_KEY = "splitease_settlements";
const ACTIVITIES_KEY = "splitease_activities";
const FRIENDS_KEY = "splitease_friends";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [g, e, s, a, f] = await Promise.all([
        AsyncStorage.getItem(GROUPS_KEY),
        AsyncStorage.getItem(EXPENSES_KEY),
        AsyncStorage.getItem(SETTLEMENTS_KEY),
        AsyncStorage.getItem(ACTIVITIES_KEY),
        AsyncStorage.getItem(FRIENDS_KEY),
      ]);
      if (g) setGroups(JSON.parse(g));
      if (e) setExpenses(JSON.parse(e));
      if (s) setSettlements(JSON.parse(s));
      if (a) setActivities(JSON.parse(a));
      if (f) setFriends(JSON.parse(f));
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) refreshData();
    else setIsLoading(false);
  }, [user, refreshData]);

  const saveGroups = async (data: Group[]) => {
    setGroups(data);
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(data));
  };
  const saveExpenses = async (data: Expense[]) => {
    setExpenses(data);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(data));
  };
  const saveSettlements = async (data: Settlement[]) => {
    setSettlements(data);
    await AsyncStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(data));
  };
  const saveActivities = async (data: ActivityItem[]) => {
    setActivities(data);
    await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(data));
  };
  const saveFriends = async (data: User[]) => {
    setFriends(data);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(data));
  };

  const addActivity = async (item: Omit<ActivityItem, "id" | "createdAt">) => {
    const newItem: ActivityItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...activities].slice(0, 200);
    await saveActivities(updated);
  };

  const createGroup = useCallback(async (data: Omit<Group, "id" | "createdAt" | "isSettled" | "totalExpenses" | "members"> & { memberIds: string[] }) => {
    if (!user) throw new Error("Not authenticated");
    const allFriends = friends;
    const members: GroupMember[] = [
      { userId: user.id, user, balance: 0 },
      ...data.memberIds
        .filter(id => id !== user.id)
        .map(id => {
          const f = allFriends.find(f => f.id === id);
          return f ? { userId: id, user: f, balance: 0 } : null;
        })
        .filter(Boolean) as GroupMember[],
    ];
    const newGroup: Group = {
      id: generateId(),
      name: data.name,
      description: data.description,
      category: data.category,
      currency: data.currency,
      members,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      isSettled: false,
      totalExpenses: 0,
    };
    const updated = [...groups, newGroup];
    await saveGroups(updated);
    await addActivity({
      type: "group_created",
      userId: user.id,
      groupId: newGroup.id,
      description: `${user.name} created group "${newGroup.name}"`,
    });
    return newGroup;
  }, [groups, friends, user, activities]);

  const updateGroup = useCallback(async (id: string, data: Partial<Group>) => {
    const updated = groups.map(g => g.id === id ? { ...g, ...data } : g);
    await saveGroups(updated);
  }, [groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const updatedGroups = groups.filter(g => g.id !== id);
    const updatedExpenses = expenses.filter(e => e.groupId !== id);
    const updatedSettlements = settlements.filter(s => s.groupId !== id);
    await Promise.all([
      saveGroups(updatedGroups),
      saveExpenses(updatedExpenses),
      saveSettlements(updatedSettlements),
    ]);
  }, [groups, expenses, settlements]);

  const addMemberToGroup = useCallback(async (groupId: string, newUser: User) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      if (g.members.some(m => m.userId === newUser.id)) return g;
      return { ...g, members: [...g.members, { userId: newUser.id, user: newUser, balance: 0 }] };
    });
    await saveGroups(updated);
    // Add to friends if not already there
    if (!friends.some(f => f.id === newUser.id) && newUser.id !== user?.id) {
      await saveFriends([...friends, newUser]);
    }
  }, [groups, friends, user]);

  const calculateSplits = (amount: number, splitType: SplitType, members: string[], customSplits?: ExpenseSplit[]): ExpenseSplit[] => {
    if (splitType === "equal") {
      const each = amount / members.length;
      return members.map(uid => ({ userId: uid, amount: Math.round(each * 100) / 100 }));
    }
    if (splitType === "full" && members.length > 0) {
      return [{ userId: members[0], amount }];
    }
    return customSplits || [];
  };

  const addExpense = useCallback(async (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error("Not authenticated");
    const newExpense: Expense = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedExpenses = [...expenses, newExpense];
    await saveExpenses(updatedExpenses);

    // Update group balances
    const group = groups.find(g => g.id === data.groupId);
    if (group) {
      const balanceMap: Record<string, number> = {};
      // Each payer gets credited
      for (const [uid, amt] of Object.entries(data.paidAmounts)) {
        balanceMap[uid] = (balanceMap[uid] || 0) + amt;
      }
      // Each person in split gets debited
      for (const split of data.splits) {
        balanceMap[split.userId] = (balanceMap[split.userId] || 0) - split.amount;
      }
      const updatedMembers = group.members.map(m => ({
        ...m,
        balance: m.balance + (balanceMap[m.userId] || 0),
      }));
      const updatedGroups = groups.map(g => g.id === data.groupId
        ? { ...g, members: updatedMembers, totalExpenses: g.totalExpenses + data.amount }
        : g
      );
      await saveGroups(updatedGroups);
    }

    await addActivity({
      type: "expense_added",
      userId: data.createdBy,
      groupId: data.groupId,
      expenseId: newExpense.id,
      description: `Added "${data.description}" for ${data.currency} ${data.amount.toFixed(2)}`,
      amount: data.amount,
      currency: data.currency,
    });
    return newExpense;
  }, [expenses, groups, user, activities]);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    if (!user) return;
    const oldExpense = expenses.find(e => e.id === id);
    if (!oldExpense) return;

    // Revert old balance impact
    const group = groups.find(g => g.id === oldExpense.groupId);
    if (group) {
      const revertMap: Record<string, number> = {};
      for (const [uid, amt] of Object.entries(oldExpense.paidAmounts)) {
        revertMap[uid] = (revertMap[uid] || 0) - amt;
      }
      for (const split of oldExpense.splits) {
        revertMap[split.userId] = (revertMap[split.userId] || 0) + split.amount;
      }

      const newExpense = { ...oldExpense, ...data };
      const applyMap: Record<string, number> = {};
      for (const [uid, amt] of Object.entries(newExpense.paidAmounts)) {
        applyMap[uid] = (applyMap[uid] || 0) + amt;
      }
      for (const split of newExpense.splits) {
        applyMap[split.userId] = (applyMap[split.userId] || 0) - split.amount;
      }

      const combinedMap: Record<string, number> = {};
      for (const uid of new Set([...Object.keys(revertMap), ...Object.keys(applyMap)])) {
        combinedMap[uid] = (revertMap[uid] || 0) + (applyMap[uid] || 0);
      }

      const totalDiff = (newExpense.amount || 0) - oldExpense.amount;
      const updatedMembers = group.members.map(m => ({
        ...m,
        balance: m.balance + (combinedMap[m.userId] || 0),
      }));
      const updatedGroups = groups.map(g => g.id === oldExpense.groupId
        ? { ...g, members: updatedMembers, totalExpenses: g.totalExpenses + totalDiff }
        : g
      );
      await saveGroups(updatedGroups);
    }

    const updated = expenses.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e);
    await saveExpenses(updated);
    await addActivity({
      type: "expense_updated",
      userId: user.id,
      groupId: oldExpense.groupId,
      expenseId: id,
      description: `Updated "${data.description || oldExpense.description}"`,
      amount: data.amount || oldExpense.amount,
      currency: data.currency || oldExpense.currency,
    });
  }, [expenses, groups, user, activities]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const group = groups.find(g => g.id === expense.groupId);
    if (group) {
      const revertMap: Record<string, number> = {};
      for (const [uid, amt] of Object.entries(expense.paidAmounts)) {
        revertMap[uid] = (revertMap[uid] || 0) - amt;
      }
      for (const split of expense.splits) {
        revertMap[split.userId] = (revertMap[split.userId] || 0) + split.amount;
      }
      const updatedMembers = group.members.map(m => ({
        ...m,
        balance: m.balance + (revertMap[m.userId] || 0),
      }));
      const updatedGroups = groups.map(g => g.id === expense.groupId
        ? { ...g, members: updatedMembers, totalExpenses: Math.max(0, g.totalExpenses - expense.amount) }
        : g
      );
      await saveGroups(updatedGroups);
    }

    const updated = expenses.filter(e => e.id !== id);
    await saveExpenses(updated);
    await addActivity({
      type: "expense_deleted",
      userId: user.id,
      groupId: expense.groupId,
      description: `Deleted "${expense.description}"`,
      amount: expense.amount,
      currency: expense.currency,
    });
  }, [expenses, groups, user, activities]);

  const addSettlement = useCallback(async (data: Omit<Settlement, "id" | "createdAt">) => {
    if (!user) return;
    const newSettlement: Settlement = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...settlements, newSettlement];
    await saveSettlements(updated);

    if (data.groupId) {
      const group = groups.find(g => g.id === data.groupId);
      if (group) {
        const updatedMembers = group.members.map(m => {
          if (m.userId === data.fromUserId) return { ...m, balance: m.balance + data.amount };
          if (m.userId === data.toUserId) return { ...m, balance: m.balance - data.amount };
          return m;
        });
        const isSettled = updatedMembers.every(m => Math.abs(m.balance) < 0.01);
        const updatedGroups = groups.map(g => g.id === data.groupId
          ? { ...g, members: updatedMembers, isSettled }
          : g
        );
        await saveGroups(updatedGroups);
      }
    }

    const fromUser = user.id === data.fromUserId ? user : friends.find(f => f.id === data.fromUserId);
    const toUser = friends.find(f => f.id === data.toUserId) || user;
    await addActivity({
      type: "settlement",
      userId: data.fromUserId,
      groupId: data.groupId,
      settlementId: newSettlement.id,
      description: `${fromUser?.name || "Someone"} paid ${toUser?.name || "someone"} ${data.currency} ${data.amount.toFixed(2)}`,
      amount: data.amount,
      currency: data.currency,
    });
  }, [settlements, groups, friends, user, activities]);

  const addFriend = useCallback(async (newUser: User) => {
    if (friends.some(f => f.id === newUser.id)) return;
    const updated = [...friends, newUser];
    await saveFriends(updated);
  }, [friends]);

  const getGroupBalance = useCallback((groupId: string, userId: string): number => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;
    const member = group.members.find(m => m.userId === userId);
    return member?.balance || 0;
  }, [groups]);

  const getFriendBalance = useCallback((friendId: string): number => {
    if (!user) return 0;
    let total = 0;
    for (const group of groups) {
      const myMember = group.members.find(m => m.userId === user.id);
      const friendMember = group.members.find(m => m.userId === friendId);
      if (myMember && friendMember) {
        total += myMember.balance - friendMember.balance;
      }
    }
    return total;
  }, [groups, user]);

  const getGroupExpenses = useCallback((groupId: string): Expense[] => {
    return expenses.filter(e => e.groupId === groupId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses]);

  const simplifyDebts = useCallback((groupId: string): { from: User; to: User; amount: number; currency: string }[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    const balances = group.members.map(m => ({ ...m }));
    const result: { from: User; to: User; amount: number; currency: string }[] = [];

    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const credit = creditors[ci];
      const debt = debtors[di];
      const amount = Math.min(credit.balance, -debt.balance);
      if (amount > 0.01) {
        result.push({
          from: debt.user,
          to: credit.user,
          amount: Math.round(amount * 100) / 100,
          currency: group.currency,
        });
      }
      credit.balance -= amount;
      debt.balance += amount;
      if (credit.balance < 0.01) ci++;
      if (debt.balance > -0.01) di++;
    }
    return result;
  }, [groups]);

  return (
    <DataContext.Provider value={{
      groups, expenses, settlements, activities, friends, isLoading,
      createGroup, updateGroup, deleteGroup, addMemberToGroup,
      addExpense, updateExpense, deleteExpense,
      addSettlement, addFriend,
      getGroupBalance, getFriendBalance, getGroupExpenses,
      simplifyDebts, refreshData,
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
