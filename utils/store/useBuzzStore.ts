import { create } from "zustand";
import { getBuzzContents } from "../../src/api/users/contentApi";

// 🔥 OPTIMIZED: 5 minutes cache like Inshorts (was 1 hour)
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// 🔥 OPTIMIZED: Keep only 40 buzz items in memory
const MAX_BUZZ_IN_MEMORY = 40;

interface BuzzState {
  buzzContents: any[];
  lastFetchedBuzzAt: number | null;
  buzzCursor: string | null;
  buzzHasMore: boolean;

  lastViewedBuzzIndex: number;
  setLastViewedBuzzIndex: (index: number) => void;

  fetchBuzzContents: (
    category_id?: number | null,
    reset?: boolean
  ) => Promise<void>;
  loadMoreBuzz: (category_id?: number | null) => Promise<void>;

  // 🔥 NEW: Clear buzz cache
  clearBuzzCache: () => void;
}

// 🔥 HELPER: Trim array to max size
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

export const useBuzzStore = create<BuzzState>((set, get) => ({
  buzzContents: [],
  lastFetchedBuzzAt: null,
  buzzCursor: null,
  buzzHasMore: true,
  lastViewedBuzzIndex: 0,

  setLastViewedBuzzIndex: (index) => {
    set({
      lastViewedBuzzIndex: index,
    });
  },

  // 🔥 NEW: Clear all buzz cache
  clearBuzzCache: () => {
    set({
      buzzContents: [],
      lastFetchedBuzzAt: null,
      buzzCursor: null,
      buzzHasMore: true,
      lastViewedBuzzIndex: 0,
    });
  },

  fetchBuzzContents: async (category_id?: number | null, reset = false) => {
    try {
      const { lastFetchedBuzzAt, buzzContents } = get();

      // 🔥 OPTIMIZED: Use 5-minute cache instead of 1 hour
      const shouldRefetch =
        reset ||
        !lastFetchedBuzzAt ||
        Date.now() - lastFetchedBuzzAt > CACHE_DURATION ||
        buzzContents.length === 0;

      if (!shouldRefetch) {
        if (__DEV__) console.log("✅ Using cached buzz:", buzzContents.length);
        return;
      }

      if (reset) {
        set({ buzzContents: [], buzzCursor: null, buzzHasMore: true });
      }

      // 🔥 OPTIMIZED: Fetch 20 items initially (was 10)
      const res = await getBuzzContents(20, null, category_id ?? null);

      if (res?.success && Array.isArray(res.data?.items)) {
        // 🔥 OPTIMIZED: Trim to 40 items max
        const trimmedItems = trimToMaxSize(res.data.items, MAX_BUZZ_IN_MEMORY);

        set({
          buzzContents: trimmedItems,
          buzzCursor: trimmedItems.length >= MAX_BUZZ_IN_MEMORY ? null : (res.data?.nextCursor || null),
          buzzHasMore: trimmedItems.length < MAX_BUZZ_IN_MEMORY && !!res.data?.nextCursor,
          lastFetchedBuzzAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching buzz contents:", err);
    }
  },

  loadMoreBuzz: async (category_id?: number | null) => {
    const { buzzContents, buzzCursor, buzzHasMore } = get();

    // 🔥 OPTIMIZED: Stop loading if we already have 40 items
    if (!buzzHasMore || buzzContents.length >= MAX_BUZZ_IN_MEMORY) {
      if (__DEV__) console.log("⚠️ Already have max buzz items:", buzzContents.length);
      return;
    }

    try {
      // 🔥 OPTIMIZED: Calculate how many more items we need
      const remainingSlots = MAX_BUZZ_IN_MEMORY - buzzContents.length;
      const fetchCount = Math.min(20, Math.max(1, remainingSlots));

      if (__DEV__) console.log(`📥 Loading ${fetchCount} more buzz items...`);

      const res = await getBuzzContents(fetchCount, buzzCursor, category_id ?? null);

      if (res?.success && Array.isArray(res.data?.items)) {
        // Filter out duplicates
        const newItems = res.data.items.filter(
          (n: any) => !buzzContents.some((b: any) => b.buzz_id === n.buzz_id)
        );

        // 🔥 OPTIMIZED: Combine and trim to 40 items max
        const combined = [...buzzContents, ...newItems];
        const trimmedItems = trimToMaxSize(combined, MAX_BUZZ_IN_MEMORY);

        set({
          buzzContents: trimmedItems,
          buzzCursor: trimmedItems.length >= MAX_BUZZ_IN_MEMORY ? null : (res.data?.nextCursor || null),
          buzzHasMore: trimmedItems.length < MAX_BUZZ_IN_MEMORY && !!res.data?.nextCursor,
        });

        if (__DEV__) console.log(`✅ Now have ${trimmedItems.length} buzz items`);
      }
    } catch (err) {
      console.error("❌ Error loading more buzz:", err);
    }
  },
}));