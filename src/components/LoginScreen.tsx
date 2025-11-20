import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";
const LoginScreen = ({ navigation }: any) => {
  const { Colors } = useTheme();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { getFont } = useOnboarding();
  // ✅ Mock send OTP API
  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert("Invalid number", "Please enter a valid mobile number");
      return;
    }
    try {
      setLoading(true);
      // Replace with your API call
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
        Alert.alert("OTP Sent", "Use 1234 as demo OTP");
      }, 1000);
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  // ✅ Mock verify OTP API
  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert("Missing OTP", "Enter the OTP sent to your number");
      return;
    }
    try {
      setLoading(true);
      // Replace with real API call

      setTimeout(() => {
        setLoading(false);
        if (otp === "1234") {
          Alert.alert("✅ Success", "Login successful!");
          // TODO: Save user session here (Zustand / Context / AsyncStorage)
          navigation.replace("HomeScreen"); // redirect after login
        } else {
          Alert.alert("❌ Invalid", "Wrong OTP, try again");
        }
      }, 1000);
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to verify OTP");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.darkpurple }]}>
      <Text style={[styles.title, { color: Colors.textcolor }]}>
        {step === "phone" ? "Login with Phone" : "Enter OTP"}
      </Text>

      {step === "phone" ? (
        <>
          <TextInput
            style={[styles.input, { color: Colors.textcolor, borderColor: Colors.mediumGray }]}
            placeholder="Enter Mobile Number"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.lavenderPurple }]}
            onPress={sendOtp}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>
              {loading ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, { color: Colors.textcolor, borderColor: Colors.mediumGray }]}
            placeholder="Enter OTP"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.lavenderPurple }]}
            onPress={verifyOtp}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={sendOtp}>
            <Text style={[styles.resendText, { color: Colors.lavenderPurple, fontFamily: getFont("regular") }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Register link */}
      <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
        <Text style={[styles.registerText, { color: Colors.mediumGray, fontFamily: getFont("regular") }]}>
          Don’t have an account? <Text style={{ color: Colors.lavenderPurple }}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: fw(20),
  },
  title: {
    fontSize: ff(20),
    fontFamily: "AnekTelugu-Bold",
    textAlign: "center",
    marginBottom: fh(30),
  },
  input: {
    borderWidth: 1,
    borderRadius: fw(10),
    padding: fh(12),
    marginBottom: fh(20),
  },
  button: {
    padding: fh(14),
    borderRadius: fw(10),
    alignItems: "center",
    marginBottom: fh(10),
  },
  buttonText: { fontSize: ff(14), fontFamily: "AnekTelugu-Bold" },
  resendText: {
    textAlign: "center",
    marginTop: fh(10),
    fontSize: ff(13),
  },
  registerText: {
    textAlign: "center",
    marginTop: fh(20),
    fontSize: ff(13),
  },
});

export default LoginScreen;
