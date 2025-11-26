import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../src/screens/Home/Home";
import HelloWorldScreen from "../src/screens/AudioScreen/AudioScreen";
import ArticleScreen from "../src/screens/Articles/Articles";
import CustomHeader from "../src/components/CustomHeader";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🔹 Home Stack (with categories header + details screen)
function HomeStack() {
  const [activeCategory, setActiveCategory] = useState("Latest");
  const categories = ["Latest", "Sports", "Politics", "Tech", "Movies"];

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        options={{
          header: () => (
            <CustomHeader
              type="categories"
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} category={activeCategory} />}
      </Stack.Screen>

      <Stack.Screen
        name="Details"
        component={ArticleScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader type="title" title="Details" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// 🔹 Profile Stack (simple title header)
function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={HelloWorldScreen}
        options={({ navigation }) => ({
          header: () => (
            <CustomHeader type="title" title="Profile" navigation={navigation} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// 🔹 Main Tab Navigator
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // hide default header
        tabBarIcon: ({ color, size }) => {
          let icon = "home";
          if (route.name === "ProfileTab") icon = "person";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
