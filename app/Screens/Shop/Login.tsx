import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
  View,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { LoginShopUser,  otpLogin, verifyOtp } from '../../api/Service/Shop';
import { userGoogleSignin} from '../../api/Service/User'

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [activeTab, setActiveTab] = useState<'password' | 'otp' | 'google'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMobile, setOtpMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '805182446508-gvphqj7e7kigpreinncsi480u4dficea.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  // ---------------- Google Sign-In ----------------
  const handleGoogleSignin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'No ID token received from Google');
        return;
      }

      setLoading(true);

      const response = await userGoogleSignin({
        idToken,
        role: 'shopOwner',
      });

      console.log('GOOGLE LOGIN RESPONSE:', response);

      if (response.success && response.token) {
        await AsyncStorage.setItem('accessToken', response.token);

        if (response.user?.shopId) {
          await AsyncStorage.setItem('shopId', response.user.shopId);
        }

        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => router.replace('/ShopOwner/shopOwnerHome'),
          },
        ]);
      } else {
        Alert.alert('Login Error', response.message || 'Google login failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Google login failed. Please try again.';
        Alert.alert('Error', message);
      }
    } finally {
      setGoogleLoading(false);
      setLoading(false);
    }
  };

  // ---------------- Normal login ----------------
  const handleLogin = async () => {
    setLoading(true);

    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      const loginData = { email, password };
      const response = await LoginShopUser(loginData);

      console.log('LOGIN RESPONSE 👉', response);

      if (response.success && response.token) {
        await AsyncStorage.setItem('accessToken', response.token);

        if (response.user?.shopId) {
          await AsyncStorage.setItem('shopId', response.user.shopId);
        }

        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace('/ShopOwner/shopOwnerHome') },
        ]);
      } else {
        Alert.alert('Login Error', response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.log('❌ LOGIN ERROR FULL 👉', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'An unexpected error occurred. Please try again.';
      Alert.alert('Error', message);
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
      const payload = { mobileNo: otpMobile, role: 'shopper' };
      const otpResponse = await otpLogin(payload);

      if (otpResponse.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
      } else {
        Alert.alert('Error', otpResponse.message || 'Failed to send OTP.');
      }
    } catch (error) {
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
      const payload = { mobileNo: otpMobile, otp, role: 'shopper' };
      const verifyResponse = await verifyOtp(payload);

      if (verifyResponse.success && verifyResponse.token) {
        await AsyncStorage.setItem('accessToken', verifyResponse.token);

        if (verifyResponse.userDate?.shopId) {
          await AsyncStorage.setItem('shopId', verifyResponse.userDate.shopId);
        }

        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.push('/ShopOwner/shopOwnerHome') },
        ]);
      } else {
        Alert.alert('Verification Error', verifyResponse.message || 'Invalid OTP.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
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
          {/* Header */}
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
              disabled={loading || googleLoading}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                Email Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'otp' && styles.activeTab]}
              onPress={() => setActiveTab('otp')}
              disabled={loading || googleLoading}
            >
              <Text style={[styles.tabText, activeTab === 'otp' && styles.activeTabText]}>
                Mobile OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {activeTab === 'password' && (
              <>
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
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading && !googleLoading}
                    />
                  </View>
                </View>

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
                      editable={!loading && !googleLoading}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading || googleLoading}
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
                  disabled={loading || googleLoading}
                  onPress={() =>
                    router.push({
                      pathname: '/Screens/User/ForgotPassword',
                      params: { role: 'shopper' },
                    })
                  }
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginButton, (loading || googleLoading) && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading || googleLoading || !email || !password}
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

            {activeTab === 'otp' && (
              <>
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
                      editable={!loading && !googleLoading}
                    />
                  </View>
                </View>

                {otpSent && (
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
                        editable={!loading && !googleLoading}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginButton, (loading || googleLoading) && styles.loginButtonDisabled]}
                  onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={loading || googleLoading || (otpSent ? !otp : !otpMobile)}
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
                    disabled={loading || googleLoading}
                  >
                    <Text style={styles.resendOtpText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Google Sign-In Button */}
          <View style={{ alignItems: 'center', marginVertical: 24, paddingHorizontal: 40 }}>
            {googleLoading ? (
              <ActivityIndicator size="large" color="#FF6B6B" />
            ) : (
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={handleGoogleSignin}
                disabled={loading || googleLoading}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/Shop/Register')}
                disabled={loading || googleLoading}
              >
                <Text style={styles.linkText}>Register your salon</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.policyContainer}>
            <Text style={styles.policyText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
              >
                Privacy Policy
              </Text>{' '}
              and{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
              >
                Terms & Conditions
              </Text>
            </Text>
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
   policyContainer: {
    marginTop: 20,
    marginBottom:10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  policyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  }
});