import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOffer } from '../../api/Service/Shop';

const CreateOffer = () => {
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    offerType: 'discount' as 'discount' | 'bundle',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: '',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
    isActive: true,
  });

  const handleConfirmDate = (date: Date) => {
    setForm({ ...form, validUntil: date });
    setDatePickerVisibility(false);
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.description.trim()) return 'Description is required';
    if (form.offerType === 'discount' && !form.discountValue) return 'Discount value is required';
    if (form.validUntil < new Date()) return 'Expiry date must be in the future';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      setLoading(true);
      const shopId = await AsyncStorage.getItem('shopId');
      if (!shopId) throw new Error('Shop ID not found');

      const payload = {
        ...form,
        shopId,
        discountValue: form.offerType === 'discount' ? Number(form.discountValue) : undefined,
        offerLevel: 'shop' as const,
        validUntil: form.validUntil.toISOString(),
      };

      const response = await createOffer(payload);
      if (response?.success) {
        Alert.alert('Success', 'Offer created successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        throw new Error(response?.message || 'Failed to create offer');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Offer Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Summer Special 10% Off"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the offer details..."
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Offer Type</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, form.offerType === 'discount' && styles.activeTab]}
              onPress={() => setForm({ ...form, offerType: 'discount' })}
            >
              <Text style={[styles.tabText, form.offerType === 'discount' && styles.activeTabText]}>Discount</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, form.offerType === 'bundle' && styles.activeTab]}
              onPress={() => setForm({ ...form, offerType: 'bundle' })}
            >
              <Text style={[styles.tabText, form.offerType === 'bundle' && styles.activeTabText]}>Bundle / Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {form.offerType === 'discount' && (
          <View style={styles.section}>
            <Text style={styles.label}>Discount Configuration</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  keyboardType="numeric"
                  value={form.discountValue}
                  onChangeText={(text) => setForm({ ...form, discountValue: text })}
                />
              </View>
              <View style={styles.tabContainerSmall}>
                <TouchableOpacity
                  style={[styles.tabSmall, form.discountType === 'percentage' && styles.activeTab]}
                  onPress={() => setForm({ ...form, discountType: 'percentage' })}
                >
                  <Text style={[styles.tabTextSmall, form.discountType === 'percentage' && styles.activeTabText]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabSmall, form.discountType === 'flat' && styles.activeTab]}
                  onPress={() => setForm({ ...form, discountType: 'flat' })}
                >
                  <Text style={[styles.tabTextSmall, form.discountType === 'flat' && styles.activeTabText]}>₹</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Expiry Date</Text>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setDatePickerVisibility(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            <Text style={styles.dateText}>
              {form.validUntil.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.switchSection}>
          <View>
            <Text style={styles.switchLabel}>Active Status</Text>
            <Text style={styles.switchSubLabel}>Show this offer to users immediately</Text>
          </View>
          <Switch
            value={form.isActive}
            onValueChange={(val) => setForm({ ...form, isActive: val })}
            trackColor={{ false: '#CBD5E1', true: '#A5B4FC' }}
            thumbColor={form.isActive ? '#4F46E5' : '#F8FAFC'}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Offer</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        minimumDate={new Date()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainerSmall: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    width: 100,
  },
  tabSmall: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 32,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  switchSubLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateOffer;
