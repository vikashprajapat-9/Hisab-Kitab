import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import { Activity, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

type ActivityFilter = "all" | "expenses" | "settlements";

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expenses", label: "Expenses" },
  { key: "settlements", label: "Settlements" },
];

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const TYPE_ICONS: Record<string, string> = {
  expense_added: "plus-circle",
  expense_deleted: "trash-2",
  expense_updated: "edit-2",
  settlement: "check-circle",
  group_created: "users",
  group_updated: "settings",
};

const TYPE_COLORS: Record<string, (colors: any) => string> = {
  expense_added: (c) => c.primary,
  expense_deleted: (c) => c.destructive,
  expense_updated: (c) => c.warning || "#f59e0b",
  settlement: (c) => c.success,
  group_created: (c) => c.primary,
  group_updated: (c) => c.mutedForeground,
};

export default function ActivityTab() {
  const colors = useColors();
  const { activities, loadActivities } = useData();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await (loadActivities as any)?.();
    setRefreshing(false);
  };

  const filtered = activities.filter((a: Activity) => {
    const matchSearch = a.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "expenses" && ["expense_added", "expense_updated", "expense_deleted"].includes(a.type)) ||
      (filter === "settlements" && a.type === "settlement");
    return matchSearch && matchFilter;
  });

  const topPt = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Activity</Text>

        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search activity..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.card,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? "#fff" : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState icon="activity" title="No activity yet" description="Your expense and settlement history will appear here" />
        }
        renderItem={({ item }) => {
          const icon = TYPE_ICONS[item.type] || "activity";
          const iconColor = (TYPE_COLORS[item.type] || ((c: any) => c.mutedForeground))(colors);

          return (
            <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: iconColor + "20" }]}>
                <Feather name={icon as any} size={18} color={iconColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.amount && (
                  <Text style={[styles.amount, { color: item.type === "settlement" ? colors.success : colors.primary }]}>
                    {item.currency} {Math.abs(item.amount).toFixed(2)}
                  </Text>
                )}
              </View>
              <Text style={[styles.time, { color: colors.mutedForeground }]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 14 },
  searchRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 10 },
  item: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  description: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  amount: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 3 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 8 },
});
