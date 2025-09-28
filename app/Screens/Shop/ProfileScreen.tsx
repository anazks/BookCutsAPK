// ProfileScreen.js - Modern UI with #FF6B6B color scheme
import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ImageUploadModal from './ImageUploadModel'; 

const PRIMARY_COLOR = '#FF6B6B'; // Primary brand color
const SECONDARY_BG = '#FFF8F8'; // Very light version of the primary color

// --- STATIC DATA ---
const shopOwnerData = {
  firstName: "Sanju",
  lastName: "Raju",
  email: "govindjkumar3225@gmail.com",
  mobileNo: "9037920297",
  city: "Kottayam",
};

const shopData = {
  ShopName: "Cuttz",
  City: "Kochi",
  ExactLocation: "Kadavanthara",
  Mobile: 9058263626,
  Timing: "9:00 AM - 11:00 PM",
  website: "https://www.cuttz.com",
  IsPremium: true, // Set to true for a premium visual accent
};

const initialImages = [
  { id: '1', uri: 'https://picsum.photos/seed/barber1/200/200', description: 'Shop front view' },
  { id: '2', uri: 'https://picsum.photos/seed/cut/200/200', description: 'Latest hairstyle cut' },
  { id: '3', uri: 'https://picsum.photos/seed/work/200/200', description: 'Barber at work' },
];

// --- REUSABLE DETAIL ROW COMPONENT ---
const DetailRow = ({ icon, label, value, color = '#333' }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconBox}>
        <Ionicons name={icon} size={18} color={PRIMARY_COLOR} />
    </View>
    <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  </View>
);

// --- MAIN PROFILE SCREEN COMPONENT ---
const ProfileScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [images, setImages] = useState(initialImages);
  
  const handleSaveImage = ({ description }) => {
    // Mock adding a new image
    const newImage = {
        id: Date.now().toString(),
        uri: `https://picsum.photos/seed/${Date.now()}/200/200`,
        description: description || 'New work added',
    };
    setImages([newImage, ...images]);
  };

  const handleImagePress = (image) => {
    Alert.alert(
      "Manage Image",
      image.description,
      [
        {
          text: "Edit Description",
          onPress: () => console.log('Edit pressed for:', image.id),
        },
        {
          text: "Delete Image",
          style: 'destructive',
          onPress: () => {
            setImages(images.filter(img => img.id !== image.id));
          },
        },
        {
          text: "Cancel",
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>

      {/* Header and Owner Name (Visual Hierarchy) */}
      <View style={styles.headerCard}>
        <Ionicons name="cut" size={50} color={PRIMARY_COLOR} />
        <Text style={styles.greetingText}>Welcome, Owner</Text>
        <Text style={styles.ownerName}>{`${shopOwnerData.firstName} ${shopOwnerData.lastName}`}</Text>
      </View>

      {/* Owner Details Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Contact Details</Text>
        <DetailRow icon="mail-outline" label="Email" value={shopOwnerData.email} />
        <DetailRow icon="phone-portrait-outline" label="Mobile Number" value={shopOwnerData.mobileNo} />
        <DetailRow icon="location-outline" label="Home City" value={shopOwnerData.city} />
      </View>

      {/* Shop Details Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shop Details - {shopData.ShopName}</Text>
        <DetailRow 
          icon={shopData.IsPremium ? "star" : "ribbon-outline"} 
          label="Membership Status" 
          value={shopData.IsPremium ? "Premium Member" : "Standard User"} 
          color={shopData.IsPremium ? '#E59400' : '#555'} // Gold for Premium
        />
        <DetailRow icon="time-outline" label="Timing" value={shopData.Timing} />
        <DetailRow icon="pin-outline" label="Exact Location" value={`${shopData.ExactLocation}, ${shopData.City}`} />
        <DetailRow icon="globe-outline" label="Website" value={shopData.website} />
      </View>

      {/* Image Management Section */}
      <View style={[styles.sectionCard, { paddingBottom: 10 }]}>
        <Text style={styles.sectionTitle}>Shop & Work Showcase</Text>
        
        {/* Add Image Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <MaterialIcons name="add-a-photo" size={20} color="white" />
          <Text style={styles.addButtonText}>Add New Showcase Image</Text>
        </TouchableOpacity>

        {/* Display Added Images */}
        <View style={styles.imagesContainer}>
          {images.length > 0 ? (
            images.map((image) => (
              <TouchableOpacity 
                key={image.id} 
                style={styles.imageWrapper}
                onPress={() => handleImagePress(image)}
              >
                <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
                <Text style={styles.imageDescription} numberOfLines={1}>{image.description}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noImagesText}>Show your work! Click 'Add New Image' to upload.</Text>
          )}
        </View>
      </View>
      
      {/* Image Upload Modal */}
      <ImageUploadModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={handleSaveImage} 
      />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_BG, // Use light color for background
    paddingHorizontal: 15,
  },
  // --- Header/Owner Card ---
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  greetingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  ownerName: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginTop: 5,
  },
  // --- Standard Section Card ---
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_BG,
    paddingBottom: 8,
  },
  // --- Detail Row Styles ---
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
  },
  detailIconBox: {
    width: 35,
    height: 35,
    borderRadius: 5,
    backgroundColor: SECONDARY_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#888',
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    color: '#222',
  },
  // --- Image Management Styles ---
  addButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  imageWrapper: {
    width: '30%', 
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
  },
  imageThumbnail: {
    width: '100%',
    aspectRatio: 1, // Keep images square
    resizeMode: 'cover',
  },
  imageDescription: {
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    color: '#444',
    backgroundColor: '#f9f9f9',
    height: 25, // Fixed height for consistent look
  },
  noImagesText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontStyle: 'italic',
    width: '100%',
  }
});

export default ProfileScreen;