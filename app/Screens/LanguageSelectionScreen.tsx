import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
];

export default function LanguageSelectionScreen() {
  const [selectedLang, setSelectedLang] = useState('en');

  const handleContinue = () => {
    router.push({
      pathname: '/Screens/DoYouHaveShopScreen',
      params: { lang: selectedLang }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>STEP 1</Text>
          <Text style={styles.title}>Choose your{'\n'}language</Text>
          <View style={styles.accent} />
          <Text style={styles.subtitle}>Select your preferred language to continue</Text>
        </View>

        <View style={styles.languageList}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageCard,
                selectedLang === lang.id && styles.languageCardActive
              ]}
              onPress={() => setSelectedLang(lang.id)}
              activeOpacity={0.8}
            >
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName,
                  selectedLang === lang.id && styles.languageNameActive
                ]}>
                  {lang.name}
                </Text>
                <Text style={[
                  styles.languageNative,
                  selectedLang === lang.id && styles.languageNativeActive
                ]}>
                  {lang.native}
                </Text>
              </View>
              <View style={[
                styles.radioCircle,
                selectedLang === lang.id && styles.radioCircleActive
              ]}>
                {selectedLang === lang.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaLabel}>Continue</Text>
            <View style={styles.ctaIcon}>
              <MaterialIcons name="arrow-forward" size={18} color="#0057FF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0057FF',
    letterSpacing: 3.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0D1321',
    lineHeight: 44,
    letterSpacing: -1,
  },
  accent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: '#0057FF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7A99',
    lineHeight: 20,
  },
  languageList: {
    flex: 1,
    gap: 16,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4E9F2',
    shadowColor: '#2255CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  languageCardActive: {
    backgroundColor: '#EEF3FF',
    borderColor: '#0057FF',
  },
  languageInfo: {
    gap: 4,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1321',
  },
  languageNameActive: {
    color: '#0057FF',
  },
  languageNative: {
    fontSize: 14,
    color: '#6B7A99',
    fontWeight: '500',
  },
  languageNativeActive: {
    color: '#0057FF',
    opacity: 0.8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0057FF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0057FF',
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
  },
  ctaButton: {
    backgroundColor: '#0057FF',
    borderRadius: 17,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
