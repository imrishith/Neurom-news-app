import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { fw, fh, ff } from '../../../utils/responsive';
import Circle from '../../components/Circle';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext'; // ✅ import context

type Row = {
  flag: ImageSourcePropType;
  label: string;
  score: string;
  showProgress?: boolean;
  progressPct?: number;
};

interface LiveScoreCardProps {
  matchTitle: string;
  tossText: string;
  rows: [Row, Row];
}

const LiveScoreCard: React.FC<LiveScoreCardProps> = ({ matchTitle, tossText, rows }) => {
  const { Colors } = useTheme();
  const { t, getFont } = useOnboarding(); // ✅ use translations + font

  return (
    <View>
      {/* Section heading */}
      <View style={styles.sectionHeadingRow}>
        <Circle
          size={10}
          backgroundColor={Colors.alertRed}
       
          imageStyle={[styles.sectionIconImage]}
        />
        <Text
          style={[
            styles.sectionHeading,
            { color: Colors.textcolor, fontFamily: getFont("bold"), fontWeight: '700', fontSize: ff(16)  },
          ]}
        >
          {t("live_sports_score")} {/* ✅ translated */}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: Colors.deepPurple }]}>
        {/* Header */}
        <View style={styles.topRow}>
          <Text
            style={[styles.matchTitle, { color: Colors.textcolor, fontFamily: getFont("medium") }]}
          >
            {matchTitle}
          </Text>
          <Text
            style={[styles.tossText, { color: Colors.textcolor, fontFamily: getFont("regular") }]}
          >
            {tossText}
          </Text>
        </View>

        {/* Team rows */}
        {rows.map((r, idx) => (
          <View key={idx} style={styles.teamRow}>
            <View style={styles.leftGroup}>
              <Image source={r.flag} style={styles.flag} />
              <Text
                style={[styles.teamLabel, { color: Colors.textcolor, fontFamily: getFont("regular") }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {r.label}
              </Text>
            </View>

            <View style={styles.rightGroup}>
              {r.showProgress ? (
                <View style={styles.pillTrack}>
                  <View
                    style={[
                      styles.pillFill,
                      {
                        width: `${Math.max(0, Math.min(100, r.progressPct ?? 0))}%`,
                      },
                    ]}
                  />
                </View>
              ) : (
                <View style={{ width: fw(72) }} />
              )}
              <Text
                style={[styles.score, { color: Colors.textcolor, fontFamily: getFont("medium") }]}
              >
                {r.score}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: fh(10),
    marginHorizontal: fw(20),
    gap: 10,
    marginTop: fh(20),
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
  },

  card: {
    borderRadius: fw(12),
    width: fw(355),
    height: fh(110),
    paddingHorizontal: fw(12),
    paddingVertical: fh(6),
    marginLeft: fw(16),
    marginTop: fh(10),
    marginBottom: fh(10),
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: fh(4),
  },
  matchTitle: {
    fontSize: ff(10),
    marginTop: fh(8),
    fontWeight: "700"
  },
  tossText: {
    opacity: 0.85,
    fontSize: ff(10),
    marginTop: fh(8),
     fontWeight: "700"
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: fh(5),
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  flag: {
    width: fw(16),
    height: fw(16),
    borderRadius: 2,
    marginRight: fw(-16),
    resizeMode: 'cover',
  },
  teamLabel: {
    fontSize: ff(12),
    flexShrink: 1,
    top: fh(3),
  },

  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    top: fh(5)
  },
  pillTrack: {
    width: fw(56),
    height: fh(8),
    borderRadius: fh(8),
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: fw(6),
    overflow: 'hidden',
  },
  pillFill: {
    height: '100%',
    borderRadius: fh(8),
    backgroundColor: '#1FD07D',
  },
  score: {
    fontSize: ff(12),
  },
});

export default LiveScoreCard;
