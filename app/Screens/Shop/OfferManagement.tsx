import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar as RNStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShopOffers, Offer, deleteOfferAPI, editOfferAPI } from '../../api/Service/Shop';

const OfferManagement = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  // ── Edit Modal State ──
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');

  const fetchOffers = async (id: string) => {
    try {
      const response = await getShopOffers(id);
      if (response?.success && response?.data) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching shop offers:', error);
      Alert.alert('Error', 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const init = async () => {
        setLoading(true);
        const id = await AsyncStorage.getItem('shopId');
        if (id) {
          setShopId(id);
          fetchOffers(id);
        } else {
          setLoading(false);
          Alert.alert('Error', 'Shop ID not found');
        }
      };
      init();
      return () => {}; // Cleanup if needed
    }, [])
  );

  // ── Delete ──
  const handleDelete = (offerId: string) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOfferAPI(offerId);
              setOffers(prev => prev.filter(o => o._id !== offerId));
              Alert.alert('Success', 'Offer deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  // ── Open Edit Modal ──
  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setEditTitle(offer.title);
    setEditDescription(offer.description);
    setEditDiscountValue(String(offer.discountValue ?? ''));
    // Format date as YYYY-MM-DD for editing
    const d = new Date(offer.validUntil);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setEditValidUntil(formatted);
    setEditModalVisible(true);
  };

  // ── Save Edit ──
  const handleSaveEdit = async () => {
    if (!editingOffer) return;

    if (!editTitle.trim()) {
      Alert.alert('Validation', 'Title cannot be empty');
      return;
    }

    setEditLoading(true);
    try {
      const payload: Partial<Offer> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        discountValue: parseFloat(editDiscountValue) || 0,
        validUntil: editValidUntil,
      };

      const response = await editOfferAPI(editingOffer._id, payload);

      if (response?.success && response?.data) {
        setOffers(prev =>
          prev.map(o => (o._id === editingOffer._id ? response.data : o))
        );
      } else {
        // Optimistic update if server returns no data
        setOffers(prev =>
          prev.map(o =>
            o._id === editingOffer._id ? { ...o, ...payload } : o
          )
        );
      }

      setEditModalVisible(false);
      setEditingOffer(null);
      Alert.alert('Success', 'Offer updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update offer');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Offer Card ──
  const renderOfferItem = ({ item }: { item: Offer }) => {
    const isExpired = new Date(item.validUntil) < new Date();
    const validDate = new Date(item.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.offerTypeBadge}>
            <Text style={styles.offerTypeText}>{item.offerType.toUpperCase()}</Text>
          </View>

          {/* Action Icons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 8 }]}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerDesc}>{item.description}</Text>

        <View style={styles.offerFooter}>
          <View>
            <Text style={styles.label}>Discount</Text>
            <Text style={styles.value}>
              {item.discountValue}
              {item.discountType === 'percentage' ? '%' : ' Flat'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Valid Until</Text>
            <Text style={[styles.value, isExpired && { color: '#EF4444' }]}>
              {validDate} {isExpired && '(Expired)'}
            </Text>
          </View>
        </View>

        {!item.isActive && (
          <View style={styles.inactiveOverlay}>
            <Text style={styles.inactiveText}>INACTIVE</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions & Offers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/Screens/Shop/CreateOffer')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="gift-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Offers Yet</Text>
          <Text style={styles.emptyDesc}>
            Create your first offer to attract more customers!
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/Screens/Shop/CreateOffer')}
          >
            <Text style={styles.createButtonText}>Create New Offer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Edit Offer Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Offer</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Offer title"
                placeholderTextColor="#94A3B8"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Offer description"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Discount Value */}
              <Text style={styles.inputLabel}>
                Discount Value{' '}
                <Text style={styles.inputHint}>
                  ({editingOffer?.discountType === 'percentage' ? '%' : 'Flat ₹'})
                </Text>
              </Text>
              <TextInput
                style={styles.input}
                value={editDiscountValue}
                onChangeText={setEditDiscountValue}
                placeholder="e.g. 20"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />

              {/* Valid Until */}
              <Text style={styles.inputLabel}>Valid Until (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={editValidUntil}
                onChangeText={setEditValidUntil}
                placeholder="2025-12-31"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, editLoading && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 20 },
  offerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveText: {
    fontSize: 24,
    fontWeight: '900',
    color: 'rgba(51,65,85,0.3)',
    transform: [{ rotate: '-15deg' }],
    letterSpacing: 2,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OfferManagement;
