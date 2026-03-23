import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { savePushToken } from './api/Service/User';

import { useColorScheme } from '@/hooks/useColorScheme';

// ─── Notification Handler ────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // ─── Get & Log Expo Push Token ───────────────────────────────────────────
 // Don't forget to import your API function at the top of the file!
// import { savePushToken } from '../path-to-your-api-file';

 useEffect(() => {
    const registerForPushNotifications = async () => {
      // 1. Only run on physical devices
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        Alert.alert('Development', 'Push notifications only work on real devices');
        return;
      }

      // 2. Android channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // 3. Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // 4. Get Expo Push Token
      try {
        const projectId = 
          Constants?.expoConfig?.extra?.eas?.projectId ?? 
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.error('EAS projectId not found in app config');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        const expoPushToken = tokenData.data;

        // Log to terminal
        console.log('\n====================================');
        console.log('Expo Push Token:', expoPushToken);
        console.log('====================================\n');

        // ✅ Save locally to AsyncStorage (API call removed)
        await AsyncStorage.setItem('expoPushToken', expoPushToken);
        console.log('Token successfully saved to AsyncStorage.');

      } catch (error) {
        console.error('Failed to get push token:', error);
      }
    };

    // Run the function
    registerForPushNotifications();

    // ─── Listen for Notification Taps ─────────────────────────────
    const notificationListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped!', data);
      }
    );

    return () => {
      notificationListener.remove();
    };
  }, []);

  // ─── Your existing access token loading ───────────────────────────────────
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
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="Home" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)/Home" options={{ gestureEnabled: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}