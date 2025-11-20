import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  Animated, 
  Easing, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window'); // For potential scaling

// --- CONSTANTS ---
const SWITCH_WIDTH = 140;
const SWITCH_HEIGHT = 40;
const BORDER_RADIUS = SWITCH_HEIGHT / 2;
const SLIDER_WIDTH = SWITCH_WIDTH / 2;
const SLIDE_DISTANCE = SWITCH_WIDTH - SLIDER_WIDTH; // 140 - 70 = 70

const ModeToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  // Animated.Value is the source of truth for the animation
  const animation = useRef(new Animated.Value(0)).current;

  // --- INTERPOLATIONS ---

  // 1. Slider Position (Smooth Slide)
  const sliderTranslateX = animation.interpolate({
    inputRange: [0, 1],
    // 0: Light state (left), SLIDE_DISTANCE: Dark state (right)
    outputRange: [0, SLIDE_DISTANCE], 
  });

  // 2. Container Background Color
  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    // State 0 (Light is active): Dark background
    // State 1 (Dark is active): Light background
    outputRange: ['#333333', '#E0E0E0'], 
  });

  // 3. Light Text Color (White when active, Gray when inactive)
  const lightTextColor = animation.interpolate({
    inputRange: [0, 1],
    // State 0: White text (active)
    // State 1: Muted gray text (inactive)
    outputRange: ['#FFFFFF', '#777777'], 
  });

  // 4. Dark Text Color (Gray when inactive, Dark Black when active)
  const darkTextColor = animation.interpolate({
    inputRange: [0, 1],
    // State 0: Muted gray text (inactive)
    // State 1: Dark text (active)
    outputRange: ['#777777', '#333333'], 
  });


  // --- TOGGLE HANDLER ---

  const toggleSwitch = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    Animated.timing(animation, {
      toValue: newState ? 1 : 0, // Animate to 1 for Dark, 0 for Light
      duration: 350,
      easing: Easing.inOut(Easing.ease), // Smooth easing function
      useNativeDriver: false, // Required for animating non-transform properties like background color
    }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      {/* Animated View for the pill shape and background color */}
      <Animated.View style={[styles.switchContainer, { backgroundColor }]}>
        
        {/* The Sliding Knob/Pill */}
        <Animated.View
          style={[
            styles.slider,
            {
              // Apply the smooth translation
              transform: [{ translateX: sliderTranslateX }],
            },
          ]}
        />

        {/* LIGHT Text */}
        <Animated.Text style={[styles.text, styles.lightTextPosition, { color: lightTextColor }]}>
          Light
        </Animated.Text>
        
        {/* DARK Text */}
        <Animated.Text style={[styles.text, styles.darkTextPosition, { color: darkTextColor }]}>
          Dark
        </Animated.Text>

      </Animated.View>
    </TouchableWithoutFeedback>
  );
};


// --- STYLESHEET ---

const styles = StyleSheet.create({
  // Container (The Pill Shape)
  switchContainer: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: BORDER_RADIUS, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content for positioning
    overflow: 'hidden', // Essential to contain the slider
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android shadow
  },
  
  // The Sliding Knob/Pill
  slider: {
    position: 'absolute',
    width: SLIDER_WIDTH, 
    height: SWITCH_HEIGHT,
    borderRadius: BORDER_RADIUS,
    backgroundColor: '#FFFFFF', // Slider is always white/light
    zIndex: 1, // Keep the slider beneath the text elements
  },

  // Base Text Style
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    zIndex: 2, // Keep text on top of the slider
    position: 'absolute', 
    lineHeight: SWITCH_HEIGHT, 
    textAlignVertical: 'center', // Android vertical centering
  },

  // Position the 'Light' text
  lightTextPosition: {
    left: 10,
  },

  // Position the 'Dark' text
  darkTextPosition: {
    right: 10,
  },
});

export default ModeToggle;