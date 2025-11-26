// screens/VerticalPollsCarousel.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  Dimensions
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Carousel from "../../components/Carousel";
import AppHeader from "../../components/AppHeader";
import GradientScreen from "../../components/GradientScreen";
import { fw, fh, ff, SCREEN_H } from "../../../utils/responsive";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginModal from "../../components/LoginModal";
import { publicPolls } from "../../api/publicapi/publicApi";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VerticalPollsCarousel = () => {
  const navigation = useNavigation<any>();
  const { Colors } = useTheme();
  const { data, t, getFont, getLangCode } = useOnboarding();
  const [loginVisible, setLoginVisible] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string | number>>({});
  const [pollStats, setPollStats] = useState<Record<string, any>>({});
  const [token, setToken] = useState<string | null>(null);
  const [responsesLoaded, setResponsesLoaded] = useState(false);
  const isTelugu = getLangCode() === "te";

  const route = useRoute<any>();
  const { selectedPollId } = route.params || {};
  const carouselRef = useRef<any>(null);
  const hasScrolledToPoll = useRef(false);

  // BackHandler
  useEffect(() => {
    const backAction = () => {
      navigation.navigate("HomeScreen");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem("accessToken");
      setToken(t);
    };
    init();
  }, []);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const pollRes = await publicPolls.list();
      if (pollRes.success && Array.isArray(pollRes.data?.items)) {
        const formatted = pollRes.data.items.map((p: any) => {
          const question = isTelugu ? p.question_te || p.question_en : p.question_en || p.question_te;

          let options: string[] = [];
          if (Array.isArray(p.options)) {
            options = p.options;
          } else if (p.options && typeof p.options === "object") {
            options = isTelugu ? p.options.te || p.options.en : p.options.en || p.options.te;
          }

          return {
            id: String(p.poll_id),
            question,
            type: p.type,
            options,
            image: p.media?.url || null,
            mediaType: p.media?.type || "image",
            createdAt: p.created_at,
            expiresAt: p.expires_at,
          };
        });

        const activePolls = formatted.filter(
          (p) => !p.expiresAt || new Date(p.expiresAt) > new Date()
        );
        setPolls(activePolls);

        if (activePolls.length > 0) {
          const mappedSelections: Record<string, string | number> = {};
          const mappedStats: Record<string, any> = {};

          await Promise.all(
            activePolls.map(async (p) => {
              try {
                const statsRes = await publicPolls.getStats(p.id);
                if (statsRes?.success) {
                  mappedStats[p.id] = statsRes.data;
                }
                if (token) {
                  const responseRes = await publicPolls.getResponses(p.id, token);
                  if (responseRes?.success && responseRes.data?.response?.selected_option) {
                    mappedSelections[p.id] = responseRes.data.response.selected_option;
                  }
                }
              } catch (err) {
                console.warn(`⚠️ Failed to fetch response/stats for poll ${p.id}`);
              }
            })
          );

          setSelections(mappedSelections);
          setPollStats(mappedStats);
          setResponsesLoaded(true);
        }
      } else {
        setPolls([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch polls:", err);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [data, token]);

  useEffect(() => {
    fetchPolls();
  }, [data, fetchPolls]);

  // Scroll to selected poll with better timing
  useEffect(() => {
    if (!loading && polls.length > 0 && selectedPollId && !hasScrolledToPoll.current) {
      const index = polls.findIndex((p) => p.id === selectedPollId);

      if (index >= 0 && carouselRef.current) {
        // Wait for next frame to ensure layout is complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.scrollToIndex({
                index,
                animated: false,
              });
              hasScrolledToPoll.current = true;
            }
          }, 300);
        });
      }
    }
  }, [loading, polls, selectedPollId]);

  // Submit choice function
  const setChoice = async (pollId: string, value: string | number) => {
    const choice = String(value);
    if (!token) {
      setLoginVisible(true);
      return;
    }

    try {
      const res = await publicPolls.submitResponse(pollId, choice, token);
      if (res.success) {
        setSelections((prev) => ({ ...prev, [pollId]: choice }));
        const statsRes = await publicPolls.getStats(pollId);
        if (statsRes?.success) {
          setPollStats((prev) => ({ ...prev, [pollId]: statsRes.data }));
        }
      } else {
        Alert.alert(t("error"), res.message || t("error_submit_vote"));
      }
    } catch (err) {
      console.error("❌ Error submitting response:", err);
      Alert.alert(t("error"), t("error_submit_vote"));
    }
  };

  // Poll Components (YesNoBlock, MCQBlock, RatingBlock remain the same)
  const YesNoBlock = ({ item }: any) => (
    <View style={styles.pollCardContent}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.pollImage} />
      )}
      <View style={styles.pollTextContainer}>
        <Text
          style={[
            styles.pollQuestion,
            getFont.regular,
            { color: Colors.textcolor },
          ]}
        >
          {item.question}
        </Text>
        <View style={styles.buttonRow}>
          {(item.options || []).map((choice: string, idx: number) => (
            <TouchableOpacity
              key={choice}
              style={[
                styles.voteButton,
                { borderColor: Colors.lavenderPurple },
                selections[item.id] === choice && {
                  backgroundColor: Colors.lavenderPurple,
                  borderWidth: 0,
                },
              ]}
              onPress={() => setChoice(item.id, choice)}
            >
              <View style={{ paddingHorizontal: fw(2), paddingVertical: fh(1) }}>
                <Text
                  style={[
                    styles.buttonText,
                    getFont.regular,
                    {
                      color: selections[item.id] === choice ? Colors.white : Colors.textcolor,
                    },
                  ]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {choice + " "}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const MCQBlock = ({ item }: any) => (
    <View style={styles.pollCardContent}>
      {item.image && <Image source={{ uri: item.image }} style={styles.pollImage} />}
      <View style={styles.pollTextContainer}>
        <Text
          style={[
            styles.pollTitleText,
            getFont.regular,
            { color: Colors.textcolor, marginBottom: fh(12) },
          ]}
          numberOfLines={3}
        >
          {item.question}
        </Text>
        <View style={styles.radioGroup}>
          {item.options.map((opt: string, idx: number) => {
            const isSelected = selections[item.id] === opt;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.radioOption}
                activeOpacity={0.7}
                onPress={() => setChoice(item.id, opt)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected
                        ? Colors.lavenderPurple
                        : Colors.mediumGray,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: Colors.lavenderPurple },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    {
                      color: Colors.textcolor,
                      paddingRight: fw(4),
                      fontFamily: getFont('regular')
                    },
                  ]}
                  numberOfLines={2}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const RatingBlock = ({ item }: any) => {
    const current = Number(selections[item.id] ?? 0);
    return (
      <View style={styles.pollCardContent}>
        {item.image && <Image source={{ uri: item.image }} style={styles.pollImage} />}
        <View style={styles.pollTextContainer}>
          <Text style={[styles.pollTitleText, getFont.regular, { color: Colors.textcolor }]}>
            {item.question}
          </Text>
          <View style={styles.ratingContainer}>
            {item.options.map((opt: string, idx: number) => {
              const index = Number(opt);
              const filled = index <= current;
              return (
                <TouchableOpacity key={idx} onPress={() => setChoice(item.id, index)} style={styles.starButton}>
                  <Image
                    source={
                      filled
                        ? require("../../../assets/icons/filled_star.png")
                        : require("../../../assets/icons/star.png")
                    }
                    style={[
                      styles.starIcon,
                      { tintColor: filled ? Colors.lavenderPurple : Colors.mediumGray },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Stats Components (YesNoStats, MCQStats, RatingStats remain the same)
  const YesNoStats = ({ item }: any) => {
    const stats = pollStats[item.id];
    if (!stats || typeof stats.stats !== "object") return null;

    const options = Object.entries(stats.stats).map(([key, value]) => ({
      label: key,
      count: Number(value),
    }));
    const totalVotes = options.reduce((acc, o) => acc + o.count, 0);

    return (
      <View style={styles.pollCardContent}>
        {item.image && <Image source={{ uri: item.image }} style={styles.pollImage} />}
        <View style={styles.pollTextContainer}>
          <Text style={[styles.pollQuestion, getFont.regular, { color: Colors.textcolor }]}>
            {item.question}
          </Text>
          {options.map((opt, idx) => {
            const percentage = totalVotes > 0 ? (opt.count / totalVotes) * 100 : 0;
            return (
              <View key={idx} style={styles.progressRow}>
                <Text style={[getFont.regular, { flex: 2, fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.label}
                </Text>
                <View style={[styles.progressBar, { flex: 5, backgroundColor: Colors.mediumGray }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${percentage}%`, backgroundColor: Colors.lavenderPurple },
                    ]}
                  />
                </View>
                <Text style={[getFont.medium, { flex: 1, textAlign: "right", fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const MCQStats = ({ item }: any) => {
    const stats = pollStats[item.id];
    if (!stats || (!Array.isArray(stats.options) && typeof stats.stats !== "object")) return null;

    let options: { label: string; count: number }[] = [];
    if (Array.isArray(stats.options)) {
      options = stats.options.map((o: any) => ({ label: o.option_text, count: o.count }));
    } else if (typeof stats.stats === "object") {
      options = Object.entries(stats.stats).map(([key, value]) => ({
        label: key,
        count: Number(value),
      }));
    }

    const totalVotes = options.reduce((acc, o) => acc + o.count, 0);

    return (
      <View style={styles.pollCardContent}>
        {item.image && <Image source={{ uri: item.image }} style={styles.pollImage} />}
        <View style={styles.pollTextContainer}>
          <Text style={[styles.pollTitleText, getFont.regular, { color: Colors.textcolor }]}>
            {item.question}
          </Text>
          {options.map((opt, idx) => {
            const percentage = totalVotes > 0 ? (opt.count / totalVotes) * 100 : 0;
            return (
              <View key={idx} style={styles.progressRow}>
                <Text style={[getFont.regular, { flex: 2, fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.label}
                </Text>
                <View style={[styles.progressBar, { flex: 5, backgroundColor: Colors.mediumGray }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${percentage}%`, backgroundColor: Colors.lavenderPurple },
                    ]}
                  />
                </View>
                <Text style={[getFont.medium, { flex: 1, textAlign: "right", fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const RatingStats = ({ item }: any) => {
    const stats = pollStats[item.id];
    if (!stats || !Array.isArray(stats.stats)) return null;

    const options = [5, 4, 3, 2, 1].map((rating) => {
      const entry = stats.stats.find((s: any) => s.rating === rating);
      return { label: `${rating} ★`, count: entry ? entry.count : 0 };
    });

    const totalVotes = options.reduce((acc, o) => acc + o.count, 0);

    return (
      <View style={styles.pollCardContent}>
        {item.image && <Image source={{ uri: item.image }} style={styles.pollImage} />}
        <View style={styles.pollTextContainer}>
          <Text style={[styles.pollTitleText, getFont.regular, { color: Colors.textcolor }]}>
            {item.question}
          </Text>
          {options.map((opt, idx) => {
            const percentage = totalVotes > 0 ? (opt.count / totalVotes) * 100 : 0;
            return (
              <View key={idx} style={styles.progressRow}>
                <Text style={[getFont.regular, { flex: 2, fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.label}
                </Text>
                <View style={[styles.progressBar, { flex: 5, backgroundColor: Colors.mediumGray }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${percentage}%`, backgroundColor: Colors.lavenderPurple },
                    ]}
                  />
                </View>
                <Text style={[getFont.medium, { flex: 1, textAlign: "right", fontSize: ff(14), color: Colors.textcolor }]}>
                  {opt.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const PollShimmer = () => (
    <View
      style={[
        styles.pollCard,
        { backgroundColor: Colors.deepPurple, width: fw(342), height: fh(371) },
      ]}
    >
      <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: "100%", height: "50%", borderRadius: fw(12) }} />
    </View>
  );



  const renderPollItem = ({ item }: { item: any }) => {
    const hasVoted = selections[item.id] !== undefined;

    return (
      <View style={[styles.pollCard, { backgroundColor: Colors.deepPurple, width: fw(342) }]}>
        {hasVoted ? (
          <>
            {item.type === "yes_no" && <YesNoStats item={item} />}
            {item.type === "multiple_choice" && <MCQStats item={item} />}
            {item.type === "rating" && <RatingStats item={item} />}
          </>
        ) : (
          <>
            {item.type === "yes_no" && <YesNoBlock item={item} />}
            {item.type === "multiple_choice" && <MCQBlock item={item} />}
            {item.type === "rating" && <RatingBlock item={item} />}
          </>
        )}
      </View>
    );
  };


  return (
    <GradientScreen>
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>

     
        <AppHeader
          containerStyle={{ backgroundColor: "transparent" }}
          leftComponents={[
            <TouchableOpacity key="back" onPress={() => navigation.goBack()}>
              <Image
                source={require("../../../assets/icons/backarrow.png")}
                style={{ width: fw(24), height: fw(24), tintColor: Colors.textcolor }}
              />
            </TouchableOpacity>,
          ]}
          rightComponents={[]}
          title={t("todays_poll_alert")}
          titleStyle={[{ color: Colors.textcolor, right: 20 }, getFont.bold]}
        />
        <View style={styles.carouselWrapper}>
          {loading ? (
            <Carousel
              data={[1, 2, 3]}
              renderItem={() => <PollShimmer />}
              horizontal={false}
              itemSpacing={fh(20)}
              windowSize={12}
              maxToRenderPerBatch={12}
              initialNumToRender={12}
              removeClippedSubviews={false} // Disable for better scrolling
              decelerationRate="fast"
              pagingEnabled
            />
          ) : (
            <Carousel
              ref={carouselRef}
              data={polls}
              renderItem={renderPollItem}
              horizontal={false}
              itemSpacing={fh(20)}
              windowSize={12}
              maxToRenderPerBatch={12}
              initialNumToRender={12}
              removeClippedSubviews={false} // Disable for better performance
              
             
              onScrollToIndexFailed={(info) => {
                console.warn('scrollToIndex failed:', info);
                setTimeout(() => {
                  if (carouselRef.current && polls.length > 0) {
                    const safeIndex = Math.min(info.index, polls.length - 1);
                    carouselRef.current.scrollToIndex({
                      index: safeIndex,
                      animated: true,
                    });
                  }
                }, 500);
              }}
            />
          )}
        </View>
        <LoginModal visible={loginVisible} onClose={() => setLoginVisible(false)} />
    
    </SafeAreaView>
    </GradientScreen>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  carouselWrapper: {
    flex: 1,
    marginTop: fh(10),
    paddingHorizontal: fw(8),
    alignItems: "center",
    paddingBottom: fh(20),
  },
  pollCard: {
    width: '90%',
    maxWidth: fw(360),
    borderRadius: fw(12),
    marginBottom: fh(20),
    alignSelf: 'center',
    minHeight: fh(371),
  },
  pollCardContent: {
    flex: 1,
  },
  pollTextContainer: {
    flex: 1,
    padding: fw(16),
    justifyContent: "space-between"
  },
  pollImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: "cover",
    borderTopLeftRadius: fw(12),
    borderTopRightRadius: fw(12),
  },
  pollQuestion: {
    fontSize: ff(14),
    textAlign: 'center',
    marginBottom: fh(20)
  },
  pollTitleText: {
    fontSize: ff(14),
    textAlign: 'center'
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: fw(10),
    marginTop: fh(20)
  },
  voteButton: {
    flex: 1,
    minWidth: fw(80),
    borderWidth: 1,
    height: fh(50),
    borderRadius: fw(8),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: fw(5),
  },
  buttonText: {
    fontSize: ff(14),
    lineHeight: ff(18),
    includeFontPadding: true,
    textAlignVertical: "center",
    letterSpacing: 0.2,
  },
  radioGroup: {
    flexDirection: "column",
    gap: fh(10),
    marginTop: fh(4),
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: fw(10),
    paddingVertical: fh(6),
  },
  radioCircle: {
    width: fw(15),
    height: fw(15),
    borderRadius: fw(10),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInnerCircle: {
    width: fw(10),
    height: fw(10),
    borderRadius: fw(5),
  },
  radioLabel: {
    fontSize: ff(14),
    flexShrink: 1,
    lineHeight: fh(22),
    includeFontPadding: false,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: fh(10),
    gap: fw(10)
  },
  starButton: {
    padding: fw(6)
  },
  starIcon: {
    width: fw(32),
    height: fw(32)
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: fh(6),
    gap: fw(8)
  },
  progressBar: {
    height: fh(14),
    borderRadius: fw(8),
    overflow: "hidden",
    flex: 5
  },
  progressBarFill: {
    height: "100%",
    borderRadius: fw(8)
  },
});

export default VerticalPollsCarousel;