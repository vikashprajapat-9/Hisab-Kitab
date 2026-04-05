import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Expense, CURRENCIES } from "@/types";
import Avatar from "./Avatar";

interface ExpenseCardProps {
  expense: Expense;
  members: { userId: string; user: { name: string } }[];
  onPress?: () => void;
  index?: number;
}

const EXPENSE_ICONS: Record<string, string> = {
  food: "coffee",
  transport: "navigation",
  accommodation: "home",
  entertainment: "film",
  utilities: "zap",
  shopping: "shopping-bag",
  other: "tag",
};

export default function ExpenseCard({ expense, members, onPress, index = 0 }: ExpenseCardProps) {
  const colors = useColors();
  const { user } = useAuth();

  const currency = CURRENCIES.find(c => c.code === expense.currency);
  const symbol = currency?.symbol || expense.currency;

  const myUserId = user?.id || "";
  const mySplit = expense.splits.find(s => s.userId === myUserId);
  const iAmPayer = expense.paidBy.includes(myUserId);
  const myAmount = iAmPayer
    ? (expense.paidAmounts[myUserId] || 0) - (mySplit?.amount || 0)
    : -(mySplit?.amount || 0);

  const payerMember = members.find(m => expense.paidBy.includes(m.userId));
  const payerName = payerMember?.user.name || expense.paidBy[0] || "Unknown";

  const date = new Date(expense.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const isOwed = myAmount > 0.01;
  const isOwe = myAmount < -0.01;
  const balanceColor = isOwed ? colors.owed : isOwe ? colors.owe : colors.mutedForeground;

  const iconName = EXPENSE_ICONS[expense.category || "other"] as any;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={iconName} size={18} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={[styles.paidBy, { color: colors.mutedForeground }]}>
            {payerName} paid · {dateStr}
          </Text>
        </View>
        <View style={styles.amounts}>
          <Text style={[styles.total, { color: colors.foreground }]}>
            {symbol}{expense.amount.toFixed(2)}
          </Text>
          <Text style={[styles.myAmount, { color: balanceColor }]}>
            {isOwed ? `+${symbol}${myAmount.toFixed(2)}` : isOwe ? `-${symbol}${Math.abs(myAmount).toFixed(2)}` : "Settled"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  description: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  paidBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  amounts: {
    alignItems: "flex-end",
    gap: 2,
  },
  total: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  myAmount: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
