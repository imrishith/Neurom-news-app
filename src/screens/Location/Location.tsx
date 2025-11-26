// screens/Onboarding/LocationScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import GradientScreen from "../../components/GradientScreen";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import { fw, fh, ff } from "../../../utils/responsive";
import LinearGradient from "react-native-linear-gradient";

import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { publicLocations } from "../../api/publicapi/publicApi";
import Geolocation from "react-native-geolocation-service";
import { BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { updateDevice } from "../../api/device/deviceService";


const LocationScreen = () => {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectModalVisible, setDetectModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [selectedAction, setSelectedAction] = useState<"continue" | "edit" | null>(null);
  const { Colors, barStyle } = useTheme();
  const { t, getFont, data, updateData } = useOnboarding(); // ✅ translations + fonts
  const debounceRef = useRef<any>(null);


  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.length > 1) fetchSuggestions(text);
      else setFilteredSuggestions([]);
    }, 400);
  }, []);

  const DEFAULT_ADDRESS =
    "Jayabheri Enclave (v)\nSerilingampally (M), Ranga Reddy (D)";

  const navigation = useNavigation();
  const route = useRoute();
  const fromProfile = route.params?.fromProfile; // 👈 check flag

  useEffect(() => {
    if (!fromProfile) return;

    const backAction = () => {
      navigation.replace("ProfileWelcomeScreen"); // 👈 go back only if fromProfile
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [fromProfile, navigation]);


  const fetchSuggestions = async (text: string) => {
    try {
      setLoading(true);
      const res = await publicLocations.searchVillages(text);

      if (res?.success && Array.isArray(res.data)) {
        setFilteredSuggestions(res.data);
      } else {
        setFilteredSuggestions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching suggestions:", err);
      Alert.alert("Error", t("error_fetch_locations"));
      setFilteredSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (locationObj: any) => {
    setQuery(locationObj.village_name);
    setFilteredSuggestions([]);
    setSelectedLocation(locationObj);

    // ✅ Save to onboarding context
    updateData({
      state_id: locationObj.state?.state_id,
      district_id: locationObj.district?.district_id,
      district_name: locationObj.district?.district_name,
      constituency_id: locationObj.constituency?.constituency_id,
      mandal_id: locationObj.mandal?.mandal_id,
      mandal_name: locationObj.mandal?.mandal_name,
      village_id: locationObj.village_id,
      village_name: locationObj.village_name,
    });

    setDetectModalVisible(true);
  };

  // 👉 Ask permission for GPS
  // 👉 Ask permission for GPS
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "We need access to your location to auto-detect your village",
          buttonPositive: "OK",
        }
      );



      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };



  // 👉 Auto detect user location
  const detectLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert("Permission denied", "Enable location services to auto-detect");
      return;
    }



    setLoading(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await publicLocations.getVillageByCoordinates(latitude, longitude);

          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const location = res.data[0];  // ✅ pick first result
            setSelectedLocation(location);



            // ✅ Save to onboarding context
            updateData({
              state_id: location.state?.state_id,
              district_id: location.district?.district_id,
              district_name: location.district?.district_name,
              constituency_id: location.constituency?.constituency_id,
              mandal_id: location.mandal?.mandal_id,
              mandal_name: location.mandal?.mandal_name,
              village_id: location.village_id,
              village_name: location.village_name,
            });

            setDetectModalVisible(true);
          }
          else {
            Alert.alert("Error", t("error_fetch_locations"));
          }
        } catch (err) {
          console.error("❌ Error auto-detect:", err);
          Alert.alert("Error", t("error_fetch_locations"));
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("❌ Location error:", error);
        Alert.alert("Error", "Unable to detect location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientScreen>
        <View
          style={{
            paddingVertical: fh(50),
            paddingHorizontal: fw(20),
            backgroundColor: 'transparent',
            alignSelf: "center",
            top: fh(40),
          }}
        >
          <Text
            style={{
              fontSize: ff(18),
              color: Colors.textcolor,
              fontFamily: getFont('semibold'),
            }}
          >
            {t('your_location')}
          </Text>
        </View>
        <View style={styles.staticTop}>
          <Text
            style={[
              styles.heading,
              { color: Colors.textcolor, fontFamily: getFont("medium") },
            ]}
          >
            {t("select_location")}
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: Colors.deepPurple,
                borderColor: Colors.lavenderPurple,
              },
            ]}
          >
            <Image
              source={require("../../../assets/icons/search.png")}
              style={[styles.searchIcon, { tintColor: Colors.textcolor }]}
            />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder={t("search")}
              placeholderTextColor={Colors.gray}
              style={[
                styles.searchInput,
                { color: Colors.textcolor, fontFamily: getFont("regular"), marginTop: fh(2) },
              ]}
            />
          </View>
        </View>

        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.textcolor}
            style={{ marginTop: fh(8) }}
          />
        )}

        {/* Suggestions */}
        {filteredSuggestions.length > 0 && (
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => String(item.village_id)}
            initialNumToRender={10}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            style={[
              styles.suggestionsList,
              { backgroundColor: Colors.deepPurple },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSuggestionSelect(item)}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: Colors.gray },
                ]}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    { color: Colors.textcolor, fontFamily: getFont("regular") },
                  ]}
                >
                  {item.village_name}, {item.mandal?.mandal_name},{" "}
                  {item.district?.district_name}, {item.state?.state_name} -{" "}
                  {item.pincode}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Auto detect card */}
        <ScrollView contentContainerStyle={styles.scrollSection}>
          <Text
            style={[
              styles.or,
              { color: Colors.textcolor, fontFamily: getFont("regular") },
            ]}
          >
            {t("or")}
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={detectLocation}>
            <Card style={[styles.card, { backgroundColor: Colors.deepPurple }]}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: Colors.textcolor, fontFamily: getFont("regular") },
                ]}
              >
                Auto Detect Location
              </Text>
            </Card>
          </TouchableOpacity>
        </ScrollView>

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={barStyle}
        />

        {/* Confirm Modal */}
        <Modal
          visible={detectModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setDetectModalVisible(false)}
        >
          <View style={styles.modalRoot}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setDetectModalVisible(false)}
            />
            <View
              style={[styles.sheet, { backgroundColor: Colors.deepPurple }]}
            >
              {/* Header */}
              <View style={styles.sheetHeader}>
                <Image
                  source={require("../../../assets/icons/location-detect.png")}
                  style={[styles.sheetHeaderIcon, { tintColor: Colors.textcolor }]}
                />
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: Colors.textcolor, fontFamily: getFont("bold") },
                  ]}
                >
                  {t("confirm_location")}
                </Text>
              </View>

              {/* Address */}
              {/* Address */}
              {selectedLocation ? (
                <>
                  <Text
                    style={[
                      styles.addressText,
                      { color: Colors.textcolor, fontFamily: getFont("medium") },
                    ]}
                  >
                    {selectedLocation.village_name} (v)
                  </Text>
                  <Text
                    style={[
                      styles.addressText,
                      { color: Colors.textcolor, fontFamily: getFont("medium") },
                    ]}
                  >
                    {selectedLocation.mandal?.mandal_name} (M),
                    {` ${selectedLocation.district?.district_name}`} (D)
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.addressText,
                    { color: Colors.textcolor, fontFamily: getFont("medium") },
                  ]}
                >
                  {DEFAULT_ADDRESS}
                </Text>
              )}


              {/* Buttons */}
              <View style={styles.buttonGroup}>
                {/* Continue */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setSelectedAction("continue");
                    requestAnimationFrame(async () => {
                      setDetectModalVisible(false);

                      if (fromProfile && selectedLocation) {
                        try {
                          // Persist in backend
                          await updateDevice({
                            device_id: data.device_id!,
                            state_id: selectedLocation.state?.state_id,
                            district_id: selectedLocation.district?.district_id,
                            mandal_id: selectedLocation.mandal?.mandal_id,
                            village_id: selectedLocation.village_id,
                            constituency_id: selectedLocation.constituency?.constituency_id,
                          });

                          // Already updated context in handleSuggestionSelect/detectLocation
                          navigation.replace("ProfileWelcomeScreen"); // 👈 back to profile
                        } catch (err) {
                          console.error("❌ Update failed:", err);
                          Alert.alert("Error", "Failed to update location");
                        }
                      } else {
                        // Onboarding case
                        navigation.navigate("LanguageScreen");
                      }
                    });
                  }}

                >
                  {selectedAction === "continue" ? (
                    <View
                      style={[
                        styles.actionButton,
                        styles.actionButtonUnselected,
                        {
                          borderColor: Colors.lavenderPurple,
                          backgroundColor: Colors.deepPurple,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: Colors.textcolor, fontFamily: getFont("regular") },
                        ]}
                      >
                        {t("continue")}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      useAngle
                      angle={200}
                      angleCenter={{ x: 0.7, y: 0.5 }}
                      colors={["#997DDF", "#7741FF"]}
                      style={styles.actionButton}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          { fontFamily: getFont("regular") },
                        ]}
                      >
                        {t("continue")}
                      </Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>

                {/* Edit */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedAction("edit");
                    requestAnimationFrame(() => setDetectModalVisible(false));
                  }}
                >
                  {selectedAction === "edit" ? (
                    <LinearGradient
                      useAngle
                      angle={187.69}
                      angleCenter={{ x: 0.5, y: 0.5 }}
                      colors={["#997DDF", "#7741FF"]}
                      style={styles.actionButton}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          { fontFamily: getFont("regular") },
                        ]}
                      >
                        {t("edit")}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.actionButton,
                        styles.actionButtonUnselected,
                        {
                          borderColor: Colors.lavenderPurple,
                          backgroundColor: Colors.deepPurple,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: Colors.textcolor, fontFamily: getFont("regular") },
                        ]}
                      >
                        {t("edit")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </GradientScreen>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerTitle: { fontSize: ff(20), fontWeight: "600" },
  staticTop: { paddingHorizontal: fw(30), paddingTop: fh(20) },
  heading: { fontSize: ff(16), marginBottom: fh(20) },
  scrollSection: { paddingHorizontal: fw(20), paddingBottom: fh(60) },
  searchWrapper: { paddingHorizontal: fw(20), marginTop: fh(-10) },
  suggestionsList: {
    maxHeight: fh(150),
    marginHorizontal: fw(20),
    marginTop: fh(4),
    borderRadius: fw(8),
  },
  suggestionItem: { paddingVertical: fh(10), paddingHorizontal: fw(16), borderBottomWidth: 1 },
  suggestionText: { fontSize: ff(14) },
  card: {
    borderRadius: fw(12),
    width: fw(342),
    height: fh(50), // ✅ Increased height
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: fh(5), // ✅ Add padding
  },
  cardTitle: {
    fontSize: ff(15),
    textAlign: "center",
    lineHeight: ff(22), // ✅ 1.47x font size
    includeFontPadding: false, // ✅ Remove Android extra padding
    textAlignVertical: "center", // ✅ Vertically center on Android
  },
  or: { textAlign: "center", fontSize: ff(16), marginVertical: fh(24) },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: fw(30),
    borderWidth: 1,
    paddingHorizontal: fw(16),
    height: fh(50),
    marginVertical: fh(8),
  },
  searchIcon: { width: fw(20), height: fw(20), marginRight: fw(10) },
  searchInput: { flex: 1, fontSize: ff(14), marginTop: fh(5), paddingVertical: 0, includeFontPadding: false },
  modalRoot: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { paddingHorizontal: fw(16), paddingTop: fh(12), paddingBottom: fh(24), borderTopLeftRadius: fw(16), borderTopRightRadius: fw(16), height: fh(350), width: "100%" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: fh(20), marginTop: fh(10) },
  sheetHeaderIcon: { width: fw(24), height: fw(24), marginRight: fw(8), marginBottom: fh(10) },
  sheetTitle: { fontSize: ff(20), fontWeight: "600", textAlign: "center", marginBottom: fh(12), marginTop: fh(2), lineHeight: ff(30) },
  addressText: { fontSize: ff(16), fontWeight: "500", textAlign: "center" },
  buttonGroup: { alignItems: "center", justifyContent: "center", marginTop: fh(4) },
  actionButton: { width: fw(297), height: fh(46), borderRadius: fw(6.67), alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: fh(25) },
  actionButtonUnselected: { borderWidth: 1 },
  actionButtonText: { fontSize: ff(12), marginTop: fh(-5) },
});

export default LocationScreen;