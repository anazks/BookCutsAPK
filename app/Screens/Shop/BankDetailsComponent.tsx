// app/Screens/Shop/BankDetailsComponent.tsx
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
} from 'react-native';
import { fetchPayoutAccounts, savePayoutAccounts } from '../../api/Service/Shop';

// ── Design Tokens ───────────────────────────────────────
const COLORS = {
  background: '#F8FAFC', // Lighter slate background
  white: '#FFFFFF',
  primary: '#2563EB', // Professional Blue
  primaryLight: '#EBF2FF',
  secondary: '#475569',
  textMain: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  cardGradient: ['#1E293B', '#334155'], // Dark Slate Professional look
};

const BORDER_RADIUS = 16;

// ── Types ──────────────────────────────────────────────
interface UserInfo {
  email: string;
  mobileNo: string;
}

interface BankDetails {
  shopOwnerId?: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  razorpayContactId?: string;
  razorpayFundAccountId?: string;
  user?: UserInfo;
}

const initialForm: BankDetails = {
  shopOwnerId: '',
  accountHolderName: '',
  accountNumber: '',
  ifsc: '',
  user: {
    email: '',
    mobileNo: '',
  }
};

export default function BankDetailsComponent() {
  const router = useRouter();
  const [bankData, setBankData] = useState<BankDetails | null>(null);
  const [form, setForm] = useState<BankDetails>(initialForm);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // Visibility States
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shopOwnerId from storage
      const storedShopOwnerId = await AsyncStorage.getItem('shopOwnerId');
      console.log('[BankDetails] Stored shopOwnerId:', storedShopOwnerId);

      const res = await fetchPayoutAccounts();

      let item = null;
      if (res?.account) {
        item = res.account;
      } else if (res?.data?.account) {
        item = res.data.account;
      } else if (res?.data) {
        item = Array.isArray(res.data) ? res.data[0] : res.data;
      }

      if (item && (item.accountNumber || item.AccountNumber)) {
        console.log('[BankDetails] Raw account number from API:', item.accountNumber || item.AccountNumber);
        const normalized: BankDetails = {
          shopOwnerId: item.shopOwnerId || item.ShopOwnerId || '',
          accountHolderName: item.accountHolderName || item.AccountHolderName || '',
          accountNumber: item.accountNumber || item.AccountNumber || '',
          ifsc: item.ifsc || item.ifceCode || item.IFSC || '',
          razorpayContactId: item.razorpayContactId || '',
          razorpayFundAccountId: item.razorpayFundAccountId || '',
          user: {
            email: item.user?.email || item.email || '',
            mobileNo: item.user?.mobileNo || item.mobileNo || '',
          }
        };
        setBankData(normalized);
        setForm({
          ...normalized,
          shopOwnerId: normalized.shopOwnerId || storedShopOwnerId || ''
        });
        setConfirmAccountNumber(normalized.accountNumber);
      } else {
        setBankData(null);
        setForm({
          ...initialForm,
          shopOwnerId: storedShopOwnerId || ''
        });
        setConfirmAccountNumber('');
      }
    } catch (err: any) {
      console.log('[fetchPayoutAccounts] Error:', err);
      if (err.statusCode !== 404) {
        setError(err.message || 'Unable to load accounts');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!form.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (form.accountNumber.length < 9 || form.accountNumber.length > 18) {
      newErrors.accountNumber = 'Invalid account number (9-18 digits)';
    }

    if (form.accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!form.ifsc) {
      newErrors.ifsc = 'IFSC code is required';
    } else if (!ifscRegex.test(form.ifsc)) {
      newErrors.ifsc = 'Invalid IFSC format (e.g. SBIN0001234)';
    }

    if (form.user?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.user.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    if (form.user?.mobileNo) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(form.user.mobileNo)) {
        newErrors.mobileNo = 'Invalid 10-digit mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Safety check: Fetch shopOwnerId again if missing in state
      let submissionData = { ...form };
      if (!submissionData.shopOwnerId) {
        const storedId = await AsyncStorage.getItem('shopOwnerId');
        if (storedId) {
          submissionData.shopOwnerId = storedId;
        }
      }

      console.log('[BankDetails] Submitting form with payload:', JSON.stringify(submissionData, null, 2));
      const res = await savePayoutAccounts(submissionData);
      if (res?.account || res?.message) {
        Alert.alert(
          'Success',
          'Your banking credentials have been secured.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      console.log('[savePayoutAccounts] Error:', err);
      
      // Handle the specific backend error format provided by user
      if (err.response?.data?.field) {
        const backendField = err.response.data.field;
        const backendDesc = err.response.data.description;
        
        setErrors(prev => ({
          ...prev,
          [backendField]: backendDesc
        }));
      } else {
        Alert.alert('Update Failed', err.message || 'We could not save your details. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    placeholder: string,
    keyType: 'default' | 'numeric' = 'default',
    errorKey?: string,
    secure: boolean = false,
    onToggleSecure?: () => void,
    isSecureVisible?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        errorKey && errors[errorKey] ? styles.inputWrapperError : null
      ]}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={(t) => {
            onChange(t);
            if (errorKey && errors[errorKey]) {
              const newErrors = { ...errors };
              delete newErrors[errorKey];
              setErrors(newErrors);
            }
          }}
          keyboardType={keyType}
          secureTextEntry={secure && !isSecureVisible}
          autoCapitalize={label === 'IFSC Code' ? 'characters' : 'none'}
        />
        {secure && (
          <TouchableOpacity onPress={onToggleSecure} style={styles.eyeIcon}>
            <Ionicons
              name={isSecureVisible ? "eye-off" : "eye"}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {errorKey && errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Securing your connection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Bank Accounts</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {bankData && !isEditing ? (
          <View>
            {/* Professional Bank Card Display */}
            <View style={styles.bankCard}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardBrand}>PRIMARY ACCOUNT</Text>
                  <Text style={styles.cardHolderName}>{bankData.accountHolderName}</Text>
                </View>
                <FontAwesome name="bank" size={24} color={COLORS.white} opacity={0.8} />
              </View>

              <View style={styles.cardMiddle}>
                <Text style={styles.cardLabel}>ACCOUNT NUMBER</Text>
                <Text
                  style={styles.cardAccountNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {showAccountNumber
                    ? bankData.accountNumber
                    : `•••• •••• •••• ${bankData.accountNumber.toString().slice(-4)}`
                  }
                </Text>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>IFSC CODE</Text>
                  <Text style={styles.cardValue}>{bankData.ifsc}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAccountNumber(!showAccountNumber)}
                  style={styles.eyeBtnSmall}
                >
                  <Ionicons
                    name={showAccountNumber ? "eye-off" : "eye"}
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={styles.eyeBtnText}>{showAccountNumber ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Account Details Checklist */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionHeader}>Account Details</Text>

              <View style={styles.detailItem}>
                <MaterialIcons name="alternate-email" size={20} color={COLORS.textMuted} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{bankData.user?.email || 'Not linkded'}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MaterialIcons name="phone-android" size={20} color={COLORS.textMuted} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Mobile Number</Text>
                  <Text style={styles.detailValue}>{bankData.user?.mobileNo || 'Not linked'}</Text>
                </View>
              </View>

              {bankData.razorpayContactId && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="verified-user" size={20} color={COLORS.success} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Gateway ID</Text>
                    <Text style={styles.detailValue}>{bankData.razorpayContactId}</Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setIsEditing(true)}
            >
              <MaterialIcons name="security" size={20} color={COLORS.white} />
              <Text style={styles.editBtnText}>Manage Account Details</Text>
            </TouchableOpacity>

            <View style={styles.securityHint}>
              <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
              <Text style={styles.securityHintText}>
                Your data is encrypted and used only for automated payouts.
              </Text>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {bankData ? 'Update Account' : 'Secure Integration'}
                </Text>
                <Text style={styles.formSubtitle}>
                  Ensure details match your passbook to avoid payout failures.
                </Text>
              </View>

              {renderInputField(
                "Account Holder Name",
                form.accountHolderName,
                (t) => setForm({ ...form, accountHolderName: t }),
                "As per bank records",
                "default",
                "accountHolderName"
              )}

              {renderInputField(
                "Account Number",
                form.accountNumber,
                (t) => setForm({ ...form, accountNumber: t }),
                "11-16 digit bank number",
                "numeric",
                "accountNumber",
                true,
                () => setShowAccountNumber(!showAccountNumber),
                showAccountNumber
              )}

              {renderInputField(
                "Confirm Account Number",
                confirmAccountNumber,
                (t) => setConfirmAccountNumber(t),
                "Re-enter account number",
                "numeric",
                "confirmAccountNumber",
                true,
                () => setShowConfirmAccountNumber(!showConfirmAccountNumber),
                showConfirmAccountNumber
              )}

              {renderInputField(
                "IFSC Code",
                form.ifsc,
                (t) => setForm({ ...form, ifsc: t.toUpperCase() }),
                "e.g. SBIN0001234",
                "default",
                "ifsc"
              )}

              <View style={styles.horizontalDivider} />
              <Text style={styles.sectionHeaderSmall}>Contact Verification</Text>

              {renderInputField(
                "Email Address",
                form.user?.email || '',
                (t) => setForm({ ...form, user: { ...form.user!, email: t } }),
                "For payout notifications",
                "default",
                "email"
              )}

              {renderInputField(
                "Mobile Number",
                form.user?.mobileNo || '',
                (t) => setForm({ ...form, user: { ...form.user!, mobileNo: t } }),
                "10-digit primary mobile",
                "numeric",
                "mobileNo"
              )}

              <View style={styles.actionRow}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Verify & Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  iconBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },

  // Bank Card UI
  bankCard: {
    backgroundColor: '#0F172A', // Deep navy/slate
    borderRadius: 24,
    padding: 24,
    height: 220,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
    marginBottom: 4,
  },
  cardHolderName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  cardMiddle: {
    marginVertical: 10,
  },
  cardLabel: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 6,
  },
  cardAccountNumber: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    minHeight: 30,
    width: '100%',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  eyeBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  eyeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Details Section
  detailsSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: BORDER_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  securityHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  securityHintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },

  // Form UI
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textMain,
    fontWeight: '500',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  sectionHeaderSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 24,
    height: 56,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});