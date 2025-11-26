/**
 * Optimized Prefetch Flow (2025)
 * - Single orchestrated prefetch in App.tsx after rehydration
 * - usePrefetchContent() handles only manual refresh
 * - Prevents redundant API hits and improves cold-start speed
 */

import { usePollsStore } from "../../utils/store/usePollsStore";
import { useArticlesStore } from "../../utils/store/useArticlesStore";
import { useVideosStore } from "../../utils/store/useVideosStore";
import { useBuzzStore } from "../../utils/store/useBuzzStore";
import { useMagazinesStore } from "../../utils/store/useMagazinesStore";

export const usePrefetchContent = () => {
  const { fetchArticles, fetchTrendingNews, fetchExclusiveArticles } =
    useArticlesStore();
  const { fetchVideos, fetchExclusiveVideos } = useVideosStore();
  const { fetchBuzzContents } = useBuzzStore();
  const { fetchMagazines } = useMagazinesStore();
  const { fetchPolls } = usePollsStore();

  const refreshAll = async () => {
    await Promise.all([
      fetchArticles(true),
      fetchVideos(),
      fetchBuzzContents(undefined, true),
      fetchMagazines(),
      fetchTrendingNews(),
      fetchPolls(),
      fetchExclusiveArticles(),
      fetchExclusiveVideos(),
    ]);
  };

  return { refreshAll };
};
