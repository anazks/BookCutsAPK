// ProfileScreen.js - Modern UI with API Integration
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageUploadModal from './ImageUploadModel'; 
import { viewMyShop } from '../../api/Service/Shop'; // Import your API function

const API_BASE_URL = 'http://192.168.29.81:3002/api';

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_BG = '#FFF8F8';

// --- REUSABLE DETAIL ROW COMPONENT ---
const DetailRow = ({ icon, label, value, color = '#333' }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconBox}>
      <Ionicons name={icon} size={18} color={PRIMARY_COLOR} />
    </View>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  </View>
);

// --- PROFILE IMAGE MODAL ---
const ProfileImageModal = ({ visible, onClose, hasProfileImage, onSelectImage }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.profileModalCard}>
        <Text style={styles.profileModalTitle}>
          {hasProfileImage ? 'Change Profile Picture' : 'Add Profile Picture'}
        </Text>
        
        <TouchableOpacity 
          style={styles.profileModalOption}
          onPress={() => {
            onSelectImage('camera');
            onClose();
          }}
        >
          <Ionicons name="camera" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.profileModalOptionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileModalOption}
          onPress={() => {
            onSelectImage('gallery');
            onClose();
          }}
        >
          <Ionicons name="images" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.profileModalOptionText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {hasProfileImage && (
          <TouchableOpacity 
            style={[styles.profileModalOption, styles.deleteOption]}
            onPress={() => {
              onSelectImage('delete');
              onClose();
            }}
          >
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <Text style={[styles.profileModalOptionText, { color: '#FF3B30' }]}>Remove Photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.profileModalCancel}
          onPress={onClose}
        >
          <Text style={styles.profileModalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// --- MAIN PROFILE SCREEN COMPONENT ---
const ProfileScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Fetch shopId from AsyncStorage
      const storedShopId = await AsyncStorage.getItem('shopId');
      if (storedShopId) {
        setShopId(storedShopId);
      }
      await fetchShopData();
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load shop information');
    }
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await viewMyShop();
      
      if (response.success) {
        setShopData(response.data);
        // Set profile image if exists in shop data
        if (response.data.profileImage) {
          setProfileImage(response.data.profileImage);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to load shop data');
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
      Alert.alert('Error', 'Failed to load shop data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setUploadingProfile(true);

      // Get shopId from AsyncStorage if not already loaded
      let currentShopId = shopId;
      if (!currentShopId) {
        currentShopId = await AsyncStorage.getItem('shopId');
        if (!currentShopId) {
          Alert.alert('Error', 'Shop ID not found. Please login again.');
          return;
        }
        setShopId(currentShopId);
      }

      console.log('Uploading profile image for shopId:', currentShopId);

      // Create form data
      const formData = new FormData();
      
      // Get file extension and ensure it's a valid image type
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      
      // Determine MIME type
      let mimeType = 'image/jpeg';
      if (fileType === 'png') mimeType = 'image/png';
      else if (fileType === 'jpg' || fileType === 'jpeg') mimeType = 'image/jpeg';

      // Backend expects 'file' as field name (from upload.single('file'))
      formData.append('file', {
        uri: imageUri,
        name: `profile_${Date.now()}.${fileType}`,
        type: mimeType,
      });

      console.log('FormData prepared with field name: file');

      // Make API call
      const response = await fetch(
        `${API_BASE_URL}/shop/addProfileImage/${currentShopId}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        Alert.alert('Error', 'Server returned an invalid response. Please check the API endpoint.');
        return;
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok && result.success) {
        // Response structure: result.result.shop.ProfileImage
        const profileImageUrl = result.result?.shop?.ProfileImage || result.result?.url || imageUri;
        setProfileImage(profileImageUrl);
        Alert.alert('Success', 'Profile picture updated successfully');
        // Refresh shop data to get updated profile image
        await fetchShopData();
      } else {
        Alert.alert('Error', result.message || 'Failed to upload profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', `Failed to upload: ${error.message}`);
    } finally {
      setUploadingProfile(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSaveImage = ({ description }) => {
    // Mock adding a new image - integrate with your actual upload API
    const newImage = {
      _id: Date.now().toString(),
      url: `https://picsum.photos/seed/${Date.now()}/200/200`,
      title: description || 'New work added',
      description: description || 'New work added',
    };
    
    setShopData(prev => ({
      ...prev,
      media: [newImage, ...(prev.media || [])]
    }));
  };

  const handleImagePress = (image) => {
    Alert.alert(
      "Manage Image",
      image.description || image.title,
      [
        {
          text: "Edit Description",
          onPress: () => console.log('Edit pressed for:', image._id),
        },
        {
          text: "Delete Image",
          style: 'destructive',
          onPress: () => {
            setShopData(prev => ({
              ...prev,
              media: prev.media.filter(img => img._id !== image._id)
            }));
          },
        },
        {
          text: "Cancel",
          style: 'cancel',
        },
      ]
    );
  };

  const handleProfileImageSelect = async (source) => {
    if (source === 'delete') {
      // TODO: Implement delete profile image API if available
      setProfileImage(null);
      Alert.alert('Success', 'Profile picture removed');
    } else if (source === 'camera') {
      await takePhoto();
    } else if (source === 'gallery') {
      await pickImageFromGallery();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (!shopData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No shop data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchShopData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Image Section */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity 
          style={styles.profileImageWrapper}
          onPress={() => setIsProfileModalVisible(true)}
          disabled={uploadingProfile}
        >
          {uploadingProfile ? (
            <View style={styles.profileImagePlaceholder}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color={PRIMARY_COLOR} />
            </View>
          )}
          {!uploadingProfile && (
            <View style={styles.profileImageBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>
        {uploadingProfile && (
          <Text style={styles.uploadingText}>Uploading...</Text>
        )}
      </View>

      {/* Header and Shop Name */}
      <View style={styles.headerCard}>
        <Ionicons name="cut" size={50} color={PRIMARY_COLOR} />
        <Text style={styles.greetingText}>Welcome, Owner</Text>
        <Text style={styles.ownerName}>{shopData.ShopName}</Text>
      </View>

      {/* Shop Details Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shop Details</Text>
        <DetailRow 
          icon={shopData.IsPremium ? "star" : "ribbon-outline"} 
          label="Membership Status" 
          value={shopData.IsPremium ? "Premium Member" : "Standard User"} 
          color={shopData.IsPremium ? '#E59400' : '#555'}
        />
        <DetailRow icon="time-outline" label="Timing" value={shopData.Timing} />
        <DetailRow 
          icon="pin-outline" 
          label="Location" 
          value={`${shopData.ExactLocation}, ${shopData.City}`} 
        />
        <DetailRow icon="call-outline" label="Mobile" value={shopData.Mobile.toString()} />
        {shopData.website && (
          <DetailRow icon="globe-outline" label="Website" value={shopData.website} />
        )}
      </View>

      {/* Image Management Section */}
      <View style={[styles.sectionCard, { paddingBottom: 10 }]}>
        <Text style={styles.sectionTitle}>Shop & Work Showcase</Text>
        
        {/* Add Image Button */}
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialIcons name="add-a-photo" size={20} color="white" />
          <Text style={styles.addButtonText}>Add New Showcase Image</Text>
        </TouchableOpacity>

        {/* Display Added Images */}
        <View style={styles.imagesContainer}>
          {shopData.media && shopData.media.length > 0 ? (
            shopData.media.map((image) => (
              <TouchableOpacity 
                key={image._id} 
                style={styles.imageWrapper}
                onPress={() => handleImagePress(image)}
              >
                <Image source={{ uri: image.url }} style={styles.imageThumbnail} />
                <Text style={styles.imageDescription} numberOfLines={1}>
                  {image.description || image.title}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noImagesText}>
              Show your work! Click 'Add New Image' to upload.
            </Text>
          )}
        </View>
      </View>
      
      {/* Image Upload Modal */}
      <ImageUploadModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={handleSaveImage} 
      />

      {/* Profile Image Modal */}
      <ProfileImageModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        hasProfileImage={!!profileImage}
        onSelectImage={handleProfileImageSelect}
      />
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_BG,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SECONDARY_BG,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // --- Profile Image Styles ---
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: PRIMARY_COLOR,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SECONDARY_BG,
    borderWidth: 4,
    borderColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_COLOR,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // --- Profile Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileModalCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  profileModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  profileModalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  profileModalCancel: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileModalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  // --- Header/Owner Card ---
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  greetingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  ownerName: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginTop: 5,
  },
  // --- Standard Section Card ---
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_BG,
    paddingBottom: 8,
  },
  // --- Detail Row Styles ---
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
  },
  detailIconBox: {
    width: 35,
    height: 35,
    borderRadius: 5,
    backgroundColor: SECONDARY_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#888',
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    color: '#222',
  },
  // --- Image Management Styles ---
  addButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  imageWrapper: {
    width: '30%', 
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
  },
  imageThumbnail: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  imageDescription: {
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    color: '#444',
    backgroundColor: '#f9f9f9',
    height: 25,
  },
  noImagesText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontStyle: 'italic',
    width: '100%',
  }
});

export default ProfileScreen;