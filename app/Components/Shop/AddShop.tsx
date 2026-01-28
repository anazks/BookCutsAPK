import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { addNewShop } from '../../api/Service/Shop';
import AsyncStorage from '@react-native-async-storage/async-storage';

// District data for Kerala and Tamil Nadu
const stateDistricts = {
  Kerala: [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
  ],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Tiruppur',
    'Vellore',
    'Erode',
    'Thoothukudi',
    'Dindigul',
    'Thanjavur',
    'Ranipet',
    'Kanchipuram',
    'Virudhunagar',
    'Theni',
    'Nagapattinam',
    'Tiruvannamalai',
    'Viluppuram',
    'Krishnagiri',
    'Cuddalore',
    'Karur',
    'Namakkal',
    'Dharmapuri',
    'Pudukkottai',
    'Sivaganga',
    'Tirupathur',
    'Ramanathapuram',
    'Ariyalur',
    'Perambalur',
    'Nilgiris',
    'Kanyakumari',
  ],
};

const states = ['Kerala', 'Tamil Nadu'];

export default function AddShop({ onShopAdded }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    ShopName: '',
    City: '',
    Mobile: '',
    State: '',
    District: '',
    Pincode: '',
    ExactLocation: '',
  });

  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleStateSelect = (state) => {
    handleChange('State', state);
    handleChange('District', '');
    if (state && stateDistricts[state]) {
      setDistricts(stateDistricts[state]);
    } else {
      setDistricts([]);
    }
    setShowStateModal(false);
  };

  const handleDistrictSelect = (district) => {
    handleChange('District', district);
    setShowDistrictModal(false);
  };

  const handleSubmit = async () => {
    if (loading) return;

    // Validation
    if (
      !formData.ShopName.trim() ||
      !formData.City.trim() ||
      !formData.Mobile.trim() ||
      !formData.State ||
      !formData.District ||
      !formData.Pincode.trim() ||
      !formData.ExactLocation.trim()
    ) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Mobile validation (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.Mobile.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    // Pincode validation (6 digits, not starting with 0)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(formData.Pincode.trim())) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);

    try {
      const cleanData = {
        ShopName: formData.ShopName.trim(),
        City: formData.City.trim(),
        Mobile: formData.Mobile.trim(),
        State: formData.State,
        District: formData.District,
        Pincode: formData.Pincode.trim(),
        ExactLocation: formData.ExactLocation.trim(),
      };

      // Debug: log exactly what is being sent
      console.log('Sending shop data:', cleanData);
      console.log('Stringified payload:', JSON.stringify(cleanData));

      const response = await addNewShop(cleanData);

      // Expecting shopId in response.data._id or similar
      const shopId = response?.data?._id || response?.shop?._id;
      if (shopId) {
        await AsyncStorage.setItem('shopId', shopId);
        console.log('Saved shopId to AsyncStorage:', shopId);
      } else {
        console.warn('No shopId returned from API');
      }

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to add shop');
      }

      // Success
      Alert.alert('Success', 'Shop added successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (onShopAdded && typeof onShopAdded === 'function') {
              onShopAdded();
            }
            // Navigate home or to profile
            router.replace('/ShopOwner/shopOwnerHome');
            // Alternative: router.push('/ShopOwner/ProfileScreen');
          },
        },
      ]);

      // Reset form
      setFormData({
        ShopName: '',
        City: '',
        Mobile: '',
        State: '',
        District: '',
        Pincode: '',
        ExactLocation: '',
      });
      setDistricts([]);
    } catch (error) {
      console.error('Add shop error:', error);
      Alert.alert('Error', error.message || 'Failed to add shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStateItem = ({ item }) => (
    <TouchableOpacity style={styles.modalItem} onPress={() => handleStateSelect(item)}>
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderDistrictItem = ({ item }) => (
    <TouchableOpacity style={styles.modalItem} onPress={() => handleDistrictSelect(item)}>
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.heading}>Add New Shop</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Shop Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Name *</Text>
              <TextInput
                style={[styles.input, formData.ShopName && styles.inputFilled]}
                placeholder="Enter shop name"
                placeholderTextColor="#94A3B8"
                onChangeText={(value) => handleChange('ShopName', value)}
                value={formData.ShopName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* State */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>State *</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, formData.State && styles.inputFilled]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowStateModal(true);
                }}
                disabled={loading}
              >
                <Text style={formData.State ? styles.selectText : styles.placeholderText}>
                  {formData.State || 'Select State'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* District */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>District *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.selectInput,
                  formData.District && styles.inputFilled,
                  !formData.State && styles.disabledInput,
                ]}
                onPress={() => {
                  if (formData.State) {
                    Keyboard.dismiss();
                    setShowDistrictModal(true);
                  }
                }}
                disabled={loading || !formData.State}
              >
                <Text style={formData.District ? styles.selectText : styles.placeholderText}>
                  {formData.District || (formData.State ? 'Select District' : 'First select a state')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* City */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, formData.City && styles.inputFilled]}
                placeholder="Enter city"
                placeholderTextColor="#94A3B8"
                onChangeText={(value) => handleChange('City', value)}
                value={formData.City}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Exact Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Exact Location *</Text>
              <TextInput
                style={[styles.input, styles.textArea, formData.ExactLocation && styles.inputFilled]}
                placeholder="Enter complete address"
                placeholderTextColor="#94A3B8"
                onChangeText={(value) => handleChange('ExactLocation', value)}
                value={formData.ExactLocation}
                autoCapitalize="words"
                editable={!loading}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Pincode */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={[styles.input, formData.Pincode && styles.inputFilled]}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                onChangeText={(value) => handleChange('Pincode', value.replace(/[^0-9]/g, ''))}
                value={formData.Pincode}
                maxLength={6}
                editable={!loading}
              />
            </View>

            {/* Mobile */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={[styles.input, formData.Mobile && styles.inputFilled]}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                onChangeText={(value) => handleChange('Mobile', value.replace(/\D/g, ''))}
                value={formData.Mobile}
                maxLength={10}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{loading ? 'Adding Shop...' : 'Add Shop'}</Text>
            </TouchableOpacity>

            {/* State Modal */}
            <Modal
              visible={showStateModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowStateModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowStateModal(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select State</Text>
                  <FlatList
                    data={states}
                    renderItem={renderStateItem}
                    keyExtractor={(item) => item}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {/* District Modal */}
            <Modal
              visible={showDistrictModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDistrictModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDistrictModal(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select District</Text>
                  <FlatList
                    data={districts}
                    renderItem={renderDistrictItem}
                    keyExtractor={(item) => item}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles (unchanged) ──
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 0 : 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#334155',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 52,
  },
  inputFilled: {
    borderColor: '#3B82F6',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  selectInput: {
    justifyContent: 'center',
  },
  selectText: {
    color: '#1E293B',
    fontSize: 16,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    textAlign: 'center',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#334155',
  },
});