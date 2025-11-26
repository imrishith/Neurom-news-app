import { create } from "zustand";
import { getCategories } from "../../src/api/users/contentApi";

// 🔥 5-minute cache for all lightweight metadata
const CACHE_DURATION = 1000 * 60 * 5;

interface CategoriesState {
  categories: any[];
  lastFetchedCategoriesAt: number | null;

  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  toggleCategory: (catKey: string) => void;

  clearSelectedCategories: () => void;
  clearCategoriesCache: () => void;

  fetchCategories: (force?: boolean) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  // Data
  categories: [],
  lastFetchedCategoriesAt: null,

  // UI selection
  selectedCategories: [],

  setSelectedCategories: (cats) => set({ selectedCategories: cats }),

  toggleCategory: (catKey) => {
    const { selectedCategories } = get();
    const updated = selectedCategories.includes(catKey)
      ? selectedCategories.filter((c) => c !== catKey)
      : [...selectedCategories, catKey];

    set({ selectedCategories: updated });
  },

  clearSelectedCategories: () => set({ selectedCategories: [] }),

  // 🔥 Clear categories + cache timestamp
  clearCategoriesCache: () =>
    set({
      categories: [],
      lastFetchedCategoriesAt: null,
      selectedCategories: [],
    }),

  // Main fetch
  fetchCategories: async (force = false) => {
    const { lastFetchedCategoriesAt, categories } = get();

    const shouldRefetch =
      force ||
      !lastFetchedCategoriesAt ||
      Date.now() - lastFetchedCategoriesAt > CACHE_DURATION ||
      categories.length === 0;

    if (!shouldRefetch) return;

    try {
      const res = await getCategories();

      if (res?.success && Array.isArray(res.data?.items)) {
        const mapped = res.data.items.map((c: any) => ({
          key: String(c.category_id),
          label_en: c.display_name_en || c.name_en,
          label_te: c.display_name_te || c.name_te,
          icon_url: c.icon_url,
          ...c,
        }));

        set({
          categories: mapped,
          lastFetchedCategoriesAt: Date.now(),
        });

        if (__DEV__) console.log("📌 Categories updated:", mapped.length);
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  },
}));
