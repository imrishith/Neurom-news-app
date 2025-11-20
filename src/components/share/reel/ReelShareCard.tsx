import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { useOnboarding } from "../../../context/OnboardingContext";
import { fw } from "../../../../utils/responsive";
import Ionicons from "react-native-vector-icons/Ionicons";

const ReelShareCard = ({ reel }: any) => {
  const { getFont, getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";

  const [loaded, setLoaded] = useState(false);

  const title = isTelugu
    ? (reel?.title_te || reel?.title_en || "").slice(0, 80)
    : (reel?.title_en || reel?.title_te || "").slice(0, 80);

  const description = isTelugu
    ? (reel?.description_te || reel?.description_en || "").slice(0, 240)
    : (reel?.description_en || reel?.description_te || "").slice(0, 240);

  const thumbnail =
    reel?.media?.thumbnail ||
    reel?.thumbnail ||
    "https://Neurom-bucket.s3.ap-south-1.amazonaws.com/processed/default.jpg";

  return (
    <View
      style={{
        width: 1080,
        height: 1800,
        backgroundColor: "#000",
        borderRadius: 30,
        overflow: "hidden",
      }}
    >
      {/* 🎥 Thumbnail with play icon */}
      <View
        style={{
          width: "100%",
          height: 1000,
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#111",
        }}
      >
        <Image
          source={{ uri: thumbnail }}
          style={{
            width: "100%",
            height: "100%",
            opacity: loaded ? 1 : 0.5,
          }}
          resizeMode="cover"
          onLoadEnd={() => setLoaded(true)}
        />

        {/* ▶️ Play Button Overlay */}
        <View
          style={{
            position: "absolute",
            backgroundColor: "rgba(0,0,0,0.45)",
            borderRadius: fw(90),
            padding: fw(50),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="play" size={fw(120)} color="#fff" />
        </View>
      </View>

      {/* 📄 Content Section */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingHorizontal: 60,
          paddingTop: 60,
          justifyContent: "space-between",
        }}
      >
        {/* 🟣 Title */}
        <Text
          style={{
            fontSize: 54,
            fontFamily: getFont("bold"),
            color: "#000",
            lineHeight: 78,
            letterSpacing: isTelugu ? 0.4 : 1.2,
            marginBottom: 20,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* 🟡 Description */}
        <Text
          style={{
            fontSize: 42,
            fontFamily: getFont("regular"),
            color: "#333",
            lineHeight: 64,
            letterSpacing: isTelugu ? 0.4 : 0.8,
            marginBottom: 100,
          }}
          numberOfLines={5}
        >
          {description}
        </Text>

        {/* 🟢 Footer */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 80,
          }}
        >
          <Text
            style={{
              fontSize: 38,
              fontFamily: getFont("medium"),
              color: "#777",
              letterSpacing: 0.8,
            }}
          >
            {isTelugu ? "షార్ట్‌లీ లో చూడండి" : "Watch on Neurom"}
          </Text>

          <Image
            source={require("../../../../assets/images/logo.png")}
            style={{
              width: 230,
              height: 80,
              resizeMode: "contain",
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default ReelShareCard;
