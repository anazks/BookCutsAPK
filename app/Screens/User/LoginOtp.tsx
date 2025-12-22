import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { otpLogin, verifyOtp } from '../../api/Service/ShoperOwner';

export default function LoginOtp() {
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Send OTP
  const handleSendOtp = async () => {
    if (!otpMobile) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      const payload = { mobileNo: otpMobile, role: "user" };
      console.log("Sending to backend:", payload);
      const otpResponse = await otpLogin(payload);

      if (otpResponse.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
      } else {
        Alert.alert('Error', otpResponse.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpMobile || !otp) {
      Alert.alert('Error', 'Please enter both mobile number and OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = { mobileNo: otpMobile, otp, role: "user" };
      console.log("Sending to backend:", payload);
      const verifyResponse = await verifyOtp(payload);

      if (verifyResponse.success && verifyResponse.token) {
        await AsyncStorage.setItem('accessToken', verifyResponse.token);
        Alert.alert('Success', 'Login successful!', [
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Animated Background */}
       

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
                <MaterialIcons name="content-cut" size={36} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>OTP Login</Text>
              <Text style={styles.subtitleText}>Enter your mobile number to continue</Text>
            </View>
          </View>

          {/* OTP Form */}
          <View style={styles.formContainer}>
            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="phone" size={22} color="#FF6B6B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={otpMobile}
                  onChangeText={setOtpMobile}
                  editable={!loading}
                />
              </View>
            </View>

            {/* OTP Input - Only show after OTP is sent */}
            {otpSent && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <MaterialIcons name="sms" size={22} color="#FF6B6B" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* Send/Verify OTP Button */}
            <TouchableOpacity
              style={[
                styles.otpButton,
                (loading || (otpSent ? !otp : !otpMobile)) && styles.otpButtonDisabled
              ]}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading || (otpSent ? !otp : !otpMobile)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.otpButtonText}>
                    {otpSent ? 'Verify OTP' : 'Send OTP'}
                  </Text>
                  <MaterialIcons 
                    name={otpSent ? 'verified-user' : 'arrow-forward'} 
                    size={22} 
                    color="#FFFFFF" 
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Resend OTP Link */}
            {otpSent && (
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <MaterialIcons name="arrow-back" size={20} color="#FF6B6B" />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/User/Register')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Are you a shop owner? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/Shop/Login')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Login here</Text>
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
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  otpButton: {
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
  otpButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '400',
  },
  resendLink: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFE5E5',
    marginBottom: 32,
  },
  backButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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