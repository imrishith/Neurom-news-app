import { create } from "zustand";
import { getMagazines } from "../../src/api/users/contentApi";

const TEN_MIN = 1000 * 60 * 10;

interface MagazinesState {
  magazines: any[];
  magCursor: string | null;
  magHasMore: boolean;
  lastFetchedMagazinesAt: number | null;

  lastViewedMagazineIndex: number;
  setLastViewedMagazineIndex: (index: number) => void;

  fetchMagazines: (category_id?: number | null) => Promise<void>;
  loadMoreMagazines: (category_id?: number | null) => Promise<void>;
}

export const useMagazinesStore = create<MagazinesState>((set, get) => ({
  magazines: [],
  magCursor: null,
  magHasMore: true,
  lastFetchedMagazinesAt: null,

  // ⭐ Added state
  lastViewedMagazineIndex: 0,

  // ⭐ Added setter
  setLastViewedMagazineIndex: (index) => {
    set({ lastViewedMagazineIndex: index });
  },
  

  fetchMagazines: async (category_id?: number | null) => {
    try {
      const { lastFetchedMagazinesAt, magazines } = get();
      const shouldRefetch =
        category_id != null ||
        !lastFetchedMagazinesAt ||
        Date.now() - lastFetchedMagazinesAt > TEN_MIN ||
        magazines.length === 0;
      if (!shouldRefetch) return;

      const res = await getMagazines(10, null, category_id ?? null);
      if (res?.success && Array.isArray(res.data?.items)) {
        set({
          magazines: res.data.items,
          magCursor: res.data?.nextCursor || null,
          magHasMore: !!res.data?.nextCursor,
          lastFetchedMagazinesAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching magazines:", err);
    }
  },

  loadMoreMagazines: async (category_id?: number | null) => {
    const { magazines, magCursor, magHasMore } = get();
    if (!magHasMore) return;

    try {
      const res = await getMagazines(10, magCursor, category_id ?? null);
      if (res?.success && Array.isArray(res.data?.items)) {
        const newItems = res.data.items.filter(
          (n: any) =>
            !magazines.some((b: any) => b.magazine_id === n.magazine_id)
        );
        set({
          magazines: [...magazines, ...newItems],
          magCursor: res.data?.nextCursor || null,
          magHasMore: !!res.data?.nextCursor,
        });
      }
    } catch (err) {
      console.error("❌ Error loading more magazines:", err);
    }
  },
}));

