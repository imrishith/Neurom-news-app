import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReportReasonPress?: (reason: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onReportReasonPress,
}) => {
  const { Colors } = useTheme();
  const { getFont, data } = useOnboarding();

  // 🈳 Language check
  const isTelugu = data?.language_code === "te";

  // 🌐 Translations
  const t = {
    title: isTelugu ? "ఈ వీడియోను రిపోర్ట్ చేయండి" : "Report This Video",
    cancel: isTelugu ? "రద్దు చేయండి" : "Cancel",
    reasons: isTelugu
      ? ["తప్పుడు/మార్గదర్శక కంటెంట్", "అపహాస్యమైన కంటెంట్"]
      : ["False/Misleading Content", "Offensive Content"],
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.4}
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: Colors.deepPurple }]}>
        <Text
          style={[
            styles.title,
            { color: Colors.textcolor, fontFamily: getFont("semibold") },
          ]}
        >
          {t.title}
        </Text>

        {t.reasons.map((reason) => (
          <TouchableOpacity
            key={reason}
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

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text
            style={[
              styles.cancelText,
              { color: Colors.lavenderPurple, fontFamily: getFont("semibold") },
            ]}
          >
            {t.cancel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    paddingVertical: fh(20),
    paddingHorizontal: fw(20),
    borderTopLeftRadius: fw(16),
    borderTopRightRadius: fw(16),
  },
  title: {
    fontSize: ff(16),
    marginBottom: fh(16),
    textAlign: "center",
  },
  option: {
    paddingVertical: fh(12),
  },
  optionText: {
    fontSize: ff(16),
  },
  cancelButton: {
    marginTop: fh(12),
    alignItems: "center",
  },
  cancelText: {
    fontSize: ff(16),
  },
});

export default ReportModal;