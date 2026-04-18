import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Logo from '@/assets/images/logo_black.png';
import { LoginShopUser } from '../../api/Service/Shop';
import { userGoogleSignin, savePushToken } from '../../api/Service/User';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      // Production ID: 
      webClientId: '805182446508-gvphqj7e7kigpreinncsi480u4dficea.apps.googleusercontent.com',
      // Development ID:
      // webClientId: '293758521018-en9762n993a249rik4r3snavhblsa7s7.apps.googleusercontent.com',
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
        role: 'shop',
      });

      console.log('GOOGLE LOGIN RESPONSE:', response);

      if (response.success && response.token) {
        await AsyncStorage.setItem('accessToken', response.token);
        await AsyncStorage.setItem('authProvider', 'google');
        await AsyncStorage.setItem('userCategory', 'shop');

        if (response.user?.shopId) {
          await AsyncStorage.setItem('shopId', response.user.shopId);
        }

        if (response.user?._id) {
          await AsyncStorage.setItem('shopOwnerId', response.user._id);
        }

        try {
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          if (pushToken) {
            await savePushToken(pushToken); 
          }
        } catch (tokenError) {
          console.error('Error saving push token:', tokenError);
        }

        router.replace('/ShopOwner/shopOwnerHome');
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
        await AsyncStorage.setItem('authProvider', 'local');
        await AsyncStorage.setItem('userCategory', 'shop');

        if (response.user?.shopId) {
          await AsyncStorage.setItem('shopId', response.user.shopId);
        }

        if (response.user?._id) {
          await AsyncStorage.setItem('shopOwnerId', response.user._id);
        }

        try {
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          if (pushToken) {
            await savePushToken(pushToken); 
          }
        } catch (tokenError) {
          console.error('Error saving push token:', tokenError);
        }

        router.replace('/ShopOwner/shopOwnerHome');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.innerContainer}>
          {/* Header with Logo - Now properly positioned */}
          <View style={styles.headerContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={Logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitleText}>Sign in to manage your salon</Text>
            </View>
          </View>

          {/* Main Content - No Scroll */}
          <View style={styles.contentContainer}>
            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused
                ]}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={focusedInput === 'email' ? '#1877F2' : '#94A3B8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!loading && !googleLoading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused
                ]}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color={focusedInput === 'password' ? '#1877F2' : '#94A3B8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!loading && !googleLoading}
                  />
                  <TouchableOpacity
                    style={styles.visibilityToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading || googleLoading}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
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

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, (loading || googleLoading || !email || !password) && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading || googleLoading || !email || !password}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.loginButtonContent}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignin}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#1877F2" />
                ) : (
                  <>
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New to BookMyCuts? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/Screens/Shop/Register')}
                  disabled={loading || googleLoading}
                >
                  <Text style={styles.linkText}>Register your salon</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Privacy */}
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
                  onPress={() => Linking.openURL('https://www.bookmycuts.com/terms')}
                >
                  Terms of Service
                </Text>
              </Text>
            </View>
          </View>
        </View>
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
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: width * 0.6,
    height: 100,
  },
  titleContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formContainer: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#1877F2',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '400',
    paddingVertical: 16,
    margin: 0,
  },
  passwordInput: {
    paddingRight: 0,
  },
  visibilityToggle: {
    padding: 12,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#1877F2',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#1877F2',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#94A3B8',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 56,
    gap: 12,
    width: '100%',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '400',
  },
  linkText: {
    color: '#1877F2',
    fontSize: 15,
    fontWeight: '700',
  },
  policyContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  policyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#1877F2',
    fontWeight: '600',
  },
});