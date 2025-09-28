import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// 🔹 Firebase imports
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = '#FF6B6B';

const ImageUploadModal = ({ visible, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);

  // 🔹 Upload image to Firebase
  const handleSave = async () => {
    try {
      if (!image) {
        alert("Please select an image first.");
        return;
      }

      // Get Firebase storage instance
      const app = getApp();
      const storage = getStorage(app);

      // Convert image URI to blob
      const response = await fetch(image);
      const blob = await response.blob();

      // Unique file name
      const filename = `uploads/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload file
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("✅ Uploaded Image URL:", downloadURL);

      // Send data back to parent
      onSave({ title, description, imageUrl: downloadURL });

      // Reset state
      setDescription('');
      setTitle('');
      setImage(null);
      onClose();

    } catch (error) {
      console.error("❌ Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    }
  };

  const handleClose = () => {
    setDescription('');
    setTitle('');
    setImage(null);
    onClose();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ use correct enum
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Upload Shop/Work Image</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Image Upload/Preview Area */}
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
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
                <Text style={styles.uploadText}>Tap to Select or Upload Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.inputTitle}
              placeholder="Add a title"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Add a caption or description"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={handleClose}
            >
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave, !image && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!image}
            >
              <Text style={[styles.textStyle, !image && styles.disabledText]}>Save Image</Text>
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
    paddingBottom: 100, // Space for bottom buttons
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
    textAlign: 'center',
  },
  placeholder: {
    width: 38, // Same width as close button for centering
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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