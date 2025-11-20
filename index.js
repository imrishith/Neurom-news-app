/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';
import { name as appName } from './app.json';
import TrackPlayer from 'react-native-track-player';

const Root = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

async function setupPlayer() {
  try {
    console.log("🎧 Initializing TrackPlayer...");
    await TrackPlayer.setupPlayer();

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });

    console.log("✅ TrackPlayer global setup complete");
  } catch (err) {
    console.log("❌ TrackPlayer setup error:", err);
  }
}

// 🚀 Run setup before mounting the component
setupPlayer();
AppRegistry.registerComponent(appName, () => Root);

TrackPlayer.registerPlaybackService(() =>
  require('./src/utils/audio/service')
);
