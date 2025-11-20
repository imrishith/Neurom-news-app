import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Tts from "react-native-tts";
import { fw, fh, ff } from "../../utils/responsive";

const TtsTestScreen = () => {
  const [voices, setVoices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<{ lang: string; list: any[] }[]>([]);

  useEffect(() => {
    (async () => {
      const allVoices = await Tts.voices();
      const installed = allVoices.filter((v) => !v.notInstalled);

      // Only Indian languages
      const indianVoices = installed.filter(
        (v) => v.language === "en-IN" || v.language === "te-IN"
      );

      // Group by language for better UI
      const grouped = ["en-IN", "te-IN"].map((lang) => ({
        lang,
        list: indianVoices.filter((v) => v.language === lang),
      }));

      setVoices(indianVoices);
      setFiltered(grouped);
    })();
  }, []);

  const speakWithVoice = async (voiceId: string, text: string) => {
    try {
      await Tts.stop();
      await Tts.setDefaultVoice(voiceId);
      Tts.speak(text);
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const playAll = async () => {
    let delay = 0;
    for (const v of voices) {
      setTimeout(() => {
        const text =
          v.language === "te-IN"
            ? `ఇది ${v.id} వాయిస్ పరీక్ష`
            : `${v.id} voice test`;
        speakWithVoice(v.id, text);
      }, delay);
      delay += 4000;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🇮🇳 TTS India Voice Tester</Text>

      {filtered.map((group) => (
        <View key={group.lang} style={styles.section}>
          <Text style={styles.subheading}>
            {group.lang === "en-IN"
              ? "🇬🇧 English (India)"
              : "🇮🇳 Telugu (India)"}
          </Text>

          {group.list.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.button}
              onPress={() =>
                speakWithVoice(
                  v.id,
                  v.language === "te-IN"
                    ? `ఇది ${v.id} వాయిస్ పరీక్ష`
                    : `${v.id} voice test`
                )
              }
            >
              <Text style={styles.btnText}>
                {v.id}{" "}
                <Text style={{ color: "#ccc" }}>
                  ({v.engine || "GoogleTTS"})
                </Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        onPress={playAll}
        style={[styles.button, { backgroundColor: "#6C63FF", marginTop: 20 }]}
      >
        <Text style={styles.btnText}>▶ Play All Indian Voices</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TtsTestScreen;

const styles = StyleSheet.create({
  container: {
    padding: fw(20),
    backgroundColor: "#000",
    flexGrow: 1,
    alignItems: "center",
  },
  heading: {
    color: "#fff",
    fontSize: ff(18),
    marginBottom: fh(10),
  },
  subheading: {
    color: "#aaa",
    fontSize: ff(16),
    marginBottom: fh(8),
    alignSelf: "flex-start",
  },
  section: { width: "100%", marginBottom: fh(16) },
  button: {
    backgroundColor: "#997DDF",
    paddingHorizontal: fw(16),
    paddingVertical: fh(10),
    borderRadius: fw(8),
    marginBottom: fh(8),
    width: "100%",
  },
  btnText: { color: "#fff", fontSize: ff(14) },
});
