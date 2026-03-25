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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { viewBankDetails, createBankDetails } from '@/app/api/Service/Shop';

// ── Constants ──────────────────────────────────────────
const BANKS = [
  { name: "Federal Bank", state: "Kerala" },
  { name: "South Indian Bank", state: "Kerala" },
  { name: "CSB Bank", state: "Kerala" },
  { name: "Dhanalakshmi Bank", state: "Kerala" },
  { name: "Kerala Bank", state: "Kerala" },
  { name: "Indian Bank", state: "Tamil Nadu" },
  { name: "Indian Overseas Bank", state: "Tamil Nadu" },
  { name: "Karur Vysya Bank", state: "Tamil Nadu" },
  { name: "City Union Bank", state: "Tamil Nadu" },
  { name: "Tamilnad Mercantile Bank", state: "Tamil Nadu" },
  { name: "State Bank of India", state: "Both" },
  { name: "HDFC Bank", state: "Both" },
  { name: "ICICI Bank", state: "Both" },
  { name: "Axis Bank", state: "Both" }
];

const ACCOUNT_TYPES = ["Savings", "Current"];

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
  AccountType: 'Savings', // Default to Savings
};

// ── Main Component ─────────────────────────────────────
export default function BankDetailsScreen() {
  const [bankData, setBankData] = useState<BankDetails | null>(null);
  const [form, setForm] = useState<BankDetails>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals visibility
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await viewBankDetails();
        
        // Flexible data extraction
        let data: any = res;
        if (res && typeof res === 'object') {
          if ('data' in res) data = res.data;
          else if ('result' in res) data = res.result;
          else if ('bankDetails' in res) data = res.bankDetails;
        }

        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          (data.BankName || data.bankName || data.AccountNumber || data.accountNumber)
        ) {
          const normalized: BankDetails = {
            BankName: data.BankName || data.bankName || data.bank_name || '',
            BranchName: data.BranchName || data.branchName || data.branch_name || '',
            AccountHolderName: data.AccountHolderName || data.accountHolderName || '',
            AccountNumber: data.AccountNumber || data.accountNumber || '',
            ifceCode: data.ifceCode || data.IFSC || '',
            AccountType: data.AccountType || data.accountType || 'Savings',
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

  const handleBankSelect = (bankName: string) => {
    handleChange('BankName', bankName);
    setShowBankModal(false);
  };

  const handleTypeSelect = (type: string) => {
    handleChange('AccountType', type);
    setShowTypeModal(false);
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
      const newData = result && result.AccountNumber ? result : form;

      const normalized = {
        BankName: newData.BankName || form.BankName,
        BranchName: newData.BranchName || form.BranchName,
        AccountHolderName: newData.AccountHolderName || form.AccountHolderName,
        AccountNumber: newData.AccountNumber || form.AccountNumber,
        ifceCode: newData.ifceCode || form.ifceCode,
        AccountType: newData.AccountType || form.AccountType,
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
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  if (bankData) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Bank Details</Text>

        <View style={styles.card}>
          <DetailRow label="Bank Name" value={bankData.BankName} />
          <DetailRow label="Branch Name" value={bankData.BranchName} />
          <DetailRow label="Account Holder" value={bankData.AccountHolderName} />
          <DetailRow label="Account Number" value={bankData.AccountNumber} />
          <DetailRow label="IFSC Code" value={bankData.ifceCode} />
          <DetailRow label="Account Type" value={bankData.AccountType} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Bank Details</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Bank Name *</Text>
        <TouchableOpacity 
          style={styles.selectTrigger} 
          onPress={() => setShowBankModal(true)}
        >
          <Text style={form.BankName ? styles.selectValueText : styles.placeholderText}>
            {form.BankName || "Select Bank"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94A3B8" />
        </TouchableOpacity>

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
          placeholder="Ex: John Doe"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Account Number *</Text>
        <TextInput
          style={styles.input}
          value={form.AccountNumber}
          onChangeText={(v) => handleChange('AccountNumber', v.replace(/\D/g, ''))}
          placeholder="Enter Account Number"
          keyboardType="numeric"
          maxLength={18}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>IFSC Code *</Text>
        <TextInput
          style={styles.input}
          value={form.ifceCode}
          onChangeText={(v) => handleChange('ifceCode', v.toUpperCase())}
          placeholder="Ex: SBIN0001234"
          autoCapitalize="characters"
          maxLength={11}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Account Type *</Text>
        <TouchableOpacity 
          style={styles.selectTrigger} 
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={styles.selectValueText}>{form.AccountType}</Text>
          <Ionicons name="chevron-down" size={20} color="#94A3B8" />
        </TouchableOpacity>

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

      {/* Bank Selection Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BANKS}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => handleBankSelect(item.name)}
                >
                  <View>
                    <Text style={styles.bankNameText}>{item.name}</Text>
                    <Text style={styles.bankStateText}>{item.state}</Text>
                  </View>
                  {form.BankName === item.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Account Type Selection Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity 
                key={type}
                style={styles.modalItem} 
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={styles.bankNameText}>{type}</Text>
                {form.AccountType === type && (
                  <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  error: {
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: -8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: '#1E293B',
  },
  selectTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValueText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1.5,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  bankNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  bankStateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});