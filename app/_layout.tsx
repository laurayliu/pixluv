import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts, PixelifySans_400Regular, PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts
    ({ 
      PixelifySans_400Regular, 
      PixelifySans_700Bold, 
      ms: require('../assets/fonts/ms-sans-serif-1.ttf') 
    });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="pixing/[userId]" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
          <Stack.Screen name="drawing_challenge" options={{ headerShown: false }} />
          <Stack.Screen name="challenge_submissions/[date]" options={{ headerShown: false }} />
          <Stack.Screen name="sticker-collection/[userId]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
