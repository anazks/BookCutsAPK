import { userLogin, userGoogleSignin } from '@/app/api/Service/User';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Button,
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

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google Sign-In once when component mounts
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '805182446508-gvphqj7e7kigpreinncsi480u4dficea.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'No ID token received from Google');
        return;
      }

      console.log('Google ID Token:', idToken.substring(0, 50) + '...');

      // Send idToken to your backend
      const response = await userGoogleSignin({ idToken });

      console.log('Google login response:', response);

      if (response.success === true && response.token && response.user) {
        // Store exactly like normal login
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('accessToken', response.token);

        // Redirect to home
        router.replace('/(tabs)/Home');
      } else {
        const errorMessage = response.message || 'Google login failed';
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await userLogin({ email, password });
      console.log('Login response:', response);

      if (response.success === true && response.token && response.user) {
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('accessToken', response.token);
        router.replace('/(tabs)/Home');
      } else {
        const errorMessage = response.message || 'Invalid login details.';
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF6B6B" barStyle="light-content" />

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
          <View style={styles.headerSection}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <MaterialIcons name="email" size={20} color="#FFFFFF" />
                <Text style={styles.inputLabel}>Email Address</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
              <View style={styles.underline} />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelContainer}>
                <MaterialIcons name="lock" size={20} color="#FFFFFF" />
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={22}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.underline} />
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              disabled={isLoading}
              onPress={() =>
                router.push({
                  pathname: '/Screens/User/ForgotPassword',
                  params: { role: 'user' },
                })
              }
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

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

            {/* Email Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FF6B6B" size="small" />
              ) : (
                <View style={styles.loginButtonContent}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <MaterialIcons name="arrow-forward" size={22} color="#FF6B6B" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              {googleLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Light}
                  onPress={signInWithGoogle}
                  disabled={googleLoading || isLoading}
                />
              )}
            </View>

            {/* OTP Button */}
            <TouchableOpacity
              style={[styles.otpLoginButton, isLoading && styles.loginButtonDisabled]}
              onPress={() => router.push('/Screens/User/LoginOtp')}
              disabled={isLoading}
            >
              <View style={styles.otpButtonContent}>
                <MaterialIcons name="sms" size={22} color="#FFFFFF" />
                <Text style={styles.otpLoginButtonText}>Login with OTP</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/Screens/User/Register')} disabled={isLoading}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Are you a shop owner? </Text>
              <TouchableOpacity onPress={() => router.push('/Screens/Shop/Login')} disabled={isLoading}>
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
    policyContainer: {
      // marginTop: 12,
      marginTop:2,
      marginBottom:10,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    policyText: {
      fontSize: 12,
      color: '#ffffff',
      textAlign: 'center',
    },
    link: {
      color: '#8fc2f9',
      textDecorationLine: 'underline',
    },
    container: {
      flex: 1,
      backgroundColor: '#FF6B6B',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 40,
    },
    headerSection: {
      paddingHorizontal: 40,
      alignItems: 'center',
      marginBottom: 50,
      marginTop: 60,
    },
    welcomeText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginBottom: 10,
    },
    subtitleText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '400',
      textAlign: 'center',
    },
    formContainer: {
      paddingHorizontal: 40,
    },
    inputContainer: {
      marginBottom: 30,
    },
    inputLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: '#FFFFFF',
      marginLeft: 10,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      fontSize: 17,
      color: '#FFFFFF',
      paddingVertical: 12,
      fontWeight: '500',
    },
    underline: {
      height: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },
    visibilityToggle: {
      padding: 10,
      marginLeft: 10,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 35,
      marginTop: -10,
    },
    forgotPasswordText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      textDecorationLine: 'underline',
      opacity: 0.9,
    },
    loginButton: {
      backgroundColor: '#FFFFFF',
      height: 58,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
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
      color: '#FF6B6B',
      fontSize: 18,
      fontWeight: '700',
      marginRight: 10,
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
      paddingHorizontal: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      fontWeight: '500',
    },
    otpLoginButton: {
      backgroundColor: 'transparent',
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    otpButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    otpLoginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: 40,
      marginTop: 40,
      gap: 16,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 15,
      fontWeight: '400',
    },
    linkText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });