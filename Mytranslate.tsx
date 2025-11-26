import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Tts from 'react-native-tts';

const { width } = Dimensions.get('window');

const articles = [
  {
    id: '1',
    title: 'సింధూరం చెరిగిపోతే.. ఆపరేషన్ కు ఆ పేరా ? జయాబచ్చన్ సూటి ప్రశ్న..!',


    content:
      'ఆపరేషన్ సింధూర్ పై ఇవాళ రాజ్యసభలో ఆసక్తికర చర్చలు జరుగుతున్నాయి. ఇందులో భాగంగా సమాజ్ వాదీ పార్టీకి చెందిన రాజ్యసభ ఎంపీ జయా బచ్చన్ ఆపరేషన్ సింధూర్ కు ఆ పేరు పెట్టడంపై తీవ్ర అభ్యంతరం వ్యక్తం చేశారు. ఈ విషయంలో కేంద్ర ప్రభుత్వ తీరును ఆమె తీవ్రంగా తప్పుబట్టారు. కాశ్మీర్ భూతల స్వర్గంగా మారిందని హామీ ఇచ్చిన కేంద్రం పహల్గాం దాడి తర్వాత బాధిత కుటుంబాలకు ఏం సమాధానం చెప్తుందని ఆమె నిలదీశారు'


  },
  {
    id: '2',
    title: 'కింగ్‌డమ్ యూఎస్ రివ్యూ ..బ్లాక్ బ్లాస్టర్ బొమ్మ',




    content: 'విజయ్ దేవరకొండ హీరోగా, గౌతమ్ తిన్ననూరి దర్శకత్వంలో తెరకెక్కిన కింగ్‌డమ్ సినిమాపై భారీ అంచనాలు నెలకొన్నాయి. కింగ్‌డమ్ ఒక స్పై యాక్షన్ డ్రామాగా తెరకెక్కింది. ఇందులో అన్నదమ్ముల సెంటిమెంట్ ప్రధానంగా ఉంటుంది. శ్రీలంక బ్యాక్‌డ్రాప్‌తో రూపొందిన ఈ యాక్షన్ డ్రామాలో భాగ్యశ్రీ బోర్సే హీరోయిన్‌గా నటించగా, సత్యదేవ్ కీలక పాత్రలో కనిపించనున్నారు. అనిరుధ్ రవిచందర్ సంగీతం సినిమాకు ప్రధాన ఆకర్షణగా నిలవనుంది. గురువారం ప్రేక్షకుల ముందుకు రానున్న ఈ సినిమా, బుధవారమే యూఎస్‌లో ప్రీమియర్స్ మొదలయ్యాయి. దీనిలో భాగంగానే సినిమా చూసిన అభిమానులు తమ అభిప్రాయాన్ని వ్యక్తం చేస్తున్నారు'


  },
  {
    id: '3',
    title: 'తెలంగాణలో ఆ విద్యార్థులకు ఉచితంగా స్పోర్ట్స్ సూట్, షూస్',


    content: 'తెలంగాణలో విద్యావ్యవస్థను పటిష్టం చేసేందుకు రేవంత్ సర్కార్ కీలక నిర్ణయాలు తీసుకుంటోంది. ప్రభుత్వ పాఠశాలలు, గురుకులాలు, కస్తూర్బా గాంధీ విద్యాలయాలపై కాంగ్రెస్ ప్రభుత్వం దృష్టి సారించింది. ఈ మేరకు ఇప్పటికే రాష్ట్రంలో విడతల వారీగా 571 కొత్త ప్రభుత్వ పాఠశాలలు ఏర్పాటు చేసేందుకు ప్రభుత్వం ప్రణాళికలు సిద్ధం చేస్తోంది. దాంతోపాటు రాష్ట్రంలోని ప్రతి నియోజ‌క‌వ‌ర్గంలో అబ్బాయిలకు ఒక‌టి, అమ్మాయిలకు ఒక‌టి యంగ్ ఇండియా రెసిడెన్షియ‌ల్స్ స్కూళ్ల నిర్మాణాల‌ను చేపడుతోంది తెలంగాణ ప్రభుత్వం. అయితే తాజాగా మరో కీలక నిర్ణయం తీసుకుంది రేవంత్ సర్కార్. కస్తూర్బా గాంధీ బాలికల విద్యాలయాల్లోని స్టూడెంట్స్ కు ఉచితంగా స్పోర్ట్స్ షూస్, సూట్లు ఇవ్వాలని నిర్ణయం తీసుకుంది'


  },
];

const ArticleCarouselTTS = () => {
  const [voiceId, setVoiceId] = useState<string | null>(null);

  useEffect(() => {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('te-IN');
      Tts.setDefaultVoice('te-in-x-teg-local'); // Male Telugu voice
      Tts.setDefaultRate(0.55);
      Tts.setDefaultPitch(1.1);
      Tts.voices().then(voices => {
        const teluguVoices = voices.filter(
          v => v.language === 'te-IN' && !v.notInstalled
        );
        const male = teluguVoices.find(v =>
          v.name?.toLowerCase().includes('male')
        );
        if (male) {
          Tts.setDefaultVoice(male.id);
          setVoiceId(male.id);
        }
      });
    });
  }, []);

  const speak = (text: string) => {
    if (voiceId) Tts.setDefaultVoice(voiceId);
    Tts.stop(); // stop any ongoing speech
    Tts.speak(text);
  };

 const renderItem = ({ item }: { item: typeof articles[0] }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <TouchableOpacity style={styles.button} onPress={() => speak(item.content)}>
        <Text style={styles.buttonText}>🔊 Play</Text>
      </TouchableOpacity>
    </View>
  );
  return (
    <FlatList
      data={articles}
      horizontal
      pagingEnabled
      keyExtractor={item => item.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
    />
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    paddingVertical: 20,
  },
  card: {
    width: width - 40,
    height: 500,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  content: {
    fontSize: 14.5,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  button: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});



export default ArticleCarouselTTS;
