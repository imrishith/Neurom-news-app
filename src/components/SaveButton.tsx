// components/SaveButton.tsx
import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { fw, fh } from "../../utils/responsive";
import { interactionService } from "../api/content/interactionService";
import Ionicons from "react-native-vector-icons/Ionicons";

type SaveButtonProps = {
  articleId: number;
  deviceId: string;
  backgroundColor: string;
};

const SaveButton = React.memo(({ articleId, deviceId, backgroundColor }: SaveButtonProps) => {
  const [isSaved, setIsSaved] = useState(false);

  // ✅ Fetch initial save state
  useEffect(() => {
    if (!articleId || !deviceId) return;
    (async () => {
      try {
        const res = await interactionService.getUserInteraction(
          "articles",
          articleId,
          deviceId
        );
        setIsSaved(res?.save ?? false);
      } catch (err) {
        console.error("❌ Fetch save state failed:", err);
      }
    })();
  }, [articleId, deviceId]);

  // ✅ Toggle save interaction
  const toggleSave = async () => {
    try {
      await interactionService.addInteraction("articles", articleId, deviceId, "save");
      setIsSaved((prev) => !prev);
    } catch (err) {
      console.error("❌ Save toggle failed:", err);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.iconButtonWrapper, { backgroundColor }]}
      onPress={toggleSave}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isSaved ? "bookmark" : "bookmark-outline"} // filled vs outline
        size={14}
        color={"#fff"}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  iconButtonWrapper: {
    width: fw(30),
    height: fh(28),
    borderRadius: fw(20),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SaveButton;
