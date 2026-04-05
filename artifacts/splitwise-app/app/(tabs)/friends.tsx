import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { User } from "@/types";

export default function FriendsTab() {
  const colors = useColors();
  const { user } = useAuth();
  const { friends, groups, getFriendBalance, addFriend } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const filtered = friends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

  const handleAddFriend = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Missing info", "Please enter name and phone");
      return;
    }
    const newUser: User = {
      id: "user_" + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      phone: newPhone.trim(),
    };
    await addFriend(newUser);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    setNewPhone("");
    setShowAdd(false);
  };

  const getFriendGroups = (friendId: string) =>
    groups.filter(g => g.members.some(m => m.userId === friendId) && g.members.some(m => m.userId === user?.id));

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Friends</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(!showAdd); }}
            activeOpacity={0.8}
          >
            <Feather name={showAdd ? "x" : "user-plus"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {showAdd && (
          <Animated.View
            entering={FadeInRight.duration(300)}
            style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.addTitle, { color: colors.foreground }]}>Add Friend</Text>
            <TextInput
              style={[styles.addInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.addInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Phone number"
              placeholderTextColor={colors.mutedForeground}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={[styles.addFriendBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddFriend}
              activeOpacity={0.8}
            >
              <Text style={[styles.addFriendBtnText, { color: colors.primaryForeground }]}>Add Friend</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search friends..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const balance = getFriendBalance(item.id);
          const sharedGroups = getFriendGroups(item.id);
          const isOwed = balance > 0.01;
          const isOwe = balance < -0.01;
          const balanceColor = isOwed ? colors.owed : isOwe ? colors.owe : colors.mutedForeground;

          return (
            <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
              <TouchableOpacity
                style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Avatar name={item.name} size={48} />
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.friendPhone, { color: colors.mutedForeground }]}>{item.phone}</Text>
                  {sharedGroups.length > 0 && (
                    <Text style={[styles.sharedGroups, { color: colors.mutedForeground }]}>
                      {sharedGroups.length} shared group{sharedGroups.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
                <View style={styles.balanceWrap}>
                  {Math.abs(balance) > 0.01 ? (
                    <>
                      <Text style={[styles.balanceLabel, { color: balanceColor }]}>
                        {isOwed ? "owes you" : "you owe"}
                      </Text>
                      <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                        ${Math.abs(balance).toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Settled</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 }
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="user"
            title="No friends yet"
            subtitle="Add friends to split expenses with them"
            actionLabel="Add Friend"
            onAction={() => setShowAdd(true)}
          />
        }
        scrollEnabled={filtered.length > 0}
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
  addCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  addTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  addInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  addFriendBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addFriendBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  friendPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  sharedGroups: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  balanceWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  balanceAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
});
