import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Alert
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

      // 1. Capture the subscription in a variable
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      // 2. Use .remove() in the cleanup function
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
    // You might want to refresh your dashboard data here
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.shopName}>{profileData.firstName || 'Shop Owner'}</Text>
          <View style={styles.shopLocationContainer}>
            <MaterialIcons name="location-on" size={14} color="#64748B" />
            <Text style={styles.shopLocation}>{profileData.city || 'Your City'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/Screens/Shop/ProfileScreen')}
        >
          <MaterialIcons name="account-circle" size={32} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Dashboard />
      </ScrollView>

      {/* Floating Action Button */}
      {/* <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/Components/Shop/AddShop')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity> */}

      {/* Add Shop Modal */}
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
            
            {/* <AddShop onShopAdded={handleShopAdded} /> */}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  shopLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  shopLocation: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  profileButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
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