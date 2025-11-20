import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";

interface RateAppModalProps {
  visible: boolean;
  onClose: () => void;
}

const RateAppModal: React.FC<RateAppModalProps> = ({ visible, onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { Colors } = useTheme();
  const { getFont, t } = useOnboarding();

  const handleSubmit = () => {
    onClose();
    setRating(0);
    setFeedback("");
    Alert.alert(t("thank_you"), t("feedback_success"));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalBox, { backgroundColor: Colors.deepPurple }]}>
              <Text style={[styles.modalHeading, { color: Colors.textcolor, fontFamily: getFont("bold") }]}>
                {t("rate_this_app")}
              </Text>

              {/* ⭐ Rating Stars */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={fw(28)}
                      color={star <= rating ? "#FFD700" : "#999"}
                      style={{ marginHorizontal: fw(4) }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* 💬 Feedback Input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: Colors.lavenderPurple,
                    color: Colors.textcolor,
                    height: fh(80),
                    textAlignVertical: "top",
                  },
                ]}
                multiline
                placeholder={t("write_feedback_optional")}
                placeholderTextColor="#999"
                value={feedback}
                onChangeText={setFeedback}
              />

              {/* ✅ Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: Colors.lavenderPurple }]}
                onPress={handleSubmit}
              >
                <Text style={[styles.submitText, { fontFamily: getFont("bold") }]}>{t("submit")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default RateAppModal;

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: fw(320),
    borderRadius: fw(12),
    padding: fw(20),
  },
  modalHeading: {
    fontSize: ff(16),
    marginBottom: fh(16),
    textAlign: "center",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: fh(12),
  },
  input: {
    borderWidth: 1,
    borderRadius: fw(8),
    paddingVertical: fh(8),
    paddingHorizontal: fw(12),
    marginBottom: fh(16),
    fontSize: ff(14),
  },
  submitBtn: {
    borderRadius: fw(8),
    paddingVertical: fh(12),
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: ff(14),
  },
});
