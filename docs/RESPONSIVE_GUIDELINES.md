# Responsive Design Guidelines

This document provides comprehensive guidelines for maintaining responsive design across the Shortly mobile application.

## 🎯 Overview

Our responsive system ensures the app looks and works perfectly across all device sizes, from small phones to large tablets. All screens should adapt fluidly to different screen sizes, orientations, and pixel densities.

## 📐 Core Responsive Utilities

### Enhanced Responsive Functions

```typescript
import { fw, fh, ff, fr, getLayoutConfig } from '../utils/responsive';

// fw() - Responsive width scaling
const width = fw(300); // Scales based on screen width

// fh() - Responsive height scaling  
const height = fh(200); // Scales based on screen height

// ff() - Responsive font scaling
const fontSize = ff(16); // Adapts font size based on screen dimensions

// fr() - Responsive border radius
const borderRadius = fr(8); // Scales border radius appropriately

// getLayoutConfig() - Get device-specific layout configuration
const config = getLayoutConfig();
console.log(config.isTablet); // true for tablets
console.log(config.isLandscape); // true for landscape mode
```

## 📱 Device Detection & Layout Config

The `getLayoutConfig()` function provides device-aware configuration:

```typescript
interface LayoutConfig {
  isTablet: boolean;        // Detects tablet devices (width >= 768)
  isLandscape: boolean;     // Current orientation
  contentPadding: number;   // Horizontal padding based on device
  maxContentWidth: number;  // Maximum content width
  headerHeight: number;     // Adaptive header height
  bottomTabHeight: number;  // Bottom navigation height
  cardSpacing: number;      // Spacing between cards
  textScale: number;        // Global text scaling factor
}
```

## 🎨 Responsive Design Patterns

### 1. Screen Container Pattern

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getLayoutConfig().contentPadding,
    justifyContent: 'center', // Center on tablets, flex-start on phones
    alignItems: getLayoutConfig().isTablet ? 'center' : 'stretch',
  }
});
```

### 2. Header Pattern

```typescript
const styles = StyleSheet.create({
  header: {
    height: getLayoutConfig().headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getLayoutConfig().contentPadding,
  },
  headerTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
    fontWeight: '600',
    includeFontPadding: false,
  }
});
```

### 3. Card/List Item Pattern

```typescript
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: fw(getLayoutConfig().isTablet ? 24 : 16),
    marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
    borderRadius: fr(12),
    minHeight: fh(getLayoutConfig().isTablet ? 80 : 60),
  },
  cardImage: {
    width: fw(getLayoutConfig().isTablet ? 100 : 80),
    height: fh(getLayoutConfig().isTablet ? 100 : 80),
    borderRadius: fr(getLayoutConfig().isTablet ? 12 : 8),
  },
  cardTitle: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    lineHeight: ff(getLayoutConfig().isTablet ? 22 : 20),
    includeFontPadding: false,
  }
});
```

### 4. Button Pattern

```typescript
const styles = StyleSheet.create({
  button: {
    paddingVertical: fh(getLayoutConfig().isTablet ? 16 : 12),
    paddingHorizontal: fw(getLayoutConfig().isTablet ? 32 : 24),
    minHeight: fh(getLayoutConfig().isTablet ? 52 : 44),
    borderRadius: fr(8),
  },
  buttonText: {
    fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
  }
});
```

## 📏 Size Guidelines by Device Type

### Mobile Phones (< 768px width)
- **Padding**: 16-20px horizontal
- **Header Height**: 56-60px
- **Button Height**: 44-50px
- **Card Spacing**: 12-16px
- **Font Scaling**: Base scale (1.0x)
- **Touch Targets**: Minimum 44px

### Tablets (≥ 768px width)
- **Padding**: 32-40px horizontal
- **Header Height**: 64-72px
- **Button Height**: 52-56px
- **Card Spacing**: 16-24px
- **Font Scaling**: +20-30% larger
- **Touch Targets**: Minimum 48px

## 🛠 Implementation Checklist

### When Creating/Updating Screens:

- [ ] Import responsive utilities: `import { fw, fh, ff, fr, getLayoutConfig } from '../utils/responsive';`
- [ ] Use `getLayoutConfig().isTablet` for tablet-specific styling
- [ ] Apply `getLayoutConfig().contentPadding` for horizontal padding
- [ ] Use `ff()` for all font sizes
- [ ] Use `fw()`, `fh()` for dimensions
- [ ] Use `fr()` for border radius
- [ ] Test on different screen sizes
- [ ] Ensure proper text scaling with `includeFontPadding: false`
- [ ] Check landscape mode compatibility
- [ ] Verify touch targets meet accessibility standards

### Text Typography Standards:

```typescript
// ✅ Good: Responsive font with proper line height
const titleStyle = {
  fontSize: ff(getLayoutConfig().isTablet ? 20 : 18),
  lineHeight: ff(getLayoutConfig().isTablet ? 28 : 24),
  includeFontPadding: false, // Android-specific fix
  fontWeight: '600',
};

// ✅ Good: Responsive padding/margins
const containerStyle = {
  padding: fw(getLayoutConfig().isTablet ? 24 : 16),
  marginBottom: fh(getLayoutConfig().isTablet ? 16 : 12),
};
```

## 🎭 Common Responsive Patterns

### Modal/Dialog Pattern
```typescript
const modalStyle = {
  marginHorizontal: getLayoutConfig().isTablet ? fw(100) : fw(20),
  padding: fw(getLayoutConfig().isTablet ? 32 : 20),
  maxHeight: fh(getLayoutConfig().isTablet ? 600 : 500),
};
```

### Form Input Pattern
```typescript
const inputStyle = {
  height: fh(getLayoutConfig().isTablet ? 56 : 48),
  paddingHorizontal: fw(16),
  fontSize: ff(getLayoutConfig().isTablet ? 16 : 14),
  borderRadius: fr(8),
};
```

### List Item Pattern
```typescript
const listItemStyle = {
  paddingHorizontal: getLayoutConfig().contentPadding,
  paddingVertical: fh(getLayoutConfig().isTablet ? 16 : 12),
  minHeight: fh(getLayoutConfig().isTablet ? 64 : 56),
};
```

## 🔍 Testing Guidelines

### Manual Testing Checklist:

1. **iPhone SE (375x667)** - Small phone
2. **iPhone 12 (390x844)** - Standard phone  
3. **iPhone 12 Pro Max (428x926)** - Large phone
4. **iPad (768x1024)** - Tablet
5. **iPad Pro 12.9" (1024x1366)** - Large tablet

### Landscape Testing:
- [ ] Content reflows properly
- [ ] No horizontal scrolling on phones
- [ ] Headers remain accessible
- [ ] Touch targets are adequate

### Accessibility:
- [ ] Text is readable at smallest size
- [ ] Touch targets are minimum 44px
- [ ] No overlapping content
- [ ] Proper contrast ratios maintained

## 🐛 Common Issues & Solutions

### Issue: Text overflow/truncation
**Solution**: Use `flexWrap: 'wrap'` and `flex: 1` for text containers

### Issue: Touch targets too small
**Solution**: Use `minHeight` and `minWidth` with proper padding

### Issue: Content doesn't center on tablets
**Solution**: Use conditional styling with `getLayoutConfig().isTablet`

### Issue: Poor layout in landscape
**Solution**: Test both orientations and use `isLandscapeMode()`

### Issue: Inconsistent spacing
**Solution**: Always use responsive functions, never hardcoded pixels

## 📋 File Structure

Responsive utilities are organized as:
- `/utils/responsive.ts` - Core responsive functions
- `/utils/layoutUtils.ts` - Layout helpers and hooks  
- `/components/` - Updated with responsive patterns
- `/screens/` - All screens following responsive guidelines

## 🚀 Future Enhancements

- [ ] Dynamic font size preferences
- [ ] Orientation-specific layouts
- [ ] Dark mode responsive adjustments
- [ ] Accessibility font scaling support
- [ ] Device-specific optimizations

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0