// src/context/OnboardingContext.tsx
import React, { createContext, useContext, useState } from "react";
import { Fonts } from "../../utils/typography";
import { translations } from "../../utils/translations";
import { MMKV } from "react-native-mmkv";

type OnboardingData = {
  device_id?: string;
  state_id?: number;
  district_id?: number;
  district_name?: string;
  mandal_id?: number;
  mandal_name?: string;
  village_id?: number;
  constituency_id?: number;
  village_name?: string;
  language_code?: "en" | "te"; // ✅ Only keep language_code now
  voice_id?: number;
  isRegistered?: boolean;
};

type OnboardingContextType = {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;

  // Helpers
  getFont: (weight?: "regular" | "semibold" | "bold" | "medium") => string;
  getLocalizedText: (item: any, baseKey: string) => string;
  t: (key: string) => string;
  getLangCode: () => "en" | "te";
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const storage = new MMKV({ id: "onboarding" });

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  // ✅ Default language is English
  const stored = storage.getString("onboardingData");

    const [data, setData] = useState<OnboardingData>(
      stored
        ? JSON.parse(stored)
        : {
            isRegistered: false,
            language_code: "en",
          }
    );

  // ✅ Safe update (ignore undefined values)
 const updateData = (updates: Partial<OnboardingData>) => {
  setData((prev) => {
    const safeUpdates: Partial<OnboardingData> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        (safeUpdates as any)[key] = value;
      }
    });

    const updated = { ...prev, ...safeUpdates };

    // 🔥 Save to MMKV
    storage.set("onboardingData", JSON.stringify(updated));

    return updated;
  });
};


  // ✅ Unified font system
  const getFont = (
    weight: "regular" | "semibold" | "bold" | "medium" = "regular"
  ) => Fonts.inter[weight];

  // ✅ Get localized API content (English/Telugu)
  const getLocalizedText = (item: any, baseKey: string) => {
    const langCode = data.language_code ?? "en";
    return item?.[`${baseKey}_${langCode}`] || "";
  };

  // ✅ Translate static UI labels
  const t = (key: string) => {
    const langCode = data.language_code ?? "en";
    return translations[langCode]?.[key] || key;
  };

  // ✅ Language code helper
  const getLangCode = (): "en" | "te" => data.language_code ?? "en";

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, getFont, getLocalizedText, t, getLangCode }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return ctx;
};
