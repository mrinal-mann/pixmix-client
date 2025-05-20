// contexts/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { registerFCMToken } from "../services/notificationService";
import { useAuth } from "./AuthContext";

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RootStackParamList = {
  Result: { imageUrl: string; filterName: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type NotificationContextType = {
  notificationToken: string | null;
  registerForPushNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  notificationToken: null,
  registerForPushNotifications: async () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notificationToken, setNotificationToken] = useState<string | null>(
    null
  );
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const registerForPushNotifications = useCallback(async () => {
    try {
      // Request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token: permission not granted");
        return;
      }

      // Get push notification token
      const token = await Notifications.getDevicePushTokenAsync();
      setNotificationToken(token.data);

      // Register token with backend if user is authenticated
      if (user && token.data) {
        await registerFCMToken(user.uid, token.data, Platform.OS);
      }

      // Set up notification channels for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("image-processing", {
          name: "Image Processing",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0a7ea4",
        });
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    // Register for push notifications when user is authenticated
    if (user) {
      registerForPushNotifications();

      // Set up notification received handler
      const notificationReceivedSubscription =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

      // Set up notification response handler
      const notificationResponseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as {
            notificationType: string;
            imageUrl: string;
            filterType: string;
          };

          if (data.notificationType === "image_ready") {
            // Navigate to result screen with processed image data
            navigation.navigate("Result", {
              imageUrl: data.imageUrl,
              filterName: data.filterType,
            });
          }
        });

      // Clean up subscriptions
      return () => {
        notificationReceivedSubscription.remove();
        notificationResponseSubscription.remove();
      };
    }
  }, [user, navigation, registerForPushNotifications]);

  const value = {
    notificationToken,
    registerForPushNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
