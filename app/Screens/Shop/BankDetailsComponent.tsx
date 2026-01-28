// components/BankDetailsScreen.tsx
import { useState, useEffect } from 'react';
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
} from 'react-native';

import { viewBankDetails, createBankDetails } from '@/app/api/Service/Shop';

// ── Type ───────────────────────────────────────────────
interface BankDetails {
  BankName: string;
  BranchName: string;
  AccountHolderName: string;
  AccountNumber: string;
  ifceCode: string;
  AccountType: string;
}

const initialForm: BankDetails = {
  BankName: '',
  BranchName: '',
  AccountHolderName: '',
  AccountNumber: '',
  ifceCode: '',
  AccountType: '',
};

// ── Main Component ─────────────────────────────────────
export default function BankDetailsScreen() {
  const [bankData, setBankData] = useState<BankDetails | null>(null);
  const [form, setForm] = useState<BankDetails>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await viewBankDetails();

        // ── Debug: always log what we actually received ──
        console.log('[viewBankDetails] Raw response:', res);
        console.log('[viewBankDetails] Type:', typeof res);
        if (res) {
          console.log('[viewBankDetails] Keys:', Object.keys(res));
          console.log('[viewBankDetails] JSON:', JSON.stringify(res, null, 2));
        }

        // ── Flexible data extraction ─────────────────────────────────
        let data: any = res;

        // Common API wrappers
        if (res && typeof res === 'object') {
          if ('data' in res) data = res.data;
          else if ('result' in res) data = res.result;
          else if ('bankDetails' in res) data = res.bankDetails;
          else if ('payload' in res) data = res.payload;
        }

        // Handle array response (very rare but possible)
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        // Final check: do we have something that looks like bank details?
        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          (data.BankName || data.bankName || data.AccountNumber || data.accountNumber)
        ) {
          // Normalize field names (in case backend uses different casing)
          const normalized: BankDetails = {
            BankName: data.BankName || data.bankName || data.bank_name || '',
            BranchName: data.BranchName || data.branchName || data.branch_name || '',
            AccountHolderName:
              data.AccountHolderName ||
              data.accountHolderName ||
              data.account_holder_name ||
              '',
            AccountNumber: data.AccountNumber || data.accountNumber || data.account_number || '',
            ifceCode: data.ifceCode || data.IFSC || data.ifscCode || data.ifsc || '',
            AccountType: data.AccountType || data.accountType || data.account_type || '',
          };

          setBankData(normalized);
        } else {
          setBankData(null);
        }
      } catch (err: any) {
        console.error('[viewBankDetails] Error:', err);
        setError('Failed to load bank details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (name: keyof BankDetails, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.BankName.trim() ||
      !form.AccountHolderName.trim() ||
      !form.AccountNumber.trim() ||
      !form.ifceCode.trim()
    ) {
      setError('Please fill all required fields (*)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createBankDetails(form);

      // After creation → show the new data (use result if returned, otherwise form)
      const newData = result && result.AccountNumber ? result : form;

      // Normalize again just in case
      const normalized = {
        BankName: newData.BankName || '',
        BranchName: newData.BranchName || '',
        AccountHolderName: newData.AccountHolderName || '',
        AccountNumber: newData.AccountNumber || '',
        ifceCode: newData.ifceCode || '',
        AccountType: newData.AccountType || '',
      };

      setBankData(normalized);
      Alert.alert('Success', 'Bank details saved successfully!');
    } catch (err: any) {
      console.error('[createBankDetails] Error:', err);
      setError('Failed to save bank details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  // ── VIEW MODE ────────────────────────────────────────
  if (bankData) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Bank Details</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Bank Name</Text>
            <Text style={styles.value}>{bankData.BankName || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Branch Name</Text>
            <Text style={styles.value}>{bankData.BranchName || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Holder</Text>
            <Text style={styles.value}>{bankData.AccountHolderName || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Number</Text>
            <Text style={styles.value}>
              {/* Option: mask account number */}
              {bankData.AccountNumber}
              {/* {'•••• ' + bankData.AccountNumber.slice(-4)} */}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>IFSC Code</Text>
            <Text style={styles.value}>{bankData.ifceCode || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Type</Text>
            <Text style={styles.value}>{bankData.AccountType || '-'}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── ADD MODE (FORM) ──────────────────────────────────
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Bank Details</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Bank Name *</Text>
        <TextInput
          style={styles.input}
          value={form.BankName}
          onChangeText={(v) => handleChange('BankName', v)}
          placeholder="State Bank of India"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Branch Name</Text>
        <TextInput
          style={styles.input}
          value={form.BranchName}
          onChangeText={(v) => handleChange('BranchName', v)}
          placeholder="Main Branch"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Account Holder Name *</Text>
        <TextInput
          style={styles.input}
          value={form.AccountHolderName}
          onChangeText={(v) => handleChange('AccountHolderName', v)}
          placeholder="Govind Kumar"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Account Number *</Text>
        <TextInput
          style={styles.input}
          value={form.AccountNumber}
          onChangeText={(v) => handleChange('AccountNumber', v.replace(/\D/g, ''))}
          placeholder="xxxxxxxxxx1234"
          keyboardType="numeric"
          maxLength={18}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>IFSC Code *</Text>
        <TextInput
          style={styles.input}
          value={form.ifceCode}
          onChangeText={(v) => handleChange('ifceCode', v.toUpperCase())}
          placeholder="SBIN0001234"
          autoCapitalize="characters"
          maxLength={11}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Account Type</Text>
        <TextInput
          style={styles.input}
          value={form.AccountType}
          onChangeText={(v) => handleChange('AccountType', v)}
          placeholder="Savings / Current"
          autoCapitalize="words"
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Bank Details</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Styles (unchanged) ───────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  error: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#99b3ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    flex: 1.6,
    textAlign: 'right',
  },
});