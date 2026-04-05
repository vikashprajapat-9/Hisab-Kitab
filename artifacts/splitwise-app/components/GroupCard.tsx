import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Group, CURRENCIES, GROUP_CATEGORIES } from "@/types";
import Avatar from "./Avatar";
import BalanceChip from "./BalanceChip";

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  const myMember = group.members.find(m => m.userId === user?.id);
  const balance = myMember?.balance || 0;
  const currency = CURRENCIES.find(c => c.code === group.currency);
  const symbol = currency?.symbol || group.currency;
  const category = GROUP_CATEGORIES.find(c => c.value === group.category);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/group/${group.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={category?.icon as any || "grid"} size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {group.members.length} members · {symbol}{group.totalExpenses.toFixed(2)} total
          </Text>
        </View>
        <View style={styles.right}>
          <BalanceChip amount={balance} currency={group.currency} size="sm" />
        </View>
      </View>
      <View style={styles.avatars}>
        {group.members.slice(0, 5).map((m, i) => (
          <View key={m.userId} style={[styles.avatarWrap, { marginLeft: i > 0 ? -10 : 0 }]}>
            <Avatar name={m.user.name} size={24} />
          </View>
        ))}
        {group.members.length > 5 && (
          <View style={[styles.avatarWrap, styles.moreAvatar, { backgroundColor: colors.muted, marginLeft: -10 }]}>
            <Text style={[styles.moreText, { color: colors.mutedForeground }]}>+{group.members.length - 5}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
  },
});
