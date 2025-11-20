// src/api/reporterApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig";

const BASE_URL = `${API_CONFIG.baseUrl}/reporter`;

// 🔹 Helper: fetch wrapper
  async function apiRequest(endpoint: string, method: string = "GET", body?: any, isMultipart = false) {
  const token = await AsyncStorage.getItem("authToken");
  const headers: any = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (!isMultipart) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "API request failed");
  }
  return json;
}

// 🔹 Auth
export const reporterAuth = {
  requestOtp: (phone: string) => apiRequest("/auth/request-otp", "POST", { phone }),
  verifyOtp: (phone: string, code: string) => apiRequest("/auth/verify-otp", "POST", { phone, code }),
};

// 🔹 Profile
export const reporterProfile = {
  // Get reporter profile
  get: () => apiRequest("/profile", "GET"),

  // Upload reporter profile photo
  uploadPhoto: async (fileUri: string, fileName: string, mimeType: string) => {
    const token = await AsyncStorage.getItem("authToken");
    const formData = new FormData();

    formData.append("photo", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    // use native fetch for multipart PUT
    const res = await fetch(`${BASE_URL}/profile/photo`, {
      method: "PUT",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Photo upload failed");
    }
    return json;
  },
};
// 🔹 Earnings
export const reporterEarnings = {
  getStats: () => apiRequest("/earnings/stats", "GET"),
};

export const reporterAchievements = {
  getAll: () => apiRequest("/achievements", "GET"),
};



// 🔹 Articles
export const reporterArticles = {
  getAll: () => apiRequest("/articles", "GET"),
  getStats: () => apiRequest("/articles/stats", "GET"),
  create: (formData: FormData) => apiRequest("/articles", "POST", formData, true),
};

// (you can add Achievements, Payments, etc. similarly)
