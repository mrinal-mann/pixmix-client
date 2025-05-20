// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCloudRunToken } from "../services/authService";

// Define the context
type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  cloudRunToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCloudRunToken: () => Promise<string | undefined>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  cloudRunToken: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshCloudRunToken: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudRunToken, setCloudRunToken] = useState<string | null>(null);

  // Configure Google Sign-In when component mounts
  useEffect(() => {
    // For Android, we only need the webClientId
    GoogleSignin.configure({
      // This is the key from your google-services.json file
      webClientId:
        "493914627855-kdi0f5kpehgj10amals7k0ote4nh4idb.apps.googleusercontent.com",
      // Remove androidClientId as it's not needed and causing issues
    });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (userObj) => {
      setUser(userObj);

      if (userObj) {
        try {
          await refreshCloudRunToken();
        } catch (error) {
          console.error("Error getting Cloud Run token:", error);
        }
      } else {
        setCloudRunToken(null);
        await AsyncStorage.removeItem("cloudRunToken");
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh Cloud Run token
  const refreshCloudRunToken = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const idToken = await currentUser.getIdToken(true);
      const token = await getCloudRunToken(idToken);

      setCloudRunToken(token);
      await AsyncStorage.setItem("cloudRunToken", token);

      return token;
    } catch (error) {
      console.error("Error refreshing Cloud Run token:", error);
      throw error;
    }
  };

  // Sign in with Google - fixed to use proper Promise<void> return type
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();

      // Get user data
      const googleUser = await GoogleSignin.signIn();

      // The type definitions don't match the actual response structure
      // Using type assertion to access the idToken
      const idToken = (googleUser as any).idToken;

      if (!idToken) {
        throw new Error("Failed to get ID token from Google Sign-In");
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);

      // Handle specific sign-in errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Sign in was cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available");
      } else {
        console.log("Other sign in error", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      setCloudRunToken(null);
      await AsyncStorage.removeItem("cloudRunToken");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        cloudRunToken,
        signInWithGoogle,
        signOut,
        refreshCloudRunToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
