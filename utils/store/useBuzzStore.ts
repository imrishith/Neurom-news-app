import { create } from "zustand";
import { getBuzzContents } from "../../src/api/users/contentApi";

const TEN_MIN = 1000 * 60 * 10;

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
}

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
  
  fetchBuzzContents: async (category_id?: number | null, reset = false) => {
    try {
      const { lastFetchedBuzzAt, buzzContents } = get();
      const shouldRefetch =
        reset ||
        !lastFetchedBuzzAt ||
        Date.now() - lastFetchedBuzzAt > TEN_MIN ||
        buzzContents.length === 0;
      if (!shouldRefetch) return;

      if (reset) {
        set({ buzzContents: [], buzzCursor: null, buzzHasMore: true });
      }

      const res = await getBuzzContents(10, null, category_id ?? null);
      if (res?.success && Array.isArray(res.data?.items)) {
        set({
          buzzContents: res.data.items,
          buzzCursor: res.data?.nextCursor || null,
          buzzHasMore: !!res.data?.nextCursor,
          lastFetchedBuzzAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching buzz contents:", err);
    }
  },

  loadMoreBuzz: async (category_id?: number | null) => {
    const { buzzContents, buzzCursor, buzzHasMore } = get();
    if (!buzzHasMore) return;

    try {
      const res = await getBuzzContents(10, buzzCursor, category_id ?? null);
      if (res?.success && Array.isArray(res.data?.items)) {
        const newItems = res.data.items.filter(
          (n: any) => !buzzContents.some((b: any) => b.buzz_id === n.buzz_id)
        );
        set({
          buzzContents: [...buzzContents, ...newItems],
          buzzCursor: res.data?.nextCursor || null,
          buzzHasMore: !!res.data?.nextCursor,
        });
      }
    } catch (err) {
      console.error("❌ Error loading more buzz:", err);
    }
  },
}));

