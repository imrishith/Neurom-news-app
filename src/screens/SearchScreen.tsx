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
import { fw, fh, ff } from "../../utils/responsive";
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
    paddingHorizontal: fw(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: fh(40),
  },
  headerTitle: {
    fontSize: ff(18),
    marginLeft: fw(12),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: fw(8),
    paddingHorizontal: fw(10),
    marginTop: fh(30),
  },
  input: {
    flex: 1,
    fontSize: ff(14),
    padding: fh(8),
  },
  categoryHeading: {
    fontSize: ff(16),
    marginTop: fh(50),
    marginBottom: fh(10),
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: fh(14),
    borderRadius: fw(8),
    marginBottom: fh(10),
    borderWidth: 1,
  },
  categoryText: {
    fontSize: ff(14),
  },
});
