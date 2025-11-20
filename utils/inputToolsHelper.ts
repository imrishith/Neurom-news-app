export async function getTeluguSuggestions(text: string) {
  if (!text || text.length < 2) return [];
  const res = await fetch(
    `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=te-t-i0-und&num=5`
  );
  const json = await res.json();
  return json?.[1]?.[0]?.[1] || [];
}
