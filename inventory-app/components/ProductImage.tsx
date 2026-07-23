import { useState } from "react";
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  source?: string;
  images?: string[];
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  size?: "sm" | "md" | "lg";
  resizeMode?: "cover" | "contain";
}

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  sm: { width: 64, height: 64 },
  md: { width: 120, height: 120 },
  lg: { width: "100%" as any, height: 220 },
};

export default function ProductImage({
  source,
  images,
  style,
  imageStyle,
  size = "md",
  resizeMode = "cover",
}: Props) {
  const [hasError, setHasError] = useState(false);
  const uri = source ?? images?.[0];

  if (!uri || hasError) {
    return (
      <View
        style={[
          styles.placeholder,
          size === "sm" && styles.placeholderSm,
          size === "md" && styles.placeholderMd,
          size === "lg" && styles.placeholderLg,
          style,
        ]}
      >
        <Ionicons
          name="image-outline"
          size={size === "sm" ? 24 : size === "md" ? 36 : 48}
          color="#94a3b8"
        />
        <Text style={[styles.placeholderText, size === "sm" && styles.placeholderTextSm]}>
          No image
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          size === "sm" && styles.imageSm,
          size === "md" && styles.imageMd,
          size === "lg" && styles.imageLg,
          imageStyle,
        ]}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  imageSm: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  imageMd: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imageLg: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  placeholder: {
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderSm: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  placeholderMd: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  placeholderLg: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  placeholderTextSm: {
    fontSize: 10,
    marginTop: 2,
  },
});