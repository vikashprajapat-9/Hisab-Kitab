import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
];

const GROUP_CATEGORIES = [
  { value: "home", label: "Home", icon: "home" },
  { value: "trip", label: "Trip", icon: "map" },
  { value: "food", label: "Food", icon: "coffee" },
  { value: "couple", label: "Couple", icon: "heart" },
  { value: "work", label: "Work", icon: "briefcase" },
  { value: "other", label: "Other", icon: "users" },
];

export default function CreateGroupScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { createGroup, friends } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [currency, setCurrency] = useState("INR");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);

  const topPt = Platform.OS === "web" ? 67 : insets.top;

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
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
      router.replace(`/group/${group.id}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPt + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Group</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.createBtn, { color: colors.primary }]}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>GROUP NAME *</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Goa Trip 2025"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>DESCRIPTION (OPTIONAL)</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="What's this group for?"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {GROUP_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryBtn,
                  {
                    backgroundColor: category === cat.value ? colors.primary : colors.card,
                    borderColor: category === cat.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Feather name={cat.icon as any} size={18} color={category === cat.value ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.categoryLabel, { color: category === cat.value ? "#fff" : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CURRENCY</Text>
          <TouchableOpacity
            style={[styles.currencyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowCurrencies(!showCurrencies)}
          >
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{selectedCurrency?.symbol}</Text>
            <Text style={[styles.currencyText, { color: colors.text }]}>
              {selectedCurrency?.code} — {selectedCurrency?.name}
            </Text>
            <Feather name={showCurrencies ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showCurrencies && (
            <View style={[styles.currencyList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setCurrency(c.code); setShowCurrencies(false); }}
                >
                  <Text style={[styles.currencyOptionCode, { color: colors.primary }]}>{c.symbol}</Text>
                  <Text style={[styles.currencyOptionName, { color: colors.text }]}>{c.code} — {c.name}</Text>
                  {currency === c.code && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Members */}
        {friends.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              ADD FRIENDS ({selectedMembers.length} selected)
            </Text>
            <View style={[styles.membersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {friends.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.memberRow, { borderBottomColor: colors.border }]}
                  onPress={() => toggleMember(f.id)}
                >
                  <Avatar name={f.name} size={36} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{f.name}</Text>
                    <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>{f.email}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: selectedMembers.includes(f.id) ? colors.primary : "transparent",
                      borderColor: selectedMembers.includes(f.id) ? colors.primary : colors.border,
                    }
                  ]}>
                    {selectedMembers.includes(f.id) && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {friends.length === 0 && (
          <View style={[styles.noFriendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user-plus" size={20} color={colors.mutedForeground} />
            <Text style={[styles.noFriendsText, { color: colors.mutedForeground }]}>
              Add friends from the Friends tab to include them in groups
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  createBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, gap: 20 },
  section: { gap: 8 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  inputRow: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, justifyContent: "center" },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  categoryLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  currencyRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold", width: 28 },
  currencyText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  currencyList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  currencyOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  currencyOptionCode: { fontSize: 14, fontFamily: "Inter_700Bold", width: 28 },
  currencyOptionName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  membersCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  memberRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  memberName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  memberEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  noFriendsCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  noFriendsText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
});
