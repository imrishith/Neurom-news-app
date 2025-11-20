// src/utils/deviceId.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";

// const DEVICE_ID_KEY = "device_id";

// 🔒 Your fixed device id
// const MY_DEVICE_ID = "fc591acce19a47c2";

export async function getStableDeviceId(): Promise<string> {
  try {
    // 📱 Detect OS-provided id
    const detectedId = DeviceInfo.getUniqueIdSync();

    // 🧑 If it’s your phone → always use your fixed id
    // if (detectedId !== MY_DEVICE_ID) {
    //   console.log("📱 Overriding detected id:", detectedId, "➡ using fixed:", MY_DEVICE_ID);
    //   return MY_DEVICE_ID;
    // }

    // 🔐 For other devices → reuse the first saved id
    // let savedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    // if (savedId) return savedId;

    // await AsyncStorage.setItem(DEVICE_ID_KEY, detectedId);
    return detectedId;
  } catch (err) {
    console.error("❌ Error getting stable device id:", err);
    return MY_DEVICE_ID; // fallback to fixed id
  }
}
