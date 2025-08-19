import React, { useState } from 'react';
import {
    Animated,
    Easing,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Rewards() {
  const [bookingsCount, setBookingsCount] = useState(12);
  const [scratchCards, setScratchCards] = useState([
    { id: 1, scratched: false, reward: '10% Off Next Cut' },
    { id: 2, scratched: false, reward: 'Free Beard Trim' },
    { id: 3, scratched: false, reward: '15% Off Premium Services' }
  ]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const scaleAnim = new Animated.Value(0);

  const milestone = 15; // Free haircut after 15 bookings
  const progress = (bookingsCount / milestone) * 100;

  const handleScratch = (cardId) => {
    const updatedCards = scratchCards.map(card => 
      card.id === cardId ? { ...card, scratched: true } : card
    );
    setScratchCards(updatedCards);
    setSelectedCard(cardId);
    
    // Animation
    scaleAnim.setValue(0);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.elastic(1),
      useNativeDriver: true
    }).start();
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF6B6B" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Rewards</Text>
        <View style={styles.pointsContainer}>
          <Icon name="star" size={20} color="#FFD700" />
          <Text style={styles.pointsText}>{bookingsCount} Bookings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Milestone Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Haircut Milestone</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress > 100 ? 100 : progress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {bookingsCount}/{milestone} bookings
              {bookingsCount >= milestone && ' - Claimed!'}
            </Text>
          </View>
          
          {bookingsCount >= milestone ? (
            <View style={styles.rewardUnlocked}>
              <Icon name="celebration" size={24} color="#FF6B6B" />
              <Text style={styles.rewardText}>Free Haircut Unlocked!</Text>
            </View>
          ) : (
            <Text style={styles.milestoneText}>
              {milestone - bookingsCount} more bookings to unlock a free haircut
            </Text>
          )}
        </View>

        {/* Scratch Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scratch & Win</Text>
          <Text style={styles.sectionSubtitle}>Scratch to reveal your reward</Text>
          
          <View style={styles.scratchCardContainer}>
            {scratchCards.map((card) => (
              <TouchableOpacity 
                key={card.id}
                style={styles.scratchCard}
                onPress={() => !card.scratched && handleScratch(card.id)}
                activeOpacity={0.8}
                disabled={card.scratched}
              >
                {card.scratched ? (
                  <Animated.View style={[styles.rewardContent, { transform: [{ scale }] }]}>
                    <Text style={styles.rewardTitle}>You Won!</Text>
                    <Text style={styles.rewardPrize}>{card.reward}</Text>
                    {selectedCard === card.id && showConfetti && (
                      <ConfettiCannon 
                        count={100} 
                        origin={{ x: -10, y: 0 }} 
                        fadeOut={true}
                      />
                    )}
                  </Animated.View>
                ) : (
                  <View style={styles.scratchSurface}>
                    <Icon name="scratch" size={40} color="#FF6B6B" />
                    <Text style={styles.scratchText}>Scratch Me</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorksItem}>
            <Icon name="looks-one" size={20} color="#FF6B6B" />
            <Text style={styles.howItWorksText}>Earn 1 point for every booking</Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Icon name="looks-two" size={20} color="#FF6B6B" />
            <Text style={styles.howItWorksText}>Get a free haircut after 15 bookings</Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Icon name="looks-3" size={20} color="#FF6B6B" />
            <Text style={styles.howItWorksText}>Scratch cards give instant rewards</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600'
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },
  pointsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5
  },
  content: {
    padding: 20,
    paddingBottom: 30
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 12
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  progressContainer: {
    marginBottom: 15
  },
  progressBar: {
    height: 10,
    backgroundColor: '#EEE',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 5
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  milestoneText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '500'
  },
  rewardUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 8
  },
  scratchCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  scratchCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  scratchSurface: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD166'
  },
  scratchText: {
    color: '#FFF',
    fontWeight: '600',
    marginTop: 8
  },
  rewardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF'
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 5
  },
  rewardPrize: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center'
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  howItWorksText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10
  }
});