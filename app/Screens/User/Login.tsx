import { userGoogleSignin, userLogin } from '@/app/api/Service/User';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

      const response = await userGoogleSignin({ idToken });

      if (response.success === true && response.token && response.user) {
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('accessToken', response.token);
        router.replace('/(tabs)/Home');
      } else {
        Alert.alert('Login Failed', response.message || 'Google login failed');
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const response = await userLogin({ email, password });
      if (response.success === true && response.token && response.user) {
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('accessToken', response.token);
        router.replace('/(tabs)/Home');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid login details.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ABSTRACT BACKGROUND SHAPES (Matching Home Theme) */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020617' }]} />
        <LinearGradient
          colors={['#1E3A8A', 'transparent']}
          style={[styles.shape, { top: -50, right: -50, width: 250, height: 250, borderRadius: 125, opacity: 0.2 }]}
        />
        <View 
          style={[styles.shape, { 
            bottom: -50, 
            left: -width * 0.1, 
            width: width * 0.7, 
            height: width * 0.7, 
            borderRadius: 80, 
            backgroundColor: '#0F172A',
            transform: [{ rotate: '45deg' }],
            opacity: 0.6
          }]} 
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerSection}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitleText}>Sign in to your premium grooming experience</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="email" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons
                      name={isPasswordVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push({ pathname: '/Screens/User/ForgotPassword', params: { role: 'user' } })}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.loginButtonContainer}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <View style={styles.socialContainer}>
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <GoogleSigninButton
                    style={styles.googleButton}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={signInWithGoogle}
                  />
                )}
              </View>

              {/* OTP Option */}
              <TouchableOpacity
                style={styles.otpButton}
                onPress={() => router.push('/Screens/User/LoginOtp')}
              >
                <MaterialIcons name="sms" size={20} color="#3B82F6" />
                <Text style={styles.otpButtonText}>Login with OTP</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/Screens/User/Register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.shopOwnerLink}
                onPress={() => router.push('/Screens/Shop/Login')}
            >
                <Text style={styles.shopOwnerText}>Are you a shop owner? <Text style={styles.linkText}>Login here</Text></Text>
            </TouchableOpacity>

            <View style={styles.policyContainer}>
              <Text style={styles.policyText}>
                By continuing, you agree to our{' '}
                <Text style={styles.policyLink} onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  safeArea: { flex: 1 },
  shape: { position: 'absolute' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: 30 },
  
  headerSection: { marginTop: height * 0.08, marginBottom: 40 },
  welcomeText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitleText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', marginTop: 8, lineHeight: 22 },
  
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  fieldLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
  glassInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 12, fontWeight: '500' },
  
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotPasswordText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  
  loginButtonContainer: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loginButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { paddingHorizontal: 15, color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, fontWeight: '700' },
  
  socialContainer: { alignItems: 'center', marginBottom: 20 },
  googleButton: { width: width - 60, height: 55 },
  
  otpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 10,
  },
  otpButtonText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  linkText: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
  
  shopOwnerLink: { marginTop: 20, alignItems: 'center' },
  shopOwnerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  
  policyContainer: { marginTop: 30, alignItems: 'center' },
  policyText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  policyLink: { color: 'rgba(255,255,255,0.5)', textDecorationLine: 'underline' },
});