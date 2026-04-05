import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { ActivityItem as ActivityType } from "@/types";

interface ActivityItemProps {
  item: ActivityType;
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  expense_added: { icon: "plus-circle", color: "#10b981" },
  expense_updated: { icon: "edit-2", color: "#3b82f6" },
  expense_deleted: { icon: "trash-2", color: "#ef4444" },
  settlement: { icon: "check-circle", color: "#10b981" },
  member_added: { icon: "user-plus", color: "#8b5cf6" },
  group_created: { icon: "users", color: "#f59e0b" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityItemComponent({ item }: ActivityItemProps) {
  const colors = useColors();
  const config = ACTIVITY_ICONS[item.type] || { icon: "activity", color: colors.primary };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: config.color + "15" }]}>
        <Feather name={config.icon as any} size={16} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.foreground }]}>
          {item.description}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
      {item.amount && item.amount > 0 && (
        <Text style={[styles.amount, { color: config.color }]}>
          {item.currency} {item.amount.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  amount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
