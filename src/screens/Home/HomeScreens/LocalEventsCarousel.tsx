import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Circle from '../../../components/Circle';
import { fw, fh, ff } from '../../../../utils/responsive';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext'; // ✅ translations + fonts
import { publicLocalEvents } from '../../../api/publicapi/publicApi';
import EventDateTime from '../../../components/EventDateTime';



const LocalEventsCarousel = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocalEventsSlide, setActiveLocalEventsSlide] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);



  const { Colors } = useTheme();
  const { t, getFont, getLangCode } = useOnboarding();

  const lang = getLangCode();
  const isTelugu = lang === "te";

  // 🔹 Fetch from API


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const json = await publicLocalEvents.list();
        if (json.success && Array.isArray(json.data?.items)) {
          const isTelugu = lang === "te";
          const formatted = json.data.items.map((ev: any) => {
            const title = isTelugu
              ? ev.title_te && ev.title_te.trim() !== "" ? ev.title_te : null
              : ev.title_en && ev.title_en.trim() !== "" ? ev.title_en : null;

            const description = isTelugu
              ? ev.description_te && ev.description_te.trim() !== "" ? ev.description_te : null
              : ev.description_en && ev.description_en.trim() !== "" ? ev.description_en : null;

            const address = isTelugu
              ? ev.location_te && ev.location_te.trim() !== "" ? ev.location_te : null
              : ev.location_en && ev.location_en.trim() !== "" ? ev.location_en : null;

            return {
              id: String(ev.event_id),
              title,
              description,
              address,
              state: ev.state?.name || null,
              image: { uri: ev.media?.url || "" },
              date: ev.event_date,
              time: ev.event_time,
            };
          });
          setEvents(formatted);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("❌ Error fetching events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [lang]); // 👈 re-run whenever language changes



  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    try {
      const [hour, minute] = timeString.split(":");
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHour = ((h + 11) % 12) + 1; // 0→12-hour format
      return `${formattedHour}:${m.toString().padStart(2, "0")} ${ampm}`;
    } catch {
      return timeString;
    }
  };


  const renderSmallOverlayCard = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.smallCard, { borderColor: Colors.mediumGray }]}
      onPress={() => { }} // modal removed
    >
      <Image source={item.image} style={styles.smallImage} resizeMode="cover" />

      {/* Black gradient at bottom */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.9)",  // darkest at the bottom
          "rgba(0,0,0,0.6)",  // medium opacity
          "rgba(0,0,0,0.4)",  // light fade
          "rgba(0,0,0,0)",    // fully transparent at the top
        ]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0.5, y: 1 }}   // 👈 start from bottom
        end={{ x: 0.5, y: 0 }}     // 👈 end at top
        style={styles.bottomShade}
      />


      {/* Date Chip (top-right) */}
      <View style={[styles.dateChip, { backgroundColor: Colors.lavenderPurple }]}>
        <EventDateTime
          date={item.date}
          time={item.time}
          fontFamily={getFont("bold")}
          color="#fff"
          lang={lang}  // 👈 pass current language
        />

      </View>

      {/* Overlay Details */}
      <View style={styles.overlayContent}>
        <Text
          numberOfLines={3}
          style={[
            styles.eventTitle,
            { color: "#fff", fontFamily: getFont("bold"), fontWeight: "700" },
          ]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.eventLocation,
            { color: "#ddd", fontFamily: getFont("bold"), fontWeight: "700" },
          ]}
        >
          {item.address}
        </Text>
        <Text
          style={[
            styles.eventTime,
            { color: "#aaa", fontFamily: getFont("bold"), fontWeight: "700" },
          ]}
        >
          {formatTime(item.time)}
        </Text>
      </View>
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <View style={{ padding: fh(20), alignItems: "center" }}>
        <ActivityIndicator size="small" color={Colors.lavenderPurple} />
      </View>
    );
  }

  // ✅ Hide entire section when no data
  if (!loading && events.length === 0) {
    return null;
  }

  return (
    <View>
      {/* Heading */}
      <View style={styles.sectionHeadingRow}>

        <Text
          style={[
            styles.sectionHeading,
            { color: Colors.textcolor, fontFamily: getFont("bold"), fontWeight: '700', fontSize: ff(16) },
          ]}
        >
          {t("local_events")}
        </Text>
      </View>

      {/* Carousel */}
      <FlatList
        horizontal
        data={events}
        renderItem={renderSmallOverlayCard}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCarouselContent}
        snapToInterval={fw(118)}
        decelerationRate="fast"
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / fw(118));
          setActiveLocalEventsSlide(index);
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
    marginTop: fh(10),
  },
  sectionIconImage: { width: fw(18), height: fw(18), resizeMode: 'contain' },
  sectionHeading: { fontSize: ff(14), fontWeight: '600', left: fh(8), lineHeight: Platform.OS === "ios" ? ff(35) : ff(22) },
  horizontalCarouselContent: { paddingHorizontal: fw(20) },
  smallCard: {
    width: fw(200),
    height: fh(150),
    borderRadius: fw(8),
    overflow: 'hidden',
    marginRight: fw(12),
    position: 'relative',
    borderWidth: 1,
    marginTop: fh(10),
  },
  smallImage: { width: '100%', height: '100%' },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },

  fullOverlayText: { fontSize: ff(10), marginTop: fh(80), textAlign: "left", right: fw(8), fontWeight: "800" },

  // Modal
  modalOverlay: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: fw(320), borderRadius: fw(12), padding: fw(16) },
  modalTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: fh(12) },
  modalImage: { width: fw(60), height: fh(60), borderRadius: fw(8), marginRight: fw(12) },
  modalTitle: { flex: 1, fontSize: ff(14), fontWeight: '600' },
  modalBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: fh(12),
  },
  modalAddress: { fontSize: ff(12), flex: 1 },
  modalDateBox: {
    width: fw(50),
    height: fh(50),
    borderRadius: fw(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDate: { fontSize: ff(16), fontWeight: '700', color: '#fff' },
  modalMonth: { fontSize: ff(6), color: '#fff' },
  closeButton: {
    marginTop: fh(10),
    alignSelf: 'center',
    paddingHorizontal: fw(12),
    paddingVertical: fh(6),
    borderRadius: fw(6),
  },
  closeButtonText: { color: '#fff', fontSize: ff(12) },

  dateChip: {
    position: "absolute",
    top: fh(6),
    right: fw(6),
    width: fw(38),
    height: fh(38),
    justifyContent: "center",
    backgroundColor: "#6a0dad",
    borderRadius: fw(6),
    alignItems: "center",
  },

  overlayContent: {
    position: "absolute",
    bottom: fh(6),
    left: fw(8),
    right: fw(8),
  },
  eventTitle: { fontSize: ff(14), marginBottom: fh(2) },
  eventLocation: { fontSize: ff(12), marginBottom: fh(1) },
  eventTime: { fontSize: ff(12) },
});

export default LocalEventsCarousel;
