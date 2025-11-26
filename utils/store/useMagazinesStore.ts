import { create } from "zustand";
import { getMagazines } from "../../src/api/users/contentApi";

// ⏳ 5-minute cache like Buzz
const CACHE_DURATION = 1000 * 60 * 5;

// 📌 Keep only 20 magazines in memory
const MAX_MAGAZINES_IN_MEMORY = 500;

// Helper: trim array
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

interface MagazinesState {
  magazines: any[];
  magCursor: string | null;
  magHasMore: boolean;
  lastFetchedMagazinesAt: number | null;

  lastViewedMagazineIndex: number;
  setLastViewedMagazineIndex: (index: number) => void;

  fetchMagazines: (category_id?: number | null, reset?: boolean) => Promise<void>;
  loadMoreMagazines: (category_id?: number | null) => Promise<void>;

  clearMagazinesCache: () => void;
}

export const useMagazinesStore = create<MagazinesState>((set, get) => ({
  magazines: [],
  magCursor: null,
  magHasMore: true,
  lastFetchedMagazinesAt: null,

  lastViewedMagazineIndex: 0,
  setLastViewedMagazineIndex: (index) => set({ lastViewedMagazineIndex: index }),

  // 🔥 NEW: Clear magazine cache
  clearMagazinesCache: () =>
    set({
      magazines: [],
      magCursor: null,
      magHasMore: true,
      lastFetchedMagazinesAt: null,
      lastViewedMagazineIndex: 0,
    }),

  fetchMagazines: async (category_id?: number | null, reset = false) => {
    try {
      const { lastFetchedMagazinesAt, magazines } = get();

      // Should refetch?
      const shouldRefetch =
        reset ||
        category_id != null ||
        !lastFetchedMagazinesAt ||
        Date.now() - lastFetchedMagazinesAt > CACHE_DURATION ||
        magazines.length === 0;

      if (!shouldRefetch) return;

      if (reset) {
        set({ magazines: [], magCursor: null, magHasMore: true });
      }

      // Fetch 20 items initially
      const res = await getMagazines(20, null, category_id ?? null);

      if (res?.success && Array.isArray(res.data?.items)) {
        const trimmed = trimToMaxSize(res.data.items, MAX_MAGAZINES_IN_MEMORY);

        set({
          magazines: trimmed,
          magCursor: trimmed.length >= MAX_MAGAZINES_IN_MEMORY ? null : res.data?.nextCursor || null,
          magHasMore: trimmed.length < MAX_MAGAZINES_IN_MEMORY && !!res.data?.nextCursor,
          lastFetchedMagazinesAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching magazines:", err);
    }
  },

  loadMoreMagazines: async (category_id?: number | null) => {
    const { magazines, magCursor, magHasMore } = get();

    if (!magHasMore || magazines.length >= MAX_MAGAZINES_IN_MEMORY) return;

    try {
      const remainingSlots = MAX_MAGAZINES_IN_MEMORY - magazines.length;
      const fetchCount = Math.min(20, Math.max(1, remainingSlots));

      const res = await getMagazines(fetchCount, magCursor, category_id ?? null);

      if (res?.success && Array.isArray(res.data?.items)) {
        const newItems = res.data.items.filter(
          (n: any) => !magazines.some((m: any) => m.magazine_id === n.magazine_id)
        );

        const combined = [...magazines, ...newItems];
        const trimmed = trimToMaxSize(combined, MAX_MAGAZINES_IN_MEMORY);

        set({
          magazines: trimmed,
          magCursor: trimmed.length >= MAX_MAGAZINES_IN_MEMORY ? null : res.data?.nextCursor || null,
          magHasMore: trimmed.length < MAX_MAGAZINES_IN_MEMORY && !!res.data?.nextCursor,
        });
      }
    } catch (err) {
      console.error("❌ Error loading more magazines:", err);
    }
  },
}));
