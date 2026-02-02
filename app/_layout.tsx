import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

// ─── Notification Handler ────────────────────────────────────────────────
// This runs when a notification arrives while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,     // show banner/alert
    shouldPlaySound: true,     // play sound
    shouldSetBadge: false,     // don't change app badge count
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // ─── Notification Setup (permissions + channel + listener) ───────────────
  useEffect(() => {
    // 1. Android channel (must be done before any notification can appear)
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 2. Request permissions (only once — system remembers choice)
    const requestPermissions = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Notification permissions not granted');
          // You can show an alert or settings link here later
        }
      } catch (err) {
        console.error('Permission request failed', err);
      }
    };

    requestPermissions();

    // 3. Optional: Listen for notification tap (when app is opened / brought to foreground)
    const notificationListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped!', data);

        // Example: navigate based on custom data
        // if (data?.screen) {
        //   router.push(data.screen);
        // }
      }
    );

    // Cleanup
    return () => {
      notificationListener.remove();
    };
  }, []);

  // ─── Your existing token loading logic ───────────────────────────────────
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setUserToken(token);
      } catch (e) {
        console.log('Error reading token', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  if (!loaded || isLoading) {
    return null; // or <SplashScreen /> if you use expo-splash-screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="Home" />
          <Stack.Screen name="(tabs)/Home" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}