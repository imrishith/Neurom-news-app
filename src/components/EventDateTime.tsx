import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fw, fh, ff } from "../../utils/responsive";

interface Props {
  date: string;
  time?: string; // accepted for compatibility (unused here)
  fontFamily?: string;
  color?: string;
  lang?: string; // accepted for compatibility (unused here)
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EventDateTime: React.FC<Props> = ({ date, fontFamily = "System", color = "#fff" }) => {
  const dateObj = new Date(date + "T00:00:00");
  if (isNaN(dateObj.getTime())) return null;

  const day = dateObj.getDate().toString();
  const monthName = MONTH_NAMES[dateObj.getMonth()];

  // Chip sizing (square 38dp) using responsive helpers
  const side = Math.min(fw(38), fh(38));

  // Typography with generous line-heights to prevent glyph clipping across scripts
  const dayFontSize = ff(16);
  const dayLineHeight = Math.round(dayFontSize * 1.2); // add headroom for scripts

  const monthFontSize = ff(10);
  const monthLineHeight = Math.round(monthFontSize * 1.25);

  // Small optical gap between lines
  const interLineGap = fh(2);

  // Compute symmetric vertical padding so content is optically centered
  const { containerStyle, dayStyle, monthStyle } = useMemo(() => {
    const contentHeight = dayLineHeight + interLineGap + monthLineHeight;
    const padV = Math.max(0, (side - contentHeight) / 2);

    return {
      containerStyle: {
        width: side,
        height: side,
        paddingTop: padV,
        paddingBottom: padV,
        // Slight horizontal breathing room (keeps equal left/right feel without clipping)
        paddingHorizontal: Math.max(0, Math.round(side * 0.08)),
      } as const,
      dayStyle: {
        fontSize: dayFontSize,
        lineHeight: dayLineHeight,
      } as const,
      monthStyle: {
        fontSize: monthFontSize,
        lineHeight: monthLineHeight,
      } as const,
    };
  }, [side, dayFontSize, dayLineHeight, monthFontSize, monthLineHeight, interLineGap]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        numberOfLines={1}
        style={[styles.day, dayStyle, { fontFamily, color }]}
      >
        {day}
      </Text>
      <View style={{ height: interLineGap }} />
      <Text
        numberOfLines={1}
        style={[styles.month, monthStyle, { fontFamily, color }]}
      >
        {monthName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  day: {
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: true,
  },
  month: {
    textTransform: "uppercase",
    textAlign: "center",
    includeFontPadding: true,
  },
});

export default EventDateTime;
