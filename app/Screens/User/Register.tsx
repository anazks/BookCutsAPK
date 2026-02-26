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
  View,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { userLogin, userRegister } from '../../api/Service/User'; // ← updated import

const PRIMARY_COLOR = '#FF6B6B';
const TEXT_DARK = '#1a1a1a';
const TEXT_GRAY = '#64748b';
const ERROR_RED = '#ef4444';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'user',
      };

      if (formData.referralCode.trim()) {
        payload.referralCode = formData.referralCode.trim();
      }

      // Using userRegister instead of userLogin
      const response = await userRegister(payload);

      if (response.success) {
        Alert.alert(
          'Success',
          'Registration successful! Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/Screens/User/Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Enter your details to get started</Text>
          </View>

          {/* Form Content */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <View
                style={[styles.inputContainer, errors.firstName && styles.inputError]}
              >
                <MaterialIcons
                  name="person"
                  size={22}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#a0aec0"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  autoCapitalize="words"
                  maxLength={40}
                  editable={!loading}
                />
              </View>
              {errors.firstName && (
                <Text style={styles.errorMessage}>{errors.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View
                style={[styles.inputContainer, errors.lastName && styles.inputError]}
              >
                <MaterialIcons
                  name="person-outline"
                  size={22}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#a0aec0"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  autoCapitalize="words"
                  maxLength={60}
                  editable={!loading}
                />
              </View>
              {errors.lastName && (
                <Text style={styles.errorMessage}>{errors.lastName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[styles.inputContainer, errors.email && styles.inputError]}
              >
                <MaterialIcons
                  name="email"
                  size={22}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="yourname@example.com"
                  placeholderTextColor="#a0aec0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  editable={!loading}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorMessage}>{errors.email}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={22}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#a0aec0"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={50}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={22}
                    color={TEXT_GRAY}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorMessage}>{errors.password}</Text>
              )}
            </View>

            {/* Referral Code - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code (optional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="card-giftcard"
                  size={22}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2dfr3w"
                  placeholderTextColor="#a0aec0"
                  autoCapitalize="none"
                  value={formData.referralCode}
                  onChangeText={(text) => handleInputChange('referralCode', text)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={PRIMARY_COLOR} size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={PRIMARY_COLOR} />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.policyText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
              >
                Privacy Policy
              </Text>{' '}
              and{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://www.bookmycuts.com/privacy')}
              >
                Terms of Service
              </Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/Screens/User/Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Are you a shop owner? </Text>
              <TouchableOpacity onPress={() => router.push('/Screens/Shop/Register')}>
                <Text style={styles.footerLink}>Register here</Text>
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
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 4,
  },
  inputError: {
    borderColor: ERROR_RED,
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: TEXT_DARK,
    paddingVertical: 12,
  },
  errorMessage: {
    color: ERROR_RED,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderRadius: 16,
    height: 58,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: PRIMARY_COLOR,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  policyText: {
    fontSize: 13,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  footerText: {
    color: TEXT_GRAY,
    fontSize: 15,
  },
  footerLink: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
    marginLeft: 4,
  },
});