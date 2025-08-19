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
import { LoginShopUser } from '../../api/Service/Shop';

export default function Login() {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      // Validate inputs
      if (activeTab === 'password') {
        if (!email || !password) {
          Alert.alert('Error', 'Please enter both email and password');
          setLoading(false);
          return;
        }
      } else {
        if (!phone || !otp) {
          Alert.alert('Error', 'Please enter both phone number and OTP');
          setLoading(false);
          return;
        }
      }

      // Prepare login data based on active tab
      const loginData = activeTab === 'password' 
        ? { email, password }
        : { phone, otp };

      // Call the shop login API
      const response = await LoginShopUser(loginData);
      console.log('Login response:', response);
      if(response.result.token){
        await AsyncStorage.setItem('accessToken', response.result.token);
    }
      router.push('/ShopOwner/shopOwnerHome')
      if (response.success) {
      await AsyncStorage.setItem('accessToken', response.result.token);
        // Successful login - navigate to shop dashboard
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.push('/ShopOwner/shopOwnerHome') }
        ]);
      } else {
        // Show error message from API or default message
        const errorMessage = response.message || 'Login failed. Please try again.';
        Alert.alert('Login Error', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    
    try {
      // Call your OTP sending API here
      // This is a placeholder - replace with actual OTP API call
      const otpResponse = { success: true }; // Mock response
      
      if (otpResponse.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP sending error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Shop Owner Login</Text>
            <Text style={styles.subtitle}>Manage your salon bookings</Text>
          </View>

          {/* Login Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.activeTab]}
              onPress={() => setActiveTab('password')}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                Email Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'otp' && styles.activeTab]}
              onPress={() => setActiveTab('otp')}
            >
              <Text style={[styles.tabText, activeTab === 'otp' && styles.activeTabText]}>
                OTP Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email/Password Form */}
          {activeTab === 'password' && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="email" size={20} color="#FF6B6B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#FF6B6B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Form */}
          {activeTab === 'otp' && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color="#FF6B6B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
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
                onPress={otpSent ? handleLogin : handleSendOtp}
                disabled={loading || (otpSent ? !otp : !phone)}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.otpButtonText}>
                    {otpSent ? 'Verify OTP' : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>

              {otpSent && (
                <TouchableOpacity 
                  style={styles.resendOtp} 
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendOtpText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Footer Links */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/Screens/Shop/Register')}>
              <Text style={styles.footerLink}>Register your salon</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  formContainer: {
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  otpButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  otpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendOtp: {
    alignSelf: 'center',
  },
  resendOtpText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  footerLink: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
});