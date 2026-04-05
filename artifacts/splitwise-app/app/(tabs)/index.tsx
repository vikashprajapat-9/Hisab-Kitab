import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { Group, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "owe" | "owed" | "settled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owe", label: "You Owe" },
  { key: "owed", label: "Owed" },
  { key: "settled", label: "Settled" },
];

const CATEGORY_ICONS: Record<string, string> = {
  home: "home",
  trip: "map",
  food: "coffee",
  couple: "heart",
  work: "briefcase",
  other: "users",
};

export default function GroupsTab() {
  const colors = useColors();
  const { user } = useAuth();
  const { groups, isLoading, loadGroups } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const getMyBalance = (g: Group) => {
    const m = g.group_members?.find((m) => m.user_id === user?.id);
    return m ? Number(m.balance) : 0;
  };

  const filteredGroups = groups.filter((g: Group) => {
    const b = getMyBalance(g);
    if (filter === "owe") return b < -0.01;
    if (filter === "owed") return b > 0.01;
    if (filter === "settled") return Math.abs(b) <= 0.01;
    return true;
  });

  const totalOwed = groups.reduce((sum, g) => {
    const b = getMyBalance(g);
    return b > 0 ? sum + b : sum;
  }, 0);
  const totalOwe = groups.reduce((sum, g) => {
    const b = getMyBalance(g);
    return b < 0 ? sum + Math.abs(b) : sum;
  }, 0);

  const topPt = (Platform.OS === "web" ? 67 : insets.top);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Hisab Kitab</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {groups.length} group{groups.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/create-group")}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {(totalOwed > 0 || totalOwe > 0) && (
          <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {totalOwed > 0 && (
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryAmount, { color: colors.success }]}>
                  +{totalOwed.toFixed(2)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>you're owed</Text>
              </View>
            )}
            {totalOwed > 0 && totalOwe > 0 && (
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            )}
            {totalOwe > 0 && (
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryAmount, { color: colors.destructive }]}>
                  -{totalOwe.toFixed(2)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>you owe</Text>
              </View>
            )}
          </View>
        )}

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
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? "#fff" : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={filter === "all" ? "No groups yet" : "No groups here"}
            description={filter === "all" ? "Create a group to start splitting expenses" : "Try another filter"}
            action={filter === "all" ? { label: "Create group", onPress: () => router.push("/create-group") } : undefined}
          />
        }
        renderItem={({ item, index }) => {
          const myBalance = getMyBalance(item);
          const isPositive = myBalance > 0.01;
          const isNegative = myBalance < -0.01;
          const icon = CATEGORY_ICONS[item.category] || "users";

          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/group/${item.id}`)}
                activeOpacity={0.75}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name={icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                    {item.group_members?.length || 0} members · {item.currency}
                  </Text>
                </View>
                <View style={styles.cardBalance}>
                  {Math.abs(myBalance) > 0.01 ? (
                    <>
                      <Text style={[styles.balanceAmount, { color: isPositive ? colors.success : colors.destructive }]}>
                        {isPositive ? "+" : "-"}{Math.abs(myBalance).toFixed(2)}
                      </Text>
                      <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
                        {isPositive ? "owed" : "owe"}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.settledLabel, { color: colors.mutedForeground }]}>settled</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14, gap: 16, alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryDivider: { width: 1, height: 32 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  cardBalance: { alignItems: "flex-end" },
  balanceAmount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  settledLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
