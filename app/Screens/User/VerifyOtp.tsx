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
import { verifyOtp } from '../../api/Service/ShoperOwner';

export default function VerifyOtp() {
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpMobile || !otp) {
      Alert.alert('Error', 'Please enter both mobile number and OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = { mobileNo: otpMobile, otp, role: "user" };
      console.log("Verifying:", payload);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Verify Your Account</Text>
            <Text style={styles.subtitle}>Enter Mobile & OTP</Text>
          </View>

          {/* OTP Verify Form */}
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

            <TouchableOpacity
              style={[styles.otpButton, loading && styles.disabledButton]}
              onPress={handleVerifyOtp}
              disabled={loading || !otp || !otpMobile}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.otpButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive OTP?</Text>
            <TouchableOpacity onPress={() => Alert.alert("Info", "Go back & request OTP again")}>
              <Text style={styles.footerLink}>Resend</Text>
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 14, marginRight: 5 },
  footerLink: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' }
});
