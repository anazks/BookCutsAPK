import { router } from 'expo-router';

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { otpLogin } from '../../api/Service/ShoperOwner';

export default function Register({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNo: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Mobile number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = { ...formData, role: 'user' };  // ✅ Add role=user here
      console.log("Sending OTP request:", payload);

      const response = await otpLogin(payload);

      if (response.success) {
        Alert.alert('OTP Sent', 'Please verify OTP to complete registration', [
           {
            text: 'OK',
            onPress: () => router.push({
              pathname: '/Screens/User/VerifyOtp',
              params: { ...payload }   // ✅ Pass form data to verify screen
            })
          }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP. Try again.');
      }
    } catch (error) {
      console.error("OTP request failed:", error);
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to book your perfect haircut</Text>
          </View>

          <View style={styles.form}>
            {/* First Name */}
            <Text style={styles.label}>First Name*</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              maxLength={40}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            {/* Last Name */}
            <Text style={styles.label}>Last Name*</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              maxLength={100}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            {/* Mobile Number */}
            <Text style={styles.label}>Mobile Number*</Text>
            <View style={styles.mobileInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.mobileInput, errors.mobileNo && styles.inputError]}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.mobileNo}
                onChangeText={(text) => handleInputChange('mobileNo', text)}
              />
            </View>
            {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo}</Text>}

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? 'Sending OTP...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: {
    marginBottom: 20,
    paddingHorizontal: 24,
    marginTop: Platform.OS === 'android' ? 40 : 20,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', paddingHorizontal: 20 },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 14, color: '#34495e', marginBottom: 8, fontWeight: '500' },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginBottom: 12, marginTop: -4 },
  mobileInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  countryCode: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  countryCodeText: { fontSize: 16, color: '#34495e' },
  mobileInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginBottom: 0,
  },
  registerButton: {
    backgroundColor: '#3498db',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: { backgroundColor: '#bdc3c7' },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: '#7f8c8d', fontSize: 14 },
  loginText: { color: '#3498db', fontSize: 14, fontWeight: '500' },
});
