import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useData } from "@/context/DataContext";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { User } from "@/types";

export default function AddMemberScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const colors = useColors();
  const { groups, friends, addMemberToGroup } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const group = groups.find(g => g.id === groupId);
  const existingIds = group?.members.map(m => m.userId) || [];
  const availableFriends = friends.filter(f => !existingIds.includes(f.id));

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = availableFriends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search)
  );

  const handleAddExisting = async (friend: User) => {
    setLoading(true);
    try {
      await addMemberToGroup(groupId, friend);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Required", "Enter name and phone");
      return;
    }
    const newUser: User = {
      id: "user_" + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      phone: newPhone.trim(),
    };
    setLoading(true);
    try {
      await addMemberToGroup(groupId, newUser);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Add Member</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search friends..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {availableFriends.length === 0 && (
              <View style={[styles.newPersonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.newPersonTitle, { color: colors.foreground }]}>Add new person</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="Full name"
                  placeholderTextColor={colors.mutedForeground}
                  value={newName}
                  onChangeText={setNewName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="Phone number"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
                <Button label="Add to Group" onPress={handleAddNew} loading={loading} fullWidth />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.friendRow, { borderBottomColor: colors.border }]}
            onPress={() => handleAddExisting(item)}
            activeOpacity={0.7}
          >
            <Avatar name={item.name} size={44} />
            <View style={styles.friendInfo}>
              <Text style={[styles.friendName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.friendPhone, { color: colors.mutedForeground }]}>{item.phone}</Text>
            </View>
            <View style={[styles.addBadge, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="plus" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
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
  headerContent: {
    gap: 12,
    marginBottom: 8,
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
  newPersonCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  newPersonTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  friendInfo: { flex: 1, gap: 2 },
  friendName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  friendPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  addBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
