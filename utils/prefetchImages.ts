import FastImage from "react-native-fast-image";

export const prefetchImages = async (urls: string[]) => {
  try {
    const unique = [...new Set(urls.filter(Boolean))];

    const tasks = unique.slice(0, 10).map(url =>
      FastImage.preload([{ uri: url }])
    );

    await Promise.all(tasks);
  } catch (_) {}
};
