import { supabase } from "./supabase";

// ─── User ────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: { name?: string; email?: string }) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function searchUsersByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .ilike("email", `%${email}%`)
    .limit(10);
  if (error) throw error;
  return data || [];
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function fetchFriends(userId: string) {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      id, status, created_at,
      requester:requester_id(id, name, email),
      addressee:addressee_id(id, name, email)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");
  if (error) throw error;
  return (data || []).map((row: any) => {
    const friend = row.requester.id === userId ? row.addressee : row.requester;
    return { ...friend, friendRecordId: row.id };
  });
}

export async function fetchPendingRequests(userId: string) {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      id, status, created_at,
      requester:requester_id(id, name, email),
      addressee:addressee_id(id, name, email)
    `)
    .eq("addressee_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return data || [];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from("friends")
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function respondToFriendRequest(requestId: string, status: "accepted" | "rejected") {
  const { data, error } = await supabase
    .from("friends")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function fetchGroups(userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      group_members!inner(user_id, balance,
        user:user_id(id, name, email)
      )
    `)
    .eq("group_members.user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function fetchGroupById(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      group_members(
        id, user_id, balance,
        user:user_id(id, name, email)
      )
    `)
    .eq("id", groupId)
    .single();
  if (error) throw error;
  return data;
}

export async function createGroup(input: {
  name: string;
  description?: string;
  category: string;
  currency: string;
  createdBy: string;
  memberIds: string[];
}) {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      description: input.description || null,
      category: input.category,
      currency: input.currency,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (groupError) throw groupError;

  // Add creator + selected members
  const memberSet = Array.from(new Set([input.createdBy, ...input.memberIds]));
  const { error: memberError } = await supabase
    .from("group_members")
    .insert(memberSet.map((uid) => ({ group_id: group.id, user_id: uid, balance: 0 })));
  if (memberError) throw memberError;

  return group;
}

export async function updateGroup(groupId: string, updates: Partial<{ name: string; description: string; currency: string; category: string }>) {
  const { data, error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", groupId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw error;
}

export async function addGroupMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, balance: 0 });
  if (error) throw error;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function fetchGroupExpenses(groupId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      payer:paid_by(id, name, email),
      expense_splits(user_id, amount, percentage,
        user:user_id(id, name, email)
      )
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchExpenseById(expenseId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      payer:paid_by(id, name, email),
      expense_splits(user_id, amount, percentage,
        user:user_id(id, name, email)
      )
    `)
    .eq("id", expenseId)
    .single();
  if (error) throw error;
  return data;
}

export async function addExpense(input: {
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitType: string;
  category: string;
  notes?: string;
  createdBy: string;
  splits: { userId: string; amount: number; percentage?: number }[];
}) {
  // Insert expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: input.groupId,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paid_by: input.paidBy,
      split_type: input.splitType,
      category: input.category,
      notes: input.notes || null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (expenseError) throw expenseError;

  // Insert splits
  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(input.splits.map((s) => ({
      expense_id: expense.id,
      user_id: s.userId,
      amount: s.amount,
      percentage: s.percentage || null,
    })));
  if (splitsError) throw splitsError;

  // Update balances: payer gets credited, each split person gets debited
  await updateGroupBalancesForExpense(input.groupId, input.paidBy, input.amount, input.splits);

  // Update group total_expenses
  await supabase.rpc("increment_group_expenses", {
    p_group_id: input.groupId,
    p_amount: input.amount,
  }).catch(() => {
    // Fallback: manual update
    supabase.from("groups").select("total_expenses").eq("id", input.groupId).single().then(({ data }) => {
      if (data) {
        supabase.from("groups").update({ total_expenses: (data.total_expenses || 0) + input.amount }).eq("id", input.groupId);
      }
    });
  });

  // Log activity
  await supabase.from("activities").insert({
    type: "expense_added",
    user_id: input.createdBy,
    group_id: input.groupId,
    expense_id: expense.id,
    description: `Added "${input.description}" for ${input.currency} ${input.amount.toFixed(2)}`,
    amount: input.amount,
    currency: input.currency,
  });

  return expense;
}

async function updateGroupBalancesForExpense(
  groupId: string,
  payerId: string,
  totalAmount: number,
  splits: { userId: string; amount: number }[]
) {
  // Build balance delta map
  const deltaMap: Record<string, number> = {};
  deltaMap[payerId] = (deltaMap[payerId] || 0) + totalAmount;
  for (const s of splits) {
    deltaMap[s.userId] = (deltaMap[s.userId] || 0) - s.amount;
  }

  // Fetch current balances
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, balance")
    .eq("group_id", groupId);

  if (!members) return;

  for (const member of members) {
    const delta = deltaMap[member.user_id] || 0;
    if (delta !== 0) {
      await supabase
        .from("group_members")
        .update({ balance: member.balance + delta })
        .eq("group_id", groupId)
        .eq("user_id", member.user_id);
    }
  }
}

export async function deleteExpense(expenseId: string, createdBy: string) {
  // Fetch expense and splits to revert balances
  const { data: expense } = await supabase
    .from("expenses")
    .select("*, expense_splits(*)")
    .eq("id", expenseId)
    .single();

  if (expense) {
    // Revert balances
    const revertSplits = (expense.expense_splits || []).map((s: any) => ({ userId: s.user_id, amount: s.amount }));
    const deltaMap: Record<string, number> = {};
    deltaMap[expense.paid_by] = -expense.amount;
    for (const s of revertSplits) {
      deltaMap[s.userId] = (deltaMap[s.userId] || 0) + s.amount;
    }

    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, balance")
      .eq("group_id", expense.group_id);

    if (members) {
      for (const m of members) {
        const delta = deltaMap[m.user_id] || 0;
        if (delta !== 0) {
          await supabase
            .from("group_members")
            .update({ balance: m.balance + delta })
            .eq("group_id", expense.group_id)
            .eq("user_id", m.user_id);
        }
      }
    }

    // Update group total
    const { data: group } = await supabase.from("groups").select("total_expenses").eq("id", expense.group_id).single();
    if (group) {
      await supabase.from("groups").update({
        total_expenses: Math.max(0, group.total_expenses - expense.amount)
      }).eq("id", expense.group_id);
    }

    await supabase.from("activities").insert({
      type: "expense_deleted",
      user_id: createdBy,
      group_id: expense.group_id,
      description: `Deleted "${expense.description}"`,
      amount: expense.amount,
      currency: expense.currency,
    });
  }

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}

// ─── Settlements ─────────────────────────────────────────────────────────────

export async function addSettlement(input: {
  groupId?: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  note?: string;
}) {
  const { data: settlement, error } = await supabase
    .from("settlements")
    .insert({
      group_id: input.groupId || null,
      from_user_id: input.fromUserId,
      to_user_id: input.toUserId,
      amount: input.amount,
      currency: input.currency,
      note: input.note || null,
    })
    .select()
    .single();
  if (error) throw error;

  // Update group member balances
  if (input.groupId) {
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, balance")
      .eq("group_id", input.groupId);

    if (members) {
      for (const m of members) {
        if (m.user_id === input.fromUserId) {
          await supabase.from("group_members").update({ balance: m.balance + input.amount }).eq("group_id", input.groupId).eq("user_id", m.user_id);
        } else if (m.user_id === input.toUserId) {
          await supabase.from("group_members").update({ balance: m.balance - input.amount }).eq("group_id", input.groupId).eq("user_id", m.user_id);
        }
      }
    }
  }

  await supabase.from("activities").insert({
    type: "settlement",
    user_id: input.fromUserId,
    group_id: input.groupId || null,
    settlement_id: settlement.id,
    description: `Settlement of ${input.currency} ${input.amount.toFixed(2)}`,
    amount: input.amount,
    currency: input.currency,
  });

  return settlement;
}

export async function fetchGroupSettlements(groupId: string) {
  const { data, error } = await supabase
    .from("settlements")
    .select(`
      *,
      from_user:from_user_id(id, name, email),
      to_user:to_user_id(id, name, email)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function fetchActivities(userId: string) {
  // Get user's group ids
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const groupIds = (memberships || []).map((m: any) => m.group_id);

  if (groupIds.length === 0) {
    // Only own activities
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .or(`user_id.eq.${userId},group_id.in.(${groupIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
