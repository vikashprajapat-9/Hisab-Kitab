import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import Input from "@/components/Input";
import Button from "@/components/Button";

type Step = "phone" | "otp" | "name";

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [generatedOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.length < 10) {
      Alert.alert("Invalid number", "Please enter a valid phone number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("OTP Sent", `Your verification code is: ${generatedOtp}`, [
      { text: "OK", onPress: () => setStep("otp") },
    ]);
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp === generatedOtp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("name");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Wrong OTP", "Please check the code and try again");
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name");
      return;
    }
    setLoading(true);
    try {
      await login(phone, name.trim());
      router.replace("/(tabs)" as any);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="divide" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>SplitEase</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Split expenses, not friendships
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.card}>
          {step === "phone" && (
            <View style={styles.formSection}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Enter your number</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                We'll send you a verification code
              </Text>
              <Input
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                prefix={<Feather name="phone" size={16} color={colors.mutedForeground} /> as any}
              />
              <Button
                label="Send Code"
                onPress={handleSendOtp}
                fullWidth
                size="lg"
              />
            </View>
          )}

          {step === "otp" && (
            <View style={styles.formSection}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Verify code</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                Enter the 6-digit code sent to {phone}
              </Text>
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => { otpRefs.current[i] = r; }}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: digit ? colors.primary : colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={digit}
                    onChangeText={t => handleOtpChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>
              <Button label="Verify" onPress={handleVerifyOtp} fullWidth size="lg" />
              <TouchableOpacity onPress={() => setStep("phone")} style={styles.backBtn}>
                <Text style={[styles.backText, { color: colors.primary }]}>Change number</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "name" && (
            <View style={styles.formSection}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>What's your name?</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                This is how others will see you
              </Text>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
              />
              <Button
                label="Get Started"
                onPress={handleComplete}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  card: {
    gap: 0,
  },
  formSection: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  stepDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  backText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
