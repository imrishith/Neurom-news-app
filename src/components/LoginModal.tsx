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
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { API_CONFIG } from "../api/config/apiConfig";
import { useOnboarding } from "../context/OnboardingContext"; // ✅ font helper

const API_BASE = `${API_CONFIG.baseUrl}/public/users`;

type LoginModalProps = {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
};

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  const { Colors } = useTheme();
  const { getFont } = useOnboarding(); // ✅ font helper
  const navigation = useNavigation<any>();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // send OTP
  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/request-otp`, { phone });
      if (res.data?.success) {
        setOtpSent(true);
        Alert.alert(
          "OTP Sent",
          res.data.data.message || "Check your SMS/WhatsApp"
        );
      }
    } catch (err) {
      console.error("❌ Send OTP failed:", err);
      Alert.alert("Error", "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone,
        code: otp,
      });

      if (res.data?.success) {
        const { tokens, user } = res.data.data;

        // save tokens + user to AsyncStorage
        await AsyncStorage.setItem("accessToken", tokens.accessToken);
        await AsyncStorage.setItem("refreshToken", tokens.refreshToken);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        onLoginSuccess?.(user);
        onClose();
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (err) {
      console.error("❌ Verify OTP failed:", err);
      Alert.alert("Error", "Login failed");
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
          Login
        </Text>

        {/* phone input */}
        <TextInput
          style={[
            styles.input,
            { color: Colors.textcolor, fontFamily: getFont("regular") },
          ]}
          placeholder="Enter phone number"
          placeholderTextColor={Colors.mediumGray}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* otp input */}
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

        {/* loading spinner */}
        {loading && (
          <ActivityIndicator size="small" color={Colors.lavenderPurple} />
        )}

        {/* actions */}
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
              Send OTP
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
              Verify OTP
            </Text>
          </TouchableOpacity>
        )}

        {/* register link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("UserRegistrationScreen")}
        >
          <Text
            style={[
              styles.registerLink,
              { color: Colors.lavenderPurple, fontFamily: getFont("medium") },
            ]}
          >
            New user? Register here
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: ff(16),
    marginBottom: fh(16),
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: fw(10),
    padding: fh(12),
    marginBottom: fh(12),
  },
  button: {
    padding: fh(14),
    borderRadius: fw(10),
    alignItems: "center",
    marginTop: fh(8),
  },
  buttonText: { color: "#fff", fontSize: ff(14) },
  registerLink: {
    marginTop: fh(20),
    fontSize: ff(13),
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

export default LoginModal;
