// src/context/ContentContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getStateArticles } from "../api/users/contentApi";
import { getShortVideos } from "../api/users/contentApi"
import { useOnboarding } from "./OnboardingContext";

type ContentContextType = {
  articles: any[];
  reels: any[];
  liveUpdates: any[];
  loading: boolean;
  refreshContent: () => Promise<void>;
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = useOnboarding(); // ✅ get language_id, state_id
  const [articles, setArticles] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshContent = async () => {
    setLoading(true);
    try {
      // 🔹 Run APIs in parallel
      const [articleRes, reelsRes] = await Promise.all([
        getStateArticles(),
        getShortVideos(),
      ]);

      if (articleRes?.success) setArticles(articleRes.data.items || []);
      if (reelsRes?.success) setReels(reelsRes.data.items || []);
    } catch (err) {
      console.error("❌ refreshContent failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load content when language/state changes
  useEffect(() => {
    refreshContent();
  }, []);

  return (
    <ContentContext.Provider
      value={{ articles, reels, liveUpdates, loading, refreshContent }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
};
