import FastImage from "react-native-fast-image";

export const prefetchImages = async (urls: string[]) => {
  try {
    const unique = [...new Set(urls.filter(Boolean))];

    const tasks = unique.slice(0, 10).map((url) =>
      FastImage.preload([{ uri: url }])
    );

    await Promise.all(tasks);
  } catch (_) {}
};

export const prefetchVideos = async (urls: string[]) => {
  try {
    const unique = [...new Set(urls.filter(Boolean))].slice(0, 4);

    await Promise.all(
      unique.map(
        (url) =>
          new Promise<void>((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
              if (!settled) {
                settled = true;
                resolve();
              }
            }, 1500);

            fetch(url, { method: "HEAD" })
              .catch(() => undefined)
              .finally(() => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timeout);
                  resolve();
                }
              });
          })
      )
    );
  } catch (_) {}
};
