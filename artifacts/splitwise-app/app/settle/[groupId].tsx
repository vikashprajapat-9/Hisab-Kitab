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
import { CURRENCIES } from "@/types";

export default function SettleScreen() {
  const { groupId, from, to, amount: amountParam } = useLocalSearchParams<{ groupId: string; from: string; to: string; amount: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const { groups, friends, addSettlement } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const group = groups.find(g => g.id === groupId);
  const [amountStr, setAmountStr] = useState(amountParam || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const fromUserId = from || user?.id || "";
  const toUserId = to || "";

  const allUsers = [user, ...friends].filter(Boolean) as any[];
  const fromUser = group?.members.find(m => m.userId === fromUserId)?.user || allUsers.find(u => u.id === fromUserId);
  const toUser = group?.members.find(m => m.userId === toUserId)?.user || allUsers.find(u => u.id === toUserId);

  const currency = CURRENCIES.find(c => c.code === group?.currency);
  const symbol = currency?.symbol || "$";

  const handleSettle = async () => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await addSettlement({
        groupId,
        fromUserId,
        toUserId,
        amount,
        currency: group?.currency || "USD",
        note: note.trim() || undefined,
        isSettled: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Settle Up</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.paymentFlow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.userBlock}>
            <Avatar name={fromUser?.name || "?"} size={56} />
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {fromUserId === user?.id ? "You" : fromUser?.name || "?"}
            </Text>
            <Text style={[styles.userRole, { color: colors.mutedForeground }]}>Pays</Text>
          </View>
          <View style={styles.arrowBlock}>
            <View style={[styles.arrowLine, { backgroundColor: colors.primary }]} />
            <Feather name="arrow-right" size={20} color={colors.primary} />
          </View>
          <View style={styles.userBlock}>
            <Avatar name={toUser?.name || "?"} size={56} />
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {toUserId === user?.id ? "You" : toUser?.name || "?"}
            </Text>
            <Text style={[styles.userRole, { color: colors.mutedForeground }]}>Receives</Text>
          </View>
        </View>

        <Input
          label={`Amount (${symbol})`}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amountStr}
          onChangeText={setAmountStr}
          prefix={symbol}
        />

        <Input
          label="Note (optional)"
          placeholder="Cash, bank transfer, etc."
          value={note}
          onChangeText={setNote}
        />

        <Button
          label="Confirm Settlement"
          onPress={handleSettle}
          loading={loading}
          fullWidth
          size="lg"
        />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          This records the payment and updates balances in the group.
        </Text>
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
  paymentFlow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  userBlock: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "center",
  },
  userRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  arrowBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  arrowLine: {
    width: 20,
    height: 2,
  },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
