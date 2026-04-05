import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ icon, label, value, onPress, rightElement, destructive }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: (destructive ? colors.destructive : colors.primary) + "18" }]}>
        <Feather name={icon as any} size={18} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: destructive ? colors.destructive : colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
      </View>
    </TouchableOpacity>
  );
}

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: "sun" },
  { key: "dark", label: "Dark", icon: "moon" },
  { key: "system", label: "System", icon: "smartphone" },
] as const;

export default function AccountTab() {
  const colors = useColors();
  const { user, signOut, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPt = Platform.OS === "web" ? 67 : insets.top;

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {}
          setSigningOut(false);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPt + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Account</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Avatar name={user?.name || "?"} size={64} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || "—"}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email || "—"}</Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.primary + "18" }]}
          onPress={() => router.push("/edit-profile")}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme === opt.key ? colors.primary : colors.background,
                    borderColor: theme === opt.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTheme(opt.key)}
              >
                <Feather name={opt.icon} size={16} color={theme === opt.key ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: theme === opt.key ? "#fff" : colors.mutedForeground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="user"
            label="Edit Profile"
            onPress={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="mail"
            label="Email"
            value={user?.email || "—"}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="info" label="App Version" value="2.0.0" />
          <SettingRow icon="shield" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="file-text" label="Terms of Service" onPress={() => {}} />
        </View>
      </View>

      {/* Sign Out */}
      <View style={[styles.section, { marginBottom: 8 }]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="log-out"
            label={signingOut ? "Signing out..." : "Sign Out"}
            onPress={signingOut ? undefined : handleSignOut}
            destructive
          />
        </View>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Hisab Kitab · Simple way to settle your hisaab
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  profileCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  themeRow: { flexDirection: "row", padding: 12, gap: 8 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  themeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  settingValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footer: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginVertical: 12 },
});
