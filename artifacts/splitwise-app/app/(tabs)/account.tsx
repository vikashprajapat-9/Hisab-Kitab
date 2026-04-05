import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Avatar from "@/components/Avatar";
import { ThemeMode } from "@/types";

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
      <View style={[styles.settingIcon, { backgroundColor: (destructive ? colors.destructive : colors.primary) + "15" }]}>
        <Feather name={icon as any} size={18} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: destructive ? colors.destructive : colors.foreground }]}>
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

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "sun" },
  { key: "dark", label: "Dark", icon: "moon" },
  { key: "system", label: "System", icon: "smartphone" },
];

export default function AccountTab() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPt + 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 }
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>

      {user && (
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Avatar name={user.name} size={64} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>{user.phone}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/edit-profile" as any)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Appearance</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.themeChip,
                {
                  backgroundColor: themeMode === opt.key ? colors.primary : colors.muted,
                  borderColor: themeMode === opt.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setThemeMode(opt.key); }}
              activeOpacity={0.7}
            >
              <Feather name={opt.icon as any} size={14} color={themeMode === opt.key ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.themeText, { color: themeMode === opt.key ? colors.primaryForeground : colors.mutedForeground }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Notifications</Text>
        <SettingRow
          icon="bell"
          label="Push Notifications"
          rightElement={
            <Switch
              value={notifications}
              onValueChange={val => { Haptics.selectionAsync(); setNotifications(val); }}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={notifications ? colors.primary : colors.mutedForeground}
            />
          }
        />
        <SettingRow
          icon="mail"
          label="Email Notifications"
          rightElement={
            <Switch
              value={emailNotifs}
              onValueChange={val => { Haptics.selectionAsync(); setEmailNotifs(val); }}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={emailNotifs ? colors.primary : colors.mutedForeground}
            />
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Share & Invite</Text>
        <SettingRow
          icon="share-2"
          label="Invite via Link"
          onPress={() => Alert.alert("Share", "https://splitease.app/invite/"+user?.id)}
        />
        <SettingRow
          icon="message-square"
          label="Invite via WhatsApp"
          onPress={() => Alert.alert("WhatsApp", "Opening WhatsApp to invite friends...")}
        />
        <SettingRow
          icon="grid"
          label="QR Code"
          onPress={() => router.push("/qr-code" as any)}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>More</Text>
        <SettingRow icon="help-circle" label="Help & Support" onPress={() => Alert.alert("Help", "Visit splitease.app/help")} />
        <SettingRow icon="shield" label="Privacy Policy" onPress={() => Alert.alert("Privacy", "Visit splitease.app/privacy")} />
        <SettingRow icon="info" label="App Version" value="1.0.0" />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  profilePhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 0,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  themeRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  themeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
