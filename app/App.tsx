// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import ResultScreen from "./screens/ResultScreen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible until authentication check completes
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// Main navigator that handles authentication state
function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth to initialize
        if (!isLoading) {
          // Hide splash screen
          await SplashScreen.hideAsync();
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [isLoading]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0a7ea4" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {user ? (
        // Authenticated routes
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "PixMix" }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: "Filtered Image" }}
          />
        </>
      ) : (
        // Non-authenticated routes
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}
