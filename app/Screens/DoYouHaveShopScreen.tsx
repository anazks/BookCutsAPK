import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Image,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import ShopCartoon from '../../assets/images/shop_owner_cartoon.png';
import UserCartoon from '../../assets/images/user_cartoon.png';

const { width } = Dimensions.get('window');

const TRANSLATIONS = {
  en: {
    mainTitle: "Do you have a shop?\nRegister your shop with us.",
    subTitle: "Join our network of premium salons and reach thousands of new customers every day.",
    userTitle: "Ready for a fresh look?\nRegister now.",
    userSubTitle: "Book top-rated salons, manage your appointments, and explore new styles.",
    questionText: "What would you like to do?",
    cardTitlePrimary: "Yes, Register Shop",
    cardDescPrimary: "I want to manage my salon business",
    cardTitleSecondary: "No, Register as User",
    cardDescSecondary: "I just want to book haircuts",
    continueBtn: "Continue",
  },
  hi: {
    mainTitle: "क्या आपके पास कोई दुकान है?\nअपनी दुकान हमारे साथ रजिस्टर करें।",
    subTitle: "प्रीमियम सैलून के हमारे नेटवर्क से जुड़ें और हर दिन हजारों नए ग्राहकों तक पहुंचें।",
    userTitle: "नए लुक के लिए तैयार हैं?\nअभी रजिस्टर करें।",
    userSubTitle: "टॉप-रेटेड सैलून बुक करें, अपने अपॉइंटमेंट प्रबंधित करें और नई शैली खोजें।",
    questionText: "आप क्या करना चाहेंगे?",
    cardTitlePrimary: "हां, दुकान रजिस्टर करें",
    cardDescPrimary: "मैं अपने सैलून का व्यवसाय प्रबंधित करना चाहता हूं",
    cardTitleSecondary: "नहीं, यूजर के रूप में रजिस्टर करें",
    cardDescSecondary: "मैं केवल हेयरकट बुक करना चाहता हूं",
    continueBtn: "जारी रखें",
  },
  ml: {
    mainTitle: "ഷോപ്പ് ഉണ്ടോ?\nരജിസ്റ്റർ ചെയ്യാം.",
    subTitle: "ഞങ്ങളോടൊപ്പം ചേർന്ന് നിങ്ങളുടെ സലൂൺ ബിസിനസ്സ് നിഷ്പ്രയാസം വളർത്തുക.",
    userTitle: "പുതിയ ലുക്കിനായി തയ്യാറാണോ?\nരജിസ്റ്റർ ചെയ്യാം.",
    userSubTitle: "മികച്ച സലൂണുകൾ ബുക്ക് ചെയ്യുക, നിങ്ങളുടെ അപ്പോയിന്റ്മെന്റുകൾ നിയന്ത്രിക്കുക.",
    questionText: "നിങ്ങളുടെ ആവശ്യം എന്താണ്?",
    cardTitlePrimary: "അതെ, ഷോപ്പ് രജിസ്റ്റർ ചെയ്യാം",
    cardDescPrimary: "സലൂൺ ബിസിനസ്സ് നിയന്ത്രിക്കാൻ",
    cardTitleSecondary: "ഇല്ല, ഉപയോക്താവായി തുടരാം",
    cardDescSecondary: "ഹെയർകട്ട് ബുക്ക് ചെയ്യാൻ",
    continueBtn: "തുടരുക",
  },
  ta: {
    mainTitle: "கடை உள்ளதா?\nபதிவு செய்யவும்.",
    subTitle: "எங்களுடன் இணைந்து உங்கள் சலூன் வணிகத்தை எளிதாக வளர்க்கவும்.",
    userTitle: "புதிய லுக்கிற்கு தயாரா?\nஇப்போதே பதிவு செய்யுங்கள்.",
    userSubTitle: "சிறந்த சலூன்களை முன்பதிவு செய்யுங்கள், உங்கள் நியமனங்களை நிர்வகிக்கவும்.",
    questionText: "நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
    cardTitlePrimary: "ஆம், கடையை பதிவு செய்",
    cardDescPrimary: "சலூனை நிர்வகிக்க",
    cardTitleSecondary: "இல்லை, பயனராக பதிவு செய்",
    cardDescSecondary: "ஹேர்கட் புக் செய்ய",
    continueBtn: "தொடரவும்",
  }
};

export default function DoYouHaveShopScreen() {
  const { lang } = useLocalSearchParams();
  const currentLang = (typeof lang === 'string' && TRANSLATIONS[lang as keyof typeof TRANSLATIONS]) ? lang : 'en';
  const t = TRANSLATIONS[currentLang as keyof typeof TRANSLATIONS];

  const [selectedRole, setSelectedRole] = useState<'shop' | 'user' | null>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Crossfade animation
  const imageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const handleRoleSelection = (role: 'shop' | 'user') => {
    if (role === selectedRole) return;
    
    // Fade out current image, set role, then fade back in
    Animated.timing(imageOpacity, {
      toValue: 0.3,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedRole(role);
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = () => {
    if (selectedRole === 'shop') {
      router.push({
        pathname: '/Screens/CreateShopScreen',
        params: { lang: currentLang }
      });
    } else if (selectedRole === 'user') {
      router.push('/Screens/User/Login');
    }
  };

  const currentImage = selectedRole === 'user' ? UserCartoon : ShopCartoon;
  const currentTitle = selectedRole === 'user' ? t.userTitle : t.mainTitle;
  const currentSubTitle = selectedRole === 'user' ? t.userSubTitle : t.subTitle;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0057FF" />
      
      {/* Dynamic Background Layout */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }], opacity: imageOpacity }]}>
           <Image source={currentImage} style={styles.cartoonImage} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.mainTitle, { opacity: imageOpacity }]}>{currentTitle}</Animated.Text>
        <Animated.Text style={[styles.subTitle, { opacity: imageOpacity }]}>
          {currentSubTitle}
        </Animated.Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.questionText}>{t.questionText}</Text>
        
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={[styles.card, selectedRole === 'shop' ? styles.cardPrimarySelected : styles.cardUnselected]} 
            onPress={() => handleRoleSelection('shop')} 
            activeOpacity={0.9}
          >
            <View style={[styles.cardIconWrapper, selectedRole === 'shop' ? styles.iconWrapperSelected : styles.iconWrapperUnselected]}>
              <MaterialIcons name="add-business" size={28} color={selectedRole === 'shop' ? '#0057FF' : '#64748B'} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, selectedRole === 'shop' ? styles.cardTitleSelected : styles.cardTitleUnselected]}>
                {t.cardTitlePrimary}
              </Text>
              <Text style={[styles.cardDesc, selectedRole === 'shop' ? styles.cardDescSelected : styles.cardDescUnselected]}>
                {t.cardDescPrimary}
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedRole === 'shop' && styles.radioActive]}>
              {selectedRole === 'shop' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, selectedRole === 'user' ? styles.cardPrimarySelected : styles.cardUnselected]} 
            onPress={() => handleRoleSelection('user')} 
            activeOpacity={0.9}
          >
            <View style={[styles.cardIconWrapper, selectedRole === 'user' ? styles.iconWrapperSelected : styles.iconWrapperUnselected]}>
              <MaterialIcons name="person" size={28} color={selectedRole === 'user' ? '#0057FF' : '#64748B'} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, selectedRole === 'user' ? styles.cardTitleSelected : styles.cardTitleUnselected]}>
                {t.cardTitleSecondary}
              </Text>
              <Text style={[styles.cardDesc, selectedRole === 'user' ? styles.cardDescSelected : styles.cardDescUnselected]}>
                {t.cardDescSecondary}
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedRole === 'user' && styles.radioActive]}>
              {selectedRole === 'user' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.continueButton, !selectedRole && styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>{t.continueBtn}</Text>
          <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0057FF',
  },
  topSection: {
    flex: 1,
    backgroundColor: '#0057FF',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartoonImage: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  bottomSection: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
  },
  cardPrimarySelected: {
    backgroundColor: '#EEF3FF',
    borderColor: '#0057FF',
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconWrapperSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapperUnselected: {
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardTitleSelected: {
    color: '#0057FF',
  },
  cardTitleUnselected: {
    color: '#1E293B',
  },
  cardDesc: {
    fontSize: 12.5,
  },
  cardDescSelected: {
    color: '#0057FF',
    opacity: 0.8,
  },
  cardDescUnselected: {
    color: '#64748B',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: {
    borderColor: '#0057FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0057FF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0057FF',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
  },
});
