import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export const useAppRefresh = (onRefresh: () => void) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
  
        onRefresh(); // 🔹 trigger refetch logic
      }
      appState.current = nextAppState;
    });

    return () => sub.remove();
  }, [onRefresh]);
};