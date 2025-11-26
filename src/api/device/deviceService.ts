// src/api/deviceApi.ts
import axios from "axios";
import { API_CONFIG } from "../config/apiConfig";  // ✅ import from your config file
import { getStableDeviceId } from "../../../utils/deviceId";


export interface UpdateDevicePayload {
  device_id: string;
  language_id?: number;
  voice?: string;

  // ✅ Add your new location-related fields
  state_id?: number;
  district_id?: number;
  mandal_id?: number;
  village_id?: number;
  constituency_id?: number;
}


const api = axios.create({
  baseURL: `${API_CONFIG.baseUrl}/public`, // 👈 append /public here
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ✅ Add interceptor immediately after creating api
api.interceptors.request.use(config => {
  return config;
});

export const registerDevice = async (payload: any) => {
    const stableId = await getStableDeviceId();
    const { data } = await api.post("/users/devices/register", {
    ...payload,
    device_id: stableId, // 🔒 always stable
  });
  return data;
};

export const updateDevice = async (payload: UpdateDevicePayload) => {
  const stableId = await getStableDeviceId();
  const { data } = await api.patch("/users/devices/update", {
    ...payload,
    device_id: stableId, // 🔒 always stable
  });
  return data.data.device;   // ✅ only return the device object
};

export const getDevice = async (deviceId: string) => {
  try {
    const stableId = await getStableDeviceId();
    const { data } = await api.get("/users/device", {
      params: { device_id: stableId },
    });
    return data;
  } catch (error) {
    if (error.message?.includes("Network Error")) {
      console.warn("⚠️ Device not found or network issue, ignoring in dev");
      return null; // gracefully ignore
    }
    throw error; // rethrow other unexpected errors
  }
};

