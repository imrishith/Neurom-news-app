import axios from "axios";

const BASE_URL =
  "https://api.shortlyindia.com/api/public/users";


// dY"1 Categories
export const getCategories = async () => {
  const res = await axios.get(`${BASE_URL}/categories`);
  return res.data; // { success, data: { items: [...] } }
};


//Articles

export const getStateArticles = async (
  cursor?: string,
  category_id?: number,
  is_breaking?: boolean,
  is_trending?: boolean,
  is_exclusive?: boolean
) => {
  try {
    const params: Record<string, any> = {
      limit: is_breaking || is_trending || is_exclusive ? 10 : 20,
    };


    if (cursor) params.cursor = cursor;
    if (category_id) params.category_id = category_id;
    if (is_breaking) params.is_breaking = is_breaking;
    if (is_trending) params.is_trending = is_trending;
    if (is_exclusive) params.is_exclusive = is_exclusive;

    console.log("🟦 [API → getStateArticles] Request Params:", params);

    const res = await axios.get(`${BASE_URL}/state-articles`, { params });

    // 🔥 DEBUG: Response summary
    const items = res?.data?.data?.items || [];
    const nextCursor = res?.data?.data?.nextCursor || null;

    console.log("🟩 [API → getStateArticles] Response:");
    console.log("   • Items Count:", items.length);
    console.log("   • Next Cursor:", nextCursor);

    return res.data;
  } catch (err: any) {
    console.log("🟥 [API ERROR → getStateArticles]:", err?.message || err);
    return { success: false, data: { items: [], nextCursor: null } };
  }
};


// Get single article by ID (full content)
export const getArticleById = async (articleId: number) => {
  try {
    console.log(`🔵 [API → getArticleById] Fetching article ${articleId}`);
    const res = await axios.get(`${BASE_URL}/article/${articleId}`);

    if (res?.data?.success) {
      console.log(`✅ [API → getArticleById] Article ${articleId} loaded`);
      return res.data;
    }

    return { success: false, data: null };
  } catch (err: any) {
    console.log(`🟥 [API ERROR → getArticleById ${articleId}]:`, err?.message || err);
    return { success: false, data: null };
  }
};



export const getLocalizedArticles = async (
  location: { district_id?: number; mandal_id?: number; village_id?: number; category_id?: number },
) => {
  try {
    const params: Record<string, any> = {};

    if (location.district_id) params.district_id = location.district_id;
    if (location.mandal_id) params.mandal_id = location.mandal_id;
    if (location.village_id) params.village_id = location.village_id;
    if (location.category_id) params.category_id = location.category_id;

    const res = await axios.get(`${BASE_URL}/articles`, { params });


    return res.data;
  } catch (err: any) {

    return { success: false, data: { items: [] } };
  }
};


// dY"1 Reels
// Supports cursor-based pagination and optional category filter.
export const getShortVideos = async (
  limit: number = 20,
  cursor?: string | null,
  category_id?: number | null,
  is_exclusive?: boolean
) => {
  try {
    const params: Record<string, any> = {
      limit: limit ?? 20,
    };

    if (cursor) params.cursor = cursor;
    if (category_id) params.category_id = category_id;
    if (is_exclusive) params.is_exclusive = is_exclusive;

    console.log("🎬 reels params check:", params);

    const res = await axios.get(`${BASE_URL}/short-video`, { params });

    return res.data; // this executes last
  } catch (err: any) {
    console.error("❌ getShortVideos error:", err.response?.data || err.message);
    return { success: false, data: { items: [], nextCursor: null } };
  }
};


// dY"1 Magazines
export const getMagazines = async (
  limit: number = 50,
  cursor?: string | null,
  category_id?: number | null
) => {
  try {
    const params: Record<string, any> = {
      limit,
    };
    if (cursor) params.cursor = cursor;
    if (category_id) params.category_id = category_id;

    const res = await axios.get(`${BASE_URL}/magazines`, { params });
    return res.data; // { success, data: { items: [...], nextCursor } }
  } catch (err: any) {
    console.error("❌ getMagazines error:", err);
    return { success: false, data: { items: [], nextCursor: null } };
  }
};



// dY"1 Buzz Contents
export const getBuzzContents = async (
  limit: number = 50,
  cursor?: string | null,
  category_id?: number | null,
  is_exclusive?: boolean
) => {
  try {
    const params: Record<string, any> = {
      limit,
    };

    if (cursor) params.cursor = cursor;
    if (category_id) params.category_id = category_id;
    if (is_exclusive) params.is_exclusive = is_exclusive;
    const res = await axios.get(`${BASE_URL}/buzz-contents`, { params });
    return res.data; // { success, data: { items: [...], nextCursor } }
  } catch (err: any) {
    return { success: false, data: { items: [], nextCursor: null } };
  }
};

// Daily Wraps
export const getDailyWraps = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/daily-wraps`);
    return res.data; // { success, data: { items: [...] } }
  } catch (err: any) {
    console.error("❌ getDailyWraps error:", err);
    return { success: false, data: { items: [] } };
  }
};
