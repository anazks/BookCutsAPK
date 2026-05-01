import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const TRANSLATIONS = {
  en: {
    title: "Create Your Shop",
    subtitle: "What is the name of your shop?",
    shopName: "Shop Name",
    shopNamePlaceholder: "e.g. Premium Cuts Salon",
    submitText: "Continue",
    alreadyRegistered: "Already registered? Login",
    orText: "OR",
  },
  hi: {
    title: "अपनी दुकान बनाएं",
    subtitle: "आपकी दुकान का नाम क्या है?",
    shopName: "दुकान का नाम",
    shopNamePlaceholder: "उदा. प्रीमियम कट्स सैलून",
    submitText: "जारी रखें",
    alreadyRegistered: "क्या आप पहले से पंजीकृत हैं? लॉगिन करें",
    orText: "या",
  },
  ml: {
    title: "ഷോപ്പ് നിർമ്മിക്കുക",
    subtitle: "നിങ്ങളുടെ ഷോപ്പിന്റെ പേരെന്താണ്?",
    shopName: "ഷോപ്പിന്റെ പേര്",
    shopNamePlaceholder: "ഉദാ. പ്രീമിയം കട്ട്സ് സലൂൺ",
    submitText: "തുടരുക",
    alreadyRegistered: "നേരത്തെ രജിസ്റ്റർ ചെയ്തോ? ലോഗിൻ ചെയ്യുക",
    orText: "അല്ലെങ്കിൽ",
  },
  ta: {
    title: "கடையை உருவாக்கவும்",
    subtitle: "உங்கள் கடையின் பெயர் என்ன?",
    shopName: "கடையின் பெயர்",
    shopNamePlaceholder: "உ-ம். பிரீமியம் கட்ஸ் சலூன்",
    submitText: "தொடரவும்",
    alreadyRegistered: "ஏற்கனவே பதிவு செய்துள்ளீர்களா? உள்நுழையவும்",
    orText: "அல்லது",
  }
};

export default function CreateShopScreen() {
  const { lang } = useLocalSearchParams();
  const currentLang = (typeof lang === 'string' && TRANSLATIONS[lang as keyof typeof TRANSLATIONS]) ? lang : 'en';
  const t = TRANSLATIONS[currentLang as keyof typeof TRANSLATIONS];

  const [formData, setFormData] = useState({
    shopName: '',
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    router.push({
      pathname: '/Screens/Shop/QuickRegister',
      params: { shopName: formData.shopName, lang: currentLang }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Floating Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        {/* Centered Content Wrapper */}
        <View style={styles.centerWrapper}>
          
          <View style={styles.card}>
            {/* Top Shop Icon */}
            <View style={styles.iconCircle}>
               <MaterialIcons name="storefront" size={54} color="#0057FF" />
            </View>

            <View style={styles.headerTextWrapper}>
               <Text style={styles.title}>{t.title}</Text>
               <Text style={styles.subtitle}>{t.subtitle}</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Shop Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.shopName}</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="storefront" size={22} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.shopNamePlaceholder}
                    placeholderTextColor="#94A3B8"
                    value={formData.shopName}
                    onChangeText={(text) => handleChange('shopName', text)}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, !formData.shopName.trim() && styles.submitButtonDisabled]} 
                onPress={handleSubmit} 
                activeOpacity={0.9}
                disabled={!formData.shopName.trim()}
              >
                <Text style={styles.submitText}>{t.submitText}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t.orText}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => router.push('/Screens/Shop/Login')} 
                activeOpacity={0.9}
              >
                <MaterialIcons name="login" size={20} color="#0057FF" />
                <Text style={styles.secondaryButtonText}>{t.alreadyRegistered}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Modern subtle gray/blue
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 65, // Space for the floating inner circle
    position: 'relative',
    marginTop: 50, // Space for the overflow circle
  },
  iconCircle: {
    position: 'absolute',
    top: -55,
    alignSelf: 'center',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrapper: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D1321',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0057FF',
    borderRadius: 16,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#0057FF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0057FF',
  },
});
