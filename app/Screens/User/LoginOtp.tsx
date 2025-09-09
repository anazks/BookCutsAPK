import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import Icon from 'react-native-vector-icons/MaterialIcons';
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
            console.log("Sending to backend:", payload);  // 👈 Debug log
            const otpResponse = await otpLogin(payload); // Changed from email to mobileNo

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
       const payload = { mobileNo: otpMobile, otp ,role: "user" };
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
      <StatusBar backgroundColor="#FF6B6B" barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>welcome to your account</Text>
            <Text style={styles.subtitle}>Login with Mobile OTP</Text>
          </View>

          {/* OTP Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#FF6B6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={otpMobile}
                onChangeText={setOtpMobile}
              />
            </View>
            {otpSent && (
              <View style={styles.inputContainer}>
                <Icon name="sms" size={20} color="#FF6B6B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.otpButton, loading && styles.disabledButton]}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading || (otpSent ? !otp : !otpMobile)}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.otpButtonText}>{otpSent ? 'Verify OTP' : 'Send OTP'}</Text>
              )}
            </TouchableOpacity>
            {otpSent && (
              <TouchableOpacity style={styles.resendOtp} onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.resendOtpText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/Screens/Shop/Register')}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 20 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: '700', color: '#FF6B6B', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666' },
  formContainer: { marginTop: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: '#333', fontSize: 15 },
  otpButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  disabledButton: { opacity: 0.7 },
  otpButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resendOtp: { alignSelf: 'center' },
  resendOtpText: { color: '#FF6B6B', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 14, marginRight: 5 },
  footerLink: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' }
});
