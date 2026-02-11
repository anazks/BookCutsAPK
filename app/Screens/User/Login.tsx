import { userGoogleSignin, userLogin } from '@/app/api/Service/User';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import {
  GoogleSignin,
  statusCodes
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Full Pane Background Gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name="cut" size={30} color="#D4AF37" />
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to find your perfect cut</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#D4AF37" style={styles.inputIcon} />
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
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/Screens/User/ForgotPassword', params: { role: 'user' } })}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#D4AF37" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color="rgba(212, 175, 55, 0.5)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8860B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.loginButtonText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity 
                style={styles.googleBtn} 
                onPress={signInWithGoogle} 
                disabled={googleLoading}
            >
                {googleLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="logo-google" size={20} color="#FFF" />
                        <Text style={styles.googleBtnText}>Sign in with Google</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* OTP Option */}
            <TouchableOpacity
              style={styles.otpButton}
              onPress={() => router.push('/Screens/User/LoginOtp')}
              disabled={isLoading}
            >
              <Text style={styles.otpButtonText}>Use Phone Number / OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to BookMyCuts? </Text>
            <TouchableOpacity onPress={() => router.push('/Screens/User/Register')}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shopOwnerSection}>
            <Text style={styles.footerText}>Are you a shop owner? </Text>
            <TouchableOpacity onPress={() => router.push('/Screens/Shop/Login')}>
              <Text style={styles.shopLinkText}>Partner Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40, paddingTop: 40 },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 20,
  },
  welcomeText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  subtitleText: { fontSize: 14, color: '#AAA', marginTop: 5, letterSpacing: 0.5 },
  
  formContainer: { paddingHorizontal: 30 },
  inputGroup: { marginBottom: 25 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fieldLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  forgotText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecorationLine: 'underline' },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  
  loginButton: { height: 55, borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { paddingHorizontal: 15, color: 'rgba(255, 255, 255, 0.3)', fontSize: 10, fontWeight: '700' },

  googleBtn: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15
  },
  googleBtnText: { color: '#FFF', fontWeight: '600' },

  otpButton: { padding: 15, alignItems: 'center' },
  otpButtonText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  shopOwnerSection: { marginTop: 30, alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 15, marginHorizontal: 30 },
  shopLinkText: { color: '#D4AF37', fontWeight: '700', marginTop: 5 }
});