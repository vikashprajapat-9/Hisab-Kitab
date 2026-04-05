import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import GroupCard from "@/components/GroupCard";
import EmptyState from "@/components/EmptyState";
import { Group } from "@/types";

type Filter = "all" | "owe" | "owed" | "settled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owe", label: "You Owe" },
  { key: "owed", label: "Owed" },
  { key: "settled", label: "Settled" },
];

export default function GroupsTab() {
  const colors = useColors();
  const { user } = useAuth();
  const { groups, isLoading, refreshData } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredGroups = groups.filter((g: Group) => {
    const myMember = g.members.find(m => m.userId === user?.id);
    const balance = myMember?.balance || 0;
    if (filter === "settled") return g.isSettled || Math.abs(balance) < 0.01;
    if (filter === "owe") return balance < -0.01;
    if (filter === "owed") return balance > 0.01;
    return true;
  });

  const totalOwed = groups.reduce((sum: number, g: Group) => {
    const m = g.members.find(m => m.userId === user?.id);
    return sum + Math.max(0, m?.balance || 0);
  }, 0);
  const totalOwe = groups.reduce((sum: number, g: Group) => {
    const m = g.members.find(m => m.userId === user?.id);
    return sum + Math.min(0, m?.balance || 0);
  }, 0);

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Groups</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/create-group" as any); }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {groups.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>You are owed</Text>
              <Text style={[styles.summaryAmount, { color: colors.owed }]}>${totalOwed.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>You owe</Text>
              <Text style={[styles.summaryAmount, { color: colors.owe }]}>${Math.abs(totalOwe).toFixed(2)}</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground }
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <GroupCard group={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="users"
              title="No groups yet"
              subtitle="Create a group to start splitting expenses with friends"
              actionLabel="Create Group"
              onAction={() => router.push("/create-group" as any)}
            />
          ) : null
        }
        scrollEnabled={filteredGroups.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  summaryAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  list: {
    padding: 16,
  },
});
