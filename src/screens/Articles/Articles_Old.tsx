// screens/Article/ArticleScreen.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  NativeEventEmitter, NativeModules,
  AppState
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Slider from "@react-native-community/slider";
import ToggleSwitch from "../../components/Togglewrapper";
import { useContentTabs } from "../../hooks/useContentTabs";
import TopBar from "../../components/TopBar";
import ShareModal from "../../components/ShareModal";
import CommentModal from "../../components/CommentModal";
import ReportModal from "../../components/ReportModal";
import SidebarPanel from "../Sidebar/SidebarPanel";
import Button from "../../components/Button";
import SaveButton from "../../components/SaveButton";
import InteractionsRow from "../../components/InteractionRow";
import { fw, fh, ff } from "../../../utils/responsive";
import { useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { useArticlesStore } from "../../../utils/store";
import Video from "react-native-video";
import DeckSwiper from "../../components/DeckSwiper"; // 👈 new component
import UpcomingArticlesCarousel from "../AudioScreen/UpcomingArticlesCarousel";
import NetInfo from "@react-native-community/netinfo";
import ImageViewing from "react-native-image-viewing";
import Tts from "react-native-tts";
import { timeAgo } from "../../../utils/timeAgo";
import { useFocusEffect } from "@react-navigation/native";




const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const BUTTON_HEIGHT = fh(28);

const ArticleScreen = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { t, getFont, getLangCode } = useOnboarding();

  const [isTextMode, setIsTextMode] = useState(() => mode !== "audio");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const VOICE_MAP: Record<string, { lang: string; id: string }> = {
    Telugu_Female: { lang: "te-IN", id: "te-in-x-tee-network" },
    Telugu_Male: { lang: "te-IN", id: "te-in-x-teg-local" },
    English_Female: { lang: "en-IN", id: "en-in-x-enc-network" },
    English_Male: { lang: "en-IN", id: "en-in-x-ene-network" },
  };


  const { tabs, categories, activeTab, setActiveTab } = useContentTabs();
  const { Colors, barStyle } = useTheme();
  const { data } = useOnboarding();
  const route = useRoute<any>();
  const { articleId, mode } = route.params || {};

  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [videoUrls, setVideoUrls] = useState<{ [key: number]: string }>({});


  const { articles, fetchArticles, loadMoreArticles, resetPagination, hasMore, isFetching } = useArticlesStore();




  const localizedTabs = useMemo(() => {
    const baseTabs = tabs.map((tab) => {
      if (tab.key === "state") {
        return { ...tab, label: String(data.village_name) };
      }
      return tab;
    });

    const sidebarTab = baseTabs.find((t) => t.key === "sidebar");
    const latestTab = baseTabs.find((t) => t.key === "latest");
    const stateTab = baseTabs.find((t) => t.key === "state");

    // ✅ Only show selected categories
    const selectedTabs = baseTabs.filter((t) =>
      selectedCategories.includes(t.key)
    );

    // ✅ Build order → [Latest, Plus, State, ...Selected]
    const orderedTabs = [
      ...(sidebarTab ? [sidebarTab] : []),
      ...(latestTab ? [latestTab] : []),
      ...(stateTab ? [stateTab] : []),
      ...selectedTabs,
    ];

    return orderedTabs;
  }, [tabs, data.village_name, selectedCategories]);






  // Fetch articles if stale
  useEffect(() => {
    fetchArticles();
  }, []);



  // Filter posts
  const { posts, startIndex } = useMemo(() => {
    let filtered = articles;
    let startIdx = 0;

    if (articleId) {
      const idx = filtered.findIndex((a: any) => a.article_id === articleId);
      startIdx = idx >= 0 ? idx : 0;
    }

    return { posts: filtered, startIndex: startIdx };
  }, [articles, activeTab, articleId]);

  // Initialize selected article + index
  useEffect(() => {
    if (posts.length > 0 && currentIndex === 0 && !selectedArticle) {

      setSelectedArticle(posts[startIndex]);
      setCurrentIndex(startIndex);
    }
  }, [posts]);

  const loading = articles.length === 0;

  useEffect(() => {
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    return () => {
      Tts.stop(); // cleanup when leaving screen
    };
  }, []);



  // Inside your component
  useEffect(() => {
    if (!selectedArticle || isTextMode) {
      Tts.stop();
      setIsSpeaking(false);
      return;
    }

    const isTelugu = getLangCode() === "te";

    const description = isTelugu
      ? selectedArticle.content_te
      : selectedArticle.content_en;

    if (!description) return;

    // Tts.voices().then(voices => console.log("checking voices", voices));


    // only auto-speak if not already speaking
    if (!isSpeaking) {
      const normalizedVoice = (data.voice || "Female").toLowerCase();
      const key = `${isTelugu ? "Telugu" : "English"}_${normalizedVoice === "male" ? "Male" : "Female"}`;



      const voiceConfig = VOICE_MAP[key] || VOICE_MAP[`${isTelugu ? "Telugu" : "English"}_Female`];

      if (voiceConfig?.id) {
        Tts.setDefaultVoice(voiceConfig.id);
      } else if (voiceConfig?.lang) {
        Tts.setDefaultLanguage(voiceConfig.lang);
      }

      Tts.speak(description);
      setIsSpeaking(true);
    }


    return () => {
      Tts.stop();
      setIsSpeaking(false);
    };
  }, [selectedArticle, isTextMode]);







  useEffect(() => {
    if (mode === "audio") {
      setIsTextMode(false);
    }
  }, [mode]);

  useEffect(() => {
    const ttsEmitter = new NativeEventEmitter(NativeModules.TextToSpeech);

    const startListener = ttsEmitter.addListener("tts-start", () => {
      setIsSpeaking(true);
    });
    const finishListener = ttsEmitter.addListener("tts-finish", () => {
      setIsSpeaking(false);
    });
    const cancelListener = ttsEmitter.addListener("tts-cancel", () => {
      setIsSpeaking(false);
    });

    return () => {
      startListener.remove();
      finishListener.remove();
      cancelListener.remove();
    };
  }, []);


  useFocusEffect(
    React.useCallback(() => {
      // Screen focused → do nothing
      return () => {
        // Screen unfocused → stop TTS
        Tts.stop();
        setIsSpeaking(false);
      };
    }, [])
  );


  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        // App going to background or closed
        Tts.stop();
        setIsSpeaking(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);


  const resolveArticleEndpoint = (tabKey: string) => {

    switch (tabKey) {
      case "latest":
        return { endpoint: "state-articles" };
      case "state":
        return { endpoint: "articles" };
      default:
        // category tabs → numeric IDs
        return { endpoint: "state-articles", category_id: Number(tabKey) };
    }
  };


  const formatArticleId = (article) => {
    if (!article?.created_at) return `Neurom/${article?.article_id || ""}`;

    const date = new Date(article.created_at);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const number = article.article_id;

    return `Neurom/${day}${month}${year}${number}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.darkpurple }]}>
      <StatusBar barStyle={barStyle} translucent backgroundColor="transparent" />

      {/* TopBar */}
      {(!articleId || posts.length > 1) && (
        <SafeAreaView
          edges={["top"]}
          style={[styles.topbarContainer, { backgroundColor: Colors.darkpurple }]}
        >
          <View style={styles.topbarInner}>
            <TopBar
              tabs={localizedTabs}
              activeTab={activeTab}
              onTabPress={async (key) => {
                if (key === "sidebar") return setSidebarVisible(true);

                setActiveTab(key);
                useArticlesStore.getState().resetPagination();
                setCurrentIndex(0);
                setSelectedArticle(null);
                const { endpoint, category_id } = resolveArticleEndpoint(key);

                try {
                  await fetchArticles(
                    true, // ✅ reset handled inside fetchArticles
                    category_id,
                    endpoint,
                    {
                      district_id: data.district_id,
                      mandal_id: data.mandal_id,
                      village_id: data.village_id,
                    },
                    undefined,
                  );
                } catch (err) {

                }
              }}


            />
          </View>
        </SafeAreaView>
      )}

      {/* ✅ Loader while fetching */}
      {isFetching && (
        <View style={{ paddingVertical: fh(15), alignItems: "center" }}>
          <ActivityIndicator size="small" color={Colors.lavenderPurple} />
        </View>
      )}

      {/* ✅ No articles fallback */}
      {!isFetching && posts.length === 0 && (
        <View style={styles.loader}>
          <Text
            style={{
              color: Colors.textcolor,
              fontFamily: getFont("medium"),
              fontSize: ff(14),
            }}
          >
            No Articles Available
          </Text>
        </View>
      )}


      {!loading && posts.length > 0 && (
        <View style={styles.deckContainer}>
          <DeckSwiper
            data={posts}
            currentIndex={currentIndex}
            swipeEnabled={isTextMode && posts.length > 1}
            extraKey={isTextMode}
            onIndexChange={(idx) => {
              setCurrentIndex(idx);
              setSelectedArticle(posts[idx]);

              if (hasMore && !isFetching) {
                const remaining = articles.length - (idx + 1);
                if (remaining <= 2) {  // 👈 prefetch when 2 left

                  loadMoreArticles();
                }
              }


              // 👇 Debug logging
              const isTelugu = getLangCode() === "te";


              const prevArticle = posts[idx - 1];
              const currentArticle = posts[idx];
              const nextArticle = posts[idx + 1];

              const prevTitle = prevArticle
                ? (isTelugu ? prevArticle.title_te : prevArticle.title_en)
                : "N/A";
              const currentTitle = currentArticle
                ? (isTelugu ? currentArticle.title_te : currentArticle.title_en)
                : "N/A";
              const nextTitle = nextArticle
                ? (isTelugu ? nextArticle.title_te : nextArticle.title_en)
                : "N/A";


            }}
            renderCard={(item, index) => {
              if (!item) return <View style={{ flex: 1 }} />;

              const isTelugu = getLangCode() === "te";

              const activeArticle = item;



              const title = isTelugu ? activeArticle.title_te : activeArticle.title_en;

              const description = isTelugu
                ? activeArticle.content_te
                : activeArticle.content_en;
              const imageSrc = activeArticle.media?.url;
              const categoryName = isTelugu
                ? activeArticle.Category?.name_te || activeArticle.Category?.name_en
                : activeArticle.Category?.name_en;

              return (
                <View key={`article-${item.article_id}-${index}`} style={styles.card}>

                  <View style={styles.topOverlay}>
                    <Text style={styles.articleId}>{formatArticleId(activeArticle)}</Text>


                    <TouchableOpacity onPress={() => setReportVisible(true)}>
                      <Image
                        source={require("../../../assets/icons/tridots.png")}
                        style={styles.tridotIcon}
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Image */}
                  <View style={styles.imageContainer}>
                    {activeArticle.media?.type === "video" ? (
                      isTextMode ? (
                        // 🟣 TEXT MODE → show thumbnail/play as usual
                        playingVideoId === activeArticle.article_id ? (
                          <Video
                            source={{ uri: videoUrls[activeArticle.article_id] }}
                            style={styles.image}
                            resizeMode="cover"
                            controls={true}
                            paused={false}
                            repeat={true}
                          />
                        ) : (
                          <TouchableOpacity
                            style={styles.videoThumbnailWrapper}
                            onPress={async () => {
                              const state = await NetInfo.fetch();
                              let selectedUrl = activeArticle.media?.variants?.["720p"];

                              if (state.isConnected && state.details?.downlink > 3) {
                                selectedUrl =
                                  activeArticle.media?.variants?.["1080p"] ||
                                  activeArticle.media?.variants?.["720p"];
                              }

                              setVideoUrls((prev) => ({
                                ...prev,
                                [activeArticle.article_id]: selectedUrl!,
                              }));
                              setPlayingVideoId(activeArticle.article_id);
                            }}
                          >
                            <Image
                              source={{ uri: activeArticle.media?.thumbnail }}
                              style={styles.image}
                            />
                            <View style={styles.playOverlay}>
                              <Image
                                source={require("../../../assets/icons/play.png")}
                                style={styles.playIconBig}
                              />
                            </View>
                          </TouchableOpacity>
                        )
                      ) : (
                        // 🟣 AUDIO MODE → only show static thumbnail
                        <Image
                          source={{ uri: activeArticle.media?.thumbnail }}
                          style={styles.image}
                        />
                      )
                    ) : activeArticle.media?.url ? (
                      <TouchableOpacity
                        onPress={() => setFullscreenImage(activeArticle.media?.url)}
                        activeOpacity={1}
                      >
                        <Image
                          source={{ uri: activeArticle.media?.url }}
                          style={{ width: "100%", aspectRatio: 16 / 9 }} // or use dynamic aspectRatio
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : (
                      <Image
                        source={require("../../../assets/images/factory.png")}
                        style={styles.image}
                      />
                    )}
                  </View>




                  {/* Bottom Section */}
                  <View style={[styles.bottomSection, { backgroundColor: Colors.darkpurple }]}>
                    <View style={{ flex: 1 }}>
                      {/* Category + Toggle + Save */}
                      <View style={styles.dividerRow}>
                        <Button
                          title={categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                          style={styles.chipButton}
                          backgroundColor={Colors.lavenderPurple}
                          textStyle={styles.chipButtonText}   // 👈 pass custom text style
                        />
                        <View style={styles.rightActions}>
                          <View style={styles.toggleWrapper}>
                            {/* Text */}
                            <TouchableOpacity
                              style={[styles.toggleButton, isTextMode && styles.toggleActive]}
                              onPress={() => {
                                Tts.stop();
                                setIsTextMode(true);
                              }}
                            >
                              <Text
                                style={[
                                  styles.toggleText,
                                  {
                                    color: isTextMode ? "#fff" : "#000",
                                    fontFamily: getFont("regular")
                                  },
                                ]}
                              >
                                {t("text")}
                              </Text>
                            </TouchableOpacity>

                            {/* Audio */}
                            <TouchableOpacity
                              style={[styles.toggleButton, !isTextMode && styles.toggleActive]}
                              onPress={() => {
                                setIsTextMode(false);

                              }}
                            >
                              <Text
                                style={[
                                  styles.toggleText,
                                  {
                                    color: !isTextMode ? "#fff" : "#000",
                                    fontFamily: getFont("regular")
                                  },
                                ]}
                              >
                                {t("audio")}
                              </Text>
                            </TouchableOpacity>

                          </View>

                          <SaveButton
                            articleId={activeArticle.article_id}
                            deviceId={data.device_id}
                            backgroundColor={Colors.lavenderPurple}
                          />
                        </View>
                      </View>

                      <Text style={[styles.title, { color: Colors.textcolor, fontFamily: getFont("bold") }]}>
                        {title}
                      </Text>

                      {/* Modes */}
                      {isTextMode ? (
                        <Text style={[styles.description, { color: Colors.textcolor, fontFamily: getFont("regular") }]}>
                          {description && description.length > 400
                            ? `${description.substring(0, 400)}...`
                            : description}
                        </Text>
                      ) : (
                        <>
                          {/* Slider + controls */}
                          <View style={styles.controlsWrap}>
                            <View style={styles.timeRow}>
                              <Text style={styles.timeText}>0:38</Text>
                              <Slider
                                style={styles.progressBar}
                                minimumValue={0}
                                maximumValue={90}
                                value={38}
                                minimumTrackTintColor={Colors.lavenderPurple}
                                maximumTrackTintColor="#ccc"
                                thumbTintColor={Colors.lavenderPurple}
                              />
                              <Text style={styles.timeText}>1:30</Text>
                            </View>

                            <View style={styles.mainControls}>
                             
                              <TouchableOpacity>
                                <Image
                                  source={require("../../../assets/images/Backward.png")}
                                  style={[styles.controlIcon, { tintColor: Colors.textcolor }]}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => {
                                  if (isSpeaking) {
                                    Tts.stop(); // pause by stopping
                                    setIsSpeaking(false);
                                  } else {
                                    if (selectedArticle) {
                                      const isTelugu = getLangCode() === "te";

                                      const description = isTelugu
                                        ? selectedArticle.content_te
                                        : selectedArticle.content_en;

                                      if (description) {
                                        const key = `${isTelugu ? "Telugu" : "English"}_${data.voice || "Female"}`;
                                        const voiceConfig = VOICE_MAP[key];

                                        if (voiceConfig?.id) {
                                          Tts.setDefaultVoice(voiceConfig.id);
                                        } else if (voiceConfig?.lang) {
                                          Tts.setDefaultLanguage(voiceConfig.lang);
                                        }

                                        Tts.speak(description);
                                        setIsSpeaking(true);

                                      }
                                    }
                                  }
                                }}
                              >
                                <Image
                                  source={
                                    isSpeaking
                                      ? require('../../../assets/icons/pause.png')
                                      : require('../../../assets/icons/play.png')
                                  }
                                  style={[
                                    styles.playIcon,
                                    isSpeaking ? styles.playIcon : styles.playIconBig,
                                    { tintColor: Colors.textcolor }
                                  ]}
                                />
                              </TouchableOpacity>

                              <TouchableOpacity>
                                <Image
                                  source={require("../../../assets/images/forward.png")}
                                  style={[styles.controlIcons, { tintColor: Colors.textcolor }]}
                                />
                              </TouchableOpacity>
                             
                            </View>
                          </View>

                          {/* Transparent interactions */}
                          <View style={styles.audioInteractionRow}>

                            <InteractionsRow
                              stats={item.stats}
                              tintColor={Colors.textcolor}
                              backgroundColor="transparent"
                              deviceId={data.device_id}
                              contentType="articles"
                              contentId={item.article_id}
                              compact={true}
                              onShare={() => setShareVisible(true)}
                              onComment={() => {
                                setSelectedArticleId(item.article_id);
                                setCommentVisible(true);
                              }}
                              containerStyle={{
                                flexDirection: "row",         // 👈 horizontal
                                justifyContent: "space-around", // 👈 evenly spaced
                                alignItems: "center",
                                marginVertical: fh(-8),
                                width: "115%",                // 👈 make sure it spans the card width
                              }}
                            />

                          </View>

                          <Text
                            style={[
                              styles.metaRights,
                              { color: Colors.mediumGray, bottom: fh(5), fontFamily: getFont("regular") },
                            ]}
                          >
                            {t("coming_up_next")}
                          </Text>


                          {/* Upcoming carousel */}
                          <UpcomingArticlesCarousel
                            articles={posts}
                            currentIndex={currentIndex}
                            isTelugu={isTelugu}
                            onSelect={(article, idx) => {
                              setSelectedArticle(article);
                              setCurrentIndex(idx);
                            }}
                          />
                        </>
                      )}
                    </View>

                    {/* Only show Meta + Interactions in Text Mode */}
                    {isTextMode && (
                      <>
                        {posts.length > 1 && (
                          <View style={styles.metaRow}>
                            <Text
                              style={[
                                styles.paginationText,
                                { color: Colors.mediumGray, fontFamily: getFont("regular") },
                              ]}
                            >
                              {index + 1}/{posts.length} {t("pages")}
                            </Text>
                            <Text
                              style={[
                                styles.metaRight,
                                { color: Colors.mediumGray, fontFamily: getFont("regular") },
                              ]}
                            >
                              {timeAgo(item.created_at)}| Hyderabad
                            </Text>
                          </View>
                        )}

                        <InteractionsRow
                          stats={item.stats}
                          tintColor={Colors.textcolor}
                          backgroundColor="#49425B33"
                          deviceId={data.device_id}
                          contentType="articles"
                          contentId={item.article_id}
                          compact={false}
                          onShare={() => setShareVisible(true)}
                          onComment={() => {
                            setSelectedArticleId(item.article_id);
                            setCommentVisible(true);
                          }}
                          containerStyle={{ marginTop: fh(10), bottom: fh(50), width: fw(290), left: fw(30) }}
                        />
                      </>
                    )}
                  </View>


                </View>
              );
            }}
          />
        </View>
      )}

      {fullscreenImage && (
        <ImageViewing
          images={[{ uri: fullscreenImage }]}
          imageIndex={0}
          visible={true}
          onRequestClose={() => setFullscreenImage(null)}
        />
      )}

      {/* Modals */}
      <SidebarPanel
        visible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
        categories={categories}
        activeCategoryKey={activeTab}
        selectedCategories={selectedCategories}
        onCategoryPress={(cat) => {
          // Toggle selection logic
          setSelectedCategories((prev) =>
            prev.includes(cat.key)
              ? prev.filter((c) => c !== cat.key)
              : [...prev, cat.key]
          );
        }}
      />

      <ShareModal visible={shareVisible} onClose={() => setShareVisible(false)} />
      {selectedArticleId && (
        <CommentModal
          visible={commentVisible}
          onClose={() => setCommentVisible(false)}
          contentId={selectedArticleId}
          contentType="articles"
        />
      )}
      <ReportModal visible={reportVisible} onClose={() => setReportVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbarContainer: { zIndex: 10 },
  topbarInner: { marginTop: fh(10) },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  deckContainer: { flex: 1, marginTop: fh(-5) },
  card: {
    height: SCREEN_H * 0.9,
    width: SCREEN_W,
    alignSelf: "center",

    overflow: "hidden",
    marginVertical: fh(10),
    backgroundColor: "#000",
  },
  imageContainer: { height: SCREEN_H * 0.45, width: "100%" },
  image: { width: fw(390), height: fh(260) },
  bottomSection: {
    flex: 1,
    borderTopLeftRadius: fw(20),
    borderTopRightRadius: fw(20),
    padding: fw(16),
    marginTop: fh(-150),
    justifyContent: "space-between",
  },
  dividerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: fh(8),
  },
  chipButton: {
    paddingHorizontal: fw(12),
    height: BUTTON_HEIGHT,
    paddingVertical: fh(4),
    borderRadius: fw(20),
    top: fh(-50),
    left: fw(10),
  },
  rightActions: { flexDirection: "row", alignItems: "center", gap: fw(12), top: fh(-50), right: fw(10) },
  title: {
    fontSize: ff(18),
    fontWeight: "700",

    marginTop: fh(-50),
    marginBottom: fh(16),
  },
  description: {
    fontSize: ff(16),
    lineHeight: ff(25),

    marginTop: fh(-5),
  },
  audioInteractionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: fh(12),

    borderRadius: fw(12),
    paddingVertical: fh(8),
    width: "100%",
  },
  audioActionIcon: { width: fw(22), height: fw(22) },
  controlsWrap: { alignItems: "center", marginVertical: fh(10), width: "100%" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
  },
  timeText: { fontSize: ff(12), color: "#fff" },
  progressBar: { flex: 1, marginHorizontal: fw(10) },
  mainControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: fh(12),
    width: "90%",
  },
  controlIcon: { width: fw(20), height: fw(20) },
  controlIcons: { width: fw(14), height: fw(14) },
  playButton: {
    width: fw(30),
    height: fw(30),
    borderRadius: fw(25),
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: { width: fw(12), height: fw(12) },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: fh(50),
    marginTop: fh(10),
  },
  toggleWrapper: {
    flexDirection: "row",
    borderRadius: fw(20),
    overflow: "hidden",
    height: BUTTON_HEIGHT,
    backgroundColor: "#fff",

  },

  toggleButton: {
    paddingHorizontal: fw(10),
    paddingVertical: fh(4),
    height: BUTTON_HEIGHT,

  },

  chipButtonText: {
    fontSize: ff(12),
    fontWeight: "500",
    color: "#fff"     // smaller font
    // or Colors.textcolor if dynamic
  },

  topOverlay: {
    position: "absolute",
    top: fh(12),
    left: fw(16),
    right: fw(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5, // ensure it floats over the image
  },

  articleId: {
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // ✅ black with 60% opacity
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 20,
    alignSelf: 'center',
    fontSize: 8,
    fontWeight: '500',
    left: 4
  },
  tridotIcon: {
    width: fw(20),
    height: fh(20),
    tintColor: "#fff",
  },


  toggleActive: {
    backgroundColor: "#997DDF",
    borderRadius: fw(20),
    paddingHorizontal: fw(10), // ✅ curves on both sides

    marginRight: -1,
    // small gap so purple pill shows inside white wrapper
  },

  toggleText: {
    fontSize: ff(12),
    marginTop: fh(-1)

  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  dimOverlay: {
    ...StyleSheet.absoluteFillObject, // covers entire card
    backgroundColor: "rgba(0,0,0,0.5)", // 50% black tint
    borderRadius: fw(20),              // keep same as card radius
  },

  playIconBig: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  paginationText: { fontSize: ff(12), fontWeight: "500", left: fw(2) },
  metaRight: { fontSize: ff(12), fontWeight: "500", right: fw(12) },
  metaRights: { fontSize: ff(12), fontWeight: "500", left: fw(12) },

});

export default ArticleScreen;
