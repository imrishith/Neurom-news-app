// utils/store/usePollsStore.ts
import { create } from "zustand";
import { publicPolls } from "../../src/api/publicapi/publicApi";

// 🔥 5-minute cache (same as Buzz + Magazines)
const CACHE_DURATION = 1000 * 60 * 5;

// 🔥 Keep max 10 polls in memory
const MAX_POLLS_IN_MEMORY = 500;

// Helper to trim array
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

interface PollsState {
  polls: any[];
  lastFetchedPollsAt: number | null;

  fetchPolls: (force?: boolean) => Promise<void>;
  refreshPolls: () => Promise<void>;
  clearPollsCache: () => void;
}

export const usePollsStore = create<PollsState>((set, get) => ({
  polls: [],
  lastFetchedPollsAt: null,

  // 🔥 Clear cache (optional)
  clearPollsCache: () =>
    set({
      polls: [],
      lastFetchedPollsAt: null,
    }),

  // MAIN FETCH
  fetchPolls: async (force = false) => {
    const { lastFetchedPollsAt, polls } = get();

    const shouldRefetch =
      force ||
      !lastFetchedPollsAt ||
      Date.now() - lastFetchedPollsAt > CACHE_DURATION ||
      polls.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("⚡ Using cached polls:", polls.length);
      return;
    }

    try {
      const res = await publicPolls.list();

      if (res?.success && Array.isArray(res.data?.items)) {
        const trimmed = trimToMaxSize(res.data.items, MAX_POLLS_IN_MEMORY);

        if (__DEV__) console.log("📊 Polls fetched:", trimmed.length);

        set({
          polls: trimmed,
          lastFetchedPollsAt: Date.now(),
        });
      } else {
        if (__DEV__) console.log("⚠️ Polls fetch returned empty");
        set({
          polls: [],
          lastFetchedPollsAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching polls:", err);
    }
  },

  // ALWAYS REFRESH (manual refresh pull-to-refresh)
  refreshPolls: async () => {
    try {
      const res = await publicPolls.list();

      if (res?.success && Array.isArray(res.data?.items)) {
        const trimmed = trimToMaxSize(res.data.items, MAX_POLLS_IN_MEMORY);

        set({
          polls: trimmed,
          lastFetchedPollsAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Refresh polls error:", err);
    }
  },
}));
