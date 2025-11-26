// src/hooks/useContentTabs.ts
import { useEffect, useMemo, useState, useCallback } from "react";
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

  const labels = {
    breaking_news: getLangCode() === "te" ? "బ్రేకింగ్" : "Breaking",
    trending: getLangCode() === "te" ? "ట్రెండింగ్" : "Trending",
    exclusive: getLangCode() === "te" ? "ఎక్స్‌క్లూజివ్" : "Exclusive",
  };

  // ✅ State for dynamically added tabs (Breaking, Trending, Exclusive)
  const [dynamicTabs, setDynamicTabs] = useState<Array<{ key: string; label: string }>>([]);

  const addSpecialTab = useCallback((key: "breaking_news" | "trending" | "exclusive") => {
    const label = labels[key];

    setDynamicTabs((prev) => {
      if (!prev.some((t) => t.key === key)) {
        return [...prev, { key, label }];
      }
      return prev;
    });

    setActiveTab(key);
  }, [labels]);
  // ✅ Fetch categories globally only once (from MMKV cache or API)
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // ✅ Function to add a tab dynamically
  const addTab = useCallback((key: string, label: string) => {
    setDynamicTabs((prev) => {
      // Check if tab already exists
      if (prev.some((tab) => tab.key === key)) {
        // Tab exists, just set it as active
        setActiveTab(key);
        return prev;
      }
      // Add new tab
      const newTab = { key, label };
      setActiveTab(key);
      return [...prev, newTab];
    });
  }, []);

  // ✅ Memoize language-based labels
  const tabs = useMemo(() => {
    const isTelugu = getLangCode() === "te";

    // 🟣 Always show base tabs (without Breaking/Trending/Exclusive)
    const baseTabs = [
      {
        key: "sidebar",
        label: "",
        icon: require("../../assets/icons/pluser.png"),
      },
      {
        key: "latest",
        label: isTelugu ? "తాజా" : "Latest",
      },
      {
        key: "state",
        label: String(data.village_name || (isTelugu ? "మండలం" : "Mandal")),
      },
      {
        key: "breaking",
        label: isTelugu ? "బ్రేకింగ్" : "Breaking",
      },
      {
        key: "trending",
        label: isTelugu ? "ట్రెండింగ్" : "Trending",
      },
      {
        key: "exclusive",
        label: isTelugu ? "ఎక్స్‌క్లూజివ్" : "Exclusive",
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
      }));

    // 🔵 Insert dynamic tabs after "state" tab
    const stateIndex = baseTabs.findIndex((tab) => tab.key === "state");
    const beforeState = baseTabs.slice(0, stateIndex + 1);
    const afterState = baseTabs.slice(stateIndex + 1);

    return [...beforeState, ...dynamicTabs, ...afterState, ...selectedCategoryTabs];
  }, [categories, selectedCategories, getLangCode(), data.state, dynamicTabs]);

  return {
    tabs,               // ✅ tabs dynamically update
    activeTab,
    setActiveTab,
    addTab,             // ✅ function to add dynamic tabs
    addSpecialTab,
    categories,         // ✅ global categories list
    selectedCategories, // ✅ globally selected categories
    setSelectedCategories,
  };
}
