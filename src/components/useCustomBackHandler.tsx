import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { useNavigationState } from '@react-navigation/native';

const useCustomBackHandler = () => {
  const backPressCount = useRef(0);
  const backPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Get the current route name from React Navigation state
  const currentRouteName = useNavigationState(state => {
    if (!state) return null;
    let route = state.routes[state.index];
    while (route.state && route.state.index !== undefined) {
      route = route.state.routes[route.state.index];
    }
    return route.name;
  });

  useEffect(() => {
    const backAction = () => {
      // Apply logic only for the HomeScreen (or any other screen you want)
      if (currentRouteName === 'HomeScreen' || currentRouteName === 'ArticleScreen') {
        if (backPressCount.current === 0) {
          backPressCount.current = 1;

          // Show Toast message (Only for Android)
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          }

          // Reset backPressCount after 2 seconds
          backPressTimer.current = setTimeout(() => {
            backPressCount.current = 0;
          }, 2000);

          return true; // Prevent default back action
        } else {
          // If back pressed again within 2 seconds, exit the app
          if (backPressTimer.current) {
            clearTimeout(backPressTimer.current);
          }
          BackHandler.exitApp(); // Exit the app
          return false; // Prevent default exit behavior
        }
      }
      return false; // Let the default back handler execute for other screens
    };

    // Attach back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Clean up the event listener
    return () => {
      backHandler.remove();
      if (backPressTimer.current) {
        clearTimeout(backPressTimer.current);
      }
    };
  }, [currentRouteName]); // Re-run effect when the route name changes

  return null;
};

export default useCustomBackHandler;
