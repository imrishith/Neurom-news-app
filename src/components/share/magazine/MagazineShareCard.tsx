// src/components/share/magazine/MagazineShareCard.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import { useOnboarding } from "../../../context/OnboardingContext";
import { fw, fh } from "../../../../utils/responsive";

const MagazineShareCard = ({ magazine }: any) => {
  const { getFont, getLangCode } = useOnboarding();
  const isTelugu = getLangCode() === "te";

  console.log("Rendering MagazineShareCard with magazine:", magazine);

  // 🧠 Language & Data Fallbacks
  const title = magazine?.title || "";
  const imageUrl = magazine?.mediaUrl || null;
  const category =
    isTelugu
      ? magazine?.category?.name_te || magazine?.category?.name_en
      : magazine?.category?.name_en || magazine?.category?.name_te;

  // 🧩 Maintain PDF thumbnail aspect ratio (default: 920x1700)
  const originalW = 920;
  const originalH = 1700;
  const aspectRatio = originalW / originalH;
  const calculatedHeight = 1080 / aspectRatio; // ≈1995 — ensures no distortion

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
      {/* 🖼️ Magazine Cover Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 1080,
            height: calculatedHeight,
            backgroundColor: "#000",
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={{
            width: 1080,
            height: 1400,
            backgroundColor: "#ddd",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#777",
              fontSize: 42,
              fontFamily: getFont("medium"),
            }}
          >
            {isTelugu ? "చిత్రం అందుబాటులో లేదు" : "Image not available"}
          </Text>
        </View>
      )}

      {/* 📘 Content Section */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingHorizontal: 60,
          paddingTop: 60,
        }}
      >
        {/* 🟣 Category */}
        {category ? (
          <Text
            style={{
              fontSize: 44,
              fontFamily: getFont("medium"),
              color: "#997DDF",
              marginBottom: 25,
            }}
            numberOfLines={1}
          >
            {category}
          </Text>
        ) : null}

        {/* 🟡 Title */}
        {title ? (
          <Text
            style={{
              fontSize: 58,
              fontFamily: getFont("bold"),
              color: "#000",
              lineHeight: 84,
              letterSpacing: isTelugu ? 0.5 : 1.1,
              marginBottom: 160,
            }}
            numberOfLines={3}
          >
            {title}
          </Text>
        ) : null}

        {/* 🟢 Footer */}
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
            {isTelugu
              ? "షార్ట్‌లీ యాప్‌లో చదవండి"
              : "Read full magazine on Neurom"}
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

export default MagazineShareCard;
