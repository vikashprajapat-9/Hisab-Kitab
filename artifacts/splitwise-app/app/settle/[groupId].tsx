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
import { Group, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$",
  CAD: "C$", SGD: "S$", AED: "د.إ", CHF: "CHF", MYR: "RM",
  THB: "฿", HKD: "HK$", NZD: "NZ$", BRL: "R$",
};

export default function SettleScreen() {
  const { groupId, fromId, toId, amount: amountParam } = useLocalSearchParams<{
    groupId: string; fromId: string; toId: string; amount: string;
  }>();
  const colors = useColors();
  const { user } = useAuth();
  const { loadGroup, addSettlement } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [amountStr, setAmountStr] = useState(amountParam || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    const g = await loadGroup(groupId);
    if (g) setGroup(g);
    setLoadingGroup(false);
  }, [groupId, loadGroup]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const fromUserId = fromId || user?.id || "";
  const toUserId = toId || "";

  const fromMember = group?.group_members?.find((m) => m.user_id === fromUserId);
  const toMember = group?.group_members?.find((m) => m.user_id === toUserId);
  const symbol = CURRENCY_SYMBOLS[group?.currency || "USD"] || "$";

  const topPt = Platform.OS === "web" ? 67 : insets.top;

  const handleSettle = async () => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await addSettlement({
        groupId: groupId || undefined,
        toUserId,
        amount,
        currency: group?.currency || "USD",
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to record settlement");
    } finally {
      setSaving(false);
    }
  };

  if (loadingGroup) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Settle Up</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Payment flow */}
        <View style={[styles.paymentFlow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.userBlock}>
            <Avatar name={fromMember?.user?.name || "?"} size={56} />
            <Text style={[styles.userName, { color: colors.text }]}>
              {fromUserId === user?.id ? "You" : fromMember?.user?.name || "?"}
            </Text>
            <Text style={[styles.userRole, { color: colors.mutedForeground }]}>Pays</Text>
          </View>
          <View style={styles.arrowBlock}>
            <View style={[styles.arrowLine, { backgroundColor: colors.primary }]} />
            <Feather name="arrow-right" size={20} color={colors.primary} />
          </View>
          <View style={styles.userBlock}>
            <Avatar name={toMember?.user?.name || "?"} size={56} />
            <Text style={[styles.userName, { color: colors.text }]}>
              {toUserId === user?.id ? "You" : toMember?.user?.name || "?"}
            </Text>
            <Text style={[styles.userRole, { color: colors.mutedForeground }]}>Receives</Text>
          </View>
        </View>

        {/* Amount */}
        <View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>AMOUNT</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{symbol}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              autoFocus
            />
          </View>
        </View>

        {/* Note */}
        <View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTE (OPTIONAL)</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Cash, bank transfer, UPI..."
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={handleSettle}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Settlement</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          This records the payment and updates balances for the group.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  navTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 20 },
  paymentFlow: { flexDirection: "row", alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1 },
  userBlock: { flex: 1, alignItems: "center", gap: 6 },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  userRole: { fontSize: 12, fontFamily: "Inter_400Regular" },
  arrowBlock: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  arrowLine: { width: 20, height: 2 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 8 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  confirmBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
