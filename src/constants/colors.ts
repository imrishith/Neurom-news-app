// src/constants/colors.ts

// Common values
const base = {
  softPurple: '#997DDF',
  mediumGray: '#828282',
  softGreen: '#25D366',
  alertRed: '#f3080cff',
  lavenderPurple: '#997DDF',
  
  royalPurple: '#2D009D',
  

};

// ✅ Dark Theme
export const DarkColors = {
  ...base,
  textcolor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
  deepPurple: '#1F1A2B',
  darkpurple: '#131313',
  heading: "#E0E0E0",
   gray: '#828282',
   circle: "#FFFFFF",
  icon: '#828282',
   actioncolor: '#49425B',
    blackcolor: '#FFFFFF',
    topbarActiveLabel: '#FFFFFF',


  gradientPrimary: {
    colors: ['#000000', '#000000'],
    direction: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  },

  gradientSecondary: {
    colors: ['#000000', '#000000'],
    direction: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  },
};

// ✅ Light Theme
export const LightColors = {
  ...base,
  textcolor: '#1F1A2B',
  backgroundColor: '#131313',
  deepPurple: '#F6F3FF',   // light background variant
  darkpurple: '#FFFFFF',
   heading: "#1F1A2B",   // pure white for surfaces
   gray: '#1F1A2B',
   circle: "#997DDF",
   icon: '#FFFFFF',
    actioncolor: '#F6F3FF',
    blackcolor: '#FFFFFF',
    topbarActiveLabel: '#000000',

  gradientPrimary: {
    colors: ['#FFFFFF', '#E8E8E8'],
    direction: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  },

  gradientSecondary: {
    colors: ['#F5F5F5', '#DDDDDD'],
    direction: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  },
};

export default DarkColors; // Default = dark mode
 