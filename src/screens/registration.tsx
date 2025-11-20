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
import { fw, fh, ff, fr, getLayoutConfig } from '../../utils/responsive';
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
    height: getLayoutConfig().headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: fw(12),
    marginTop: fh(10),
  },
  leftIconHitSlop: {
    width: fw(getLayoutConfig().isTablet ? 40 : 32),
    height: fh(getLayoutConfig().isTablet ? 40 : 32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: { 
    width: fw(getLayoutConfig().isTablet ? 28 : 24), 
    height: fh(getLayoutConfig().isTablet ? 28 : 24),
    marginLeft: fw(4),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'AnekTelugu-SemiBold',
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    fontWeight: '600',
    paddingHorizontal: fw(8),
    includeFontPadding: false,
  },
  container: { 
    flex: 1, 
    paddingHorizontal: getLayoutConfig().contentPadding,
    marginTop: fh(10),
    justifyContent: 'center',
  },
  label: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14), 
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20), 
    marginBottom: fh(8),
    lineHeight: ff(getLayoutConfig().isTablet ? 24 : 20),
    includeFontPadding: false,
    fontWeight: '500',
  },
  input: {
    height: fh(getLayoutConfig().isTablet ? 56 : 50),
    borderRadius: fr(6),
    paddingHorizontal: fw(16),
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 10),
    includeFontPadding: false,
  },
  genderOption: {
    height: fh(getLayoutConfig().isTablet ? 56 : 50),
    borderRadius: fr(6),
    justifyContent: 'center',
    paddingHorizontal: fw(16),
    marginTop: fh(20),
  },
  genderText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
    fontWeight: '500',
  },
  hintText: { 
    marginTop: fh(8), 
    fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
    lineHeight: ff(getLayoutConfig().isTablet ? 20 : 18),
    includeFontPadding: false,
  },
  submitButton: {
    height: fh(getLayoutConfig().isTablet ? 56 : 50),
    width: '100%',
    borderRadius: fr(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: fw(16),
    marginTop: fh(getLayoutConfig().isTablet ? 40 : 80),
  },
  submitText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16), 
    fontFamily: 'AnekTelugu-SemiBold',
    includeFontPadding: false,
    lineHeight: ff(getLayoutConfig().isTablet ? 24 : 22),
  },
  loginRow: { 
    marginTop: fh(getLayoutConfig().isTablet ? 24 : 20), 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: fw(20),
  },
  loginText: { 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    lineHeight: ff(getLayoutConfig().isTablet ? 22 : 20),
    includeFontPadding: false,
    textAlign: 'center',
  },
  loginLink: { 
    textDecorationLine: 'underline', 
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    includeFontPadding: false,
    lineHeight: ff(getLayoutConfig().isTablet ? 22 : 20),
    fontWeight: '600',
  },
});

export default UserRegistrationScreen;