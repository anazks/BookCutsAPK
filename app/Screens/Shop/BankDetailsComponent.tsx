// app/Screens/Shop/BankDetailsComponent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchPayoutAccounts, savePayoutAccounts } from '../../api/Service/Shop';

// ── Design Tokens ───────────────────────────────────────
const COLORS = {
  background: '#F1F5F9',
  white: '#FFFFFF',
  primary: '#2563EB', // Standard Blue
  secondary: '#475569',
  textMain: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const BORDER_RADIUS = 12; // Standard rounding

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
  kycStatus: string;
  razorpayContactId?: string;
  razorpayFundAccountId?: string;
  user?: UserInfo;
}

const initialForm: BankDetails = {
  accountHolderName: '',
  accountNumber: '',
  ifsc: '',
  kycStatus: 'PENDING',
  user: {
    email: '',
    mobileNo: '',
  }
};

export default function BankDetailsComponent() {
  const router = useRouter();
  const [bankData, setBankData] = useState<BankDetails | null>(null);
  const [form, setForm] = useState<BankDetails>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPayoutAccounts();
      
      console.log('--- Bank Details API Response ---', JSON.stringify(res, null, 2));

      let item = null;
      if (res?.account) {
        item = res.account;
      } else if (res?.data?.account) {
        item = res.data.account;
      } else if (res?.data) {
        item = Array.isArray(res.data) ? res.data[0] : res.data;
      }

      if (item && (item.accountNumber || item.AccountNumber)) {
        const normalized: BankDetails = {
          shopOwnerId: item.shopOwnerId || item.ShopOwnerId || '',
          accountHolderName: item.accountHolderName || item.AccountHolderName || '',
          accountNumber: item.accountNumber || item.AccountNumber || '',
          ifsc: item.ifsc || item.ifceCode || item.IFSC || '',
          kycStatus: item.kycStatus || item.KycStatus || 'PENDING',
          razorpayContactId: item.razorpayContactId || '',
          razorpayFundAccountId: item.razorpayFundAccountId || '',
          user: {
            email: item.user?.email || item.email || '',
            mobileNo: item.user?.mobileNo || item.mobileNo || '',
          }
        };
        setBankData(normalized);
        setForm(normalized);
      } else {
        setBankData(null);
        setForm(initialForm);
      }
    } catch (err: any) {
      console.error('[fetchPayoutAccounts] Error:', err);
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

  const handleSubmit = async () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifsc) {
      Alert.alert('Missing Info', 'Please provide Account Holder, Number, and IFSC.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await savePayoutAccounts(form);
      if (res?.success) {
        Alert.alert('Success', 'Bank details updated.');
        setIsEditing(false);
        loadData();
      }
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'VERIFIED') return COLORS.success;
    if (s === 'REJECTED') return COLORS.error;
    return COLORS.warning;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Payout Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {bankData && !isEditing ? (
          <View>
            {/* Elegant Details Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.labelMuted}>PRIMARY ACCOUNT</Text>
                  <Text style={styles.accountHolderDisplay}>{bankData.accountHolderName}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(bankData.kycStatus) + '15' }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(bankData.kycStatus) }]}>
                    {bankData.kycStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={[styles.infoRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>ACCOUNT NUMBER</Text>
                  <Text style={styles.valueStrong}>{bankData.accountNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>IFSC CODE</Text>
                  <Text style={styles.valueStrong}>{bankData.ifsc}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>EMAIL</Text>
                  <Text style={styles.valueText}>{bankData.user?.email || 'N/A'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>MOBILE</Text>
                  <Text style={styles.valueText}>{bankData.user?.mobileNo || 'N/A'}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>CONTACT ID</Text>
                  <Text style={styles.valueText}>{bankData.razorpayContactId || 'N/A'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelMuted}>FUND ACCOUNT ID</Text>
                  <Text style={styles.valueText}>{bankData.razorpayFundAccountId || 'N/A'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={18} color={COLORS.white} />
                <Text style={styles.primaryBtnText}>Update Banking Info</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hintBox}>
              <MaterialIcons name="security" size={18} color={COLORS.textMuted} />
              <Text style={styles.hintText}>
                Payouts are automatically transferred to this verified account.
              </Text>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{bankData ? 'Edit Account' : 'Add Bank Account'}</Text>
              
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter as per bank record"
                  value={form.accountHolderName}
                  onChangeText={(t) => setForm({...form, accountHolderName: t})}
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 11-16 digit number"
                  keyboardType="numeric"
                  value={form.accountNumber}
                  onChangeText={(t) => setForm({...form, accountNumber: t})}
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. SBIN0001234"
                  autoCapitalize="characters"
                  value={form.ifsc}
                  onChangeText={(t) => setForm({...form, ifsc: t.toUpperCase()})}
                />
              </View>

              <Text style={styles.sectionDivider}>Contact Verification</Text>

              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Primary contact email"
                  keyboardType="email-address"
                  value={form.user?.email}
                  onChangeText={(t) => setForm({...form, user: {...form.user!, email: t}})}
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.user?.mobileNo}
                  onChangeText={(t) => setForm({...form, user: {...form.user!, mobileNo: t}})}
                />
              </View>

              <View style={styles.btnRow}>
                {isEditing && (
                  <TouchableOpacity 
                    style={styles.secondaryBtn} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.confirmBtn, submitting && { opacity: 0.7 }]} 
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>Save Details</Text>
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
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  iconBtn: {
    padding: 10,
  },
  scrollContent: {
    padding: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  
  // Data Screen Styles
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  labelMuted: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  accountHolderDisplay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueStrong: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: BORDER_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 10,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Form Screen Styles
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 24,
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textMain,
    backgroundColor: '#FAFAFA',
  },
  sectionDivider: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 1,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 52,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});