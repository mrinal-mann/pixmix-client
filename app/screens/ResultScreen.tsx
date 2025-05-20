// screens/ResultScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export default function ResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUrl, filterName } = route.params as {
    imageUrl: string;
    filterName: string;
  };

  // Function to share image
  const shareImage = async () => {
    try {
      // If it's a remote URL, we need to download it first
      if (imageUrl.startsWith("http")) {
        const fileUri = FileSystem.documentDirectory + "pixmix_filtered.png";
        const downloadResult = await FileSystem.downloadAsync(
          imageUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          await Share.share({
            url: downloadResult.uri,
            message: `Check out my ${filterName} filtered image from PixMix!`,
          });
        }
      }
      // For base64 data URLs, we need to save to a file first
      else if (imageUrl.startsWith("data:")) {
        const fileUri = FileSystem.documentDirectory + "pixmix_filtered.png";
        await FileSystem.writeAsStringAsync(fileUri, imageUrl.split(",")[1], {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Share.share({
          url: fileUri,
          message: `Check out my ${filterName} filtered image from PixMix!`,
        });
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share image.");
    }
  };

  // Function to save image to gallery
  const saveToGallery = async () => {
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Need permission to save images to your gallery."
        );
        return;
      }

      // For remote URL
      if (imageUrl.startsWith("http")) {
        const fileUri = FileSystem.documentDirectory + "pixmix_filtered.png";
        const downloadResult = await FileSystem.downloadAsync(
          imageUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          await MediaLibrary.createAlbumAsync("PixMix", asset, false);
          Alert.alert("Success", "Image saved to gallery!");
        }
      }
      // For base64 data URLs
      else if (imageUrl.startsWith("data:")) {
        const fileUri = FileSystem.documentDirectory + "pixmix_filtered.png";
        await FileSystem.writeAsStringAsync(fileUri, imageUrl.split(",")[1], {
          encoding: FileSystem.EncodingType.Base64,
        });

        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync("PixMix", asset, false);
        Alert.alert("Success", "Image saved to gallery!");
      }
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image to gallery.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{filterName} Filter Applied</Text>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={saveToGallery}>
          <Text style={styles.buttonText}>Save to Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={shareImage}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newImageButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.newImageButtonText}>Create Another</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#0a7ea4",
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  newImageButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  newImageButtonText: {
    color: "#444",
    fontWeight: "600",
    fontSize: 16,
  },
});
