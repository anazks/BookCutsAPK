import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform
} from 'react-native';
import { getMyProfile } from '../api/Service/ShoperOwner';
import Dashboard from '../Components/Shop/Dashboard';

export default function ShopOwnerHome() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const [profileData, setProfileData] = useState({
    firstName: '',
    mobileNo: '',
    city: ''
  });
  const [loading, setLoading] = useState(true);
  const [showAddShopModal, setShowAddShopModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        console.log("Profile data fetched:", JSON.stringify(response));
        if (response.success && response.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleShopAdded = () => {
    setShowAddShopModal(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* ── Modern Standard Header ── */}
      <View style={styles.headerWrap}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            
            {/* Left: Greeting & Location */}
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.shopName} numberOfLines={1}>
                {profileData.firstName || 'Shop Owner'}
              </Text>
              
              <View style={styles.locationBadge}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {profileData.city || 'Your City'}
                </Text>
              </View>
            </View>

            {/* Right: Actions */}
            <View style={styles.headerActions}>
              {/* Notification Bell */}
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => router.push('/Screens/User/Notifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={22} color="#475569" />
                <View style={styles.unreadDot} />
              </TouchableOpacity>

              {/* Profile Button */}
              <TouchableOpacity 
                style={styles.profileBtn}
                onPress={() => router.push('/Screens/Shop/ProfileScreen')}
                activeOpacity={0.8}
              >
                <Text style={styles.profileInitials}>
                  {(profileData.firstName || 'S').charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Dashboard />
      </ScrollView>

      {/* ── Add Shop Modal ── */}
      <Modal
        visible={showAddShopModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddShopModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.push('/Components/Shop/AddShop')}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // ── Header Styling ──
  headerWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    maxWidth: 140,
  },
  
  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ── Scroll Content ──
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  
  // ── Modals ──
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
});