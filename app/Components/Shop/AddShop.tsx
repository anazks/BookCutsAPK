import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { addNewShop } from '../../api/Service/Shop';

// District data for Kerala and Tamil Nadu
const stateDistricts = {
  Kerala: [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
    "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukudi",
    "Dindigul", "Thanjavur", "Ranipet", "Kanchipuram",
    "Virudhunagar", "Theni", "Nagapattinam", "Tiruvannamalai",
    "Viluppuram", "Krishnagiri", "Cuddalore", "Karur", "Namakkal",
    "Dharmapuri", "Pudukkottai", "Sivaganga", "Tirupathur",
    "Ramanathapuram", "Ariyalur", "Perambalur", "Nilgiris", "Kanyakumari"
  ]
};

const states = ["Kerala", "Tamil Nadu"];

export default function AddShop({ onShopAdded }) {
  const [formData, setFormData] = useState({
    ShopName: '',
    City: '',
    Mobile: '',
    Timing: '',
    website: '',
    State: '',
    District: ''
  });
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const handleChange = (key, value) => {
    console.log(`Changing ${key} to:`, value);
    
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleStateSelect = (state) => {
    handleChange('State', state);
    handleChange('District', ''); // Reset district when state changes
    
    // Update available districts based on selected state
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
    console.log('handleSubmit called!');
    console.log('Current formData:', formData);
    
    // Prevent multiple submissions
    if (loading) return;
    
    // Validation - now includes State and District
    if (!formData.ShopName.trim() || !formData.City.trim() || !formData.Mobile.trim() || 
        !formData.Timing.trim() || !formData.website.trim() || !formData.State || !formData.District) {
      console.log('Validation failed - missing fields');
      Alert.alert("Error", "All fields are required");
      return;
    }

    // Mobile validation - allow various formats
    const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    if (!mobileRegex.test(formData.Mobile.replace(/\D/g, ''))) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    // Website validation - more flexible
    const websiteRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!websiteRegex.test(formData.website.trim())) {
      Alert.alert("Error", "Please enter a valid website URL (include http:// or https://)");
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting shop:', formData);
      
      // Prepare clean data
      const cleanData = {
        ShopName: formData.ShopName.trim(),
        City: formData.City.trim(),
        Mobile: formData.Mobile.trim(),
        Timing: formData.Timing.trim(),
        website: formData.website.trim(),
        State: formData.State,
        District: formData.District
      };
      
      const response = await addNewShop(cleanData);
      console.log("Response from addShop:", response);
      
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to add shop");
      }
      
      // Reset form on success
      setFormData({
        ShopName: '',
        City: '',
        Mobile: '',
        Timing: '',
        website: '',
        State: '',
        District: ''
      });
      
      // Reset districts list
      setDistricts([]);
      
      Alert.alert("Success", "Shop added successfully");
      
      // Call the callback if provided
      if (onShopAdded && typeof onShopAdded === 'function') {
        onShopAdded();
      }
      
    } catch (error) {
      console.error("Error adding shop:", error);
      Alert.alert("Error", error.message || "Failed to add shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStateItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleStateSelect(item)}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderDistrictItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleDistrictSelect(item)}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Add New Shop</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Shop Name *</Text>
        <TextInput
          placeholder="Enter shop name"
          style={[styles.input, formData.ShopName ? styles.inputFilled : null]}
          onChangeText={(value) => handleChange('ShopName', value)}
          value={formData.ShopName}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>State *</Text>
        <TouchableOpacity 
          style={[styles.input, styles.selectInput, formData.State ? styles.inputFilled : null]}
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>District *</Text>
        <TouchableOpacity 
          style={[
            styles.input, 
            styles.selectInput, 
            formData.District ? styles.inputFilled : null,
            !formData.State && styles.disabledInput
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          placeholder="Enter city"
          style={[styles.input, formData.City ? styles.inputFilled : null]}
          onChangeText={(value) => handleChange('City', value)}
          value={formData.City}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput
          placeholder="Enter 10-digit mobile number"
          style={[styles.input, formData.Mobile ? styles.inputFilled : null]}
          keyboardType="phone-pad"
          onChangeText={(value) => handleChange('Mobile', value.replace(/\D/g, ''))}
          value={formData.Mobile}
          maxLength={10}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Business Hours *</Text>
        <TextInput
          placeholder="e.g., 9:00 AM - 8:00 PM"
          style={[styles.input, formData.Timing ? styles.inputFilled : null]}
          onChangeText={(value) => handleChange('Timing', value)}
          value={formData.Timing}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Website URL *</Text>
        <TextInput
          placeholder="https://www.example.com"
          style={[styles.input, formData.website ? styles.inputFilled : null]}
          keyboardType="url"
          onChangeText={(value) => handleChange('website', value)}
          value={formData.website}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Adding Shop...' : 'Add Shop'}
        </Text>
      </TouchableOpacity>

      {/* State Selection Modal */}
      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStateModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select State</Text>
                <FlatList
                  data={states}
                  renderItem={renderStateItem}
                  keyExtractor={(item, index) => index.toString()}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDistrictModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select District</Text>
                <FlatList
                  data={districts}
                  renderItem={renderDistrictItem}
                  keyExtractor={(item, index) => index.toString()}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 24,
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
  },
  inputFilled: {
    borderColor: '#FF6B6B',
  },
  selectInput: {
    justifyContent: 'center',
  },
  selectText: {
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
});