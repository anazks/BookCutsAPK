// ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Linking
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ImageUploadModal from './ImageUploadModel'; // Adjust path as needed
import { viewMyShop } from '../../api/Service/Shop';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://bookmycutsapp.onrender.com/api';

// Color Palette
const COLORS = {
  primary: '#4F46E5',           // Strong indigo
  primaryLight: '#EEF2FF',      // Very pale blue-gray
  darkText: '#0F172A',          // Very dark slate
  mediumGray: '#64748B',        // Cool medium slate gray
  lightGray: '#94A3B8',         // Soft cool gray
  borderGray: '#CBD5E1',        // Light cool gray
  lightestGray: '#F1F5F9',      // Very light cool gray
  background: '#F8FAFC',        // Almost-white light slate
  white: '#FFFFFF',             // Pure white
};

// ── No Shop Found Screen ──
const NoShopFoundScreen = ({ onAddShopPress }) => (
  <View style={styles.noShopContainer}>
    <View style={styles.noShopContent}>
      <View style={styles.noShopIconContainer}>
        <Ionicons name="storefront-outline" size={80} color={COLORS.borderGray} />
      </View>
      <Text style={styles.noShopTitle}>No Shop Found</Text>
      <Text style={styles.noShopDescription}>
        You haven't created a shop yet. Create your shop to start managing your business profile, showcase your work, and connect with customers.
      </Text>

      <TouchableOpacity style={styles.addShopButton} onPress={onAddShopPress}>
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addShopButtonText}>Add Your Shop</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backToHomeButton} onPress={() => router.replace('/ShopOwner/shopOwnerHome')}>
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={styles.backToHomeButtonText}>Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.noShopHelpText}>
        Need help? Contact support at support@bookmycuts.com
      </Text>
    </View>
  </View>
);

// ── Reusable Detail Row ──
const DetailRow = ({ icon, label, value, color = COLORS.darkText }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconBox}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  </View>
);

// ── Profile Image Selection Modal ──
const ProfileImageModal = ({ visible, onClose, hasProfileImage, onSelectImage }) => (
  <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.profileModalCard}>
        <Text style={styles.profileModalTitle}>
          {hasProfileImage ? 'Change Profile Picture' : 'Add Profile Picture'}
        </Text>

        <TouchableOpacity
          style={styles.profileModalOption}
          onPress={() => { onSelectImage('camera'); onClose(); }}
        >
          <Ionicons name="camera" size={24} color={COLORS.primary} />
          <Text style={styles.profileModalOptionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileModalOption}
          onPress={() => { onSelectImage('gallery'); onClose(); }}
        >
          <Ionicons name="images" size={24} color={COLORS.primary} />
          <Text style={styles.profileModalOptionText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {hasProfileImage && (
          <TouchableOpacity
            style={[styles.profileModalOption, styles.deleteOption]}
            onPress={() => { onSelectImage('delete'); onClose(); }}
          >
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <Text style={[styles.profileModalOptionText, { color: '#FF3B30' }]}>Remove Photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.profileModalCancel} onPress={onClose}>
          <Text style={styles.profileModalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// ── Simple Profile Image Preview Modal ──
const ProfileImagePreviewModal = ({
  visible,
  imageUri,
  onCancel,
  onSave,
  uploading,
}) => {
  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={previewStyles.overlay}>
        <View style={previewStyles.card}>
          <Text style={previewStyles.title}>Profile Picture Preview</Text>

          <Image
            source={{ uri: imageUri }}
            style={previewStyles.previewImage}
            resizeMode="contain"
          />

          <View style={previewStyles.buttonRow}>
            <TouchableOpacity
              style={[previewStyles.btn, previewStyles.cancelBtn]}
              onPress={onCancel}
              disabled={uploading}
            >
              <Text style={previewStyles.btnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                previewStyles.btn,
                previewStyles.saveBtn,
                uploading && previewStyles.btnDisabled,
              ]}
              onPress={onSave}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={previewStyles.btnTextWhite}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const previewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: COLORS.darkText,
  },
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: COLORS.background,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.lightestGray,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkText,
  },
  btnTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

// ── Edit Image Modal (for showcase images) ──
const EditImageModal = ({
  visible,
  onClose,
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  onSave,
}) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
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

// ── MAIN COMPONENT ──
const ProfileScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isProfilePreviewVisible, setIsProfilePreviewVisible] = useState(false);
  const [selectedProfileImageUri, setSelectedProfileImageUri] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [hasShop, setHasShop] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const getToken = async () => await AsyncStorage.getItem('accessToken');

  const initializeData = async () => {
    try {
      const storedShopId = await AsyncStorage.getItem('shopId');
      if (storedShopId) setShopId(storedShopId);
      await fetchShopData();
    } catch (error) {
      console.error('Error initializing:', error);
      Alert.alert('Error', 'Failed to load shop information');
    }
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await viewMyShop();
      const isSuccess = response.success === true || response.success === 'true';

      if (isSuccess) {
        setShopData(response.data);
        setHasShop(true);
        setProfileImage(response.data?.ProfileImage || null);
      } else {
        setHasShop(false);
        setShopData(null);
      }
    } catch (error) {
      setHasShop(false);
      setShopData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShop = () => {
    router.push('/Components/Shop/AddShop');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['accessToken', 'shopId']);
            Alert.alert('Success', 'Logged out successfully');
            router.replace('/Home');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setUploadingProfile(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      let currentShopId = shopId || (await AsyncStorage.getItem('shopId'));
      if (!currentShopId) throw new Error('No shop ID');

      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      let mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: `profile_${Date.now()}.${fileType}`,
        type: mimeType,
      } as any);

      const response = await fetch(`${API_BASE_URL}/shop/addProfileImage/${currentShopId}`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && (result.success === true || result.success === 'true')) {
        const newProfileUrl = result.result?.shop?.ProfileImage || result.result?.url || imageUri;
        setProfileImage(newProfileUrl);
        Alert.alert('Success', 'Profile picture updated');
        await fetchShopData();
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload profile image');
    } finally {
      setUploadingProfile(false);
    }
  };

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedProfileImageUri(result.assets[0].uri);
      setIsProfilePreviewVisible(true);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedProfileImageUri(result.assets[0].uri);
      setIsProfilePreviewVisible(true);
    }
  };

  const handleProfileImageSelect = (source: 'camera' | 'gallery' | 'delete') => {
    if (source === 'delete') {
      // TODO: Implement actual delete API when available
      setProfileImage(null);
      Alert.alert('Success', 'Profile picture removed');
      return;
    }
    if (source === 'camera') takePhoto();
    else if (source === 'gallery') pickImageFromGallery();
  };

  const handleUpdateImage = async () => {
    // TODO: Implement showcase image update logic
  };

  const handleDeleteImage = async (imageId) => {
    // TODO: Implement showcase image delete logic
  };

  const handleImagePress = (image) => {
    Alert.alert('Image', `Selected: ${image.title || image.description || 'Untitled'}`);
  };

  const handleMediaUploadSuccess = async () => {
    setIsModalVisible(false);
    await fetchShopData();
  };

  const handleBackToHome = () => {
    router.replace('/ShopOwner/shopOwnerHome');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (!hasShop) {
    return <NoShopFoundScreen onAddShopPress={handleAddShop} />;
  }

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: COLORS.background }} 
      edges={['top', 'bottom']}
    >
      <ScrollView style={styles.container}>
        {/* Back / Home Button */}
        <TouchableOpacity 
          style={[
            styles.backButton, 
            { marginTop: Platform.OS === 'ios' ? 8 : 12 }
          ]} 
          onPress={handleBackToHome}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity
            style={styles.profileImageWrapper}
            onPress={() => setIsProfileModalVisible(true)}
            disabled={uploadingProfile}
          >
            {uploadingProfile ? (
              <View style={styles.profileImagePlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color={COLORS.primary} />
              </View>
            )}
            {!uploadingProfile && (
              <View style={styles.profileImageBadge}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {uploadingProfile && <Text style={styles.uploadingText}>Uploading...</Text>}
        </View>

        {/* Shop Header */}
        <View style={styles.headerCard}>
          <Ionicons name="cut" size={50} color={COLORS.primary} />
          <Text style={styles.greetingText}>Welcome, Owner</Text>
          <Text style={styles.ownerName}>{shopData?.ShopName || 'My Shop'}</Text>
        </View>

        {/* Shop Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <DetailRow
            icon={shopData?.IsPremium ? 'star' : 'ribbon-outline'}
            label="Membership Status"
            value={shopData?.IsPremium ? 'Premium Member' : 'Standard User'}
            color={shopData?.IsPremium ? '#E59400' : COLORS.mediumGray}
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

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => router.push('/Screens/Shop/BankDetailsComponent')}
          >
            <View style={styles.detailIconBox}>
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Bank Details</Text>
              <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                {shopData?.bankDetails ? 'View / Edit' : 'Add Bank Details'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity
  style={styles.detailRow}
  onPress={() =>
    Linking.openURL('https://www.bookmycuts.com/privacy ')
  }
>
  <View style={styles.detailIconBox}>
    <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
  </View>

  <View style={{ flex: 1 }}>
    <Text style={styles.detailLabel}>Privacy Policy</Text>
    <Text style={[styles.detailValue, { color: COLORS.primary }]}>
      View Policy
    </Text>
  </View>

  <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
</TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.detailIconBox}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.darkText} />
            </View>
            <Text style={[styles.detailValue, { color: '#FF3B30', fontWeight: '600' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Showcase Images */}
        <View style={[styles.sectionCard, { paddingBottom: 10 }]}>
          <Text style={styles.sectionTitle}>Shop & Work Showcase</Text>

          <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
            <MaterialIcons name="add-a-photo" size={20} color="white" />
            <Text style={styles.addButtonText}>Add New Showcase Image</Text>
          </TouchableOpacity>

          <View style={styles.imagesContainer}>
            {shopData?.media?.length > 0 ? (
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

        {/* Modals */}
        <ImageUploadModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSave={handleMediaUploadSuccess}
        />

        <ProfileImageModal
          visible={isProfileModalVisible}
          onClose={() => setIsProfileModalVisible(false)}
          hasProfileImage={!!profileImage}
          onSelectImage={handleProfileImageSelect}
        />

        <ProfileImagePreviewModal
          visible={isProfilePreviewVisible}
          imageUri={selectedProfileImageUri}
          onCancel={() => {
            setIsProfilePreviewVisible(false);
            setSelectedProfileImageUri(null);
          }}
          onSave={async () => {
            if (selectedProfileImageUri) {
              await uploadProfileImage(selectedProfileImageUri);
              setIsProfilePreviewVisible(false);
              setSelectedProfileImageUri(null);
            }
          }}
          uploading={uploadingProfile}
        />

        <EditImageModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setEditingImage(null);
            setEditTitle('');
            setEditDescription('');
          }}
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

// ── STYLES ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.mediumGray,
  },

  // No Shop Found
  noShopContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  noShopContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  noShopIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
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
    color: COLORS.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  noShopDescription: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  addShopButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addShopButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  backToHomeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  backToHomeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noShopHelpText: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },

  // Profile Image
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 10,
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
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 4,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  editModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  profileModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 20,
    textAlign: 'center',
  },
  profileModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightestGray,
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  profileModalOptionText: {
    fontSize: 16,
    color: COLORS.darkText,
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
    color: COLORS.mediumGray,
    fontWeight: '600',
  },

  // Edit Modal Inputs & Buttons
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightestGray,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonTextWhite: {
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonText: {
    color: COLORS.darkText,
    fontWeight: '600',
  },

  // Header Card
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 10,
  },
  ownerName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 5,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
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
    color: COLORS.darkText,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightestGray,
    paddingBottom: 8,
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightestGray,
  },
  detailIconBox: {
    width: 35,
    height: 35,
    borderRadius: 5,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailLabel: {
    fontWeight: '500',
    color: COLORS.mediumGray,
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    color: COLORS.darkText,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },

  // Showcase Images
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: {
    color: COLORS.white,
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
    backgroundColor: COLORS.white,
    borderColor: COLORS.borderGray,
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
    color: COLORS.darkText,
    backgroundColor: COLORS.background,
    height: 25,
  },
  noImagesText: {
    textAlign: 'center',
    padding: 20,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    width: '100%',
  },
});

export default ProfileScreen;