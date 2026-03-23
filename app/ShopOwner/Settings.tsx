import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AddBarber,
  AddService,
  deleteBarberAPI,
  deleteServiceAPI,
  modifyBarber,
  modifyService,
  viewMyBarbers,
  viewMyService,
  viewMyShop,
  ownerToBarber
} from '../api/Service/Shop';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ────────────────────────────────────────────────
// Logout helper function - FIXED
// ────────────────────────────────────────────────
const performLogout = async (navigation: any) => {
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
    
    // Reset navigation stack to Home to prevent back-swipe
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  } catch (error) {
    console.error('Logout failed:', error);
    Alert.alert('Error', 'Failed to logout. Please try again.');
  }
};

// ────────────────────────────────────────────────
// No Shop Screen Component
// ────────────────────────────────────────────────
const NoShopScreen = ({ navigation }: { navigation: any }) => (
  <SafeAreaView style={styles.container}>
    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

    <View style={styles.noShopContainer}>
      <View style={styles.noShopCard}>
        <MaterialIcons name="storefront" size={80} color="#CBD5E1" />
        <Text style={styles.noShopTitle}>Setup Your Salon</Text>
        <Text style={styles.noShopSubtitle}>
          Create your shop profile to start managing barbers and services
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Components/Shop/AddShop')}
        >
          <MaterialIcons name="add-business" size={24} color="white" />
          <Text style={styles.buttonText}>Create Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => performLogout(navigation)}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

// ────────────────────────────────────────────────
// Main Settings Component
// ────────────────────────────────────────────────
export default function Settings() {
  const navigation = useNavigation<any>();

  const [hasShop, setHasShop] = useState<boolean | null>(null); // null = still checking
  const [shopData, setShopData] = useState<any>(null);

  // ────────────────────────────────────────────────
  // Barber & Service states
  // ────────────────────────────────────────────────
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopID] = useState(null);


  // Add Barber modal
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [barberName, setBarberName] = useState('');
  const [from, setFrom] = useState('');

  // Edit Barber modal
  const [showEditBarberModal, setShowEditBarberModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [editBarberName, setEditBarberName] = useState('');
  const [editFrom, setEditFrom] = useState('');

  // Add Service modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  // Edit Service modal
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('');
  const [editServiceDuration, setEditServiceDuration] = useState('');

  // ────────────────────────────────────────────────
  // Check shop existence on mount
  // ────────────────────────────────────────────────
  useEffect(() => {
    const initialize = async () => {
      try {
        const shopId = await AsyncStorage.getItem('shopId');
        if (!shopId) {
          setHasShop(false);
          return;
        }

        // Try to fetch shop data
        const shopResponse = await viewMyShop();

        if (shopResponse?.data?._id) {
          setShopData(shopResponse.data);
          setHasShop(true);
        } else {
          // Token exists but no valid shop → clear shopId
          await AsyncStorage.removeItem('shopId');
          setHasShop(false);
        }
      } catch (err) {
        console.error('Shop check failed:', err);
        setHasShop(false);
      }
    };

    initialize();
  }, []);

  // Load barbers + services only when shop exists
  useEffect(() => {
    if (hasShop === true) {
      fetchShopData();
    }
  }, [hasShop]);

const fetchShopData = async () => {
  try {
    setLoading(true);

    // Fetch barbers
    try {
      const barbersRes = await viewMyBarbers();
      console.log('Barbers Response:', barbersRes);
      
      if (barbersRes?.success && Array.isArray(barbersRes.data)) {
        setBarbers(barbersRes.data);
      } else {
        setBarbers([]);
      }
    } catch (barberError) {
      console.log('Barbers error:', barberError);
      setBarbers([]);
    }

    // Fetch services - SPECIAL HANDLING FOR 404
    try {
      const servicesRes = await viewMyService();
      console.log('Services Response:', servicesRes);
      
      if (servicesRes?.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      } else {
        setServices([]);
      }
    } catch (serviceError: any) {
      console.log('Services error caught:', serviceError);
      
      // Check if it's a 404 "No services found" error
      if (serviceError?.message?.includes("No services found") || 
          serviceError?.success === false) {
        // This is expected - shop has no services yet
        console.log('Shop has no services yet - this is normal');
        setServices([]);
      } else {
        // Real error
        console.log('Real services error:', serviceError);
        setServices([]);
      }
    }

  } catch (error) {
    console.log('Unexpected error:', error);
  } finally {
    setLoading(false);
  }
};1
  // ────────────────────────────────────────────────
  // Add Barber
  // ────────────────────────────────────────────────
  const addBarber = async () => {
    if (!barberName.trim() || !from.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId');
      const payload = {
        BarberName: barberName.trim(),
        From: from.trim(),
        shopId,
      };

      const res = await AddBarber(payload);
      const newBarber = res.data || res;

      setBarbers((prev) => [...prev, newBarber]);

      setBarberName('');
      setFrom('');
      setShowBarberModal(false);

      Alert.alert('Success', 'Barber added');
    } catch (err) {
      Alert.alert('Error', 'Failed to add barber');
      console.error(err);
    }
  };


const becomeBarber = async () => {
  try {
    Alert.alert(
      'Become a Barber',
      'Are you sure you want to register yourself as a barber in your shop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const shopId = await AsyncStorage.getItem('shopId');
              if (!shopId) {
                Alert.alert('Error', 'Shop ID not found');
                return;
              }

              await ownerToBarber(shopId); // just fire & forget

              // Re-fetch the full updated list (most reliable)
              const barbersRes = await viewMyBarbers();
              setBarbers(barbersRes?.data || []);

              Alert.alert('Success', 'You are now a barber in your shop!');
            } catch (err) {
              Alert.alert('Error', 'Failed to register as barber');
              console.error(err);
            }
          },
        },
      ]
    );
  } catch (err) {
    Alert.alert('Error', 'Something went wrong');
    console.error(err);
  }
};

  // ────────────────────────────────────────────────
  // Update Barber
  // ────────────────────────────────────────────────
  const updateBarber = async () => {
    if (!editBarberName.trim() || !editFrom.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId');
      const payload = {
        BarberName: editBarberName.trim(),
        From: editFrom.trim(),
        shopId,
      };

      await modifyBarber(editingBarber._id, payload);

      setBarbers((prev) =>
        prev.map((b) =>
          b._id === editingBarber._id ? { ...b, ...payload } : b
        )
      );

      setEditingBarber(null);
      setEditBarberName('');
      setEditFrom('');
      setShowEditBarberModal(false);

      Alert.alert('Success', 'Barber updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update barber');
      console.error(err);
    }
  };

  // ────────────────────────────────────────────────
  // Delete Barber
  // ────────────────────────────────────────────────
  const deleteBarber = async (id: string) => {
    Alert.alert('Delete Barber', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const shopId = await AsyncStorage.getItem('shopId');
            await deleteBarberAPI(id,shopId);
            setBarbers((prev) => prev.filter((b) => b._id !== id));
            Alert.alert('Success', 'Barber deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete barber');
            console.error(err);
          }
        },
      },
    ]);
  };

  // ────────────────────────────────────────────────
  // Add Service
  // ────────────────────────────────────────────────
  const addService = async () => {
    if (!serviceName.trim() || !servicePrice || !serviceDuration.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId');
      const payload = {
        ServiceName: serviceName.trim(),
        Rate: servicePrice,
        duration: serviceDuration.trim(),
        shopId,
      };

      const res = await AddService(payload);
      const newService = res.data || res;

      setServices((prev) => [...prev, newService]);

      setServiceName('');
      setServicePrice('');
      setServiceDuration('');
      setShowServiceModal(false);

      Alert.alert('Success', 'Service added');
    } catch (err) {
      Alert.alert('Error', 'Failed to add service');
      console.error(err);
    }
  };

  // ────────────────────────────────────────────────
  // Update Service
  // ────────────────────────────────────────────────
  const updateService = async () => {
    if (!editServiceName.trim() || !editServicePrice || !editServiceDuration.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId');
      const payload = {
        ServiceName: editServiceName.trim(),
        Rate: editServicePrice,
        Duration: editServiceDuration.trim(),
        shopId,
      };

      await modifyService(editingService._id, payload);

      setServices((prev) =>
        prev.map((s) =>
          s._id === editingService._id ? { ...s, ...payload } : s
        )
      );

      setEditingService(null);
      setEditServiceName('');
      setEditServicePrice('');
      setEditServiceDuration('');
      setShowEditServiceModal(false);

      Alert.alert('Success', 'Service updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update service');
      console.error(err);
    }
  };

  // ────────────────────────────────────────────────
  // Delete Service
  // ────────────────────────────────────────────────
  const deleteService = async (id: string) => {
    Alert.alert('Delete Service', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteServiceAPI(id);
            setServices((prev) => prev.filter((s) => s._id !== id));
            Alert.alert('Success', 'Service deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete service');
            console.error(err);
          }
        },
      },
    ]);
  };

  // ────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────
  const renderBarber = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.listItem, index === barbers.length - 1 && styles.lastItem]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <MaterialIcons name="person" size={20} color="#000000" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.BarberName}</Text>
          <Text style={styles.itemDetail}>From {item.From}</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => {
          setEditingBarber(item);
          setEditBarberName(item.BarberName);
          setEditFrom(item.From);
          setShowEditBarberModal(true);
        }}>
          <Ionicons name="create-outline" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => deleteBarber(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderService = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.listItem, index === services.length - 1 && styles.lastItem]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <MaterialIcons name="content-cut" size={18} color="#000000" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.ServiceName}</Text>
          <Text style={styles.itemDetail}>₹{item.Rate} • {item.Duration || item.duration}</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => {
          setEditingService(item);
          setEditServiceName(item.ServiceName);
          setEditServicePrice(item.Rate.toString());
          setEditServiceDuration((item.Duration || item.duration || '').toString());
          setShowEditServiceModal(true);
        }}>
          <Ionicons name="create-outline" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => deleteService(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ────────────────────────────────────────────────
  // Loading / No shop / Normal states
  // ────────────────────────────────────────────────
  if (hasShop === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialIcons name="hourglass-empty" size={40} color="#4F46E5" />
          <Text style={styles.loadingText}>Checking account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasShop === false) {
    return <NoShopScreen navigation={navigation} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialIcons name="hourglass-empty" size={36} color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your salon...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ────────────────────────────────────────────────
  // Main screen (has shop)
  // ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile / Shop Header */}
        {shopData && (
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {shopData.ShopName ? shopData.ShopName.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <Text style={styles.profileName}>{shopData.ShopName}</Text>
            <Text style={styles.profileSub}>{shopData.City} • {shopData.Mobile}</Text>
            <Text style={styles.profileTiming}>{shopData.Timing}</Text>
            {shopData.website ? <Text style={styles.profileLink}>{shopData.website}</Text> : null}
          </View>
        )}

        <View style={styles.settingsGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>TEAM MEMBERS</Text>
            <TouchableOpacity onPress={() => setShowBarberModal(true)}>
              <Text style={styles.groupAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.groupContent}>
            {barbers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No team members added.</Text>
                <TouchableOpacity onPress={becomeBarber}>
                  <Text style={styles.emptyLink}>Become a Barber</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={barbers}
                renderItem={renderBarber}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>

        <View style={styles.settingsGroup}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>SERVICES & PRICING</Text>
            <TouchableOpacity onPress={() => setShowServiceModal(true)}>
              <Text style={styles.groupAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.groupContent}>
            {services.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No services added.</Text>
              </View>
            ) : (
              <FlatList
                data={services}
                renderItem={renderService}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>

        <View style={[styles.settingsGroup, { marginTop: 24 }]}>
          <View style={styles.groupContent}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Screens/Shop/WorkingHoursScreen')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="access-time" size={20} color="#000000" />
              </View>
              <Text style={styles.menuRowText}>Manage Working Hours</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => performLogout(navigation)}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuRowText, { color: '#EF4444' }]}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ──────────────────────────────────────────────── */}
      {/*           MODALS - Add / Edit Barber & Service       */}
      {/* ──────────────────────────────────────────────── */}

      {/* Add Barber Modal */}
      <Modal visible={showBarberModal} animationType="slide" transparent onRequestClose={() => setShowBarberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Barber</Text>
              <TouchableOpacity onPress={() => {
                setBarberName('');
                setFrom('');
                setShowBarberModal(false);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Barber Name</Text>
                <TextInput
                  style={styles.input}
                  value={barberName}
                  onChangeText={setBarberName}
                  placeholder="Enter name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>From (City / Region)</Text>
                <TextInput
                  style={styles.input}
                  value={from}
                  onChangeText={setFrom}
                  placeholder="e.g. Kochi, Thrissur"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setBarberName('');
                  setFrom('');
                  setShowBarberModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={addBarber}>
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Barber Modal */}
      <Modal visible={showEditBarberModal} animationType="slide" transparent onRequestClose={() => setShowEditBarberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Barber</Text>
              <TouchableOpacity onPress={() => {
                setEditBarberName('');
                setEditFrom('');
                setEditingBarber(null);
                setShowEditBarberModal(false);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Barber Name</Text>
                <TextInput
                  style={styles.input}
                  value={editBarberName}
                  onChangeText={setEditBarberName}
                  placeholder="Enter name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>From (City / Region)</Text>
                <TextInput
                  style={styles.input}
                  value={editFrom}
                  onChangeText={setEditFrom}
                  placeholder="e.g. Kochi, Thrissur"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setEditBarberName('');
                  setEditFrom('');
                  setEditingBarber(null);
                  setShowEditBarberModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={updateBarber}>
                <Text style={styles.confirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Service Modal */}
      <Modal visible={showServiceModal} animationType="slide" transparent onRequestClose={() => setShowServiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity onPress={() => {
                setServiceName('');
                setServicePrice('');
                setServiceDuration('');
                setShowServiceModal(false);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Service Name</Text>
                <TextInput
                  style={styles.input}
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="e.g. Haircut, Shaving"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={serviceDuration}
                  onChangeText={setServiceDuration}
                  placeholder="e.g. 30 mins, 1 hour"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setServiceName('');
                  setServicePrice('');
                  setServiceDuration('');
                  setShowServiceModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={addService}>
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Service Modal */}
      <Modal visible={showEditServiceModal} animationType="slide" transparent onRequestClose={() => setShowEditServiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Service</Text>
              <TouchableOpacity onPress={() => {
                setEditServiceName('');
                setEditServicePrice('');
                setEditServiceDuration('');
                setEditingService(null);
                setShowEditServiceModal(false);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Service Name</Text>
                <TextInput
                  style={styles.input}
                  value={editServiceName}
                  onChangeText={setEditServiceName}
                  placeholder="e.g. Haircut, Shaving"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={editServicePrice}
                  onChangeText={setEditServicePrice}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={editServiceDuration}
                  onChangeText={setEditServiceDuration}
                  placeholder="e.g. 30 mins, 1 hour"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setEditServiceName('');
                  setEditServicePrice('');
                  setEditServiceDuration('');
                  setEditingService(null);
                  setShowEditServiceModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={updateService}>
                <Text style={styles.confirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },

  // No shop screen
  noShopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  noShopCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  noShopTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 24,
    marginBottom: 12,
  },
  noShopSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 80,
  },

  profileHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSub: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileTiming: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    textAlign: 'center',
  },

  settingsGroup: {
    marginTop: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  groupAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  groupContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // Empty states
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptyLink: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 14,
    color: '#64748B',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
  },

  // Menu Rows (Working Hours / Logout)
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 16,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },

  // Modal Styles remain largely similar to match the app
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  confirmBtn: {
    backgroundColor: '#000000',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Added Notice Styles
  activationNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  activationText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  becomeBarberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  becomeBarberButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});