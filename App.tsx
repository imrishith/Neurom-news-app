
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";
import { OnboardingProvider } from "./src/context/OnboardingContext";
import { LogBox, Text, TextInput, Linking, AppState, InteractionManager } from "react-native";
import { navigationRef } from './navigation/navigationRef';
import { useArticlesStore } from "./utils/store/useArticlesStore";
import { useVideosStore } from "./utils/store/useVideosStore";
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
// ❌ REMOVED: import { setupTrackPlayer } from "./src/utils/audio/trackPlayerService";

// Disable system scaling & lock default font globally
// @ts-ignore
Text.defaultProps = Text.defaultProps || {};
// @ts-ignore
Text.defaultProps.allowFontScaling = false;
// @ts-ignore
Text.defaultProps.style = {
  fontFamily: "Inter-Regular",
};

// @ts-ignore
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-ignore
TextInput.defaultProps.allowFontScaling = false;
// @ts-ignore
TextInput.defaultProps.style = {
  fontFamily: "Inter-Regular",
};

export default function App() {
  const appState = useRef(AppState.currentState);

  const didColdStartRefresh = useRef(false);
  const [hasHydrated, setHasHydrated] = useState(
    // @ts-ignore
    (useArticlesStore as any)?.persist?.hasHydrated?.() ?? false
  );


  useEffect(() => {
    async function setupNotifications() {
      try {
        await notifee.requestPermission();

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log(enabled ? '🔔 Push permission granted' : '🚫 Push permission denied');

        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        const token = await messaging().getToken();

        const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {

          await notifee.displayNotification({
            title: remoteMessage.notification?.title ?? "Neurom",
            body: remoteMessage.notification?.title ?? "",
            android: {
              channelId,
              smallIcon: "ic_launcher",
              pressAction: { id: "default" },
              importance: AndroidImportance.HIGH,
              largeIcon: remoteMessage.data?.image,
              style: {
                type: AndroidStyle.BIGTEXT,
                text: remoteMessage.notification?.title ?? "",
              } as any,
            },
            data: remoteMessage.data,
          });
        });

        const unsubscribeOnOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
          if (remoteMessage?.data?.article_id) {
            Linking.openURL(`Neurom://article/${remoteMessage.data.article_id}`);
          }
        });

        const initialMessage = await messaging().getInitialNotification();
        if (initialMessage?.data?.article_id) {
          Linking.openURL(`Neurom://article/${initialMessage.data.article_id}`);
        }

        return () => {
          unsubscribeOnMessage();
          unsubscribeOnOpened();
        };
      } catch (error) {
        console.error('❌ FCM setup failed:', error);
      }
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    try {
      LogBox.ignoreLogs(["Setting a timer"]);
      // @ts-ignore
      console.reportErrorsAsExceptions = false;
      // @ts-ignore
      if (global?.ErrorUtils?.setGlobalHandler) {
        // @ts-ignore
        global.ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
          if (__DEV__) {
            console.log("GLOBAL ERROR:", {
              message: err?.message,
              isFatal,
              stack: err?.stack,
            });
          }
        });
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // JS thread block detector
//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       const start = Date.now();
// setImmediate(() => {
//   const end = Date.now();
//   const block = end - start;
//   if (block > 40) {
//     console.log("🔥 JS thread BLOCKED:", block + "ms");
//   }
// });

//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, []);

  useEffect(() => {
    // @ts-ignore
    const persistApi = (useArticlesStore as any)?.persist;
    const unsubFinish = persistApi?.onFinishHydration?.(() => setHasHydrated(true));
    if (persistApi?.hasHydrated?.()) setHasHydrated(true);

    if (!persistApi || persistApi?.hasHydrated == null) {
      const t = setTimeout(() => setHasHydrated(true), 0);
      return () => clearTimeout(t);
    }

    return () => {
      try { unsubFinish?.(); } catch { }
    };
  }, []);

  const hasPrefetched = useRef(false);
  useEffect(() => {
    if (!hasHydrated) return;
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    const prefetchAppData = async () => {
      const {
        fetchArticles,
      } = useArticlesStore.getState();

       const {
      fetchVideos,
    } = useVideosStore.getState();
      
      fetchArticles();
      fetchVideos();            // short videos
    };

    InteractionManager.runAfterInteractions(async () => {
      console.log("🚀 Background prefetch started");
      await prefetchAppData();
      console.log("✅ Background prefetch completed");
    });
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    const parseAndNavigate = (url?: string | null) => {
      if (!url) return;
      try {
        const schemeRe = /Neurom:\/\/article\/(\d+)/i;
        const httpsRe = /https?:\/\/Neuromindia\.com\/article\/(\d+)/i;
        const match = url.match(schemeRe) || url.match(httpsRe);
        const idStr = match?.[1];
        const articleId = idStr ? Number(idStr) : NaN;
        if (!isNaN(articleId)) {
          if (navigationRef.isReady()) {
            // @ts-ignore
            navigationRef.navigate('ArticleScreen' as never, { articleId } as never);
          } else {
            setTimeout(() => {
              // @ts-ignore
              navigationRef.navigate('ArticleScreen' as never, { articleId } as never);
            }, 0);
          }
        }
      } catch { }
    };

    Linking.getInitialURL().then(parseAndNavigate).catch(() => { });
    const sub = Linking.addEventListener('url', (e: any) => parseAndNavigate(e?.url));
    return () => {
      // @ts-ignore
      sub?.remove?.();
    };
  }, [hasHydrated]);

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
