// screens/FullScreenMedia.tsx
import React, { Suspense, useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { useAdaptiveVideo } from "../../../utils/useAdaptiveVideo";
import { useRoute, useNavigation } from "@react-navigation/native";
import { fw, fh, ff, fr } from "../../../utils/responsive";

const FullScreenMedia = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { media } = route.params;
  const [isPlaying, setIsPlaying] = useState(media.type === "video");
  const { pickUrl } = useAdaptiveVideo();
  const videoUrl = media?.variants ? pickUrl(media.variants) : media?.url;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {media?.type === "video" ? (
        <Suspense fallback={<ActivityIndicator style={styles.fullscreen} color="#fff" />}>
          {/* Lazy-load heavy video module */}
          {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
          {videoUrl ? (
            React.createElement(
              // require is used instead of static import to avoid bundling on cold start
              require("react-native-video").default,
              {
                source: { uri: videoUrl },
                style: styles.fullscreen,
                resizeMode: "contain",
                paused: !isPlaying,
                repeat: true,
              }
            )
          ) : (
            <View style={styles.fullscreen} />
          )}
        </Suspense>
      ) : (
        <Image source={{ uri: media.url }} style={styles.fullscreen} resizeMode="contain" />
      )}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Image source={require("../../../assets/icons/person.png")} style={styles.closeIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  fullscreen: { flex: 1 },
  closeButton: {
    position: "absolute",
    top: fh(40),
    right: fw(20),
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: fw(8),
    borderRadius: fr(20),
  },
  closeIcon: {
    width: fw(30),
    height: fw(30),
    tintColor: "#fff"
  }
});

export default FullScreenMedia;
