// navigation/types.ts

export type RootStackParamList = {
  StartScreen: undefined;
  LocationScreen: undefined;
  LanguageScreen: undefined;
  ProfileWelcomeScreen: undefined;
  ArticleScreen: { articleId?: number } | undefined;
  VoiceScreen: undefined;
  HomeScreen: undefined;
  GetStarted: undefined;
  // 🧩 Add other screens as you use them
};
