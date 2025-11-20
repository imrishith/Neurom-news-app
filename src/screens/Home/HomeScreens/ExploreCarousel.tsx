import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity , Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Circle from '../../../components/Circle';
import { fw, fh, ff } from '../../../../utils/responsive';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext'; // ✅ translations + fonts

// Use keys instead of raw English titles
const smallCarouselicondata = [
  { id: '1', image: require('../../../../assets/icons/Explained.png'), key: 'explained' },
  { id: '2', image: require('../../../../assets/icons/quicks.png'), key: 'quick' },
  { id: '3', image: require('../../../../assets/icons/polls.png'), key: 'polls' },
  { id: '4', image: require('../../../../assets/icons/daily.png'), key: 'daily_wraps' },
  { id: '5', image: require('../../../../assets/icons/wave.png'), key: 'audio' },
  { id: '6', image: require('../../../../assets/icons/play.png'), key: 'video' },
];

const ExploreCarousel = () => {
  const [activeExploreSlide, setActiveExploreSlide] = useState(0);
  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding(); // ✅ helpers

  const handleNavigation = (item: any) => {
    switch (item.key) {
      case 'explained':
        navigation.navigate('ExploreMosaicScreen', { category: item });
        break;
      case 'polls':
        navigation.navigate('pollScreen', { category: item });
        break;
      case 'quick':
        navigation.navigate('BuzzScreen', { category: item });
        break;
      case 'daily_wraps':
      navigation.navigate('DailyWrapsScreen', { category: item });
      break;

      case 'audio':
      navigation.navigate('ArticleScreen', { mode: 'audio' });
      break;

      case 'video':
      navigation.navigate('HelloWorldScreen', { category: item });
      break;

      
      default:
      navigation.navigate('ExploreDetailsScreen', { category: item });
      break;
      
    }
  };

  const renderSmallCarouselIcon = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.exploreCard, { backgroundColor: Colors.deepPurple }]}
      onPress={() => handleNavigation(item)}
    >
      <Image source={item.image} style={[styles.exploreIcon, { tintColor: Colors.textcolor }]} resizeMode="contain" />
      <Text style={[styles.exploreText, { color: Colors.textcolor, fontFamily: getFont("bold") }]}>
        {t(item.key)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      {/* Section heading */}
      <View style={styles.sectionHeadingRow}>
        
        <Text
          style={[
            styles.sectionHeading,
            { color: Colors.textcolor, fontFamily: getFont("bold"), fontWeight: '700', fontSize: ff(16) },
          ]}
        >
          {t("explore")}
        </Text>
      </View>

      <FlatList
        horizontal
        data={smallCarouselicondata}
        renderItem={renderSmallCarouselIcon}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCarouselContent}
        snapToInterval={fw(122)}
        decelerationRate="fast"
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / fw(122));
          setActiveExploreSlide(index);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: fw(20),
    gap: 10,
  },
  sectionIconImage: {
    width: fw(18),
    height: fw(18),
    resizeMode: 'contain',
  },
  sectionHeading: {
    fontSize: ff(14),
    fontWeight: '600',
    top: fh(-2),
    left: fh(8)
  },
  horizontalCarouselContent: {
    paddingHorizontal: fw(20),
  },
  exploreCard: {
    width: fw(110),
    height: fh(87),
    borderRadius: fw(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: fw(12),
    marginTop: fh(10),
  },
  exploreIcon: {
    width: fw(24),
    height: fw(24),
    resizeMode: 'contain',
  },
  exploreText: {
    fontSize: ff(12),
    fontWeight: '600',
    marginTop: fh(12),
    textAlign: 'center',
    lineHeight:  Platform.OS === "ios" ? ff(30) : ff(22),
  },
});

export default ExploreCarousel;
