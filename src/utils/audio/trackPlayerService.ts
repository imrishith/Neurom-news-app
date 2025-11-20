import TrackPlayer from "react-native-track-player";

export async function setupTrackPlayer() {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10,
    });

    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
        TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
        TrackPlayer.CAPABILITY_SEEK_TO,
      ],
      compactCapabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
      ],
      android: {
        appKilledPlaybackBehavior: "stop-playback",
      },
    });

    console.log("🎵 GLOBAL TrackPlayer initialized");
  } catch (e) {
    console.error("❌ TrackPlayer setup failed:", e);
  }
}
