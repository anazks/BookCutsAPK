import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getmyProfile } from '../api/Service/User';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
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
                  const isGoogleSignedIn = await GoogleSignin.isSignedIn();
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
              router.replace('/Screens/User/Login');
            } catch (error) {
              console.error('Logout Error:', error);
              await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
              router.replace('/Screens/User/Login');
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

      {/* ── Hero Header ── */}
      <View style={styles.heroHeader}>
        {/* Avatar + name inside hero */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
              
        {/* ── Menu Section ── */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

           <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push({
                pathname: '/Screens/User/PayoutScreen',
                params: { referralCode: userData?.referralCode },
              })
            }
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="calendar-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Payout</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
          </TouchableOpacity>

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
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="calendar-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Bookings</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
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
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="gift-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Refer & Reward</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/Screens/User/Payment')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="wallet-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Payment Methods</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
          </TouchableOpacity>

         

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Privacy & Policy</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/Screens/User/Support')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#1877F2" />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color="#1877F2" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },

  /* ── Hero Header ── */
  heroHeader: {
    backgroundColor: '#1877F2',
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#0D4FB5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  onlineIndicator: {
    position: 'absolute',
    right: '34%',
    top: 68,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1877F2',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  locationPillText: {
    fontSize: 12,
    color: '#1877F2',
    fontWeight: '600',
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  /* ── Stats ── */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1877F2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#DBEAFE',
    alignSelf: 'center',
  },

  /* ── Quick Actions ── */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1877F2',
  },

  /* ── Menu ── */
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1877F2',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4FF',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  /* ── Logout ── */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* ── Loading / Error ── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1877F2',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#EEF4FF',
  },
  errorText: {
    fontSize: 16,
    color: '#1877F2',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#1877F2',
    borderRadius: 14,
    shadowColor: '#0D4FB5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});