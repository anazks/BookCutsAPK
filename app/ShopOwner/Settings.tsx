import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { AddBarber, AddService, viewMyBarbers, viewMyService, viewMyShop } from '../api/Service/Shop'

export default function Settings() {
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [shopData, setShopData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showBarberModal, setShowBarberModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  
  // Form states
  const [barberName, setBarberName] = useState('')
  const [from, setFrom] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('')

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch shop data first
      console.log('Fetching shop data...')
      const shopResponse = await viewMyShop()
      console.log('Shop Response:', JSON.stringify(shopResponse, null, 2))
      
      if (shopResponse && shopResponse.data) {
        setShopData(shopResponse.data)
        console.log('Shop data set:', shopResponse.data)
        
        // Store shop ID globally in AsyncStorage
        await AsyncStorage.setItem('shopId', shopResponse.data._id)
        console.log('Shop ID stored:', shopResponse.data._id)
      } else {
        console.log('No shop data found in response')
      }
      
      // Fetch other data
      const barbersData = await viewMyBarbers()
      const servicesData = await viewMyService()
      
      console.log('Barbers:', barbersData)
      console.log('Services:', servicesData)
      
      setBarbers(barbersData?.data || [])
      setServices(servicesData?.data || [])
      
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data: ' + error.message)
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBarber = async () => {
    if (!barberName.trim() || !from.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId')
      
      const newBarber = {
        BarberName: barberName.trim(),
        From: from.trim(),
        shopId: shopId // Include shop ID in the request
      }

      const addedBarber = await AddBarber(newBarber)
      setBarbers([...barbers, addedBarber])
      setBarberName('')
      setFrom('')
      setShowBarberModal(false)
      Alert.alert('Success', 'Barber added successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to add barber')
      console.error(error)
    }
  }

  const addService = async () => {
    if (!serviceName.trim() || !servicePrice || !serviceDuration.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    try {
      const shopId = await AsyncStorage.getItem('shopId')
      
      const newService = {
        ServiceName: serviceName.trim(),
        Rate: servicePrice,
        Duration: serviceDuration.trim(),
        shopId: shopId // Include shop ID in the request
      }

      const addedService = await AddService(newService)
      setServices([...services, addedService])
      setServiceName('')
      setServicePrice('')
      setServiceDuration('')
      setShowServiceModal(false)
      Alert.alert('Success', 'Service added successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to add service')
      console.error(error)
    }
  }

  const deleteBarber = async (id) => {
    Alert.alert(
      'Delete Barber',
      'Are you sure you want to delete this barber?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call your API to delete barber
              // await deleteBarberAPI(id)
              setBarbers(barbers.filter(barber => barber.id !== id))
              Alert.alert('Success', 'Barber deleted successfully')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete barber')
              console.error(error)
            }
          }
        }
      ]
    )
  }

  const deleteService = async (id) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call your API to delete service
              // await deleteServiceAPI(id)
              setServices(services.filter(service => service.id !== id))
              Alert.alert('Success', 'Service deleted successfully')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service')
              console.error(error)
            }
          }
        }
      ]
    )
  }

  const editBarber = (id) => {
    // Implement edit barber functionality
    console.log('Edit barber:', id)
  }

  const editService = (id) => {
    // Implement edit service functionality
    console.log('Edit service:', id)
  }

  const renderBarberItem = ({ item, index }) => (
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
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editBarber(item.id)}
        >
          <Ionicons name="create-outline" size={18} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteBarber(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderServiceItem = ({ item, index }) => (
    <View style={[styles.listItem, index === services.length - 1 && styles.lastItem]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <MaterialIcons name="content-cut" size={20} color="#4F46E5" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.ServiceName}</Text>
          <Text style={styles.itemDetail}>₹{item.Rate} • {item.Duration}</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editService(item.id)}
        >
          <Ionicons name="create-outline" size={18} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteService(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <MaterialIcons name="hourglass-empty" size={32} color="#4F46E5" />
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Professional Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Salon Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your business configuration</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="settings" size={24} color="#4F46E5" />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Shop Info Section */}
        {shopData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIcon}>
                  <MaterialIcons name="store" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.sectionTitle}>Shop Information</Text>
              </View>
            </View>
            
            <View style={styles.shopInfoGrid}>
              <View style={styles.shopInfoRow}>
                <View style={styles.shopInfoItem}>
                  <Text style={styles.shopInfoLabel}>Shop Name</Text>
                  <Text style={styles.shopInfoValue}>{shopData.ShopName}</Text>
                </View>
                
                <View style={styles.shopInfoItem}>
                  <Text style={styles.shopInfoLabel}>City</Text>
                  <Text style={styles.shopInfoValue}>{shopData.City}</Text>
                </View>
              </View>
              
              <View style={styles.shopInfoRow}>
                <View style={styles.shopInfoItem}>
                  <Text style={styles.shopInfoLabel}>Mobile</Text>
                  <Text style={styles.shopInfoValue}>{shopData.Mobile}</Text>
                </View>
                
                <View style={styles.shopInfoItem}>
                  <Text style={styles.shopInfoLabel}>Timing</Text>
                  <Text style={styles.shopInfoValue}>{shopData.Timing}</Text>
                </View>
              </View>
              
              {shopData.website && (
                <View style={styles.shopInfoRow}>
                  <View style={[styles.shopInfoItem, { flex: 1 }]}>
                    <Text style={styles.shopInfoLabel}>Website</Text>
                    <Text style={styles.shopInfoValue}>{shopData.website}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Barbers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="people" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{barbers.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowBarberModal(true)}
            >
              <MaterialIcons name="person-add" size={16} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.listContainer}>
            {barbers.length > 0 ? (
              <FlatList
                data={barbers}
                renderItem={renderBarberItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="person-add" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No team members yet</Text>
                <Text style={styles.emptySubtitle}>Add your first barber to get started</Text>
              </View>
            )}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="content-cut" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.sectionTitle}>Services & Pricing</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{services.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowServiceModal(true)}
            >
              <MaterialIcons name="add-circle-outline" size={16} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.listContainer}>
            {services.length > 0 ? (
              <FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="content-cut" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No services added</Text>
                <Text style={styles.emptySubtitle}>Add your services and pricing</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Barber Modal */}
      <Modal
        visible={showBarberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBarberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Team Member</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowBarberModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter barber's name"
                  value={barberName}
                  onChangeText={setBarberName}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mumbai, India"
                  value={from}
                  onChangeText={setFrom}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowBarberModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={addBarber}
                >
                  <Text style={styles.confirmButtonText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Service</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Service Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Haircut, Beard Trim"
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="299"
                    value={servicePrice}
                    onChangeText={setServicePrice}
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30 min"
                    value={serviceDuration}
                    onChangeText={setServiceDuration}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={addService}
                >
                  <Text style={styles.confirmButtonText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '400',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  shopInfoGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shopInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  shopInfoItem: {
    flex: 1,
    marginRight: 16,
  },
  shopInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  shopInfoValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ECFDF5',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderColor: '#E2E8F0',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
})