import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import Input from "@/components/Input";
import { CURRENCIES, ExpenseSplit, SplitType } from "@/types";

const SPLIT_TYPES: { key: SplitType; label: string; icon: string }[] = [
  { key: "equal", label: "Equal", icon: "users" },
  { key: "exact", label: "Exact", icon: "dollar-sign" },
  { key: "percentage", label: "Percent", icon: "percent" },
  { key: "full", label: "One pays", icon: "user" },
];

const CATEGORIES = [
  { key: "food", label: "Food", icon: "coffee" },
  { key: "transport", label: "Transport", icon: "navigation" },
  { key: "accommodation", label: "Stay", icon: "home" },
  { key: "entertainment", label: "Fun", icon: "film" },
  { key: "utilities", label: "Bills", icon: "zap" },
  { key: "shopping", label: "Shopping", icon: "shopping-bag" },
  { key: "other", label: "Other", icon: "tag" },
];

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { groups, addExpense } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const group = groups.find(g => g.id === groupId);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [category, setCategory] = useState("other");
  const [paidBy, setPaidBy] = useState<string>(user?.id || "");
  const [loading, setLoading] = useState(false);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fullOwedBy, setFullOwedBy] = useState<string>("");

  if (!group) return null;

  const currency = CURRENCIES.find(c => c.code === group.currency);
  const symbol = currency?.symbol || group.currency;
  const amount = parseFloat(amountStr) || 0;
  const members = group.members;

  const computeSplits = (): ExpenseSplit[] => {
    if (splitType === "equal") {
      const each = amount / members.length;
      return members.map(m => ({ userId: m.userId, amount: Math.round(each * 100) / 100 }));
    }
    if (splitType === "exact") {
      return members.map(m => ({
        userId: m.userId,
        amount: parseFloat(exactAmounts[m.userId] || "0"),
      }));
    }
    if (splitType === "percentage") {
      return members.map(m => {
        const pct = parseFloat(percentages[m.userId] || "0");
        return { userId: m.userId, amount: Math.round(amount * pct) / 100, percentage: pct };
      });
    }
    if (splitType === "full") {
      const targetId = fullOwedBy || members[0]?.userId;
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
    if (Math.abs(splitsTotal - amount) > 0.02) {
      Alert.alert("Split error", `Splits total ${symbol}${splitsTotal.toFixed(2)} doesn't match ${symbol}${amount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        groupId: group.id,
        description: description.trim(),
        amount,
        currency: group.currency,
        paidBy: [paidBy],
        paidAmounts: { [paidBy]: amount },
        splitType,
        splits,
        createdBy: user?.id || "",
        category,
        notes: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Add Expense</Text>
        <Button label="Save" onPress={handleAdd} loading={loading} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        <Input
          label={`Amount (${symbol})`}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amountStr}
          onChangeText={setAmountStr}
          prefix={symbol}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, { backgroundColor: category === cat.key ? colors.primary : colors.muted }]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Feather name={cat.icon as any} size={14} color={category === cat.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.catText, { color: category === cat.key ? "#fff" : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Paid by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
            {members.map(m => (
              <TouchableOpacity
                key={m.userId}
                style={[styles.payerChip, {
                  backgroundColor: paidBy === m.userId ? colors.primary + "20" : colors.muted,
                  borderColor: paidBy === m.userId ? colors.primary : "transparent",
                }]}
                onPress={() => setPaidBy(m.userId)}
                activeOpacity={0.7}
              >
                <Avatar name={m.user.name} size={28} />
                <Text style={[styles.payerName, { color: paidBy === m.userId ? colors.primary : colors.foreground }]}>
                  {m.userId === user?.id ? "You" : m.user.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Split</Text>
          <View style={styles.splitTypeRow}>
            {SPLIT_TYPES.map(st => (
              <TouchableOpacity
                key={st.key}
                style={[styles.splitTypeChip, {
                  backgroundColor: splitType === st.key ? colors.primary : colors.muted,
                  flex: 1,
                }]}
                onPress={() => { Haptics.selectionAsync(); setSplitType(st.key); }}
                activeOpacity={0.7}
              >
                <Feather name={st.icon as any} size={14} color={splitType === st.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.splitTypeText, { color: splitType === st.key ? "#fff" : colors.mutedForeground }]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {splitType === "equal" && amount > 0 && (
            <View style={[styles.splitPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.splitPreviewText, { color: colors.mutedForeground }]}>
                Each person pays {symbol}{(amount / members.length).toFixed(2)}
              </Text>
            </View>
          )}

          {splitType === "exact" && (
            <View style={styles.splitInputs}>
              {members.map(m => (
                <View key={m.userId} style={styles.splitInputRow}>
                  <Avatar name={m.user.name} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.foreground }]} numberOfLines={1}>
                    {m.userId === user?.id ? "You" : m.user.name.split(" ")[0]}
                  </Text>
                  <TextInput
                    style={[styles.splitInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                    value={exactAmounts[m.userId] || ""}
                    onChangeText={val => setExactAmounts(prev => ({ ...prev, [m.userId]: val }))}
                  />
                </View>
              ))}
            </View>
          )}

          {splitType === "percentage" && (
            <View style={styles.splitInputs}>
              {members.map(m => (
                <View key={m.userId} style={styles.splitInputRow}>
                  <Avatar name={m.user.name} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.foreground }]} numberOfLines={1}>
                    {m.userId === user?.id ? "You" : m.user.name.split(" ")[0]}
                  </Text>
                  <TextInput
                    style={[styles.splitInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                    value={percentages[m.userId] || ""}
                    onChangeText={val => setPercentages(prev => ({ ...prev, [m.userId]: val }))}
                  />
                  <Text style={[styles.pctSign, { color: colors.mutedForeground }]}>%</Text>
                </View>
              ))}
            </View>
          )}

          {splitType === "full" && (
            <View style={styles.splitInputs}>
              <Text style={[styles.fullOwedLabel, { color: colors.mutedForeground }]}>Owed by:</Text>
              {members.map(m => (
                <TouchableOpacity
                  key={m.userId}
                  style={[styles.splitInputRow, { cursor: "pointer" } as any]}
                  onPress={() => setFullOwedBy(m.userId)}
                  activeOpacity={0.7}
                >
                  <Avatar name={m.user.name} size={32} />
                  <Text style={[styles.splitMemberName, { color: colors.foreground, flex: 1 }]}>
                    {m.userId === user?.id ? "You" : m.user.name}
                  </Text>
                  <View style={[styles.radioBtn, {
                    borderColor: (fullOwedBy || members[0]?.userId) === m.userId ? colors.primary : colors.border,
                    backgroundColor: (fullOwedBy || members[0]?.userId) === m.userId ? colors.primary : "transparent",
                  }]}>
                    {(fullOwedBy || members[0]?.userId) === m.userId && <View style={styles.radioDot} />}
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
  catRow: { gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  catText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  memberRow: { gap: 8 },
  payerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  payerName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  splitTypeRow: {
    flexDirection: "row",
    gap: 6,
  },
  splitTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  splitTypeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  splitPreview: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  splitPreviewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  splitInputs: { gap: 8 },
  splitInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  splitMemberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    width: 80,
  },
  splitInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "right",
  },
  pctSign: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  fullOwedLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  radioBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
