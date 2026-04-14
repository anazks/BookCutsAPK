import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin
} from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { getmyProfile } from '../api/Service/User';
import { useTabBar } from '../context/TabBarContext';
import { useAppTheme } from '../context/ThemeContext';
import TransparentInfoCard from '../Components/Home/TransparentInfoCard';


interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  referralCode?: string;
}

export default function Profile() {
  const { theme } = useAppTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const { tabBarOffset } = useTabBar();
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;

      if (currentScrollY <= 0) {
        tabBarOffset.value = withTiming(0, { duration: 200 });
      } else if (currentScrollY > lastScrollY.value + 5) {
        tabBarOffset.value = withTiming(100, { duration: 200 }); // hide
      } else if (currentScrollY < lastScrollY.value - 5) {
        tabBarOffset.value = withTiming(0, { duration: 200 }); // show
      }

      lastScrollY.value = currentScrollY;
    },
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // getmyProfile might need a token or something, but usually it takes it from AsyncStorage in the service
      const response = await getmyProfile();
      console.log("profile data:", JSON.stringify(response, null, 2));
      if (response && response.success) {
        setUserData(response.user);
      } else {
        setError(response?.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const authProvider = await AsyncStorage.getItem('authProvider');
            if (authProvider === 'google') {
              try {
                const isGoogleSignedIn = await (GoogleSignin as any).isSignedIn();
                if (isGoogleSignedIn) {
                  await GoogleSignin.revokeAccess();
                  await GoogleSignin.signOut();
                }
              } catch (googleErr: any) {
                if (googleErr.code !== 'SIGN_IN_REQUIRED') console.log('Google sign-out failed:', googleErr);
              }
            }
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/');
          } catch (error) {
            console.error('Logout Error:', error);
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.accent }]}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: 'transparent' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.accent} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]} onPress={fetchProfile}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Small Profile Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.topHeaderGreeting}>Settings</Text>
          <Text style={styles.topHeaderEmail}>{userData?.email || 'My Profile'}</Text>
        </View>
        <TouchableOpacity style={styles.smallAvatar}>
          <Text style={styles.smallAvatarText}>
             {userData?.firstName?.[0]}{userData?.lastName?.[0]}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Section */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() =>
              router.push({
                pathname: '/Screens/User/Bookings',
                params: { referralCode: userData?.referralCode },
              })
            }
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#1877F215' }]}>
              <Ionicons name="calendar-outline" size={20} color="#1877F2" />
            </View>
            <Text style={styles.gridCardText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() =>
              router.push({
                pathname: '/Screens/User/ReferralDetails',
                params: { referralCode: userData?.referralCode },
              })
            }
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#EAB30815' }]}>
              <Ionicons name="gift-outline" size={20} color="#EAB308" />
            </View>
            <Text style={styles.gridCardText}>Refer & Reward</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/Screens/User/Payment')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="wallet-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.gridCardText}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#8B5CF615' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.gridCardText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/Screens/User/Support')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#F9731615' }]}>
              <Ionicons name="help-buoy-outline" size={20} color="#F97316" />
            </View>
            <Text style={styles.gridCardText}>Help & Support</Text>
          </TouchableOpacity>

          {/* Dummy Option */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {}}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#06B6D415' }]}>
              <Ionicons name="notifications-outline" size={20} color="#06B6D4" />
            </View>
            <Text style={styles.gridCardText}>Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info card */}
        <TransparentInfoCard />

        {/* Logout Section */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  /* Top Profile Header */
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topHeaderLeft: {
    flex: 1,
  },
  topHeaderGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  topHeaderEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  smallAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  smallAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1, 
    paddingBottom: 110 // Increased padding to clear bottom tab bar
  },

  /* Grid Section */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  gridIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },

  /* Logout */
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 'auto',
    paddingBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Loading / Error */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1877F2',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#1877F2',
    borderRadius: 14,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});