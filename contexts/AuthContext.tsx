// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import * as Google from "expo-auth-session/providers/google";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getCloudRunToken } from "../services/authService";
import { firebaseConfig } from "../lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Define the shape of the context
type AuthContextType = {
  user: firebase.User | null;
  isLoading: boolean;
  cloudRunToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCloudRunToken: () => Promise<string | undefined>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  cloudRunToken: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshCloudRunToken: async () => undefined,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudRunToken, setCloudRunToken] = useState<string | null>(null);

  // Set up Google OAuth
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "493914627855-kdi0f5kpehgj10amals7k0ote4nh4idb.apps.googleusercontent.com", // Web client ID
    androidClientId:
      "493914627855-fmh1tvmgu2ng7m4c6uivhmjj1pn6uja3.apps.googleusercontent.com", // Android client ID
    // iosClientId: "YOUR_IOS_CLIENT_ID", // You'll need to get this from Firebase iOS app settings
    webClientId:
      "493914627855-kdi0f5kpehgj10amals7k0ote4nh4idb.apps.googleusercontent.com", // Same as web client ID
  });

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      firebase
        .auth()
        .signInWithCredential(credential)
        .catch((error) => {
          console.error("Firebase auth error:", error);
        });
    }
  }, [response]);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        // User is signed in, get Cloud Run token
        try {
          await refreshCloudRunToken();
        } catch (error) {
          console.error("Error getting Cloud Run token:", error);
        }
      } else {
        // User is signed out
        setCloudRunToken(null);
        await AsyncStorage.removeItem("cloudRunToken");
      }

      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Function to refresh Cloud Run token
  const refreshCloudRunToken = async () => {
    try {
      if (!firebase.auth().currentUser) return;

      const idToken = await firebase.auth().currentUser!.getIdToken(true);
      const token = await getCloudRunToken(idToken);

      setCloudRunToken(token);
      await AsyncStorage.setItem("cloudRunToken", token);

      return token;
    } catch (error) {
      console.error("Error refreshing Cloud Run token:", error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setIsLoading(true);
    await promptAsync();
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebase.auth().signOut();
      setCloudRunToken(null);
      await AsyncStorage.removeItem("cloudRunToken");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    isLoading,
    cloudRunToken,
    signInWithGoogle,
    signOut,
    refreshCloudRunToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
