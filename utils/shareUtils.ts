import { Linking, Alert, Platform } from "react-native";

/**
 * Shares a Neurom article directly to WhatsApp or WhatsApp Business.
 * If WhatsApp is not installed, gracefully falls back to universal web share.
 */
export async function shareToWhatsApp(articleTitle: string, articleId: number) {
  try {
    if (!articleId) {
      Alert.alert("Invalid Article", "This article cannot be shared right now.");
      return;
    }

    const title = articleTitle?.trim() || "Read this on Neurom";
    const webLink = `https://Neuromindia.com/article/${articleId}`;

    // App-specific package
    const pkg = "com.Neurom";
    const playStoreLink = `https://play.google.com/store/apps/details?id=${pkg}`;
    const appStoreLink = `https://apps.apple.com/app/idYOUR_APP_ID`; // TODO: replace with your iOS app ID

    // ✅ Android deep link intent (auto-opens app if installed)
    const androidIntent = `intent://article/${articleId}#Intent;scheme=Neurom;package=${pkg};S.browser_fallback_url=${encodeURIComponent(
      playStoreLink
    )};end`;

    // ✅ iOS uses the web link (Neurom://article/x handled via universal link)
    const iosUniversal = `Neurom://article/${articleId}`;

    // Message for share
    const message = `${title}\n${Platform.OS === "android" ? webLink : iosUniversal}\n\nShared via Neurom 🗞️`;
    const encoded = encodeURIComponent(message);

    // Preferred WhatsApp schemes
    const schemes = [
      `whatsapp://send?text=${encoded}`,
      `whatsapp-business://send?text=${encoded}`,
    ];

    // 1️⃣ Try WhatsApp or WhatsApp Business (if installed)
    for (const url of schemes) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    }

    // 2️⃣ Fallback to WhatsApp web universal link
    const waUniversal = `https://wa.me/?text=${encoded}`;
    await Linking.openURL(waUniversal);

  } catch (error) {
    console.error("❌ WhatsApp share failed:", error);
    Alert.alert("Share Failed", "Could not open WhatsApp to share this article.");
  }
}

/**
 * Generic cross-platform fallback sharing
 * Uses Neurom link directly when WhatsApp is not available
 */
export async function shareGeneric(articleTitle: string, articleId: number) {
  try {
    const title = articleTitle?.trim() || "Check this out!";
    const link = `https://Neuromindia.com/article/${articleId}`;
    const encoded = encodeURIComponent(`${title}\n${link}\n\nShared via Neurom 🗞️`);
    const shareUrl = `https://wa.me/?text=${encoded}`;
    await Linking.openURL(shareUrl);
  } catch {
    Alert.alert("Share failed", "Unable to open system share dialog.");
  }
}
