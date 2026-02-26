import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReferralDetailsProps {
  referralCode?: string;
}

const STEPS = [
  { title: 'Share Your Code', desc: 'Send your code to friends via any platform.' },
  { title: 'Friend Signs Up', desc: 'They register and complete their first booking.' },
  { title: 'Earn ₹1', desc: 'Get ₹1 credited for every successful referral.' },
  { title: '5 Friends = ₹10 Bonus', desc: 'Hit 5 referrals and unlock a special discount.' },
  { title: 'Auto Applied', desc: 'Rewards apply automatically on your next booking.' },
];

const ReferralDetails: React.FC<ReferralDetailsProps> = ({ referralCode }) => {
  // Fallback only shown when truly no code was passed
  const displayCode = referralCode || '-------';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Use my referral code ${displayCode} to sign up and get exclusive rewards!`,
      });
    } catch (error) {
      console.log('Share failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.tag}>REFERRAL PROGRAM</Text>
          <Text style={styles.heading}>Share & Earn</Text>
          <Text style={styles.subheading}>
            Invite friends and earn rewards on every successful referral.
          </Text>
        </View>

        {/* Code Card */}
        <Animated.View
          style={[
            styles.codeCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.codeValue}>
            {displayCode}
          </Text>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.75}
            disabled={!referralCode} // optional: disable if no real code
          >
            <Text style={styles.shareBtnText}>Share Code</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Steps */}
        <Text style={styles.sectionTitle}>How it works</Text>

        {STEPS.map((step, i) => (
          <Animated.View
            key={i}
            style={[
              styles.stepRow,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.stepLeft}>
              <Text style={styles.stepNum}>{i + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Footer note */}
        <Text style={styles.footerNote}>
          The more friends you refer, the more you save ✨
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 23,
    maxWidth: 280,
  },

  // Code Card
  codeCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    marginBottom: 40,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2.5,
    marginBottom: 14,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 5,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 24,
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },

  // Steps
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  stepLeft: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },

  // Footer
  footerNote: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ReferralDetails;