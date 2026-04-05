import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function FriendsTab() {
  const colors = useColors();
  const { user } = useAuth();
  const { friends, pendingRequests, searchUsers, sendFriendRequest, respondToRequest, loadFriends } = useData();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [tab, setTab] = useState<"friends" | "requests">("friends");

  const topPt = Platform.OS === "web" ? 67 : insets.top;

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = async () => {
    if (!search.trim() || search.length < 3) return;
    setSearching(true);
    try {
      const results = await searchUsers(search.trim());
      // Filter out self and existing friends
      const filtered = results.filter(
        (r) => r.id !== user?.id && !friends.find((f) => f.id === r.id)
      );
      setSearchResults(filtered);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (addressee: UserProfile) => {
    try {
      await sendFriendRequest(addressee.id);
      Alert.alert("Request sent", `Friend request sent to ${addressee.name}`);
      setSearchResults([]);
      setSearch("");
      setShowSearch(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRespond = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      await respondToRequest(requestId, status);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Friends</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setShowSearch(!showSearch); setSearchResults([]); }}
          >
            <Feather name={showSearch ? "x" : "user-plus"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {showSearch && (
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by email..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity onPress={handleSearch}>
                <Text style={[styles.searchBtn, { color: colors.primary }]}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showSearch && searchResults.length > 0 && (
          <View style={[styles.resultsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {searchResults.map((r) => (
              <View key={r.id} style={styles.resultRow}>
                <Avatar name={r.name} size={36} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.resultName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.resultEmail, { color: colors.mutedForeground }]}>{r.email}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.requestBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleSendRequest(r)}
                >
                  <Text style={styles.requestBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {pendingRequests.length > 0 && (
          <View style={[styles.tabRow, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "friends" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab("friends")}
            >
              <Text style={[styles.tabText, { color: tab === "friends" ? colors.primary : colors.mutedForeground }]}>
                Friends ({friends.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "requests" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab("requests")}
            >
              <Text style={[styles.tabText, { color: tab === "requests" ? colors.primary : colors.mutedForeground }]}>
                Requests ({pendingRequests.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {tab === "requests" ? (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListEmptyComponent={<EmptyState icon="inbox" title="No pending requests" description="" />}
          renderItem={({ item }) => {
            const requester = item.requester as UserProfile;
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Avatar name={requester?.name || "?"} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{requester?.name}</Text>
                  <Text style={[styles.cardEmail, { color: colors.mutedForeground }]}>{requester?.email}</Text>
                </View>
                <View style={styles.respondBtns}>
                  <TouchableOpacity
                    style={[styles.respondBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleRespond(item.id, "accepted")}
                  >
                    <Feather name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.respondBtn, { backgroundColor: colors.destructive + "20" }]}
                    onPress={() => handleRespond(item.id, "rejected")}
                  >
                    <Feather name="x" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListEmptyComponent={
            !showSearch ? (
              <EmptyState
                icon="users"
                title="No friends yet"
                description="Search by email to add friends and split expenses together"
                action={{ label: "Add Friend", onPress: () => setShowSearch(true) }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Avatar name={item.name} size={42} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardEmail, { color: colors.mutedForeground }]}>{item.email}</Text>
              </View>
              <View style={[styles.friendBadge, { backgroundColor: colors.success + "20" }]}>
                <Feather name="check" size={12} color={colors.success} />
                <Text style={[styles.friendBadgeText, { color: colors.success }]}>Friend</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  searchBtn: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultsBox: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  resultRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  resultName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  requestBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  requestBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  respondBtns: { flexDirection: "row", gap: 8 },
  respondBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  friendBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  friendBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
