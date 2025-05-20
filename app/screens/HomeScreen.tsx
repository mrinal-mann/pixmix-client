// screens/HomeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../../contexts/AuthContext";
import { applyFilter } from "../../services/imageService";

type RootStackParamList = {
  Home: undefined;
  Result: { imageUrl: string; filterName: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Available filter types
const filters = [
  { id: "Ghibli", name: "Ghibli", icon: "🏯" },
  { id: "Pixar", name: "Pixar", icon: "🧸" },
  { id: "Sketch", name: "Sketch", icon: "✏️" },
  { id: "Cyberpunk", name: "Cyberpunk", icon: "🌆" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image picker function
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      // Reset filter when new image is selected
      setSelectedFilter(null);
    }
  };

  // Handle filter application
  const handleApplyFilter = async () => {
    if (!selectedImage || !selectedFilter) {
      alert("Please select both an image and a filter");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await applyFilter(selectedImage, selectedFilter);

      // Navigate to result screen with the processed image URL
      navigation.navigate("Result", {
        imageUrl: response.imageUrl,
        filterName: selectedFilter,
      });
    } catch (error) {
      console.error("Error applying filter:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* User info and sign out */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {user?.photoURL && (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          )}
          <Text style={styles.userName}>{user?.displayName || "User"}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Image placeholder or selected image */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              Tap to select an image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter selection */}
      <Text style={styles.sectionTitle}>Choose a Filter</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.selectedFilterItem,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text style={styles.filterName}>{filter.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Apply button */}
      <TouchableOpacity
        style={[
          styles.applyButton,
          (!selectedImage || !selectedFilter || isProcessing) &&
            styles.disabledButton,
        ]}
        onPress={handleApplyFilter}
        disabled={!selectedImage || !selectedFilter || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.applyButtonText}>
            {selectedImage && selectedFilter
              ? "Apply Filter"
              : "Select Image & Filter"}
          </Text>
        )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: "#0a7ea4",
    fontWeight: "500",
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: "#e1e1e1",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#888",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterList: {
    flexDirection: "row",
    marginBottom: 24,
  },
  filterItem: {
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFilterItem: {
    backgroundColor: "#e6f2f7",
    borderColor: "#0a7ea4",
    borderWidth: 2,
  },
  filterIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  filterName: {
    fontSize: 14,
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  disabledButton: {
    backgroundColor: "#aaa",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
