// src/api/publicApi.ts
import { API_CONFIG } from "../config/apiConfig";
import axios from "axios";

export async function publicRequest(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any,
  token?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // If url starts with http/https, use it directly. Otherwise, prepend baseUrl.
  const fullUrl = url.startsWith("http") ? url : `${API_CONFIG.baseUrl}${url}`;

  try {
    const res = await axios({
      url: fullUrl,
      method,
      data: body,
      headers,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(
      `API request failed with status ${err.response?.status || 500}`
    );
  }
}


// Live Updates
export const publicLiveUpdates = {
  list: (languageId: number, stateId: number) =>
    publicRequest(`/public/users/live-updates`),
  getEntries: (liveUpdateId: number) =>
    publicRequest(`/public/users/live-updates/${liveUpdateId}/entries`),
};

// Local Events
export const publicLocalEvents = {
  list: () => publicRequest("/public/users/local-events"),
};


// polls
export const publicPolls = {
  list: (languageId: number, stateId: number) =>
    publicRequest(`/public/users/polls`),

  getStats: (pollId: string | number) =>
    publicRequest(`/public/content/polls/${pollId}/stats`, "GET"),

  getResponses: (pollId: string | number, token: string) =>
    publicRequest(`/public/content/polls/${pollId}/responses/me`, "GET", undefined, token),

  submitResponse: (
    pollId: string | number,
    selectedOption: string | number,
    token: string
  ) =>
    publicRequest(
      `/public/content/polls/${pollId}/responses`,
      "POST",
      { selected_option: selectedOption },
      token
    ),
};

// Daily Wraps moved to users contentApi (globalized)

// Locations
export const publicLocations = {
  searchVillages: (searchTerm: string) =>
    publicRequest(
      `/public/locations/villages/search?searchTerm=${encodeURIComponent(searchTerm)}`
    ),

  // New: auto-detect endpoint
  getVillageByCoordinates: (lat: number, lng: number) =>
    publicRequest(
      `/public/locations/villages/by-coordinates?lat=${lat}&lng=${lng}`
    ),
};

// Languages
export const publicLanguages = {
  list: () => publicRequest("/public/users/languages"),
};

// Users
export const publicUsers = {
  // Saved Articles for the authenticated user
  getSavedArticles: (token: string) =>
    publicRequest("/public/users/saved-articles", "GET", undefined, token),

  // Saved Articles by device (POST body)
  getSavedArticlesByDevice: (
    device_id: string,
    limit: number = 10,
    offset: number = 0
  ) =>
    publicRequest(
      "/public/users/saved-articles",
      "POST",
      { device_id, limit, offset }
    ),
};

