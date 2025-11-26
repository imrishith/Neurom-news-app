export const compress = (obj: any): string => {
  try {
    return JSON.stringify(obj ?? null);
  } catch {
    return "null";
  }
};

export const decompress = <T = any>(raw: string | null | undefined): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

