import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Avatar from "@/components/Avatar";
import BalanceChip from "@/components/BalanceChip";
import ExpenseCard from "@/components/ExpenseCard";
import EmptyState from "@/components/EmptyState";
import { CURRENCIES, GROUP_CATEGORIES } from "@/types";

type TabKey = "expenses" | "balances" | "debts";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { groups, deleteGroup, getGroupExpenses, simplifyDebts } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("expenses");

  const group = groups.find(g => g.id === id);
  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 60, alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Group not found</Text>
      </View>
    );
  }

  const myMember = group.members.find(m => m.userId === user?.id);
  const myBalance = myMember?.balance || 0;
  const currency = CURRENCIES.find(c => c.code === group.currency);
  const symbol = currency?.symbol || group.currency;
  const category = GROUP_CATEGORIES.find(c => c.value === group.category);
  const expenses = getGroupExpenses(group.id);
  const simplifiedDebts = simplifyDebts(group.id);

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleDelete = () => {
    Alert.alert("Delete Group", "This will delete all expenses and settlements in this group. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteGroup(group.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: "expenses", label: "Expenses" },
    { key: "balances", label: "Balances" },
    { key: "debts", label: "Settle Up" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.groupTitle}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={category?.icon as any || "grid"} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
              {group.name}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push(`/add-expense/${group.id}` as any)} style={[styles.actionBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, { backgroundColor: colors.muted }]} activeOpacity={0.8}>
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.balanceInfo}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total expenses</Text>
            <Text style={[styles.totalAmount, { color: colors.foreground }]}>{symbol}{group.totalExpenses.toFixed(2)}</Text>
          </View>
          <BalanceChip amount={myBalance} currency={group.currency} size="md" />
        </View>

        <View style={styles.memberAvatars}>
          {group.members.map((m, i) => (
            <View key={m.userId} style={[styles.memberAvatar, { marginLeft: i > 0 ? -12 : 0 }]}>
              <Avatar name={m.user.name} size={32} />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addMemberBtn, { backgroundColor: colors.muted, marginLeft: -12 }]}
            onPress={() => router.push(`/add-member/${group.id}` as any)}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, { borderBottomColor: tab === t.key ? colors.primary : "transparent" }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "expenses" && (
        <FlatList
          data={expenses}
          keyExtractor={e => e.id}
          renderItem={({ item, index }) => (
            <ExpenseCard
              expense={item}
              members={group.members}
              onPress={() => router.push(`/expense/${item.id}` as any)}
              index={index}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          ListEmptyComponent={
            <EmptyState
              icon="tag"
              title="No expenses yet"
              subtitle="Add your first expense to start splitting"
              actionLabel="Add Expense"
              onAction={() => router.push(`/add-expense/${group.id}` as any)}
            />
          }
          scrollEnabled={expenses.length > 0}
        />
      )}

      {tab === "balances" && (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}>
          {group.members.map(m => (
            <View key={m.userId} style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Avatar name={m.user.name} size={44} />
              <View style={styles.balanceMemberInfo}>
                <Text style={[styles.memberName, { color: colors.foreground }]}>
                  {m.user.name}{m.userId === user?.id ? " (you)" : ""}
                </Text>
                <Text style={[styles.memberBalance, {
                  color: Math.abs(m.balance) < 0.01 ? colors.mutedForeground : m.balance > 0 ? colors.owed : colors.owe
                }]}>
                  {Math.abs(m.balance) < 0.01 ? "Settled up" : m.balance > 0 ? `+${symbol}${m.balance.toFixed(2)}` : `-${symbol}${Math.abs(m.balance).toFixed(2)}`}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "debts" && (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}>
          {simplifiedDebts.length === 0 ? (
            <EmptyState icon="check-circle" title="All settled!" subtitle="No outstanding debts in this group" />
          ) : (
            simplifiedDebts.map((debt, i) => (
              <View key={i} style={[styles.debtCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Avatar name={debt.from.name} size={40} />
                <View style={styles.debtArrow}>
                  <Text style={[styles.debtLabel, { color: colors.mutedForeground }]}>owes</Text>
                  <Feather name="arrow-right" size={16} color={colors.primary} />
                </View>
                <Avatar name={debt.to.name} size={40} />
                <View style={styles.debtInfo}>
                  <Text style={[styles.debtNames, { color: colors.foreground }]}>
                    {debt.from.name} → {debt.to.name}
                  </Text>
                  <Text style={[styles.debtAmount, { color: colors.owe }]}>
                    {symbol}{debt.amount.toFixed(2)}
                  </Text>
                </View>
                {(debt.from.id === user?.id || debt.to.id === user?.id) && (
                  <TouchableOpacity
                    style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/settle/${group.id}?from=${debt.from.id}&to=${debt.to.id}&amount=${debt.amount}` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.settleBtnText, { color: colors.primaryForeground }]}>Settle</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceInfo: { gap: 2 },
  totalLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  totalAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  memberAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  addMemberBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  tabRow: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  balanceMemberInfo: { flex: 1, gap: 3 },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  memberBalance: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  debtCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  debtArrow: {
    alignItems: "center",
    gap: 2,
  },
  debtLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  debtInfo: {
    flex: 1,
    gap: 2,
  },
  debtNames: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  debtAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  settleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  settleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
