let lastCallAt = 0;

export const debounceFetch = async <T>(
  fn: () => Promise<T>,
  gap = 300
): Promise<T | null> => {
  const now = Date.now();
  if (now - lastCallAt < gap) return null;
  lastCallAt = now;
  return fn();
};

