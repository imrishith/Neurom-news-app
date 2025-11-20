import { useCallback, useMemo } from "react";
import { MMKV } from "react-native-mmkv";
import { getNetworkQuality } from "./networkQuality";

const mmkv = new MMKV();
const QUALITY_KEY = "preferred_quality";

export type VideoVariants = Record<string, string | undefined>;
export type VideoQuality = "hls_1080p" | "hls_720p" | "hls_480p" | "auto";

export const useAdaptiveVideo = () => {
  const quality = useMemo<VideoQuality>(() => {
    const saved = mmkv.getString(QUALITY_KEY) as VideoQuality | null;
    return saved || "auto";
  }, []);

  const pickUrl = useCallback(
    (variants: VideoVariants | null | undefined) => {
      if (!variants) return null;

      const network = getNetworkQuality(); // "high" | "medium" | "low"

      const prefer = (keys: string[]) =>
        keys.map((k) => variants[k]).find(Boolean) || null;

      if (quality === "hls_1080p") {
        return (
          variants["hls_1080p"] ||
          variants["1080p"] ||
          variants["hls_720p"] ||
          variants["720p"] ||
          variants["hls_480p"] ||
          variants["480p"] ||
          prefer(Object.keys(variants))
        );
      }

      if (quality === "hls_720p") {
        return (
          variants["hls_720p"] ||
          variants["720p"] ||
          variants["hls_480p"] ||
          variants["480p"] ||
          prefer(Object.keys(variants))
        );
      }

      if (quality === "hls_480p") {
        return (
          variants["hls_480p"] ||
          variants["480p"] ||
          variants["hls_360p"] ||
          variants["360p"] ||
          prefer(Object.keys(variants))
        );
      }

      // auto mode → choose based on network
      if (network === "high") {
        return (
          variants["hls_1080p"] ||
          variants["1080p"] ||
          variants["hls_720p"] ||
          variants["720p"] ||
          variants["hls_480p"] ||
          variants["480p"] ||
          prefer(Object.keys(variants))
        );
      }

      if (network === "medium") {
        return (
          variants["hls_720p"] ||
          variants["720p"] ||
          variants["hls_480p"] ||
          variants["480p"] ||
          variants["hls_360p"] ||
          variants["360p"] ||
          prefer(Object.keys(variants))
        );
      }

      // low/unknown
      return (
        variants["hls_480p"] ||
        variants["480p"] ||
        variants["hls_360p"] ||
        variants["360p"] ||
        variants["hls_240p"] ||
        variants["240p"] ||
        prefer(Object.keys(variants))
      );
    },
    [quality]
  );

  const setPreferredQuality = useCallback((q: VideoQuality) => {
    mmkv.set(QUALITY_KEY, q);
  }, []);

  return { quality, pickUrl, setPreferredQuality };
};

