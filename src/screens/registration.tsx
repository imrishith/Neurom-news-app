import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import GradientScreen from '../components/GradientScreen';
import { fw, fh, ff } from '../../utils/responsive';
import { useTheme } from '../context/ThemeContext';
import LoginModal from '../components/LoginModal';
import { useOnboarding } from '../context/OnboardingContext';
import { API_CONFIG } from '../api/config/apiConfig';

const API_URL = `${API_CONFIG.baseUrl}/public/users/register`;

const UserRegistrationScreen = () => {
  const navigation = useNavigation();
  const { Colors } = useTheme();
  const { data } = useOnboarding();
  const isTelugu = data?.language_code === 'te';

  // 🈳 Translations
  const t = {
    header: isTelugu ? 'వినియోగదారు నమోదు' : 'User Registration',
    fullName: isTelugu ? 'పూర్తి పేరు' : 'Full Name',
    enterFullName: isTelugu ? 'మీ పూర్తి పేరును నమోదు చేయండి' : 'Enter Your Full Name',
    mobile: isTelugu ? 'మొబైల్ నంబర్' : 'Mobile Number',
    enterMobile: isTelugu ? 'మీ మొబైల్ నంబర్ ను నమోదు చేయండి' : 'Enter Your Mobile Number',
    gender: isTelugu ? 'లింగం' : 'Gender',
    selectGender: isTelugu ? 'మీ లింగాన్ని ఎంచుకోండి' : 'Select your gender',
    female: isTelugu ? 'మహిళ' : 'Female',
    male: isTelugu ? 'పురుషుడు' : 'Male',
    submit: isTelugu ? 'సమర్పించండి' : 'Submit',
    already: isTelugu ? 'ఇప్పటికే ఖాతా ఉందా?' : 'Already have an Account?',
    login: isTelugu ? 'లాగిన్ అవ్వండి' : 'Login',
    validation: isTelugu ? 'దయచేసి అన్ని ఫీల్డ్‌లను పూరించండి.' : 'Please fill all fields.',
    success: isTelugu ? 'విజయం' : 'Success',
    welcome: isTelugu ? 'స్వాగతం' : 'Welcome',
    error: isTelugu ? 'లోపం' : 'Error',
    somethingWrong: isTelugu ? 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Something went wrong. Try again.',
    registrationFailed: isTelugu ? 'నమోదు విఫలమైంది' : 'Registration failed',
  };

  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !phoneNumber || !gender) {
      Alert.alert(t.error, t.validation);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        device_id: data.device_id,
        name: fullName,
        mobile: phoneNumber,
        gender,
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log('📩 Registration API response:', json);

      if (json.success && json.data?.user) {
        navigation.navigate('HomeScreen' as never);
      } else {
        Alert.alert(t.error, json.message || t.registrationFailed);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      Alert.alert(t.error, t.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientScreen>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack?.()} style={styles.leftIconHitSlop}>
            <Image
              source={require('../../assets/icons/backarrow.png')}
              style={[styles.leftIcon, { tintColor: Colors.lavenderPurple }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text 
            style={[styles.headerTitle, { color: Colors.textcolor }]}
            numberOfLines={1} // ✅ Prevent overflow
            allowFontScaling={false} // ✅ Prevent system scaling
          >
            {t.header}
          </Text>
          <View style={{ width: fw(32) }} />
        </View>
      </SafeAreaView>

      {/* Form */}
      <View style={styles.container}>
        <Text 
          style={[styles.label, { color: Colors.textcolor }]}
          allowFontScaling={false} // ✅ Prevent system scaling
        >
          {t.fullName}
        </Text>
        <TextInput
          placeholder={t.enterFullName}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor={Colors.mediumGray}
          allowFontScaling={false} // ✅ Prevent system scaling
          style={[styles.input, { backgroundColor: Colors.deepPurple, color: Colors.textcolor }]}
        />

        <Text 
          style={[styles.label, { color: Colors.textcolor }]}
          allowFontScaling={false} // ✅ Prevent system scaling
        >
          {t.mobile}
        </Text>
        <TextInput
          placeholder={t.enterMobile}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholderTextColor={Colors.mediumGray}
          keyboardType="phone-pad"
          allowFontScaling={false} // ✅ Prevent system scaling
          style={[styles.input, { backgroundColor: Colors.deepPurple, color: Colors.textcolor }]}
        />

        <Text 
          style={[styles.label, { color: Colors.textcolor }]}
          allowFontScaling={false} // ✅ Prevent system scaling
        >
          {t.gender}
        </Text>
        <Text 
          style={[styles.hintText, { color: Colors.mediumGray }]}
          allowFontScaling={false} // ✅ Prevent system scaling
        >
          {t.selectGender}
        </Text>

        <TouchableOpacity
          style={[
            styles.genderOption,
            { backgroundColor: Colors.deepPurple },
            gender === 'female' && { borderColor: Colors.lavenderPurple, borderWidth: 1 },
          ]}
          onPress={() => setGender('female')}
        >
          <Text 
            style={[styles.genderText, { color: Colors.textcolor }]}
            allowFontScaling={false} // ✅ Prevent system scaling
          >
            {t.female}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            { backgroundColor: Colors.deepPurple },
            gender === 'male' && { borderColor: Colors.lavenderPurple, borderWidth: 1 },
          ]}
          onPress={() => setGender('male')}
        >
          <Text 
            style={[styles.genderText, { color: Colors.textcolor }]}
            allowFontScaling={false} // ✅ Prevent system scaling
          >
            {t.male}
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={{ marginTop: fh(80) }} onPress={handleSubmit} disabled={loading}>
          <LinearGradient
            useAngle
            angle={200}
            angleCenter={{ x: 0.7, y: 0.5 }}
            colors={['#997DDF', '#7741FF']}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text 
                style={[styles.submitText, { color: Colors.textcolor }]}
                allowFontScaling={false} // ✅ Prevent system scaling
              >
                {t.submit}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Login link - ✅ FIXED: Proper text wrapping */}
        <View style={styles.loginRow}>
          <Text 
            style={[styles.loginText, { color: Colors.mediumGray }]}
            allowFontScaling={false} // ✅ Prevent system scaling
          >
            {t.already}{' '}
            {/* ✅ Inline the login text to prevent wrapping issues */}
            <Text 
              style={[styles.loginLink, { color: Colors.textcolor }]}
              onPress={() => setLoginModalVisible(true)}
              allowFontScaling={false}
            >
              {t.login}
            </Text>
          </Text>
        </View>
      </View>

      {/* Login Modal */}
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLoginSuccess={() => setLoginModalVisible(false)}
      />
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  safeTop: { backgroundColor: 'transparent' },
  headerContent: {
    height: fh(56),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: fw(12),
    marginTop: fh(10), // ✅ Add consistent top margin
  },
  leftIconHitSlop: {
    width: fw(32),
    height: fh(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: { 
    width: fw(24), 
    height: fh(24),
    marginLeft: fw(4), // ✅ Small left margin
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'AnekTelugu-SemiBold',
    fontSize: ff(18),
    fontWeight: '600',
    paddingHorizontal: fw(8), // ✅ Add padding to prevent truncation
    includeFontPadding: false, // ✅ Android-specific
  },
  container: { 
    flex: 1, 
    paddingHorizontal: fw(24), // ✅ Increased from 20
    marginTop: fh(10),
  },
  label: { 
    fontSize: ff(14), 
    marginTop: fh(20), 
    marginBottom: fh(8),
    lineHeight: ff(20), // ✅ Use ff() for consistency
    includeFontPadding: false, // ✅ Android-specific
  },
  input: {
    height: fh(50),
    borderRadius: fw(6),
    paddingHorizontal: fw(16), // ✅ Increased from 15
    fontSize: ff(14),
    marginBottom: fh(10),
    includeFontPadding: false, // ✅ Android-specific
  },
  genderOption: {
    height: fh(50),
    borderRadius: fw(6),
    justifyContent: 'center',
    paddingHorizontal: fw(16), // ✅ Increased from 15
    marginTop: fh(20),
  },
  genderText: { 
    fontSize: ff(14),
    includeFontPadding: false, // ✅ Android-specific
  },
  hintText: { 
    marginTop: fh(8), 
    fontSize: ff(12),
    lineHeight: ff(18), // ✅ Use ff() for consistency
    includeFontPadding: false, // ✅ Android-specific
  },
  submitButton: {
    height: fh(50),
    width: '100%',
    borderRadius: fw(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: fw(16), // ✅ Add padding
  },
  submitText: { 
    fontSize: ff(16), 
    fontFamily: 'AnekTelugu-SemiBold',
    includeFontPadding: false, // ✅ Android-specific
    lineHeight: ff(22), // ✅ Use ff() for consistency
  },
  loginRow: { 
  // flexDirection: 'row', 
  marginTop: fh(20), 
  justifyContent: 'center',
  paddingHorizontal: fw(20),
},
loginText: { 
  fontSize: ff(14),
  lineHeight: ff(20),
  includeFontPadding: false,
},
loginLink: { 
  textDecorationLine: 'underline', 
  fontSize: ff(14),
  includeFontPadding: false,
  lineHeight: ff(20), // ✅ Match parent lineHeight
},
});

export default UserRegistrationScreen;