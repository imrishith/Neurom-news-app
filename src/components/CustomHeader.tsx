import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons"; // 👈 correct import for CLI

type Props = {
  type: "title" | "categories";
  title?: string;
  navigation?: any;
  categories?: string[];
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
};

export default function CustomHeader({
  type,
  title,
  navigation,
  categories = [],
  activeCategory,
  onCategoryChange,
}: Props) {
  return (
    <View style={styles.container}>
      {type === "title" ? (
        <View style={styles.row}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={() => alert("More options")}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                activeCategory === cat && styles.activeTab,
              ]}
              onPress={() => onCategoryChange?.(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#6C63FF",
    paddingTop: 40,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingHorizontal: 10,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#7E75F9",
  },
  activeTab: {
    backgroundColor: "white",
  },
  categoryText: {
    color: "white",
    fontSize: 14,
  },
  activeText: {
    color: "#6C63FF",
    fontWeight: "600",
  },
});
