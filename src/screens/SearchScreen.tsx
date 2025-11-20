import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  BackHandler
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import GradientScreen from "../components/GradientScreen";
import { fw, fh, ff, fr, getLayoutConfig } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";
import { useNavigation } from "@react-navigation/native"; // ✅ added

const categories = [
  "national",
  "international",
  "politics",
  "business_startups",
  "entertainment",
  "finance_money",
  "health_fitness",
  "science_tech",
  "education",
];

const SearchScreen = () => {
  const [query, setQuery] = useState("");
  const navigation = useNavigation(); // ✅ hook for navigation
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding();

   // backhandler done by rishith
          useEffect(() => {
            const backAction = () => {
              // ✅ Navigate to Home instead of exiting the app
              navigation.navigate("HomeScreen"); // change to your actual home route name
              return true; // prevent default back behavior (app exit)
            };
        
            const backHandler = BackHandler.addEventListener(
              "hardwareBackPress",
              backAction
            );
        
            return () => backHandler.remove();
          }, [navigation]);

  return (
    <GradientScreen>
      <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={fw(22)} color={Colors.textcolor} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: Colors.textcolor, fontFamily: getFont("semibold") },
            ]}
          >
            {t("search")}
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: Colors.deepPurple, borderColor: Colors.lavenderPurple },
          ]}
        >
          <Ionicons name="search-outline" size={fw(18)} color={Colors.gray} />
          <TextInput
            placeholder={t("search")}
            placeholderTextColor={Colors.gray}
            style={[
              styles.input,
              { color: Colors.textcolor, fontFamily: getFont("regular") },
            ]}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Categories */}
        <Text
          style={[
            styles.categoryHeading,
            { color: Colors.textcolor, fontFamily: getFont("semibold") },
          ]}
        >
          {t("categories")}
        </Text>

        <FlatList
          data={categories}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                { backgroundColor: Colors.deepPurple, borderColor: Colors.lavenderPurple },
              ]}
              
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: index === 0 ? Colors.textcolor : Colors.gray,
                    fontFamily: getFont(index === 0 ? "semibold" : "regular"),
                  },
                ]}
              >
                {t(item)}
              </Text>
              <Ionicons name="chevron-forward" size={fw(18)} color={Colors.gray} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </GradientScreen>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getLayoutConfig().contentPadding,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getLayoutConfig().isTablet ? fh(20) : fh(40),
    height: getLayoutConfig().headerHeight,
  },
  headerTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    marginLeft: fw(12),
    fontWeight: "600",
    includeFontPadding: false,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: fr(8),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 16 : 10),
    marginTop: fh(getLayoutConfig().isTablet ? 20 : 30),
    height: fh(getLayoutConfig().isTablet ? 56 : 48),
  },
  input: {
    flex: 1,
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    padding: fh(getLayoutConfig().isTablet ? 12 : 8),
    includeFontPadding: false,
  },
  categoryHeading: {
    fontSize: ff(getLayoutConfig().isTablet ? 18 : 16),
    marginTop: fh(getLayoutConfig().isTablet ? 30 : 50),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 10),
    fontWeight: "600",
    includeFontPadding: false,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: fh(getLayoutConfig().isTablet ? 18 : 14),
    borderRadius: fr(8),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 10),
    borderWidth: 1,
    minHeight: fh(getLayoutConfig().isTablet ? 64 : 56),
  },
  categoryText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    flex: 1,
    includeFontPadding: false,
  },
});
