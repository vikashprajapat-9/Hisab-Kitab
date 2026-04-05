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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const colors = useColors();
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim().toLowerCase(), password, name.trim());
        Alert.alert(
          "Account created!",
          "Please check your email to confirm your account, then sign in.",
          [{ text: "OK", onPress: () => setMode("login") }]
        );
      } else {
        await signIn(email.trim().toLowerCase(), password);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const s = styles(colors, topInset, bottomInset);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(600)} style={s.header}>
          <View style={s.logoContainer}>
            <Text style={s.logoEmoji}>🧾</Text>
          </View>
          <Text style={s.appName}>Hisab Kitab</Text>
          <Text style={s.tagline}>Simple way to settle your hisaab</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={s.card}>
          <Text style={s.cardTitle}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </Text>
          <Text style={s.cardSubtitle}>
            {mode === "login"
              ? "Sign in to your account"
              : "Start managing shared expenses"}
          </Text>

          {mode === "signup" && (
            <View style={s.inputGroup}>
              <Text style={s.label}>Full Name</Text>
              <View style={s.inputRow}>
                <Feather name="user" size={18} color={colors.mutedForeground} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={s.inputGroup}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputRow}>
              <Feather name="mail" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Feather name="lock" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={s.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.submitBtn, isLoading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitBtnText}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.switchBtn}
            onPress={() => {
              setMode(mode === "login" ? "signup" : "login");
              setEmail("");
              setPassword("");
              setName("");
            }}
          >
            <Text style={s.switchText}>
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={s.switchLink}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: any, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      paddingTop: topInset + 40,
      paddingBottom: bottomInset + 24,
      paddingHorizontal: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 36,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.primary + "22",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    logoEmoji: {
      fontSize: 40,
    },
    appName: {
      fontSize: 30,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 6,
    },
    tagline: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      height: 50,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    eyeBtn: {
      padding: 4,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 16,
    },
    submitBtnDisabled: {
      opacity: 0.7,
    },
    submitBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    switchBtn: {
      alignItems: "center",
    },
    switchText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    switchLink: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
  });
