import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userGoogleSignin, savePushToken } from '../../api/Service/User';

const { width } = Dimensions.get('window');

const TRANSLATIONS = {
  en: {
    title: "Join BookMyCuts",
    subtitle: "Almost there! Choose how you'd like to register your shop:",
    googleBtn: "Continue with Google",
    googleDesc: "Faster, more secure way to register your shop with one tap.",
    registerBtn: "Register Shop",
    registerDesc: "Enter your shop details manually using email and password.",
    orText: "or",
    backBtn: "Back",
    forShop: "for",
  },
  hi: {
    title: "BookMyCuts से जुड़ें",
    subtitle: "लगभग तैयार! चुनें कि आप अपनी दुकान को कैसे पंजीकृत करना चाहेंगे:",
    googleBtn: "गूगल के साथ जारी रखें",
    googleDesc: "एक टैप से अपनी दुकान को पंजीकृत करने का तेज़, अधिक सुरक्षित तरीका।",
    registerBtn: "दुकान पंजीकृत करें",
    registerDesc: "ईमेल और पासवर्ड का उपयोग करके अपनी दुकान का विवरण मैन्युअल रूप से दर्ज करें।",
    orText: "या",
    backBtn: "पीछे",
    forShop: "के लिए",
  },
  ml: {
    title: "BookMyCuts-ൽ ചേരുക",
    subtitle: "ഏതാണ്ട് അവിടെ എത്തി! നിങ്ങളുടെ ഷോപ്പ് എങ്ങനെ രജിസ്റ്റർ ചെയ്യണമെന്ന് തിരഞ്ഞെടുക്കുക:",
    googleBtn: "ഗൂഗിൾ വഴി തുടരുക",
    googleDesc: "ഒരു ടാപ്പിലൂടെ നിങ്ങളുടെ ഷോപ്പ് രജിസ്റ്റർ ചെയ്യാനുള്ള വേഗതയേറിയതും സുരക്ഷിതവുമായ മാർഗ്ഗം.",
    registerBtn: "ഷോപ്പ് രജിസ്റ്റർ ചെയ്യുക",
    registerDesc: "ഇമെയിലും പാസ്‌വേഡും ഉപയോഗിച്ച് നിങ്ങളുടെ ഷോപ്പ് വിശദാംശങ്ങൾ നേരിട്ട് നൽകുക.",
    orText: "അല്ലെങ്കിൽ",
    backBtn: "പിന്നിലേക്ക്",
    forShop: "ഇതിനായി",
  },
  ta: {
    title: "BookMyCuts இல் இணையுங்கள்",
    subtitle: "கிட்டத்தட்ட முடிந்துவிட்டது! உங்கள் கடையை எப்படி பதிவு செய்ய விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்:",
    googleBtn: "கூகுள் மூலம் தொடரவும்",
    googleDesc: "ஒரே தட்டலில் உங்கள் கடையைப் பதிவு செய்வதற்கான விரைவான, பாதுகாப்பான வழி.",
    registerBtn: "கடையை பதிவு செய்யவும்",
    registerDesc: "மின்னஞ்சல் மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி உங்கள் கடையின் விவரங்களை கைமுறையாக உள்ளிடவும்.",
    orText: "அல்லது",
    backBtn: "பின்செல்",
    forShop: "இதற்காக",
  }
};

const PRIMARY_COLOR = '#0057FF';
const TEXT_DARK = '#0F172A';
const TEXT_GRAY = '#64748B';

export default function QuickRegister() {
  const { shopName, lang } = useLocalSearchParams();
  const currentLang = (typeof lang === 'string' && TRANSLATIONS[lang as keyof typeof TRANSLATIONS]) ? lang : 'en';
  const t = TRANSLATIONS[currentLang as keyof typeof TRANSLATIONS];

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleSignin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'No ID token received from Google');
        return;
      }

      setIsLoading(true);

      const response = await userGoogleSignin({
        idToken,
        role: 'shop',
        shopName: shopName
      });

      console.log('GOOGLE REGISTER RESPONSE:', response);

      const token = response.accessToken || response.token;

      if (response.success && token) {
        await AsyncStorage.setItem('accessToken', token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        await AsyncStorage.setItem('authProvider', 'google');
        await AsyncStorage.setItem('userCategory', 'shop');

        if (response.user?.shopId) {
          await AsyncStorage.setItem('shopId', response.user.shopId);
        }

        if (response.user?._id) {
          await AsyncStorage.setItem('shopOwnerId', response.user._id);
        }

        try {
          const pushToken = await AsyncStorage.getItem('expoPushToken');
          if (pushToken) {
            await savePushToken(pushToken); 
          }
        } catch (tokenError) {
          console.error('Error saving push token:', tokenError);
        }

        router.replace('/ShopOwner/shopOwnerHome');
      } else {
        Alert.alert('Registration Error', response.message || 'Google registration failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        const message = error?.response?.data?.message || error?.message || 'Google registration failed. Please try again.';
        Alert.alert('Error', message);
      }
    } finally {
      setGoogleLoading(false);
      setIsLoading(false);
    }
  };

  const handleManualRegister = () => {
    router.push({
      pathname: '/Screens/Shop/Register',
      params: { shopName, lang: currentLang }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="verified-user" size={48} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>
              {t.subtitle} <Text style={styles.shopNameHighlight}>{shopName}</Text>
            </Text>
          </View>

          {/* Registration Options */}
          <View style={styles.optionsContainer}>
            {/* Google Option */}
            <View style={styles.optionItem}>
              <TouchableOpacity 
                style={[styles.googleButton, (isLoading || googleLoading) && styles.buttonDisabled]} 
                onPress={handleGoogleSignin}
                disabled={isLoading || googleLoading}
                activeOpacity={0.9}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <>
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                      style={styles.googleIcon} 
                    />
                    <Text style={styles.googleButtonText}>{t.googleBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.optionDesc}>{t.googleDesc}</Text>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.orText}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual Option */}
            <View style={styles.optionItem}>
              <TouchableOpacity 
                style={[styles.registerButton, (isLoading || googleLoading) && styles.buttonDisabled]} 
                onPress={handleManualRegister}
                disabled={isLoading || googleLoading}
                activeOpacity={0.9}
              >
                <MaterialIcons name="app-registration" size={24} color="#FFFFFF" />
                <Text style={styles.registerButtonText}>{t.registerBtn}</Text>
              </TouchableOpacity>
              <Text style={styles.optionDesc}>{t.registerDesc}</Text>
            </View>
          </View>
        </View>

        {/* Footer Policy */}
        <View style={styles.footer}>
          <Text style={styles.policyText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  shopNameHighlight: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  optionsContainer: {
    gap: 16,
  },
  optionItem: {
    gap: 8,
  },
  optionDesc: {
    fontSize: 13,
    color: TEXT_GRAY,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    height: 60,
    borderRadius: 18,
    gap: 12,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  policyText: {
    fontSize: 12,
    color: TEXT_GRAY,
    textAlign: 'center',
    lineHeight: 18,
  }
});
