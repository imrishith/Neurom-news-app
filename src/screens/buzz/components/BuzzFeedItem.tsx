import React from "react";
import BuzzDailyWrapVideo from "./BuzzDailyWrapVideo";
import BuzzMagazineItem from "./BuzzMagazineItem";
import BuzzImageItem from "./BuzzImageItem";

type Props = {
  item: any;
  isActive: boolean;
  onPagerToggle: (enabled: boolean) => void;
  speedMbps: number | null;
  imageHeight: number;
};

const BuzzFeedItem: React.FC<Props> = ({ item, isActive, onPagerToggle, speedMbps, imageHeight }) => {
  if (item?.type === "wrap") {
    return (
      <BuzzDailyWrapVideo
        item={item}
        isActive={isActive}
        onPagerToggle={onPagerToggle}
        speedMbps={speedMbps}
        imageHeight={imageHeight}
      />
    );
  }
  if (item?.type === "magazine") {
    return <BuzzMagazineItem item={item} isActive={isActive} />;
  }
  return <BuzzImageItem item={item} imageHeight={imageHeight} />;
};

export default React.memo(BuzzFeedItem);

