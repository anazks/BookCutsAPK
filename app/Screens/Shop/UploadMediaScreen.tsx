import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const UploadMediaScreen = ({ navigation }) => {
  const BASE_URL = 'http://192.168.29.81:3002/api';     
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopId = async () => {
      try {
        const id = await AsyncStorage.getItem('shopId');
        if (id) {
          setShopId(id);
        } else {
          Alert.alert('Error', 'Shop ID not found in storage. Please login again.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching shopId:', error);
        Alert.alert('Error', 'Failed to fetch shop ID from storage.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchShopId();
  }, [navigation]);

  const pickImage = async () => {
    // No permissions required in Expo for image picker in recent versions, but you can add if needed
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]); // Expo SDK 51+ uses assets array
    }
  };

  const uploadMedia = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (!shopId) {
      Alert.alert('Error', 'Shop ID not available');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', {
        uri: selectedImage.uri,
        type: selectedImage.mimeType || 'image/jpeg', // Fallback to jpeg
        name: selectedImage.fileName || 'image.jpg',
      });

      const response = await axios.post(
        `${BASE_URL}/shop/uploadMedia/${shopId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Media uploaded successfully!');
        setTitle('');
        setDescription('');
        setSelectedImage(null);
        // Optionally navigate or refresh data
        // navigation.goBack();
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Media</Text>

      <TextInput
        style={styles.input}
        placeholder="Title * (required)"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading}>
        <Text style={styles.buttonText}>
          {selectedImage ? 'Change Image' : 'Select Image'}
        </Text>
      </TouchableOpacity>

      {selectedImage && (
        <Text style={styles.imageInfo}>Selected: {selectedImage.fileName}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.uploadButton]}
        onPress={uploadMedia}
        disabled={uploading || !selectedImage}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Upload Media'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#34C759',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default UploadMediaScreen;