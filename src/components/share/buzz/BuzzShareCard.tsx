// src/components/share/buzz/BuzzShareCard.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import { useOnboarding } from "../../../context/OnboardingContext";
import { fw, fh } from "../../../../utils/responsive";

const BuzzShareCard = ({ buzz }: any) => {
  const { getFont, getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";
  console.log("Rendering BuzzShareCard with buzz:", buzz);
  // 🖼️ Choose media based on language
  const mediaUrl = buzz?.mediaUrl

  const category = isTelugu
    ? buzz?.category?.name_te || buzz?.Category?.name_en
    : buzz?.category?.name_en || buzz?.Category?.name_te;

  const aspectRatio = 920 / 1700;
  const calculatedHeight = 1080 / aspectRatio; // ≈1995

  return (
    <View
      style={{
        width: 1080,
        height: 1800,
        backgroundColor: "#fff",
        borderRadius: 30,
        overflow: "hidden",
      }}
    >
      {/* 🖼️ Main Image */}
      {mediaUrl ? (
        <Image
          source={{ uri: mediaUrl }}
          style={{
            width: 1080,
            height: calculatedHeight
          }}
          resizeMode="contain"
        />
      ) : null}

      {/* 📄 Footer Section */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 60,
          paddingTop: 40,
          backgroundColor: "#fff",
        }}
      >
        {/* Category */}
        {/* {category ? (
          <Text
            style={{
              fontSize: 44,
              fontFamily: getFont("bold"),
              color: "#222",
              marginBottom: 25,
            }}
            numberOfLines={1}
          >
            {category}
          </Text>
        ) : null} */}

        {/* Footer row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
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
            {isTelugu ? "షార్ట్‌లీ లో చూడండి" : "See on Neurom"}
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

export default BuzzShareCard;
