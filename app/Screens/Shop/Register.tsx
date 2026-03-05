import { router } from 'expo-router';
import { useState } from 'react';
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
    Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RegisterShopUser } from '../../api/Service/Shop';

const { width, height } = Dimensions.get('window');

// Updated color scheme to match login
const PRIMARY_COLOR = '#1877F2'; // Facebook blue
const TEXT_DARK = '#1e293b';
const TEXT_GRAY = '#64748b';
const ERROR_RED = '#ef4444';
const INPUT_BG = '#f8fafc';
const INPUT_BORDER = '#e2e8f0';

export default function ShopRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNo: '',
    city: '',
    password: '',
    email: '',
    role: 'shop'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    // Validate form fields
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }
    if (!formData.mobileNo.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobileNo)) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (formData.password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Convert to FormData
      const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobileNo: formData.mobileNo,
      city: formData.city,
      password: formData.password,
      email: formData.email,
      role: formData.role
    };

      const result = await RegisterShopUser(registrationData);
      console.log('Registration result:', result);
      
      if (result && result.success === true) {
        Alert.alert('Success', 'Shop registration successful!', [
          { text: 'OK', onPress: () => router.push('/Screens/Shop/Login') }
        ]);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
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
            {/*  */}
            
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Create Shop Account</Text>
              <Text style={styles.subtitleText}>Register to manage your salon bookings</Text>
            </View>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* First Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="person" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={formData.firstName}
                  onChangeText={(text) => handleChange('firstName', text)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Last Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="person-outline" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={formData.lastName}
                  onChangeText={(text) => handleChange('lastName', text)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Mobile No Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="phone" size={22} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.mobileInput]}
                  placeholder="Mobile Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={formData.mobileNo}
                  onChangeText={(text) => handleChange('mobileNo', text)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* City Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="location-city" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={formData.city}
                  onChangeText={(text) => handleChange('city', text)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="email" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility-off' : 'visibility'} 
                    size={22} 
                    color={TEXT_GRAY} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock-outline" size={22} color={PRIMARY_COLOR} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                    size={22} 
                    color={TEXT_GRAY} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button - Updated to blue */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.registerButtonText}>Register</Text>
                  <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/Screens/Shop/Login')}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.policyContainer}>
            <Text style={styles.policyText}>
              By signing up, you agree to our{' '}
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

// Updated styles with blue/white color scheme
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
    backgroundColor: PRIMARY_COLOR, // Changed to blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
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
    color: TEXT_DARK,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: TEXT_GRAY,
    fontWeight: '400',
    textAlign: 'center',
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
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
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
    color: TEXT_DARK,
    paddingRight: 16,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 0,
  },
  visibilityToggle: {
    padding: 18,
  },
  countryCodeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF', // Light blue background
    borderRadius: 8,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: PRIMARY_COLOR, // Changed to blue
    fontWeight: '600',
  },
  mobileInput: {
    paddingLeft: 0,
  },
  registerButton: {
    backgroundColor: PRIMARY_COLOR, // Changed to blue
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#94a3b8', // Gray when disabled
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
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
    color: TEXT_GRAY,
    fontSize: 15,
    fontWeight: '400',
  },
  linkText: {
    color: PRIMARY_COLOR, // Changed to blue
    fontSize: 15,
    fontWeight: '700',
  },
  policyContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  policyText: {
    fontSize: 12,
    color: TEXT_GRAY,
    textAlign: 'center',
  },
  link: {
    color: PRIMARY_COLOR, // Changed to blue
    fontWeight: '600',
    textDecorationLine: 'underline',
  }  
});