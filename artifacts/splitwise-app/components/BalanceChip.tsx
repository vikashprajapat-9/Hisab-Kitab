import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { CURRENCIES } from "@/types";

interface BalanceChipProps {
  amount: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}

export default function BalanceChip({ amount, currency = "USD", size = "md" }: BalanceChipProps) {
  const colors = useColors();
  const isOwed = amount > 0;
  const isSettled = Math.abs(amount) < 0.01;

  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || currency;

  const color = isSettled ? colors.settled : isOwed ? colors.owed : colors.owe;

  const fontSizes = { sm: 11, md: 13, lg: 15 };
  const paddings = { sm: [2, 6], md: [3, 8], lg: [4, 10] };

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: color + "20",
          paddingVertical: paddings[size][0],
          paddingHorizontal: paddings[size][1],
          borderRadius: 6,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: fontSizes[size] }]}>
        {isSettled
          ? "Settled"
          : isOwed
          ? `you are owed ${symbol}${Math.abs(amount).toFixed(2)}`
          : `you owe ${symbol}${Math.abs(amount).toFixed(2)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
  },
});
