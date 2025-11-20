// src/hooks/useContentTabs.ts
import { useEffect, useMemo, useState } from "react";
import { useOnboarding } from "../context/OnboardingContext";
import { useCategoriesStore } from "../../utils/store";

export function useContentTabs() {
  const { data, getLangCode } = useOnboarding();
  const {
    categories,
    fetchCategories,
    selectedCategories,
    setSelectedCategories,
  } = useCategoriesStore();
  const [activeTab, setActiveTab] = useState<string>("latest");

  // ✅ Fetch categories globally only once (from MMKV cache or API)
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // ✅ Memoize language-based labels
  const tabs = useMemo(() => {
    const isTelugu = getLangCode() === "te";

    // 🟣 Always show base tabs
    const baseTabs = [
      {
        key: "sidebar",
        label: "",
        icon: require("../../assets/icons/pluser.png"),
      },
      {
        key: "latest",
        label: isTelugu ? "తాజా" : "Latest",
        // icon: require("../../assets/icons/time.png"),
      },
      {
        key: "state",
        label: data.state?.name || (isTelugu ? "రాష్ట్రం" : "State"),
        // icon: require("../../assets/icons/location-detect.png"),
      },
    ];

    // 🟢 Only show selected categories in TopBar
    const selectedCategoryTabs = categories
      .filter((c) => selectedCategories.includes(String(c.category_id)))
      .map((c) => ({
        key: String(c.category_id),
        label: isTelugu
          ? c.display_name_te || c.name_te
          : c.display_name_en || c.name_en,
        // icon: c.icon_url
        //   ? { uri: c.icon_url }
        //   : require("../../assets/icons/time.png"),
      }));

    return [...baseTabs, ...selectedCategoryTabs];
  }, [categories, selectedCategories, getLangCode(), data.state]);

  return {
    tabs,               // ✅ tabs dynamically update
    activeTab,
    setActiveTab,
    categories,         // ✅ global categories list
    selectedCategories, // ✅ globally selected categories
    setSelectedCategories,
  };
}
