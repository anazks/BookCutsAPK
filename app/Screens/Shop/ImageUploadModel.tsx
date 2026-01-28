import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = '#FF6B6B';
const BASE_URL = 'https://bookmycutsapp.onrender.com/api';

interface ImageUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ visible, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClose = () => {
    if (!uploading) {
      setDescription('');
      setTitle('');
      setImage(null);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!image || !title.trim()) {
      Alert.alert('Missing Information', 'Please add an image and a title');
      return;
    }

    setUploading(true);

    try {
      const shopId = await AsyncStorage.getItem('shopId');

      if (!shopId) {
        Alert.alert('Error', 'Shop ID not found. Please login again.');
        setUploading(false);
        return;
      }

      const formData = new FormData();

      // Extract filename from URI
      const uriParts = image.split('/');
      const filename = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;

      // Determine MIME type based on file extension
      let mimeType = 'image/jpeg';
      const lowerFilename = filename.toLowerCase();
      if (lowerFilename.endsWith('.png')) mimeType = 'image/png';
      else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (lowerFilename.endsWith('.gif')) mimeType = 'image/gif';
      else if (lowerFilename.endsWith('.webp')) mimeType = 'image/webp';

      // Append fields
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('file', {
        uri: image,
        name: filename,
        type: mimeType,
      } as any);

      console.log('Uploading image:', { shopId, title: title.trim(), filename, mimeType });

      const response = await axios.post(`${BASE_URL}/shop/uploadMedia/${shopId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Image uploaded successfully!');
        onSave?.();
        handleClose();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Changed to false → allows original image without forced crop
        quality: 0.9, // Slightly better quality than 0.8, still reasonable for upload
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        console.log('Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={uploading}
            >
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Upload Shop/Work Image</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Image Upload / Preview */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            {image ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <View style={styles.changeImageOverlay}>
                  <MaterialIcons name="edit" size={24} color="white" />
                  <Text style={styles.changeImageText}>Tap to change image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadArea}>
                <MaterialIcons name="add-a-photo" size={48} color={PRIMARY_COLOR} />
                <Text style={styles.uploadText}>Tap to Select Image</Text>
                <Text style={styles.uploadSubText}>
                  Original size will be used (no forced cropping)
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.inputTitle}
              placeholder="Add a title"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
              editable={!uploading}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Add a caption or description (optional)"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={!uploading}
            />
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={handleClose}
              disabled={uploading}
            >
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                (!image || !title.trim() || uploading) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!image || !title.trim() || uploading}
            >
              <Text
                style={[
                  styles.textStyle,
                  (!image || !title.trim() || uploading) && styles.disabledText,
                ]}
              >
                {uploading ? 'Uploading...' : 'Save Image'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120, // Extra padding for bottom buttons
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 38,
  },
  imageContainer: {
    margin: 20,
    marginBottom: 30,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 250,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: '#FFF0F0',
  },
  uploadText: {
    marginTop: 15,
    color: PRIMARY_COLOR,
    fontWeight: '600',
    fontSize: 16,
  },
  uploadSubText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  imagePreview: {
    position: 'relative',
    width: '100%',
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputTitle: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: 'white',
  },
  input: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: 'white',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonClose: {
    backgroundColor: '#6c757d',
  },
  buttonSave: {
    backgroundColor: PRIMARY_COLOR,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  textStyle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
});

export default ImageUploadModal;