// services/authService.ts
import axios from 'axios';
import Constants from 'expo-constants';

// API URLs
const AUTH_SERVICE_URL = Constants.expoConfig?.extra?.authServiceUrl || 
  'https://gcloud-authentication-xxx.run.app';

/**
 * Exchanges a Firebase ID token for a Cloud Run token
 * 
 * @param firebaseToken Firebase ID token
 * @returns Cloud Run token string
 */
export const getCloudRunToken = async (firebaseToken: string): Promise<string> => {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/public-token`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.token) {
      return response.data.token;
    } else {
      throw new Error('Invalid response from auth service');
    }
  } catch (error) {
    console.error('Error getting Cloud Run token:', error);
    throw error;
  }
};