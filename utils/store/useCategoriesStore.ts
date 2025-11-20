import { create } from "zustand";
import { getCategories } from "../../src/api/users/contentApi";

const TEN_MIN = 1000 * 60 * 10;

interface CategoriesState {
  categories: any[];
  lastFetchedCategoriesAt: number | null;

  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  toggleCategory: (catKey: string) => void;
  clearCategories: () => void;

  fetchCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  // ---------- Data ----------
  categories: [],
  lastFetchedCategoriesAt: null,

  // ---------- UI ----------
  selectedCategories: [],

  setSelectedCategories: (cats) => set({ selectedCategories: cats }),

  toggleCategory: (catKey) => {
    const { selectedCategories } = get();
    const updated = selectedCategories.includes(catKey)
      ? selectedCategories.filter((c) => c !== catKey)
      : [...selectedCategories, catKey];

    set({ selectedCategories: updated });
  },

  clearCategories: () => set({ selectedCategories: [] }),

  // ---------- Fetch categories ----------
  fetchCategories: async () => {
    const { lastFetchedCategoriesAt, categories } = get();
    const shouldRefetch =
      !lastFetchedCategoriesAt ||
      Date.now() - lastFetchedCategoriesAt > TEN_MIN ||
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
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
    }
  },
}));
