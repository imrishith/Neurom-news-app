import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fw, fh, ff } from "../../../utils/responsive";

const ArticleUnifiedMode = ({
  article,
  isTextMode,
  onToggleMode,
  colors,
  t,
  getFont,
}) => {
  return (
    <View style={styles.container}>

      {/* 🔥 SAME HEADER FOR BOTH MODES */}
      <Text style={[styles.category, { color: colors.text }]}>
        {article.Category?.name_en}
      </Text>

      <Text style={[styles.title, { color: colors.text, fontFamily: getFont("semibold") }]}>
        {t("te") === "te" ? article.title_te : article.title_en}
      </Text>

      {/* 🔄 SWITCH ONLY THIS AREA */}
      <View style={styles.bodyContainer}>
        {isTextMode ? (
          <Text style={[styles.description, { color: colors.text }]}>
            {t("te") === "te" ? article.description_te : article.description_en}
          </Text>
        ) : (
          <View style={styles.audioBox}>
            {/* put your audio player UI here */}
            <Text style={{ color: "#fff" }}>🎧 Audio Playing…</Text>
          </View>
        )}
      </View>

      {/* MODE TOGGLER */}
      <Text
        style={styles.switchBtn}
        onPress={() => onToggleMode(!isTextMode)}
      >
        {isTextMode ? "Listen Audio" : "Read Text"}
      </Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: fw(16),
    paddingTop: fh(20),
  },
  category: {
    fontSize: ff(12),
    opacity: 0.6,
  },
  title: {
    fontSize: ff(20),
    marginTop: fh(6),
    fontWeight: "700",
  },
  bodyContainer: {
    marginTop: fh(16),
  },
  description: {
    fontSize: ff(15),
    lineHeight: ff(24),
  },
  audioBox: {
    backgroundColor: "#222",
    padding: fw(16),
    borderRadius: fw(10),
    height: fh(140),
    justifyContent: "center",
    alignItems: "center",
  },
  switchBtn: {
    marginTop: fh(20),
    color: "#997DDF",
    fontSize: ff(14),
  },
});

export default ArticleUnifiedMode;
