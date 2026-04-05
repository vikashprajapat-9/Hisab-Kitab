import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { Group, GroupMember, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const SPLIT_TYPES = [
  { key: "equal", label: "Equal", icon: "users" },
  { key: "exact", label: "Exact", icon: "dollar-sign" },
  { key: "percentage", label: "Percent", icon: "percent" },
  { key: "full", label: "One pays", icon: "user" },
] as const;

const CATEGORIES = [
  { key: "food", label: "Food", icon: "coffee" },
  { key: "transport", label: "Transport", icon: "navigation" },
  { key: "accommodation", label: "Stay", icon: "home" },
  { key: "entertainment", label: "Fun", icon: "film" },
  { key: "utilities", label: "Bills", icon: "zap" },
  { key: "shopping", label: "Shopping", icon: "shopping-bag" },
  { key: "other", label: "Other", icon: "tag" },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$",
  CAD: "C$", SGD: "S$", AED: "د.إ", CHF: "CHF", MYR: "RM",
  THB: "฿", HKD: "HK$", NZD: "NZ$", BRL: "R$",
};

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { loadGroup, addExpense } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage" | "full">("equal");
  const [category, setCategory] = useState("other");
  const [paidBy, setPaidBy] = useState<string>(user?.id || "");
  const [loading, setLoading] = useState(false);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fullOwedBy, setFullOwedBy] = useState<string>("");

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    const g = await loadGroup(groupId);
    if (g) {
      setGroup(g);
      setPaidBy(user?.id || "");
    }
    setLoadingGroup(false);
  }, [groupId, loadGroup, user?.id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  if (loadingGroup) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!group) return null;

  const symbol = CURRENCY_SYMBOLS[group.currency] || group.currency;
  const amount = parseFloat(amountStr) || 0;
  const members = group.group_members || [];

  const computeSplits = () => {
    if (splitType === "equal") {
      const each = amount / members.length;
      return members.map((m) => ({ userId: m.user_id, amount: parseFloat(each.toFixed(2)) }));
    }
    if (splitType === "exact") {
      return members.map((m) => ({
        userId: m.user_id,
        amount: parseFloat(exactAmounts[m.user_id] || "0"),
      }));
    }
    if (splitType === "percentage") {
      return members.map((m) => {
        const pct = parseFloat(percentages[m.user_id] || "0");
        return { userId: m.user_id, amount: parseFloat((amount * pct / 100).toFixed(2)), percentage: pct };
      });
    }
    if (splitType === "full") {
      const targetId = fullOwedBy || members[0]?.user_id;
      return [{ userId: targetId, amount }];
    }
    return [];
  };

  const handleAdd = async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description");
      return;
    }
    if (amount <= 0) {
      Alert.alert("Required", "Please enter a valid amount");
      return;
    }
    const splits = computeSplits();
    const splitsTotal = splits.reduce((s, sp) => s + sp.amount, 0);
    if (Math.abs(splitsTotal - amount) > 0.05) {
      Alert.alert("Split error", `Splits total ${symbol}${splitsTotal.toFixed(2)} but expense is ${symbol}${amount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        groupId: group.id,
        description: description.trim(),
        amount,
        currency: group.currency,
        paidBy,
        splitType,
        category,
        splits,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const topPt = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Add Expense</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>DESCRIPTION *</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="What was this for?"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              autoFocus
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>AMOUNT ({group.currency})</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{symbol}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.chip,
                  { backgroundColor: category === cat.key ? colors.primary : colors.card, borderColor: category === cat.key ? colors.primary : colors.border },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Feather name={cat.icon as any} size={14} color={category === cat.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.chipText, { color: category === cat.key ? "#fff" : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Paid By */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>PAID BY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {members.map((m: GroupMember) => (
              <TouchableOpacity
                key={m.user_id}
                style={[
                  styles.payerChip,
                  {
                    backgroundColor: paidBy === m.user_id ? colors.primary + "20" : colors.card,
                    borderColor: paidBy === m.user_id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setPaidBy(m.user_id)}
              >
                <Avatar name={m.user?.name || "?"} size={28} />
                <Text style={[styles.payerName, { color: paidBy === m.user_id ? colors.primary : colors.text }]}>
                  {m.user_id === user?.id ? "You" : m.user?.name?.split(" ")[0] || "?"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Split Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>SPLIT</Text>
          <View style={styles.splitTypeRow}>
            {SPLIT_TYPES.map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.splitTypeChip,
                  { backgroundColor: splitType === st.key ? colors.primary : colors.card, borderColor: splitType === st.key ? colors.primary : colors.border },
                ]}
                onPress={() => setSplitType(st.key)}
              >
                <Feather name={st.icon as any} size={14} color={splitType === st.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.chipText, { color: splitType === st.key ? "#fff" : colors.mutedForeground }]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {splitType === "equal" && amount > 0 && (
            <View style={[styles.previewBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.previewText, { color: colors.mutedForeground }]}>
                Each person pays {symbol}{(amount / members.length).toFixed(2)}
              </Text>
            </View>
          )}

          {splitType === "exact" && (
            <View style={styles.splitInputs}>
              {members.map((m: GroupMember) => (
                <View key={m.user_id} style={styles.splitInputRow}>
                  <Avatar name={m.user?.name || "?"} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.text }]} numberOfLines={1}>
                    {m.user_id === user?.id ? "You" : m.user?.name?.split(" ")[0]}
                  </Text>
                  <View style={[styles.amountInputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[{ color: colors.mutedForeground, marginRight: 4 }]}>{symbol}</Text>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      value={exactAmounts[m.user_id] || ""}
                      onChangeText={(val) => setExactAmounts((prev) => ({ ...prev, [m.user_id]: val }))}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {splitType === "percentage" && (
            <View style={styles.splitInputs}>
              {members.map((m: GroupMember) => (
                <View key={m.user_id} style={styles.splitInputRow}>
                  <Avatar name={m.user?.name || "?"} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.text }]} numberOfLines={1}>
                    {m.user_id === user?.id ? "You" : m.user?.name?.split(" ")[0]}
                  </Text>
                  <View style={[styles.amountInputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      value={percentages[m.user_id] || ""}
                      onChangeText={(val) => setPercentages((prev) => ({ ...prev, [m.user_id]: val }))}
                    />
                    <Text style={{ color: colors.mutedForeground, marginLeft: 4 }}>%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {splitType === "full" && (
            <View style={styles.splitInputs}>
              <Text style={[styles.previewText, { color: colors.mutedForeground, marginBottom: 4 }]}>
                Who owes the full amount?
              </Text>
              {members.map((m: GroupMember) => (
                <TouchableOpacity
                  key={m.user_id}
                  style={styles.splitInputRow}
                  onPress={() => setFullOwedBy(m.user_id)}
                >
                  <Avatar name={m.user?.name || "?"} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.text, flex: 1 }]}>
                    {m.user_id === user?.id ? "You" : m.user?.name}
                  </Text>
                  <View style={[
                    styles.radioBtn,
                    {
                      borderColor: (fullOwedBy || members[0]?.user_id) === m.user_id ? colors.primary : colors.border,
                      backgroundColor: (fullOwedBy || members[0]?.user_id) === m.user_id ? colors.primary : "transparent",
                    }
                  ]}>
                    {(fullOwedBy || members[0]?.user_id) === m.user_id && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  navTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 20 },
  section: { gap: 10 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 8 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  payerChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2 },
  payerName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  splitTypeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  splitTypeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  previewBox: { padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  previewText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  splitInputs: { gap: 10 },
  splitInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  splitMemberName: { fontFamily: "Inter_500Medium", fontSize: 14, width: 80 },
  amountInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 40 },
  amountInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  radioBtn: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
});
