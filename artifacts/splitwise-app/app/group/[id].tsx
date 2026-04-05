import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { Expense, Group, GroupMember, Settlement, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

type TabKey = "expenses" | "balances" | "debts";

const CURRENCIES: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$",
  CAD: "C$", SGD: "S$", AED: "د.إ", CHF: "CHF", MYR: "RM",
  THB: "฿", HKD: "HK$", NZD: "NZ$", BRL: "R$",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { groups, loadGroup, loadGroupExpenses, loadGroupSettlements, deleteExpense, deleteGroup, simplifyDebts } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>("expenses");
  const [group, setGroup] = useState<Group | null>(groups.find((g) => g.id === id) || null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [g, exps, setts] = await Promise.all([
        loadGroup(id),
        loadGroupExpenses(id),
        loadGroupSettlements(id),
      ]);
      if (g) setGroup(g);
      setExpenses(exps);
      setSettlements(setts);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [id, loadGroup, loadGroupExpenses, loadGroupSettlements]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Group not found</Text>
      </View>
    );
  }

  const myMember = group.group_members?.find((m) => m.user_id === user?.id);
  const myBalance = myMember ? Number(myMember.balance) : 0;
  const symbol = CURRENCIES[group.currency] || group.currency;
  const topPt = (Platform.OS === "web" ? 67 : insets.top);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "expenses", label: `Expenses (${expenses.length})` },
    { key: "balances", label: "Balances" },
    { key: "debts", label: "Settle Up" },
  ];

  const simplifiedDebts = simplifyDebts(group.group_members || []);

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert("Delete Expense", `Delete "${expense.description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(expense.id);
            setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
            load(); // refresh balances
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "This will delete all expenses and settlements. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(group.id);
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
            <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
              {group.group_members?.length || 0} members · {group.currency}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addExpenseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/add-expense/${group.id}`)}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addExpenseBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteGroup} style={styles.moreBtn}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* My balance chip */}
        <View style={[styles.balanceChip, {
          backgroundColor: Math.abs(myBalance) < 0.01
            ? colors.muted
            : myBalance > 0 ? colors.success + "20" : colors.destructive + "20"
        }]}>
          <Text style={[styles.balanceChipText, {
            color: Math.abs(myBalance) < 0.01
              ? colors.mutedForeground
              : myBalance > 0 ? colors.success : colors.destructive
          }]}>
            {Math.abs(myBalance) < 0.01
              ? "You're all settled up"
              : myBalance > 0
                ? `You're owed ${symbol}${myBalance.toFixed(2)}`
                : `You owe ${symbol}${Math.abs(myBalance).toFixed(2)}`}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabBtn,
                { borderBottomColor: tab === t.key ? colors.primary : "transparent", borderBottomWidth: 2 },
              ]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {tab === "expenses" && (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="No expenses yet"
              description="Add your first expense to start tracking"
              action={{ label: "Add Expense", onPress: () => router.push(`/add-expense/${group.id}`) }}
            />
          }
          renderItem={({ item }) => {
            const myShare = item.expense_splits?.find((s) => s.user_id === user?.id);
            const iPaid = item.paid_by === user?.id;
            return (
              <View style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.expenseTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
                    <Text style={[styles.expenseMeta, { color: colors.mutedForeground }]}>
                      Paid by {iPaid ? "you" : item.payer?.name} · {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>
                      {symbol}{Number(item.amount).toFixed(2)}
                    </Text>
                    {myShare && (
                      <Text style={[styles.expenseShare, {
                        color: iPaid ? colors.success : colors.destructive
                      }]}>
                        {iPaid ? "you lent" : "you owe"} {symbol}{Number(myShare.amount).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
                {item.created_by === user?.id && (
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(item)}
                    style={styles.deleteExpenseBtn}
                  >
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                    <Text style={[styles.deleteExpenseBtnText, { color: colors.destructive }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {tab === "balances" && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {(group.group_members || []).map((m: GroupMember) => {
            const balance = Number(m.balance);
            const isMe = m.user_id === user?.id;
            return (
              <View key={m.user_id} style={[styles.balanceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Avatar name={m.user?.name || "?"} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {isMe ? "You" : m.user?.name}
                  </Text>
                  <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>
                    {m.user?.email}
                  </Text>
                </View>
                <Text style={[styles.memberBalance, {
                  color: Math.abs(balance) < 0.01 ? colors.mutedForeground : balance > 0 ? colors.success : colors.destructive
                }]}>
                  {Math.abs(balance) < 0.01 ? "Settled" : `${balance > 0 ? "+" : ""}${symbol}${balance.toFixed(2)}`}
                </Text>
              </View>
            );
          })}
          {(group.group_members || []).length === 0 && (
            <EmptyState icon="users" title="No members" description="" />
          )}
        </ScrollView>
      )}

      {tab === "debts" && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {simplifiedDebts.length === 0 ? (
            <View style={[styles.settledCard, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
              <Feather name="check-circle" size={36} color={colors.success} />
              <Text style={[styles.settledTitle, { color: colors.success }]}>All settled up!</Text>
              <Text style={[styles.settledDesc, { color: colors.mutedForeground }]}>
                Everyone in this group is square.
              </Text>
            </View>
          ) : (
            <>
              {simplifiedDebts.map((debt, i) => {
                const isMe = debt.from === user?.id || debt.to === user?.id;
                return (
                  <View key={i} style={[styles.debtCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Avatar name={debt.fromName} size={36} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={[styles.debtText, { color: colors.text }]}>
                        <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                          {debt.from === user?.id ? "You" : debt.fromName}
                        </Text>
                        {" → "}
                        <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                          {debt.to === user?.id ? "You" : debt.toName}
                        </Text>
                      </Text>
                      <Text style={[styles.debtAmount, { color: colors.destructive }]}>
                        {symbol}{debt.amount.toFixed(2)}
                      </Text>
                    </View>
                    {isMe && (
                      <TouchableOpacity
                        style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/settle/${group.id}?fromId=${debt.from}&toId=${debt.to}&amount=${debt.amount}`)}
                      >
                        <Text style={styles.settleBtnText}>Settle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Recent settlements */}
          {settlements.length > 0 && (
            <>
              <Text style={[styles.recentTitle, { color: colors.mutedForeground }]}>Recent Settlements</Text>
              {settlements.slice(0, 5).map((s) => (
                <View key={s.id} style={[styles.settlementRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={18} color={colors.success} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.settlementText, { color: colors.text }]}>
                      {s.from_user_id === user?.id ? "You" : s.from_user?.name} paid {s.to_user_id === user?.id ? "you" : s.to_user?.name}
                    </Text>
                    <Text style={[styles.settlementDate, { color: colors.mutedForeground }]}>
                      {formatDate(s.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.settlementAmount, { color: colors.success }]}>
                    {symbol}{Number(s.amount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 0 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  backBtn: { padding: 4 },
  groupName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  groupMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addExpenseBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addExpenseBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  moreBtn: { padding: 4 },
  balanceChip: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start", marginBottom: 12 },
  balanceChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 10 },
  expenseCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  expenseTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  expenseDesc: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  expenseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  expenseAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  expenseShare: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  deleteExpenseBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-end" },
  deleteExpenseBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  balanceRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14 },
  memberName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  memberEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  memberBalance: { fontSize: 15, fontFamily: "Inter_700Bold" },
  settledCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  settledTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  settledDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  debtCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14 },
  debtText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  debtAmount: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  settleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  settleBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recentTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  settlementRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12 },
  settlementText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  settlementDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  settlementAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
