// screens/HelloWorld/HelloWorldScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Button from '../../components/Button';
import GradientScreen from '../../components/GradientScreen';
import TopBar from '../../components/TopBar';
import BottomBar from '../../components/Bottombar';
import Card from '../../components/Card';
import { fw, fh, ff } from '../../../utils/responsive';
import SwitchPill from '../../components/Switchpill/SwitchPill';
import LinearGradient from 'react-native-linear-gradient';
import CommentModal from '../../components/CommentModal';
import ShareModal from '../../components/ShareModal';
import ReportModal from '../../components/ReportModal';
import SidebarPanel from '../Sidebar/SidebarPanel';
import { useTheme } from '../../context/ThemeContext';


// ✅ Zustand
import { useArticlesStore } from '../../../utils/store';
import { useOnboarding } from '../../context/OnboardingContext';

// TopBar tabs
const tabs = [
  { key: 'sidebar', icon: require('../../../assets/icons/plus.png'), label: '' },
  { key: 'Latest', label: 'Latest', icon: require('../../../assets/icons/time.png') },
  { key: 'Miyapur', label: 'Miyapur', icon: require('../../../assets/icons/location.png') },
  { key: 'Trending', label: 'Trending', icon: require('../../../assets/icons/fire.png') },
  { key: 'Finance', label: 'Finance', icon: require('../../../assets/icons/bank.png') },
  { key: 'Science', label: 'Science', icon: require('../../../assets/icons/microscope.png') },
  { key: 'Sports', label: 'Sports', icon: require('../../../assets/icons/cup.png') },
];

const BAR_H = fh(64);

export default function HelloWorldScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { Colors } = useTheme(); // ✅ theme colors
  const { data, getFont} = useOnboarding();

  const { articles, fetchArticles } = useArticlesStore();

  const articleId = (route.params as any)?.articleId;

  const [activeTab, setActiveTab] = useState('Latest');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(38);
  const [duration] = useState(90);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // ✅ Fetch if store empty
  useEffect(() => {
    
      fetchArticles();
    
  }, []);

  // ✅ Selected + Remaining
 const selectedArticle = useMemo(() => {
  if (!articleId) return articles[0];
  return articles.find((a: any) => a.article_id === articleId) || articles[0];
}, [articleId, articles]);


  const remainingArticles = useMemo(() => {
    return articles.filter((a: any) => a.article_id !== selectedArticle?.article_id);
  }, [articles, selectedArticle]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePlayPause = () => setIsPlaying(p => !p);

  // Bottom bar active key by route name
  const routeToKey: Record<string, string> = {
    HomeScreen: 'home',
    ArticleScreen: 'search',
    HelloWorldScreen: 'profile',
    BuzzScreen: 'buzz',
  };
  const activeBottomKey = routeToKey[(route as any).name] ?? 'home';

  if (!selectedArticle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>No article found</Text>
      </View>
    );
  }

  const isTelugu = data.language_id === 1;
  const title = isTelugu ? selectedArticle.title_te : selectedArticle.title_en;
  const description = isTelugu ? selectedArticle.content_te : selectedArticle.content_en;
  const imageSrc = selectedArticle.media?.url;
  const categoryName = isTelugu
    ? selectedArticle.Category?.name_te || selectedArticle.Category?.name_en
    : selectedArticle.Category?.name_en;

  // Coming up card renderer
  const renderComingUpCard = ({ item }: any) => {
    const cardTitle = isTelugu ? item.title_te : item.title_en;
    const cardImage = item.media?.url;
    const timeAgo = item.created_at ? formatTimeAgo(item.created_at) : 'Just now';
    
    return (
      <TouchableOpacity
        onPress={() => navigation.setParams({ articleId: item.article_id })}
      >
        <View style={{ marginHorizontal: -fw(10) }}>
          <Card style={[styles.comingCard, { backgroundColor: Colors.deepPurple }]} borderRadius={fw(12)}>
            <View style={styles.comingRow}>
              <Image 
                source={cardImage ? { uri: cardImage } : require('../../../assets/images/factory.png')} 
                style={styles.comingThumb} 
              />
              <View style={styles.comingTextBox}>
                <Text style={[styles.comingTitle, { color: Colors.textcolor, fontFamily:getFont('regular') }]} numberOfLines={2}>{cardTitle}</Text>
              </View>
              <TouchableOpacity style={styles.audioListItemMenu}>
                <Text style={[styles.comingMeta, { color: Colors.mediumGray, fontFamily: getFont('regular') }]}>{timeAgo}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <GradientScreen style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* TOP safe area */}
      <SafeAreaView edges={['top']} style={styles.screen}>
        {/* TopBar */}
        <View style={{ paddingTop: insets.top * 0.4  }}>
          <TopBar
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={(key) => {
              setActiveTab(key);
              if (key === 'sidebar') setSidebarVisible(true);
            }}
            contentContainerStyle={{ paddingHorizontal: fw(6) }}
            tabStyle={{ marginHorizontal: fw(3), paddingHorizontal: fw(10) }}
          />
        </View>

        {/* Main scrollable area */}
        <FlatList
          ListHeaderComponent={
            <View>
              {/* Hero image + overlay + code + tridots + title + SwitchPill */}
              <View style={styles.audioImageContainer}>
                <Image 
                  source={imageSrc ? { uri: imageSrc } : require('../../../assets/images/factory.png')} 
                  style={styles.audioFixedHeaderImage} 
                  resizeMode="cover" 
                />
                
                <View style={[styles.audioImageOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />

                {/* Top row: Article code + tridots */}
                <View style={styles.topOverlayRow}>
                  <Text style={[styles.articleCode, { color: 'rgba(0,0,0,0.55)', fontFamily: getFont('regular') }]}>Neurom/article/{selectedArticle.article_id}</Text>
                  <TouchableOpacity onPress={() => setReportVisible(true)}>
                    <Image 
                      source={require('../../../assets/icons/tridots.png')} 
                      style={[styles.tridotsIcon, { tintColor: Colors.textcolor }]} 
                    />
                  </TouchableOpacity>
                </View>

                <LinearGradient
                  colors={['rgba(0,0,0,0)', '#000000']}
                  locations={[0.29, 0.95]}
                  style={styles.gradientOverlay}
                />

                {/* Title overlay (bottom of image) */}
                <View style={styles.titleOverlay}>
                  <Text style={[styles.articleTitle, { color: "#fff" }]} numberOfLines={2}>
                    {title}
                  </Text>
                </View>

                <View style={styles.dividerRow}>
                  <Button
                    title={categoryName}
                    style={styles.chipButton}
                    backgroundColor={Colors.lavenderPurple}
                  />
                </View>

                {/* Switch pill */}
                <View style={styles.switchButtonContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ArticleScreen')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: fw(10) }}
                  >
                    <Image
                      source={require('../../../assets/icons/switchtext.png')}
                      style={{ width: fw(133), height: fw(27) }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Player controls */}
              <View style={styles.controlsWrap}>
                <View style={styles.progressContainer}>
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: Colors.textcolor }]}>{formatTime(currentTime)}</Text>

                    <Slider
                      style={styles.progressBar}
                      minimumValue={0}
                      maximumValue={duration}
                      value={currentTime}
                      minimumTrackTintColor={Colors.lavenderPurple}
                      maximumTrackTintColor="#ccc"
                      thumbTintColor={Colors.lavenderPurple}
                      onValueChange={setCurrentTime}
                    />

                    <Text style={[styles.timeText, { color: Colors.textcolor }]}>{formatTime(duration)}</Text>
                  </View>
                </View>

                <View style={styles.mainControls}>
                 
                  <TouchableOpacity style={styles.controlButton}>
                    <Image 
                      source={require('../../../assets/images/Backward.png')} 
                      style={[styles.controlsIcon, { tintColor: Colors.textcolor }]} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.playButton, { backgroundColor: Colors.lavenderPurple }]} 
                    onPress={togglePlayPause}
                  >
                    <Image
                      source={
                        isPlaying
                          ? require('../../../assets/icons/pause.png')
                          : require('../../../assets/icons/play.png')
                      }
                      style={[
                        styles.playIcon,
                        isPlaying ? styles.pauseSize : styles.playSize,
                        { tintColor: Colors.textcolor }
                      ]}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlButton}>
                    <Image 
                      source={require('../../../assets/icons/forward.png')} 
                      style={[styles.controlIcon, { tintColor: Colors.textcolor }]} 
                    />
                  </TouchableOpacity>
                 
                </View>
              </View>

              {/* Social row */}
              <View style={styles.audioInteractionWrapper}>
                <View style={styles.audioActionRow}>
                  <TouchableOpacity style={styles.audioActionButton}>
                    <Image 
                      source={require('../../../assets/icons/like.png')} 
                      style={[styles.audioIconInteraction, { tintColor: Colors.textcolor }]} 
                    />
                    <Text style={[styles.count, { color: Colors.textcolor }]}>02</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.audioActionButton}>
                    <Image 
                      source={require('../../../assets/icons/dislike.png')} 
                      style={[styles.audioIconInteraction, { tintColor: Colors.textcolor }]} 
                    />
                    <Text style={[styles.count, { color: Colors.textcolor }]}>02</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.audioActionButton} onPress={() => setCommentVisible(true)}>
                    <Image 
                      source={require('../../../assets/icons/comments.png')} 
                      style={[styles.audioIconInteraction, { tintColor: Colors.textcolor }]} 
                    />
                    <Text style={[styles.count, { color: Colors.textcolor }]}>02</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.audioActionButton}  onPress={() => setShareVisible(true)}>
                    <Image 
                      source={require('../../../assets/icons/Share.png')} 
                      style={[styles.audioIconInteraction, { tintColor: Colors.textcolor }]} 
                    />
                    <Text style={[styles.count, { color: Colors.textcolor }]}>02</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section header */}
              <View style={styles.comingUpNextHeader}>
                <Text style={[styles.comingUpNextText, { color: Colors.textcolor }]}>Coming up next</Text>
                <TouchableOpacity>
                  <Text style={{ 
                    color: Colors.lavenderPurple, 
                    fontSize: ff(12), 
                    textDecorationLine: 'underline' 
                  }}>
                    View Queue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          data={remainingArticles}
          keyExtractor={(item) => String(item.article_id)}
          renderItem={renderComingUpCard}
          contentContainerStyle={{
            paddingHorizontal: fw(8),
            paddingBottom: insets.bottom + BAR_H + fh(8),
          }}
          showsVerticalScrollIndicator={false}
        />

        <SidebarPanel visible={isSidebarVisible} onClose={() => setSidebarVisible(false)} categories={['National','International','Politics','Buisiness Startups', 'Entertainments','Finance & Money', 'Sports','Technology','Health','Education']} onCategoryPress={() => {}} />
        <ShareModal visible={shareVisible} onClose={() => setShareVisible(false)} />
        <CommentModal visible={commentVisible} onClose={() => setCommentVisible(false)} />
        <ReportModal visible={reportVisible} onClose={() => setReportVisible(false)} />
      </SafeAreaView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // fixed bottom bar
  bottomBarWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: -4,
    backgroundColor: 'transparent',
    height: BAR_H,
    justifyContent: 'center',
  },

  // Hero
  audioImageContainer: {
    width: '100%', height: fh(300),
    marginTop: fh(15), marginBottom: fh(10), paddingHorizontal: fw(10),
    position: 'relative',
  },
  audioFixedHeaderImage: { width: '100%', height: '100%', borderRadius: fw(10), paddingHorizontal: fw(5) },
  audioImageOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: fw(10) , marginRight: fw(8), marginLeft: fw(8)},

  topOverlayRow: {
    position: 'absolute',
    top: fh(10),
    left: fw(10),
    right: fw(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  articleCode: {
    fontSize: ff(8),
    fontWeight: '500',
    marginLeft: fw(8)
  },
  tridotsIcon: { width: fw(18), height: fw(18), marginRight: fw(8)},

  titleOverlay: { position: 'absolute', bottom: fh(20), left: fw(12), right: fw(12) },
  articleTitle: {
    fontSize: ff(18),
    fontWeight: '700',
    lineHeight: ff(22),
    fontFamily: 'AnekTelugu-Bold',
    marginTop: fh(4),
    marginLeft: fw(8),
    marginBottom: fh(20)
  },

  switchButtonContainer: { position: 'absolute', top: fh(275), right: fw(10), zIndex: 10 },

  // Player
  controlsWrap: {
    borderRadius: fw(12),
    paddingVertical: fh(25),
    paddingHorizontal: fw(10),
  },
  progressContainer: { paddingHorizontal: fw(-10), marginBottom: fh(6), marginTop: fh(1) },
  progressBar: { width: fw(250), height: fh(1) },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: fh(8),
    paddingHorizontal: fw(10),
    marginTop: fh(10),
  },
  controlButton: { padding: fw(14) },
  controlIcon: { width: fw(14), height: fw(14) },
  controlsIcon: { width: fw(20), height: fw(20) },
  playButton: { borderRadius: fw(30), width: fw(50), height: fw(50), justifyContent: 'center', alignItems: 'center' },

  // Social
  audioInteractionWrapper: { alignItems: 'center', marginTop: fh(-20), paddingHorizontal: fw(10)},
  audioActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '95%' },
  audioActionButton: { flexDirection: 'row', alignItems: 'center' },
  audioIconInteraction: { width: fw(24), height: fw(24), marginRight: fw(5) },
  count: { fontSize: ff(12) },

  // Section header
  comingUpNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: fh(6),
    marginTop: fh(20),
    paddingHorizontal: fw(14),
  },
  comingUpNextText: { fontSize: ff(14), fontFamily: 'AnekTelugu-Medium', fontWeight: '500' },

  // Coming up list items
  comingCard: { marginBottom: fh(6), paddingHorizontal: fw(10), paddingVertical: fh(1),width: fw(357), height: fh(80)},
  comingRow: { flexDirection: 'row', alignItems: 'center' },
  comingThumb: { width: fw(80), height: fw(72), borderRadius: fw(8), marginRight: fw(15), marginBottom: fh(35) , marginLeft: fw(-9), marginTop: fh(-8)},
  comingTextBox: { flex: 1 },
  comingTitle: { fontSize: ff(14), fontWeight: '600', marginBottom: fh(4), marginTop: fh(-30) },
  comingMeta: { fontSize: ff(12) },
  comingMenuBtn: { padding: fw(6), marginLeft: fw(6) },
  comingMenuIcon: { width: fw(16), height: fw(16) },
  audioListItemMenuText: {
    fontSize: ff(18),
    fontWeight: 'bold',
    paddingHorizontal: fw(2),
    top: fh(25)
  },

  chipButton: {
    paddingHorizontal: fw(8),
    paddingVertical: fh(4),
    borderRadius: fw(20),
    top: fh(-28),
    left: fw(8)
  },

  dividerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: fh(8),
  },

  gradientOverlay: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 0,
    height: '60%',
  },

  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '15%',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: ff(8),
    width: fw(40),
    textAlign: 'center',
  },

  playIcon: {},

  playSize: {
    width: fw(24),
    height: fw(24),
  },

  pauseSize: {
    width: fw(16),
    height: fw(16),
  },
});