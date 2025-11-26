import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal";
import CheckBox from "@react-native-community/checkbox";
import GradientScreen from "../../components/GradientScreen";
import { fw, fh, ff } from "../../../utils/responsive";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { useCategoriesStore } from "../../../utils/store/useCategoriesStore";

const SidebarPanel = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { Colors } = useTheme();
  const { t, getFont, getLangCode } = useOnboarding();
  
  const {
    categories,
    selectedCategories: globalSelectedCategories, // Rename for clarity
    setSelectedCategories, // We use this to save all at once
    fetchCategories,
  } = useCategoriesStore();

  // ✅ 1. Local State for instant UI feedback
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // ✅ Fetch categories if missing
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // ✅ 2. Sync Global Store -> Local State when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelected(globalSelectedCategories);
    }
  }, [visible, globalSelectedCategories]);

  // ✅ Sync "Select All" checkbox based on local state
  useEffect(() => {
    setSelectAll(
      categories.length > 0 && localSelected.length === categories.length
    );
  }, [localSelected, categories]);

  // ✅ 3. Handle Toggle Locally (Instant, no lag)
  const toggleLocalCategory = useCallback((key: string) => {
    setLocalSelected((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  }, []);

  // ✅ 4. Handle Select All Locally
  const handleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      setLocalSelected(categories.map((cat) => String(cat.category_id)));
    } else {
      setLocalSelected([]);
    }
  }, [selectAll, categories]);

  // ✅ 5. Save to Global Store ONLY when closing
  const handleCloseAndSave = () => {
    // Only update store if changes were actually made
    if (JSON.stringify(localSelected) !== JSON.stringify(globalSelectedCategories)) {
      setSelectedCategories(localSelected);
    }
    onClose();
  };

  const isTelugu = getLangCode() === "te";

  return (
    <Modal
      isVisible={visible}
      animationIn="slideInLeft"
      animationOut="slideOutLeft"
      onBackdropPress={handleCloseAndSave} // Save when clicking outside
      onBackButtonPress={handleCloseAndSave} // Save when pressing back button
      backdropOpacity={0.3}
      style={styles.modal}
      useNativeDriver={true} // Performance boost
      hideModalContentWhileAnimating={true} // Smoother close animation
    >
      <GradientScreen>
        <View style={styles.container}>
          <Text
            style={[
              styles.title,
              { color: Colors.textcolor, fontFamily: getFont("medium") },
            ]}
          >
            {t("select_the_categories")}
          </Text>

          {/* Select All Row */}
          <View style={styles.selectAllRow}>
            <Text
              style={[
                styles.selectAllText,
                { color: Colors.textcolor, fontFamily: getFont("regular") },
              ]}
            >
              {t("select_all")}
            </Text>
            <CheckBox
              value={selectAll}
              onValueChange={handleSelectAll}
              tintColors={{
                true: Colors.lavenderPurple,
                false: Colors.textcolor,
              }}
              style={styles.checkbox}
            />
          </View>

          {/* Category List */}
          {categories.map((cat) => {
            const key = String(cat.category_id);
            const label = isTelugu
              ? cat.display_name_te || cat.name_te
              : cat.display_name_en || cat.name_en;
            
            // Check against LOCAL state
            const isActive = localSelected.includes(key);

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                style={[
                  styles.item,
                  {
                    backgroundColor: isActive
                      ? Colors.lavenderPurple
                      : "transparent",
                  },
                ]}
                onPress={() => toggleLocalCategory(key)}
              >
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: isActive ? "#fff" : Colors.textcolor,
                      fontFamily: getFont("regular"),
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GradientScreen>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  container: {
    width: fw(200),
    height: "100%",
    padding: fw(20),
    borderTopRightRadius: fw(16),
    borderBottomRightRadius: fw(16),
    justifyContent: "flex-start",
  },
  title: {
    fontSize: ff(14),
    fontWeight: "700",
    marginBottom: fh(12),
    alignSelf: "flex-start",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: fw(20),
    marginBottom: fh(20),
  },
  selectAllText: {
    fontSize: ff(14),
    marginLeft: fw(6),
    fontWeight: "700",
    lineHeight: fh(22),
  },
  item: {
    width: fw(140),
    height: fh(34),
    borderRadius: fw(10),
    marginBottom: fh(15),
    justifyContent: "center",
  },
  itemText: {
    fontSize: ff(14),
    fontWeight: "700",
    marginLeft: fw(14),
    top: fh(1),
    lineHeight: fh(22),
  },
  checkbox: {
    transform: [{ scaleX: 1 }, { scaleY: 1}],
    marginLeft: fw(15),
    marginTop: fh(-5),
  },
});

export default SidebarPanel;