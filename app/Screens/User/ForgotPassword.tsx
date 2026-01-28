import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { forgotPassword, verifyForgotOtp, resetPassword } from '@/app/api/Service/User';

type Step = 'email' | 'otp' | 'reset';

const ForgotPassword = () => {
  const router = useRouter();
  const { role = 'user' } = useLocalSearchParams<{ role: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const showError = (msg: string) => {
    setMessage(msg);
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await forgotPassword({ email, role });

      // Adjust these conditions according to your actual API response shape
      if (response?.success || response?.status === 'success' || response?.message?.toLowerCase().includes('sent')) {
        setMessage('OTP sent! Please check your email.');
        setStep('otp');
      } else {
        showError(response?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      showError(error?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await verifyForgotOtp({ email, otp, role });

      // Adjust condition based on your API response
      if (response?.success || response?.verified || response?.message?.toLowerCase().includes('verified')) {
        setMessage('OTP verified successfully!');
        setStep('reset');
      } else {
        showError(response?.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (error: any) {
      showError(error?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await resetPassword({
        email,
        password: newPassword, // change to new_password / confirm_password if your API expects different field name
        role,
      });

      if (response?.success || response?.message?.toLowerCase().includes('success') || response?.status === 'success') {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been updated. Please login with your new password.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/Screens/User/Login'), // ← adjust this path to your actual login route
            },
          ]
        );
      } else {
        showError(response?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      showError(error?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {step === 'email' ? 'Reset Password' : step === 'otp' ? 'Verify OTP' : 'Set New Password'}
          </Text>

          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter your email to receive a one-time password'
              : step === 'otp'
              ? `We sent a 6-digit code to ${email}`
              : 'Choose a strong new password'}
          </Text>

          {step === 'email' && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#bbb"
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                  autoFocus
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={resetFlow} style={styles.link}>
                <Text style={styles.linkText}>Didn't receive code? Try again</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'reset' && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#aaa"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TextInput
                  style={[styles.input, { marginTop: 16 }]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#aaa"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={resetFlow} style={styles.link}>
                <Text style={styles.linkText}>Start over</Text>
              </TouchableOpacity>
            </>
          )}

          {message ? (
            <Text
              style={[
                styles.message,
                message.toLowerCase().includes('success') ||
                message.toLowerCase().includes('sent') ||
                message.toLowerCase().includes('verified')
                  ? styles.success
                  : styles.error,
              ]}
            >
              {message}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
    height: 58,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 22,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#e74c3c',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ForgotPassword;