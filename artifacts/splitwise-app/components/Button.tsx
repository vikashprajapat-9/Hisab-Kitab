import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const bgColors = {
    primary: colors.primary,
    secondary: colors.secondary,
    destructive: colors.destructive,
    outline: "transparent",
    ghost: "transparent",
  };
  const textColors = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    destructive: colors.destructiveForeground,
    outline: colors.primary,
    ghost: colors.foreground,
  };
  const borderColors = {
    primary: "transparent",
    secondary: "transparent",
    destructive: "transparent",
    outline: colors.primary,
    ghost: "transparent",
  };

  const paddings = { sm: { v: 8, h: 14 }, md: { v: 12, h: 20 }, lg: { v: 16, h: 28 } };
  const fontSizes = { sm: 13, md: 15, lg: 16 };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: bgColors[variant],
          paddingVertical: paddings[size].v,
          paddingHorizontal: paddings[size].h,
          borderColor: borderColors[variant],
          borderWidth: variant === "outline" ? 1.5 : 0,
          opacity: disabled || loading ? 0.6 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <Text
          style={[styles.text, { color: textColors[variant], fontSize: fontSizes[size] }]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});
