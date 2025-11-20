// src/components/ShareCard.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import { useOnboarding } from "../context/OnboardingContext"; // ✅ same context used in ArticleTextMode
import { fw, fh } from "../../utils/responsive";

const ShareCard = ({ article }: any) => {
  const { getFont, getLangCode } = useOnboarding(); // ✅ get both font and language
  const isTelugu = getLangCode() === "te"; // ✅ check current language

  // ✅ Choose language-specific text
  const title = isTelugu
    ? (article?.title_te || article?.title_en || "").slice(0, 80)
    : (article?.title_en || article?.title_te || "").slice(0, 80);

  const description = isTelugu
    ? (article?.content_te || article?.content_en || "").slice(0, 360)
    : (article?.content_en || article?.content_te || "").slice(0, 360);

  const imageUrl =
    article?.media?.type === "video"
      ? article?.media?.thumbnail
      : article?.media?.url;

  return (
    <View
      style={{
        width: 1080,
        height: 1800, // match ViewShot
        backgroundColor: "#fff",
        borderRadius: 30,
        overflow: "hidden",
      }}
    >
      {/* 🖼️ Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 1080,
            height: 800,
          }}
          resizeMode="cover"
        />
      ) : null}

      {/* 📰 Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 60,
          paddingTop: 60,
        }}
      >
        {/* 🟣 Title */}
        <Text
          style={{
            fontSize: 54,
            fontFamily: getFont("bold"), // ✅ consistent with app UI
            color: "#000",
            lineHeight: 88,
            letterSpacing: isTelugu ? 0.5 : 1.2, // ✅ Telugu text needs tighter letter spacing
            marginBottom: 35,
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
            lineHeight: 68,
            letterSpacing: isTelugu ? 0.4 : 0.8, // ✅ adjust for Telugu readability
            marginBottom: 140,
          }}
          numberOfLines={8}
        >
          {description}
        </Text>

        {/* 🟢 Footer */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingBottom: 90,
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
            {isTelugu ? "షార్ట్‌లీ లో చదవండి" : "Read on Neurom"}
          </Text>

          <Image
            source={require("../../assets/images/logo.png")}
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

export default ShareCard;
