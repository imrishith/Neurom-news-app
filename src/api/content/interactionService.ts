// services/interactionService.ts
import axios from "axios";
import { API_CONFIG } from "../config/apiConfig"; 

const API_BASE = `${API_CONFIG.baseUrl}/public/content`;

export const interactionService = {
  // ✅ Add interaction (like, unlike, share)
  addInteraction: async (
    contentType: "articles" | "videos" | "magazines" | "buzz",
    contentId: number | string,
    deviceId: string,
    type: "like" | "unlike" | "share" | "save"
  ) => {
    const url = `${API_BASE}/${contentType}/${contentId}/interactions`;

    const res = await axios.post(url, {
      device_id: deviceId,
      type,
    });


    return res.data?.data?.interaction; // ✅ return actual interaction
  },  

  // ✅ Get user-specific interaction
  getUserInteraction: async (
    contentType: "articles" | "videos" | "magazines" | "buzz",
    contentId: number | string,
    deviceId: string
  ) => {
    const url = `${API_BASE}/${contentType}/${contentId}/interactions/me?device_id=${deviceId}`;
    
    const res = await axios.get(url);
    return res.data?.data; // { like: true, unlike: false, save: true }
  },
};
