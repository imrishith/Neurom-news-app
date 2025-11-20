import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import Modal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fw, fh, ff } from "../../../utils/responsive";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { reporterAuth } from "../../api/reporter/reporterApi";

type ReporterLoginModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (payload: { token: string; reporter: any }) => void;
};

const ReporterLoginModal: React.FC<ReporterLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { Colors } = useTheme();
  const { getFont, t } = useOnboarding();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    try {
      setLoading(true);
      const json = await reporterAuth.requestOtp(phone.trim());
      if (json?.success) {
        setOtpSent(true);
        Alert.alert(json.data?.message || "OTP sent");
      } else {
        Alert.alert(json?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Reporter Send OTP failed:", err);
      Alert.alert("Error", "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }
    try {
      setLoading(true);
      const json = await reporterAuth.verifyOtp(phone.trim(), otp.trim());
      if (json?.success) {
        const token = json.data?.tokens?.accessToken;
        const reporter = json.data?.reporter;

        if (token) {
          await AsyncStorage.setItem("authToken", token);
        }
        if (reporter) {
          await AsyncStorage.setItem("reporterProfile", JSON.stringify(reporter));
        }

        onSuccess?.({ token, reporter });
        onClose();
      } else {
        Alert.alert("Invalid OTP", "Please try again");
      }
    } catch (err) {
      console.error("Reporter Verify OTP failed:", err);
      Alert.alert("Error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.4}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.container, { backgroundColor: Colors.deepPurple }]}>
        <Text
          style={[
            styles.title,
            { color: Colors.textcolor, fontFamily: getFont("bold") },
          ]}
        >
          {t("login_Neurom")}
        </Text>

        <TextInput
          style={[
            styles.input,
            { color: Colors.textcolor, fontFamily: getFont("regular") },
          ]}
          placeholder="Enter Phone Number (+91...)"
          placeholderTextColor={Colors.mediumGray}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {otpSent && (
          <TextInput
            style={[
              styles.input,
              { color: Colors.textcolor, fontFamily: getFont("regular") },
            ]}
            placeholder="Enter OTP"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
        )}

        {loading && (
          <ActivityIndicator size="small" color={Colors.lavenderPurple} />
        )}

        {!otpSent ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.lavenderPurple }]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                { fontFamily: getFont("semibold") },
              ]}
            >
              {t("send_otp")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.lavenderPurple }]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                { fontFamily: getFont("semibold") },
              ]}
            >
              {t("verify_otp")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    padding: fw(16),
    borderTopLeftRadius: fw(20),
    borderTopRightRadius: fw(20),
  },
  title: { fontSize: ff(16), marginBottom: fh(12), textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: fw(10),
    paddingVertical: fh(10),
    paddingHorizontal: fw(12),
    marginBottom: fh(10),
  },
  button: {
    padding: fh(12),
    borderRadius: fw(10),
    alignItems: "center",
    marginTop: fh(6),
  },
  buttonText: { color: "#fff", fontSize: ff(14) },
});

export default ReporterLoginModal;

