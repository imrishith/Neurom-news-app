import NetInfo from "@react-native-community/netinfo";

let networkQuality: "low" | "medium" | "high" = "medium";

NetInfo.addEventListener((state) => {
  const speed = state.details?.downlink ?? 1; // Mbps

  if (speed > 10) networkQuality = "high";
  else if (speed > 3) networkQuality = "medium";
  else networkQuality = "low";
});

export const getNetworkQuality = () => networkQuality;
