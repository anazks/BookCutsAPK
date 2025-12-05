import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { otpLogin, verifyOtp } from '../../api/Service/ShoperOwner';

const { width, height } = Dimensions.get('window');

export default function OtpRegister() {
  const [step, setStep] = useState(1); // 1: Enter details, 2: Verify OTP
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNo: ''
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload = { ...formData, role: 'user' };
      console.log("Sending OTP request:", payload);

      const response = await otpLogin(payload);

      if (response.success) {
        Alert.alert('OTP Sent', 'Please enter the OTP sent to your mobile number', [
          { text: 'OK', onPress: () => setStep(2) }
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
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = { mobileNo: formData.mobileNo, otp, role: "user" };
      console.log("Verifying:", payload);

      const verifyResponse = await verifyOtp(payload);

      if (verifyResponse.success && verifyResponse.token) {
        await AsyncStorage.setItem('accessToken', verifyResponse.token);
        Alert.alert('Success', 'Registration successful! Welcome aboard.', [
          { text: 'OK', onPress: () => router.push('/(tabs)/Home') }
        ]);
      } else {
        Alert.alert('Verification Error', verifyResponse.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setStep(1);
    setOtp('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Animated Background */}
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />
          <View style={[styles.shape, styles.shape4]} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <MaterialIcons name={step === 1 ? "person-add" : "verified"} size={36} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                {step === 1 ? 'Create Account' : 'Verify Your Account'}
              </Text>
              <Text style={styles.subtitleText}>
                {step === 1 
                  ? 'Enter your details to get started' 
                  : `OTP sent to +91${formData.mobileNo}`
                }
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                {/* First Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={[styles.inputWrapper, errors.firstName && styles.inputWrapperError]}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="person" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your first name"
                      placeholderTextColor="#94A3B8"
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      maxLength={40}
                      editable={!loading}
                    />
                  </View>
                  {errors.firstName && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    </View>
                  )}
                </View>

                {/* Last Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={[styles.inputWrapper, errors.lastName && styles.inputWrapperError]}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="person-outline" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your last name"
                      placeholderTextColor="#94A3B8"
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      maxLength={100}
                      editable={!loading}
                    />
                  </View>
                  {errors.lastName && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    </View>
                  )}
                </View>

                {/* Mobile Number Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={[styles.inputWrapper, errors.mobileNo && styles.inputWrapperError]}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="phone" size={22} color="#FF6B6B" />
                    </View>
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.mobileInput]}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={formData.mobileNo}
                      onChangeText={(text) => handleInputChange('mobileNo', text)}
                      editable={!loading}
                    />
                  </View>
                  {errors.mobileNo && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.mobileNo}</Text>
                    </View>
                  )}
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    loading && styles.registerButtonDisabled
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.registerButtonText}>Send OTP</Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Info Text */}
                <View style={styles.infoContainer}>
                  <MaterialIcons name="info-outline" size={16} color="#64748B" />
                  <Text style={styles.infoText}>
                    We'll send a verification code to your mobile
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Mobile Number Display (Read-only) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="phone" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={[styles.input, { color: '#64748B' }]}
                      value={`+91 ${formData.mobileNo}`}
                      editable={false}
                    />
                  </View>
                </View>

                {/* OTP Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="sms" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    loading && styles.registerButtonDisabled
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading || !otp}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.registerButtonText}>Verify OTP</Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Resend Info */}
                <View style={styles.infoContainer}>
                  <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                    <Text style={styles.resendText}>Change number or resend OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/User/Login')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Are you a shop owner? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/Shop/Register')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Register here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
    borderRadius: 100,
  },
  shape1: {
    width: 300,
    height: 300,
    backgroundColor: '#FFE5E5',
    top: -150,
    right: -100,
    opacity: 0.5,
  },
  shape2: {
    width: 200,
    height: 200,
    backgroundColor: '#FFE5E5',
    bottom: -50,
    left: -100,
    opacity: 0.4,
  },
  shape3: {
    width: 150,
    height: 150,
    backgroundColor: '#FFF0F0',
    top: '45%',
    right: -75,
    opacity: 0.6,
  },
  shape4: {
    width: 100,
    height: 100,
    backgroundColor: '#FFE5E5',
    top: '20%',
    left: -50,
    opacity: 0.3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    height: 60,
  },
  inputWrapperError: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  inputIconContainer: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingRight: 16,
    fontWeight: '500',
  },
  countryCodeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  mobileInput: {
    paddingLeft: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#FF6B6B',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    color: '#64748B',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  resendText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '400',
  },
  linkText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
});