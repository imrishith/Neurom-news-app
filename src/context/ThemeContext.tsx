// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance, StatusBarStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors } from "../constants/colors";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  finalTheme: Theme;
  setTheme: (t: Theme) => void;
  Colors: typeof DarkColors;
  barStyle: StatusBarStyle;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: any) => {

  // Read system theme ONCE
  const systemTheme: Theme =
    Appearance.getColorScheme() === "dark" ? "dark" : "light";

  // This will be overridden if user saved a choice
  const [theme, setThemeState] = useState<Theme>(systemTheme);

  // Load user theme override
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("appTheme");
      if (saved === "light" || saved === "dark") {
        setThemeState(saved); // user override
      }
    })();
  }, []);

  // Save whenever user switches theme
  const setTheme = (t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem("appTheme", t);
  };

  // Final UI theme
  const finalTheme = theme;

  const Colors = finalTheme === "dark" ? DarkColors : LightColors;
  const barStyle: StatusBarStyle =
    finalTheme === "dark" ? "light-content" : "dark-content";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        finalTheme,
        Colors,
        setTheme,
        barStyle
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
};
