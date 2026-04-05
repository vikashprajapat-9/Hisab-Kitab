import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";

export default function QRCodeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPt + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>QR Code</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Scan to add me</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Share this code with friends to connect on Hisab Kitab
        </Text>

        <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.muted }]}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 64 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    {
                      backgroundColor:
                        Math.random() > 0.5 ? colors.foreground : "transparent",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <Avatar name={user?.name || "?"} size={56} />
          <Text style={[styles.qrName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.qrPhone, { color: colors.mutedForeground }]}>{user?.email}</Text>
        </View>

        <View style={styles.shareRow}>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.muted }]} activeOpacity={0.7}>
            <Feather name="share-2" size={18} color={colors.primary} />
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.muted }]} activeOpacity={0.7}>
            <Feather name="copy" size={18} color={colors.primary} />
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>Copy ID</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  qrContainer: {
    width: 260,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 14,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 156,
  },
  qrCell: {
    width: 19.5,
    height: 19.5,
  },
  qrName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  qrPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  shareRow: {
    flexDirection: "row",
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
