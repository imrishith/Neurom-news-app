import axios from "axios";

/**
 * 🔤 Transliterates English text into the target Indic script (Telugu, Hindi, etc.)
 * using Google Input Tools API.
 *
 * @param text - The input English text.
 * @param langCode - Target language code (default: "te").
 * @returns Transliterated text if successful, otherwise returns the original text.
 */
export const transliterateText = async (
  text: string,
  langCode: string = "te"
): Promise<string> => {
  try {
    if (!text || langCode !== "te") return text; // only transliterate Telugu

    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      text
    )}&itc=${langCode}-t-i0-und&num=1`;

    const { data } = await axios.get(url);

    if (data[0] === "SUCCESS" && data[1]?.[0]?.[1]?.[0]) {
      return data[1][0][1][0];
    }
  } catch (err) {
    console.warn("⚠️ Transliteration failed:", err.message);
  }
  return text;
};
