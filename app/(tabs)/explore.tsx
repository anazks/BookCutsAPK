import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getmyProfile } from '../api/Service/User';
import { useNavigation } from '@react-navigation/native';
import Animated, { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTabBar } from '../context/TabBarContext';


interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  referralCode?: string;
}

export default function Profile() {
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
                  if (googleErr.code !== 'SIGN_IN_REQUIRED') {
                    console.log('Google sign-out failed:', googleErr);
                  }
                }
              }
              await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
              
              // Use navigation.reset for a clean break
              navigation.reset({
                index: 0,
                routes: [{ name: 'Screens/User/Login' }],
              });
            } catch (error) {
              console.error('Logout Error:', error);
              await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Screens/User/Login' }],
              });
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#1877F2" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </Text>
            </View>
          </View>
          <View style={styles.onlineIndicator} />
          <Text style={styles.heroName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.heroEmail}>{userData?.email}</Text>
          {userData?.city ? (
            <View style={styles.locationPill}>
              <Ionicons name="location-sharp" size={12} color="#1877F2" />
              <Text style={styles.locationPillText}>{userData.city}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push({
                pathname: '/Screens/User/Bookings',
                params: { referralCode: userData?.referralCode },
              })
            }
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="calendar-outline" size={20} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push({
                pathname: '/Screens/User/ReferralDetails',
                params: { referralCode: userData?.referralCode },
              })
            }
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="gift-outline" size={20} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Refer & Reward</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/Screens/User/Payment')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="wallet-outline" size={20} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Privacy & Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/Screens/User/Support')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  /* Hero Header */
  heroHeader: {
    backgroundColor: '#1877F2',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    right: '32%',
    top: 68,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#1877F2',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 12,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  locationPillText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 100
  },

  /* Menu Section */
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    flex: 1,
  },

  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
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