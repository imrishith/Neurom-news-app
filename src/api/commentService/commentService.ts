// services/commentService.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig";

const API_BASE = `${API_CONFIG.baseUrl}/public/content`;

export const commentService = {
  /**
   * 🔹 Get comments for a given content type
   */
  getComments: async (
    contentType: "articles" | "videos" | "magazines" | "buzz",
    contentId: number | string
  ) => {
    const url = `${API_BASE}/${contentType}/${contentId}/comments`;

    const res = await axios.get(url);
    return res.data?.data?.items || [];
  },

  /**
   * 🔹 Add a new comment
   */
  addComment: async (
    contentType: "articles" | "videos" | "magazines" | "buzz",
    contentId: number | string,
    text: string
  ) => {
    const url = `${API_BASE}/${contentType}/${contentId}/comments`;
    

    // 🔑 Get token from AsyncStorage
    const token = await AsyncStorage.getItem("accessToken");

    // Backend expects both `*_id` and `comment_text`
    const payload =
       contentType === "articles"
    ? { article_id: contentId, comment_text: text }
    : contentType === "videos"
    ? { video_id: contentId, comment_text: text }
    : contentType === "magazines"
    ? { magazine_id: contentId, comment_text: text }
    : { buzz_id: contentId, comment_text: text }; // ✅ new case for buzz

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },

    });
 
    return res.data;
  },
};
