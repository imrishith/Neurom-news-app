import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReportReasonPress?: (reason: string) => void;
  article?: any;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onReportReasonPress,
  article,
}) => {
  const { Colors } = useTheme();
  const { getFont, t } = useOnboarding(); // ✅ use translation + font helpers

  // 🔹 Translation-based report reasons
  const reportReasons = [
    t("false_misleading_content"),
    t("offensive_content"),
  ];

  const formatArticleId = (article: any) => {
    if (!article?.created_at) return `Neurom/${article?.article_id || ""}`;
    const date = new Date(article.created_at);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const number = article.article_id;
    return `Neurom/${day}${month}${year}${number}`;
  };

  const copyArticleId = () => {
  const id = formatArticleId(article);
  Clipboard.setString(id);
  Toast.show(t("copied_to_clipboard") || "Copied!", Toast.SHORT);
};


  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.4}
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: Colors.deepPurple }]}>
        {/* 🔹 Title */}
        <Text
          style={[
            styles.title,
            { color: Colors.textcolor, fontFamily: getFont("semibold") },
          ]}
        >
          {t("report_this_article")}
        </Text>

        {/* 🔹 Options */}
        {reportReasons.map((reason, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => onReportReasonPress?.(reason)}
          >
            <Text
              style={[
                styles.optionText,
                { color: Colors.textcolor, fontFamily: getFont("regular") },
              ]}
            >
              {reason}
            </Text>
          </TouchableOpacity>
        ))}

       {article && (
  <View style={styles.factCheckRow}>
    <Text
      style={[
        styles.factCheckLabel,
        { color: Colors.textcolor, fontFamily: getFont("semibold") }
      ]}
    >
      {t("fact_check")}:
    </Text>

    <TouchableOpacity onPress={copyArticleId} style={styles.articleIdPill}>
      <Text
        style={[
          styles.articleIdText,
          { color: Colors.textcolor, fontFamily: getFont("regular") }
        ]}
      >
        {formatArticleId(article)}
      </Text>
    </TouchableOpacity>
  </View>
)}





        {/* 🔹 Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text
            style={[
              styles.cancelText,
              { color: Colors.lavenderPurple, fontFamily: getFont("semibold") },
            ]}
          >
            {t("cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    paddingVertical: fh(20),
    paddingHorizontal: fw(20),
    borderTopLeftRadius: fw(16),
    borderTopRightRadius: fw(16),
  },
  title: {
    fontSize: ff(16),
    marginBottom: fh(16),
    lineHeight: ff(22),
    textAlign: "center",
  },
  option: { paddingVertical: fh(12) },
  optionText: {
    fontSize: ff(16),
    lineHeight: ff(22),
  },
 factCheckRow: {
  flexDirection: "row",
  gap: fw(8),
  alignItems: "center",
  paddingVertical: fh(12), // ✅ Same as option
  paddingHorizontal: fw(4),
  // Remove marginBottom: fh(16), or reduce it
},

factCheckLabel: {
  fontSize: ff(16),
  lineHeight: ff(22),
},

copyWrapper: {
  flexDirection: "row",
  alignItems: "center",
  gap: fw(8),
},

factCheckId: {
  fontSize: ff(16),
  maxWidth: fw(150),
},

copyText: {
  fontSize: ff(12),
  fontWeight: "600",
},
  articleIdBox: {
    paddingVertical: fh(8),
    paddingHorizontal: fw(12),
    borderRadius: fw(12),
    borderWidth: 0.5,
    borderColor: "#ffffff70",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignSelf: "center",
    marginBottom: fh(16),
  },

  articleIdPill: {
  backgroundColor: "rgba(0,0,0,0.25)",
  borderWidth: 0.4,
  borderColor: "#FFFFFF70",
  paddingHorizontal: fw(12),
  paddingVertical: fh(6),
  borderRadius: fw(20),
},

  articleIdText: {
    fontSize: ff(12),
    textAlign: "center",
  },
  cancelButton: {
    marginTop: fh(12),
    alignItems: "center",
  },
  cancelText: {
    fontSize: ff(16),
    lineHeight: ff(22),
  },
});

export default ReportModal;
