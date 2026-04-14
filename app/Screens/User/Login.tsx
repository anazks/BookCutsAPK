import { userLogin, userGoogleSignin, savePushToken } from '@/app/api/Service/User';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  Image,
} from 'react-native';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import Logo from '@/assets/images/logo_black.png';

const { width, height } = Dimensions.get('window');

const PRIMARY = '#1877F2';
const DARK_TEXT = '#1E293B';
const GRAY_TEXT = '#64748B';
const LIGHT_GRAY = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

      const response = await userGoogleSignin({ idToken });

      console.log('GOOGLE LOGIN RESPONSE:', response);


    if (response.success && response.token) {
        console.log('🟢 BREADCRUMB 1: Login success block reached!');

        await AsyncStorage.setItem('accessToken', response.token);
        await AsyncStorage.setItem('authProvider', 'google');
        await AsyncStorage.setItem('userCategory', 'user');

        if (response.user?.id) {
          await AsyncStorage.setItem('userId', response.user.id);
        }

        try {
          console.log('🟢 BREADCRUMB 2: Checking storage for push token...');
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          
          console.log('🟢 BREADCRUMB 3: Retrieved pushToken ->', pushToken);
          
          if (pushToken) {
            console.log('🟢 BREADCRUMB 4: Token exists! Calling API...');
            
            // Note: Make sure savePushToken is imported at the top of this file!
            await savePushToken(pushToken); 
            
            console.log('🟢 BREADCRUMB 5: API function completed.');
          } else {
            console.log('🔴 STOP: pushToken is null. The API was skipped.');
          }
        } catch (tokenError) {
          console.error('🔴 ERROR IN PUSH TOKEN BLOCK:', tokenError);
        }

        router.replace('/(tabs)/Home');
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

  const handleLogin = async () => {
    setLoading(true);

    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      const loginData = { email, password };
      const response = await userLogin(loginData);

      console.log('LOGIN RESPONSE 👉', response);

      if (response.success && response.token) {
        console.log('🟢 BREADCRUMB 1: Login success block reached!');

        await AsyncStorage.setItem('accessToken', response.token);
        await AsyncStorage.setItem('authProvider', 'local');
        await AsyncStorage.setItem('userCategory', 'user');

        if (response.user?.id) {
          await AsyncStorage.setItem('userId', response.user.id);
        }

        try {
          console.log('🟢 BREADCRUMB 2: Checking storage for push token...');
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          
          console.log('🟢 BREADCRUMB 3: Retrieved pushToken ->', pushToken);
          
          if (pushToken) {
            console.log('🟢 BREADCRUMB 4: Token exists! Calling API...');
            
            // Note: Make sure savePushToken is imported at the top of this file!
            await savePushToken(pushToken); 
            
            console.log('🟢 BREADCRUMB 5: API function completed.');
          } else {
            console.log('🔴 STOP: pushToken is null. The API was skipped.');
          }
        } catch (tokenError) {
          console.error('🔴 ERROR IN PUSH TOKEN BLOCK:', tokenError);
        }

        router.replace('/(tabs)/Home');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Large Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subtitleText}>Sign in to your account</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused
              ]}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={focusedField === 'email' ? PRIMARY : GRAY_TEXT} 
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={GRAY_TEXT}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading && !googleLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused
              ]}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={focusedField === 'password' ? PRIMARY : GRAY_TEXT} 
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={GRAY_TEXT}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading && !googleLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading || googleLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={GRAY_TEXT}
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
                  params: { role: 'user' },
                })
              }
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (loading || googleLoading || !email || !password) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || googleLoading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.googleButton, (googleLoading || loading) && styles.buttonDisabled]}
              onPress={handleGoogleSignin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator color={PRIMARY} size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Image 
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>New to BookMyCuts? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/User/Register')}
                disabled={loading || googleLoading}
              >
                <Text style={styles.signupLink}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer with Terms */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.footerLink}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
              >
                Privacy Policy
              </Text>{' '}
              and{' '}
              <Text
                style={styles.footerLink}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/terms')}
              >
                Terms of Service
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
    paddingBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 10,      // Reduced from 60 to pull everything up slightly
    marginBottom: 5,    // Reduced from 30 to remove the huge gap below the logo
  },
  logoWrapper: {
    width: width * 0.85, // Increased from 0.7 to give it more horizontal space
    height: 160,         // Increased from 100 to make the logo significantly bigger
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: DARK_TEXT,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: GRAY_TEXT,
    fontWeight: '400',
  },
  formSection: {
    paddingHorizontal: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    height: 60,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#FFFFFF',
  },
  fieldIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: DARK_TEXT,
    fontWeight: '500',
    paddingVertical: 12,
  },
  passwordInput: {
    paddingRight: 0,
  },
  visibilityToggle: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_COLOR,
  },
  dividerText: {
    color: GRAY_TEXT,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: GRAY_TEXT,
    fontSize: 15,
    fontWeight: '400',
  },
  signupLink: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: GRAY_TEXT,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: PRIMARY,
    fontWeight: '600',
  },
});