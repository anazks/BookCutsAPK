import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ExploreMore() {
  const options = [
    {
      id: 1,
      title: 'Gifts',
      image: {
        uri: 'https://static.vecteezy.com/system/resources/previews/023/630/261/non_2x/flat-gift-box-icon-with-transparent-background-free-png.png'
      },
      color: '#FEF2F2',
      iconColor: '#EF4444'
    },
    {
      id: 2,
      title: 'Offers',
      image: {
        uri: 'https://png.pngtree.com/png-vector/20251028/ourlarge/pngtree-3d-red-discount-tag-icon-png-image_17846969.webp'
      },
      color: '#EFF6FF',
      iconColor: '#3B82F6'
    },
    {
      id: 3,
      title: 'Top Rated',
      image: {
        uri: 'https://png.pngtree.com/png-vector/20240613/ourlarge/pngtree-high-quality-five-star-rating-icon-for-top-notch-products-png-image_12739606.png'
      },
      color: '#FFFBEB',
      iconColor: '#F59E0B'
    },
    {
      id: 4,
      title: 'Near Me',
      image: {
        uri: 'https://www.clipartmax.com/png/middle/114-1148777_pin-map-pushpin-location-icon-location-pin-icon-transparent.png'
      },
      color: '#F0FDF4',
      iconColor: '#10B981'
    },
    {
      id: 5,
      title: 'Open Now',
      image: {
        uri: 'https://static.vecteezy.com/system/resources/thumbnails/021/286/373/small/24-hours-sign-on-transparent-background-free-png.png'
      },
      color: '#F5F3FF',
      iconColor: '#8B5CF6'
    },
    {
      id: 6,
      title: 'Premium',
      image: {
        uri: 'https://img.freepik.com/premium-vector/vector-illustration-diamond-icon-set-isolated-transparent-background_181203-36155.jpg'
      },
      color: '#FDF4FF',
      iconColor: '#EC4899'
    },
    {
      id: 7,
      title: 'Quick Book',
      image: {
        uri: 'https://www.clipartmax.com/png/middle/225-2255698_lightning-bolt-icon-lightning-vector.png'
      },
      color: '#ECFEFF',
      iconColor: '#06B6D4'
    },
    {
      id: 8,
      title: 'Deals',
      image: {
        uri: 'https://p1.hiclipart.com/preview/1010/506/329/trending-icon-up-icon-line-logo-material-property-triangle-png-clipart.jpg'
      },
      color: '#FFF7ED',
      iconColor: '#F97316'
    },
  ];

  const handleOptionPress = (optionId: number) => {
    console.log(`Pressed option: ${optionId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
        style={styles.scrollView}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.imageContainer, { backgroundColor: option.color }]}>
              <Image
                source={option.image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionTitle}>{option.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  optionCard: {
    alignItems: 'center',
    width: 72,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: 32,
    height: 32,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
});