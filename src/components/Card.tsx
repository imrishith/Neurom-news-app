import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageStyle,
  TextStyle,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Colors from '../constants/colors';
import { fw, fh, ff } from '../../utils/responsive';

interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  children?: React.ReactNode;

  // Custom styles
  style?: StyleProp<ViewStyle>;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  imageStyle?: ImageStyle;
  imageHeight?: number; // remains optional
  borderRadius?: number;
  backgroundColor?: string;

  // Optional sections
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  image,
  children,
  style,
  titleStyle,
  subtitleStyle,
  imageStyle,
  imageHeight = fh(180), // ✅ responsive height
  borderRadius = fw(12), // ✅ responsive radius
  backgroundColor = Colors.deepPurple,
  header,
  footer,
}) => {
  return (
    <View style={[styles.card, { backgroundColor, borderRadius }, style]}>
      {header && <View style={styles.section}>{header}</View>}

      {image && (
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          style={[
            styles.image,
            { height: imageHeight, borderRadius },
            imageStyle,
          ]}
        />
      )}

      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}

      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
      )}

      {children && <View style={styles.content}>{children}</View>}

      {footer && <View style={styles.section}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: fw(16),
    marginVertical: fh(12),
    width: '90%',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: ff(18),
    fontWeight: 'bold',
    color: Colors.textcolor,
    marginTop: fh(12),
    marginBottom: fh(4),
  },
  subtitle: {
    fontSize: ff(14),
    color: Colors.mediumGray,
    marginBottom: fh(8),
  },
  content: {
    marginTop: fh(8),
  },
  section: {
    marginBottom: fh(8),
  },
});

export default Card;
