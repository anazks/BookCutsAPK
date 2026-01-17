// ProfileScreen.js - Modern UI with API Integration
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ImageUploadModal from './ImageUploadModel'; 
import { viewMyShop } from '../../api/Service/Shop'; // Import your API function
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://bookmycutsapp.onrender.com/api';

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_BG = '#FFF8F8';

// --- NO SHOP FOUND SCREEN COMPONENT ---
const NoShopFoundScreen = ({ onAddShopPress }) => (
  <View style={styles.noShopContainer}>
    <View style={styles.noShopContent}>
      <View style={styles.noShopIconContainer}>
        <Ionicons name="storefront-outline" size={80} color={PRIMARY_COLOR} />
      </View>
      <Text style={styles.noShopTitle}>No Shop Found</Text>
      <Text style={styles.noShopDescription}>
        You haven't created a shop yet. Create your shop to start managing your business profile, showcase your work, and connect with customers.
      </Text>
      
      <TouchableOpacity 
        style={styles.addShopButton}
        onPress={onAddShopPress}
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addShopButtonText}>Add Your Shop</Text>
      </TouchableOpacity>
      
      <Text style={styles.noShopHelpText}>
        Need help? Contact support at support@bookmycuts.com
      </Text>
    </View>
  </View>
);

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

// --- EDIT IMAGE MODAL ---
const EditImageModal = ({ 
  visible, 
  onClose, 
  title, 
  onChangeTitle, 
  description, 
  onChangeDescription, 
  onSave 
}) => (
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
      <View style={styles.editModalCard}>
        <Text style={styles.profileModalTitle}>Edit Image Details</Text>
        
        <Text style={styles.detailLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={onChangeTitle}
          placeholder="Enter title"
          autoFocus
        />
        
        <Text style={styles.detailLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.descriptionInput]}
          value={description}
          onChangeText={onChangeDescription}
          placeholder="Enter description"
          multiline
          numberOfLines={4}
        />
        
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.buttonTextWhite}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  </Modal>
);

// --- MAIN PROFILE SCREEN COMPONENT ---
const ProfileScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [hasShop, setHasShop] = useState(true); // Track if user has a shop

  useEffect(() => {
    initializeData();
  }, []);

  const getToken = async () => {
    return await AsyncStorage.getItem('accessToken');
  };

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
      
      console.log('API Response:', response); // Debug log
      
      // Fix: Handle string "false" vs boolean false
      const isSuccess = response.success === true || response.success === 'true';
      
      if (isSuccess) {
        setShopData(response.data);
        setHasShop(true);
        // Set profile image if exists in shop data
        setProfileImage(response.data?.ProfileImage || null);
      } else {
        // If no shop found, set hasShop to false
        setHasShop(false);
        setShopData(null);
        console.log('No shop found for user:', response.message);
        
        // Only show alert if it's not a "not found" message
        if (response.message && !response.message.toLowerCase().includes('not found')) {
          Alert.alert('Error', response.message || 'Failed to load shop data');
        }
      }
    } catch (error) {
      console.log('Error fetching shop data:', error);
      setHasShop(false);
      setShopData(null);
      
      // Check if it's a "not found" error
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('not found')) {
        console.log('No shop found (catch block)');
      } else {
        Alert.alert('Error', 'Failed to load shop data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = () => {
    // Navigate to AddShop screen
    router.push('/Components/Shop/AddShop');
  };

  const handleLogout = async () => {
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
              // Clear stored credentials
              await AsyncStorage.multiRemove(['accessToken', 'shopId']);
              Alert.alert('Success', 'Logged out successfully');
              // Navigate to login screen
              router.replace('/Home');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setUploadingProfile(true);

      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        setUploadingProfile(false);
        return;
      }

      // Get shopId from AsyncStorage if not already loaded
      let currentShopId = shopId;
      if (!currentShopId) {
        currentShopId = await AsyncStorage.getItem('shopId');
        if (!currentShopId) {
          Alert.alert('Error', 'Shop ID not found. Please login again.');
          setUploadingProfile(false);
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
            'Authorization': `Bearer ${token}`,
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

      if (response.ok) {
        // Handle both string and boolean success values
        const isSuccess = result.success === true || result.success === 'true';
        if (isSuccess) {
          // Response structure: result.result.shop.ProfileImage
          const profileImageUrl = result.result?.shop?.ProfileImage || result.result?.url || imageUri;
          setProfileImage(profileImageUrl);
          Alert.alert('Success', 'Profile picture updated successfully');
          // Refresh shop data to get updated profile image
          await fetchShopData();
        } else {
          Alert.alert('Error', result.message || 'Failed to upload profile image');
        }
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

  const handleUpdateImage = async () => {
    if (!editingImage) return;

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const body = {
        title: editTitle,
        description: editDescription,
      };

      const response = await fetch(`${API_BASE_URL}/shop/updateMedia/${editingImage._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log('Update response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Update response content-type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        Alert.alert('Error', 'Server returned an invalid response. Please check the API endpoint.');
        return;
      }

      const result = await response.json();
      console.log('Update API Response:', result);

      if (response.ok) {
        // Handle both string and boolean success values
        const isSuccess = result.success === true || result.success === 'true';
        if (isSuccess) {
          Alert.alert('Success', 'Image details updated successfully');
          await fetchShopData();
          setIsEditModalVisible(false);
          setEditingImage(null);
          setEditTitle('');
          setEditDescription('');
        } else {
          Alert.alert('Error', result.message || 'Failed to update image details');
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to update image details');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', `Failed to update: ${error.message}`);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/shop/deleteMedia/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Delete response content-type:', contentType);

      let result;
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        Alert.alert('Error', 'Server returned an invalid response. Please check the API endpoint.');
        return;
      } else {
        result = await response.json();
        console.log('Delete API Response:', result);
      }

      if (response.ok) {
        // Handle both string and boolean success values
        const isSuccess = result.success === true || result.success === 'true';
        if (isSuccess) {
          Alert.alert('Success', 'Image deleted successfully');
          await fetchShopData();
        } else {
          Alert.alert('Error', result?.message || 'Failed to delete image');
        }
      } else {
        Alert.alert('Error', result?.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message || 'Failed to delete image');
    }
  };

  const handleImagePress = (image) => {
    Alert.alert(
      "Manage Image",
      image.description || image.title,
      [
        {
          text: "Edit Description",
          onPress: () => {
            setEditingImage(image);
            setEditTitle(image.title || '');
            setEditDescription(image.description || '');
            setIsEditModalVisible(true);
          },
        },
        {
          text: "Delete Image",
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete this image? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteImage(image._id),
                },
              ]
            );
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

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingImage(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleMediaUploadSuccess = async () => {
    setIsModalVisible(false);
    await fetchShopData();
  };

  // Show loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  // Show "No Shop Found" screen if user doesn't have a shop
  if (!hasShop) {
    return <NoShopFoundScreen onAddShopPress={handleAddShop} />;
  }

  // Show regular profile screen if user has a shop
  return (
   <SafeAreaView style={{ flex: 1, backgroundColor: SECONDARY_BG }}>
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
        <Text style={styles.ownerName}>{shopData?.ShopName || 'My Shop'}</Text>
      </View>

      {/* Shop Details Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shop Details</Text>
        <DetailRow 
          icon={shopData?.IsPremium ? "star" : "ribbon-outline"} 
          label="Membership Status" 
          value={shopData?.IsPremium ? "Premium Member" : "Standard User"} 
          color={shopData?.IsPremium ? '#E59400' : '#555'}
        />
        <DetailRow icon="time-outline" label="Timing" value={shopData?.Timing || 'Not set'} />
        <DetailRow 
          icon="pin-outline" 
          label="Location" 
          value={`${shopData?.ExactLocation || 'Not set'}, ${shopData?.City || 'Not set'}`} 
        />
        <DetailRow icon="call-outline" label="Mobile" value={shopData?.Mobile?.toString() || 'Not set'} />
        {shopData?.website && (
          <DetailRow icon="globe-outline" label="Website" value={shopData.website} />
        )}
        {/* Logout Button under Website */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.detailIconBox}>
            <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
          </View>
          <Text style={[styles.detailValue, { color: '#FF3B30', fontWeight: '600' }]}>Logout</Text>
        </TouchableOpacity>
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
          {shopData?.media && shopData.media.length > 0 ? (
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
        onSave={handleMediaUploadSuccess}
      />

      {/* Profile Image Modal */}
      <ProfileImageModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        hasProfileImage={!!profileImage}
        onSelectImage={handleProfileImageSelect}
      />

      {/* Edit Image Modal */}
      <EditImageModal
        visible={isEditModalVisible}
        onClose={handleEditModalClose}
        title={editTitle}
        onChangeTitle={setEditTitle}
        description={editDescription}
        onChangeDescription={setEditDescription}
        onSave={handleUpdateImage}
      />
      
      <View style={{ height: 40 }} />
    </ScrollView>
   </SafeAreaView>
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
  // --- No Shop Found Screen Styles ---
  noShopContainer: {
    flex: 1,
    backgroundColor: SECONDARY_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  noShopContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  noShopIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  noShopTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noShopDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  addShopButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addShopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  noShopHelpText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
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
  editModalCard: {
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
  // --- Edit Modal Styles ---
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonTextWhite: {
    color: 'white',
    fontWeight: '600',
  },
  buttonText: {
    color: '#333',
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
  // --- Logout Button Style ---
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
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