// src/utils/audio/service.js
import TrackPlayer, { Event } from "react-native-track-player";

/**
 * TrackPlayer Playback Service
 * This runs in a separate JS context and handles background audio
 * Register this in index.js with TrackPlayer.registerPlaybackService()
 */

module.exports = async function () {
  // Remote control event handlers
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log("🎵 Remote Play");
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log("⏸️ Remote Pause");
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log("⏹️ Remote Stop");
    await TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log("⏭️ Remote Next");
    // Handle skip to next (you can implement this in your UI)
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log("⏮️ Remote Previous");
    // Handle skip to previous (you can implement this in your UI)
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    console.log("⏩ Remote Seek:", event.position);
    await TrackPlayer.seekTo(event.position);
  });

  // Optional: Handle playback queue ended
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    console.log("🏁 Playback Queue Ended");
    // You can auto-skip to next article here if needed
  });
};