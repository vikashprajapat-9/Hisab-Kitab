import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import Input from "@/components/Input";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import { CURRENCIES, GROUP_CATEGORIES, GroupCategory, User } from "@/types";

export default function CreateGroupScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { createGroup, friends } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupCategory>("other");
  const [currency, setCurrency] = useState("USD");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);

  const toggleMember = (uid: string) => {
    setSelectedMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a group name");
      return;
    }
    setLoading(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        currency,
        memberIds: selectedMembers,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/group/${group.id}` as any);
    } catch (e) {
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>New Group</Text>
        <Button label="Create" onPress={handleCreate} loading={loading} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label="Group Name"
          placeholder="Roommates, Trip to Bali, etc."
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Input
          label="Description (optional)"
          placeholder="What's this group for?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {GROUP_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.value ? colors.primary : colors.muted,
                    borderColor: category === cat.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setCategory(cat.value); }}
                activeOpacity={0.7}
              >
                <Feather name={cat.icon as any} size={16} color={category === cat.value ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.categoryText, { color: category === cat.value ? colors.primaryForeground : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Default Currency</Text>
          <TouchableOpacity
            style={[styles.currencyPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowCurrencies(!showCurrencies)}
            activeOpacity={0.7}
          >
            <Text style={[styles.currencyText, { color: colors.foreground }]}>
              {selectedCurrency?.symbol} {selectedCurrency?.code} — {selectedCurrency?.name}
            </Text>
            <Feather name={showCurrencies ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showCurrencies && (
            <View style={[styles.currencyList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setCurrency(c.code); setShowCurrencies(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>{c.symbol}</Text>
                  <Text style={[styles.currencyCode, { color: colors.foreground }]}>{c.code}</Text>
                  <Text style={[styles.currencyName, { color: colors.mutedForeground }]}>{c.name}</Text>
                  {currency === c.code && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Add Members</Text>
          {friends.length === 0 ? (
            <View style={[styles.noFriends, { backgroundColor: colors.muted, borderRadius: 12 }]}>
              <Text style={[styles.noFriendsText, { color: colors.mutedForeground }]}>
                Add friends first from the Friends tab to include them in groups
              </Text>
            </View>
          ) : (
            friends.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.memberRow, { borderBottomColor: colors.border }]}
                onPress={() => toggleMember(f.id)}
                activeOpacity={0.7}
              >
                <Avatar name={f.name} size={40} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{f.name}</Text>
                  <Text style={[styles.memberPhone, { color: colors.mutedForeground }]}>{f.phone}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: selectedMembers.includes(f.id) ? colors.primary : "transparent",
                    borderColor: selectedMembers.includes(f.id) ? colors.primary : colors.border,
                  }
                ]}>
                  {selectedMembers.includes(f.id) && <Feather name="check" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 20,
  },
  section: { gap: 10 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  currencyPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  currencyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  currencyList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 200,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  currencySymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    width: 24,
  },
  currencyCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    width: 36,
  },
  currencyName: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  noFriends: {
    padding: 16,
    alignItems: "center",
  },
  noFriendsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  memberPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
