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
import { LoginShopUser, viewMyShop } from '../../api/Service/Shop';
import { otpLogin, verifyOtp } from '../../api/Service/ShoperOwner';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---------------- Normal login functions ----------------
  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        setLoading(false);
        return;
      }

      const loginData = { email, password };
      const response = await LoginShopUser(loginData);

      if (response.success && response.result.token) {
        await AsyncStorage.setItem('accessToken', response.result.token);
        // const shop = await viewMyShop();
        // console.log("shop data:", shop);
        // const shopId = shop.data._id;
        // console.log("shopId:", shopId);
        // await AsyncStorage.setItem('shopId', shopId);
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace('/ShopOwner/shopOwnerHome') }
        ]);
      } else {
        Alert.alert('Login Error', response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- OTP login functions ----------------
  const handleSendOtp = async () => {
    if (!otpMobile) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    
    setLoading(true);
    try {
      const payload = { mobileNo: otpMobile, role: "shopper" };
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

  const handleVerifyOtp = async () => {
    if (!otpMobile || !otp) {
      Alert.alert('Error', 'Please enter both mobile number and OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = { mobileNo: otpMobile, otp, role: "shopper" };
      console.log("Sending to backend:", payload);    
      const verifyResponse = await verifyOtp(payload);

      if (verifyResponse.success && verifyResponse.token) {
        await AsyncStorage.setItem('accessToken', verifyResponse.token);
        // const shop = await viewMyShop();
        // console.log("shop data:", shop);
        // const shopId = shop.data._id;
        // console.log("shopId:", shopId);
        // await AsyncStorage.setItem('shopId', shopId);
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.push('/ShopOwner/shopOwnerHome') }
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
              <Text style={styles.welcomeText}>Shop Owner Login</Text>
              <Text style={styles.subtitleText}>Manage your salon bookings</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.activeTab]}
              onPress={() => setActiveTab('password')}
              disabled={loading}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                Email Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'otp' && styles.activeTab]}
              onPress={() => setActiveTab('otp')}
              disabled={loading}
            >
              <Text style={[styles.tabText, activeTab === 'otp' && styles.activeTabText]}>
                Mobile OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Login */}
            {activeTab === 'password' && (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="email" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="lock" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <MaterialIcons 
                        name={showPassword ? 'visibility-off' : 'visibility'} 
                        size={22} 
                        color="#64748B" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.forgotPassword} 
                  disabled={loading}
                  onPress={() => Alert.alert('Forgot Password', 'Coming soon!')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* OTP Login */}
            {activeTab === 'otp' && (
              <>
                {/* Mobile Number Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <MaterialIcons name="phone" size={22} color="#FF6B6B" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={otpMobile}
                      onChangeText={setOtpMobile}
                      editable={!loading}
                    />
                  </View>
                </View>

                {otpSent && (
                  /* OTP Input */
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <MaterialIcons name="sms" size={22} color="#FF6B6B" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
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

                {/* OTP Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled
                  ]}
                  onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={loading || (otpSent ? !otp : !otpMobile)}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Text style={styles.loginButtonText}>
                        {otpSent ? 'Verify OTP' : 'Send OTP'}
                      </Text>
                      <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
                    </View>
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
              </>
            )}
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/Shop/Register')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Register your salon</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  passwordInput: {
    paddingRight: 0,
  },
  visibilityToggle: {
    padding: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  resendOtp: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  resendOtpText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
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