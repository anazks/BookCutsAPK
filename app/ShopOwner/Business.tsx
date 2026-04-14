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
  Platform,
  Linking
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Modal, 
  TextInput 
} from 'react-native';

// Local Components
import ImageUploadModal from '../Screens/Shop/ImageUploadModel'; // Adjust path
import { viewMyShop, deleteMediaAPI, updateMediaDetailsAPI } from '../api/Service/Shop';

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  darkText: '#0F172A',
  mediumGray: '#64748B',
  lightGray: '#94A3B8',
  borderGray: '#CBD5E1',
  lightestGray: '#F1F5F9',
  background: '#F8FAFC',
  white: '#FFFFFF',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.12)',
};

const DetailRow = ({ icon, label, value, color = COLORS.darkText, onPress, iconFamily = 'Ionicons' as 'Ionicons' | 'MaterialIcons' }) => (
  <TouchableOpacity style={styles.detailRow} onPress={onPress} disabled={!onPress}>
    <View style={styles.detailIconBox}>
      {iconFamily === 'Ionicons' ? (
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      ) : (
        <MaterialIcons name={icon as any} size={18} color={COLORS.primary} />
      )}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />}
  </TouchableOpacity>
);

export default function BusinessScreen() {
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  // Edit Media State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storedShopId = await AsyncStorage.getItem('shopId');
      setShopId(storedShopId);

      const response = await viewMyShop();
      if (response?.success) {
        setShopData(response.data);
      }
    } catch (error) {
      console.log('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploadSuccess = async () => {
    setIsModalVisible(false);
    await fetchData();
  };

  const handleDeleteMedia = async (mediaId: string) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to remove this image from your showcase?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteMediaAPI(mediaId);
              if (res.success) {
                Alert.alert("Success", "Image removed successfully");
                fetchData();
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete image");
            }
          }
        }
      ]
    );
  };

  const handleEditPress = (image: any) => {
    setSelectedImage(image);
    setEditTitle(image.title || '');
    setEditDescription(image.description || '');
    setIsEditModalVisible(true);
  };

  const handleUpdateMedia = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateMediaDetailsAPI(selectedImage._id, {
        title: editTitle.trim(),
        description: editDescription.trim()
      });

      if (res.success) {
        Alert.alert("Success", "Showcase updated");
        setIsEditModalVisible(false);
        fetchData();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!shopData || Object.keys(shopData).length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Ionicons name="storefront-outline" size={64} color={COLORS.lightGray} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.darkText, marginBottom: 8, textAlign: 'center' }}>
            No Business Profile Found
          </Text>
          <Text style={{ textAlign: 'center', color: COLORS.mediumGray, marginBottom: 24, fontSize: 15, lineHeight: 22 }}>
            Please complete your shop registration first to access the Business Center and manage your profile.
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, width: 220, alignItems: 'center' }}
            onPress={() => router.push('/Components/Shop/AddShop')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Create Shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Business Center</Text>
          <Text style={styles.headerSubtitle}>Manage your shop settings and growth</Text>
        </View>

        {/* Premium Status Card */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumIconContainer}>
            <Ionicons name={shopData?.IsPremium ? "star" : "ribbon-outline"} size={32} color={shopData?.IsPremium ? "#E59400" : COLORS.lightGray} />
          </View>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>
              {shopData?.IsPremium ? 'Premium Member' : 'Standard Plan'}
            </Text>
            <Text style={styles.premiumDesc}>
              {shopData?.IsPremium 
                ? 'You have full access to all premium features.' 
                : 'Upgrade to Premium for better visibility and management tools.'}
            </Text>
          </View>
          {/* {!shopData?.IsPremium && (
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )} */}
        </View>

        {/* Quick Management Links */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FINANCIALS & GROWTH</Text>
          <View style={styles.card}>
            <DetailRow
              icon="card-outline"
              label="Earnings"
              value="View Daily & Total Earnings"
              onPress={() => router.push('/Screens/User/PayoutScreen')}
            />
            <View style={styles.divider} />
            <DetailRow
              icon="payments"
              iconFamily="MaterialIcons"
              label="Bank Details"
              value={shopData?.bankDetails ? 'Update Payout Account' : 'Connect Bank Account'}
              onPress={() => router.push('/Screens/Shop/BankDetailsComponent')}
            />
            <View style={styles.divider} />
            <DetailRow
              icon="pricetag-outline"
              label="Offers & Promotions"
              value="Manage Discounts"
              color={COLORS.success}
              onPress={() => router.push('/Screens/Shop/OfferManagement')}
            />
          </View>
        </View>

        {/* Showcase Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SHOP & WORK SHOWCASE</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalVisible(true)}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.card}>
            {shopData?.media?.length > 0 ? (
              <View style={styles.grid}>
                {shopData.media.map((image: any) => (
                  <View key={image._id} style={styles.imageWrapper}>
                    <Image source={{ uri: image.url }} style={styles.thumbnail} />
                    
                    <View style={styles.imageActions}>
                      <TouchableOpacity 
                        style={styles.actionIcon} 
                        onPress={() => handleEditPress(image)}
                      >
                        <MaterialIcons name="edit" size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]} 
                        onPress={() => handleDeleteMedia(image._id)}
                      >
                        <MaterialIcons name="delete-outline" size={16} color="white" />
                      </TouchableOpacity>
                    </View>

                    {image.title && (
                      <View style={styles.titleContainer}>
                        <Text style={styles.imageTitle} numberOfLines={1}>{image.title}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyShowcase}>
                <Ionicons name="images-outline" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>Showcase your best work to attract customers!</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Media Upload Modal */}
      <ImageUploadModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleMediaUploadSuccess}
      />

      {/* Edit Media Metadata Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Showcase Details</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedImage && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage.url }} style={styles.editPreviewImage} resizeMode="cover" />
                </View>
              )}
              
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter title"
                placeholderTextColor={COLORS.lightGray}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter description (optional)"
                placeholderTextColor={COLORS.lightGray}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleUpdateMedia}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.lightestGray,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  premiumIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  premiumDesc: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.lightGray,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightestGray,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightestGray,
    marginHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkText,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  imageWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageTitle: {
    color: 'white',
    fontSize: 11,
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  modalBody: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: COLORS.lightestGray,
    borderWidth: 1,
    borderColor: COLORS.lightestGray,
  },
  editPreviewImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.darkText,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightestGray,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyShowcase: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightGray,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});
