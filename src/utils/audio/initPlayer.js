import TrackPlayer, { Capability } from "react-native-track-player";

let initialized = false;

export async function initPlayer() {
  if (initialized) return;

  await TrackPlayer.setupPlayer({ maxCacheSize: 1024 * 30 });

  await TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
  });

  initialized = true;
}
