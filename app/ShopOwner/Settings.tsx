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

// ────────────────────────────────────────────────
// Logout helper function - FIXED
// ────────────────────────────────────────────────
const performLogout = async (navigation: any) => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'shopId', 'refreshToken']);
    // You can add more keys if you store others (userId, etc.)

    // FIX: Use navigation.replace() instead of reset()
    // This will clear the navigation stack and redirect to Home
    navigation.replace('Home');
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
          <MaterialIcons name="person" size={20} color="#4F46E5" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.BarberName}</Text>
          <Text style={styles.itemDetail}>From {item.From}</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingBarber(item);
          setEditBarberName(item.BarberName);
          setEditFrom(item.From);
          setShowEditBarberModal(true);
        }}>
          <Ionicons name="create-outline" size={18} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteBarber(item._id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderService = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.listItem, index === services.length - 1 && styles.lastItem]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <MaterialIcons name="content-cut" size={20} color="#4F46E5" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.ServiceName}</Text>
          <Text style={styles.itemDetail}>₹{item.Rate} • {item.duration}</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingService(item);
          setEditServiceName(item.ServiceName);
          setEditServicePrice(item.Rate.toString());
          setEditServiceDuration(item.duration.toString());
          setShowEditServiceModal(true);
        }}>
          <Ionicons name="create-outline" size={18} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteService(item._id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
        {/* Shop Info */}
        {shopData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <MaterialIcons name="store" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.sectionTitle}>Shop Information</Text>
              </View>
            </View>

            <View style={styles.shopInfoContainer}>
              <View style={styles.shopRow}>
                <View style={styles.shopItem}>
                  <Text style={styles.label}>Shop Name</Text>
                  <Text style={styles.value}>{shopData.ShopName}</Text>
                </View>
                <View style={styles.shopItem}>
                  <Text style={styles.label}>City</Text>
                  <Text style={styles.value}>{shopData.City}</Text>
                </View>
              </View>

              <View style={styles.shopRow}>
                <View style={styles.shopItem}>
                  <Text style={styles.label}>Mobile</Text>
                  <Text style={styles.value}>{shopData.Mobile}</Text>
                </View>
                <View style={styles.shopItem}>
                  <Text style={styles.label}>Timing</Text>
                  <Text style={styles.value}>{shopData.Timing}</Text>
                </View>
              </View>

              {shopData.website && (
                <View style={styles.shopRow}>
                  <View style={styles.shopItemFull}>
                    <Text style={styles.label}>Website</Text>
                    <Text style={styles.value}>{shopData.website}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Barbers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="people" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{barbers.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowBarberModal(true)}>
              <MaterialIcons name="person-add" size={16} color="white" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

       <View style={styles.listWrapper}>
  {barbers.length === 0 ? (
    <View style={styles.empty}>
      <MaterialIcons name="person-add" size={48} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No barbers yet</Text>
      <Text style={styles.emptyText}>Add your first team member</Text>
      
      <View style={styles.activationNotice}>
        <MaterialIcons name="info-outline" size={20} color="#F59E0B" />
        <Text style={styles.activationText}>
          Your shop is not activated. To activate, add at least one barber or you can be a barber in your shop.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.becomeBarberButton}
        onPress={becomeBarber}
      >
        <MaterialIcons name="person" size={20} color="#FFFFFF" />
        <Text style={styles.becomeBarberButtonText}>Become a Barber</Text>
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

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="content-cut" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.sectionTitle}>Services & Pricing</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{services.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowServiceModal(true)}>
              <MaterialIcons name="add-circle-outline" size={16} color="white" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listWrapper}>
            {services.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="content-cut" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No services yet</Text>
                <Text style={styles.emptyText}>Add your services & prices</Text>
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

        {/* Working Hours Button */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.workingHoursBtn}
            onPress={() => navigation.navigate('Screens/Shop/WorkingHoursScreen')}
          >
            <MaterialIcons name="access-time" size={24} color="#4F46E5" />
            <Text style={styles.workingHoursText}>Manage Working Hours</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Logout when shop exists */}
        <TouchableOpacity
          style={styles.logoutFull}
          onPress={() => performLogout(navigation)}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutFullText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },

  // No shop screen
  noShopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noShopCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  noShopTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
  },
  noShopSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
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
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },

  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addBtnText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },

  shopInfoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shopRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  shopItem: {
    flex: 1,
    marginRight: 16,
  },
  shopItemFull: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },

  listWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 3,
  },
  itemDetail: {
    fontSize: 14,
    color: '#64748b',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ecfdf5',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },

  bottomAction: {
    marginTop: 12,
    marginBottom: 20,
  },
  workingHoursBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  workingHoursText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 14,
  },

  logoutFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutFullText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  form: {
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
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
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confirmBtn: {
    backgroundColor: '#4f46e5',
  },
  cancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  activationNotice: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#FEF3C7',
  padding: 12,
  borderRadius: 8,
  marginTop: 16,
  marginHorizontal: 16,
  gap: 8,
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
  backgroundColor: '#3B82F6',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  marginTop: 16,
  marginHorizontal: 16,
  gap: 8,
},
becomeBarberButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
});