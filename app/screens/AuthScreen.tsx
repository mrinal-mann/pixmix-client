import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthScreen() {
  const { signInWithGoogle, isLoading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>PixMix</Text>
        <Text style={styles.subtitle}>Transform your photos with AI</Text>
      </View>

      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          <Image style={styles.googleIcon} />
          <Text style={styles.signInText}>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Keep your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0a7ea4",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#687076",
    textAlign: "center",
  },
  signInButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
});