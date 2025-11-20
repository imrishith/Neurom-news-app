// utils/store/usePollsStore.ts
import { create } from "zustand";
import { publicPolls } from "../../src/api/publicapi/publicApi";

const TEN_MIN = 1000 * 60 * 10;

interface PollsState {
  polls: any[];
  lastFetchedPollsAt: number | null;

  fetchPolls: (force?: boolean) => Promise<void>;
  refreshPolls: () => Promise<void>;
}

export const usePollsStore = create<PollsState>((set, get) => ({
  polls: [],
  lastFetchedPollsAt: null,

  // MAIN FETCH
  fetchPolls: async (force = false) => {
    const { lastFetchedPollsAt, polls } = get();

    const shouldRefetch =
      force ||
      !lastFetchedPollsAt ||
      Date.now() - lastFetchedPollsAt > TEN_MIN ||
      polls.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("⚡ Using cached polls:", polls.length);
      return;
    }

    try {
      const res = await publicPolls.list();
      if (res?.success && Array.isArray(res.data?.items)) {
        if (__DEV__) console.log("📊 Polls fetched:", res.data.items.length);

        set({
          polls: res.data.items,
          lastFetchedPollsAt: Date.now(),
        });
      } else {
        if (__DEV__) console.log("⚠️ Polls fetch returned empty");
        set({ polls: [], lastFetchedPollsAt: Date.now() });
      }
    } catch (err) {
      console.error("❌ Error fetching polls:", err);
    }
  },

  // ALWAYS refetch
  refreshPolls: async () => {
    try {
      const res = await publicPolls.list();
      if (res?.success && Array.isArray(res.data?.items)) {
        set({
          polls: res.data.items,
          lastFetchedPollsAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("❌ Refresh polls error:", err);
    }
  },
}));
