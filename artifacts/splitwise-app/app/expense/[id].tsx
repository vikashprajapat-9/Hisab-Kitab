import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
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
import { CURRENCIES } from "@/types";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { expenses, groups, deleteExpense } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const expense = expenses.find(e => e.id === id);
  const group = expense ? groups.find(g => g.id === expense.groupId) : null;

  if (!expense || !group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 60, alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Expense not found</Text>
      </View>
    );
  }

  const currency = CURRENCIES.find(c => c.code === expense.currency);
  const symbol = currency?.symbol || expense.currency;

  const getMemberName = (uid: string) => {
    const member = group.members.find(m => m.userId === uid);
    return member?.user.name || uid;
  };

  const handleDelete = () => {
    Alert.alert("Delete Expense", "This will remove the expense and update all balances. Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteExpense(expense.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  const date = new Date(expense.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Expense Details</Text>
        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <View style={[styles.amountCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.description, { color: colors.foreground }]}>{expense.description}</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {symbol}{expense.amount.toFixed(2)}
          </Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{dateStr}</Text>
          <Text style={[styles.groupName, { color: colors.mutedForeground }]}>{group.name}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Paid by</Text>
          {expense.paidBy.map(uid => (
            <View key={uid} style={styles.memberRow}>
              <Avatar name={getMemberName(uid)} size={40} />
              <Text style={[styles.memberName, { color: colors.foreground }]}>
                {getMemberName(uid)}{uid === user?.id ? " (you)" : ""}
              </Text>
              <Text style={[styles.memberAmount, { color: colors.owed }]}>
                +{symbol}{(expense.paidAmounts[uid] || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Split breakdown</Text>
          <View style={[styles.splitTypeTag, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.splitTypeText, { color: colors.primary }]}>
              {expense.splitType === "equal" ? "Equal split" :
               expense.splitType === "exact" ? "Exact amounts" :
               expense.splitType === "percentage" ? "Percentage split" :
               "One person owes all"}
            </Text>
          </View>
          {expense.splits.map(split => (
            <View key={split.userId} style={styles.memberRow}>
              <Avatar name={getMemberName(split.userId)} size={40} />
              <Text style={[styles.memberName, { color: colors.foreground }]}>
                {getMemberName(split.userId)}{split.userId === user?.id ? " (you)" : ""}
              </Text>
              <View style={styles.splitRight}>
                {split.percentage && (
                  <Text style={[styles.splitPct, { color: colors.mutedForeground }]}>{split.percentage}%</Text>
                )}
                <Text style={[styles.memberAmount, { color: colors.owe }]}>
                  -{symbol}{split.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  amountCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  description: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  groupName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  splitTypeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  splitTypeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  memberAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  splitRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  splitPct: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});
