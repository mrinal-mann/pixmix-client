// services/imageService.ts
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../contexts/NotificationContext';

// API URLs
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 
  'https://pixmix-backend-xxx.run.app';

/**
 * Apply a filter to an image
 * 
 * @param imageUri Local URI of the image to process
 * @param filter Filter to apply
 * @returns Object containing the processed image URL
 */
export const applyFilter = async (imageUri: string, filter: string) => {
  try {
    // Get Cloud Run token from storage
    const cloudRunToken = await AsyncStorage.getItem('cloudRunToken');
    if (!cloudRunToken) {
      throw new Error('Authentication token not found');
    }

    // Get notification token
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    // Create form data with image file
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Add image file to form data
    const imageName = imageUri.split('/').pop() || 'image.jpg';
    const mimeType = imageName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    // @ts-ignore (FormData type definition issue with React Native)
    formData.append('image', {
      uri: imageUri,
      name: imageName,
      type: mimeType,
    });
    
    // Add filter and FCM token
    formData.append('filter', filter);
    if (fcmToken) {
      formData.append('fcmToken', fcmToken);
    }

    // Send request to backend
    const response = await axios.post(`${BACKEND_URL}/generate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${cloudRunToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error applying filter:', error);
    throw error;
  }
};