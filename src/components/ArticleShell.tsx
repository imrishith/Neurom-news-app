import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { fw, fh, ff } from '../../utils/responsive';

const { height: SCREEN_H } = Dimensions.get('window');

interface ArticleShellProps {
    title: string;
    thumbnail?: string;
    isLoading?: boolean;
    colors: any;
}

/**
 * ArticleShell - Lightweight placeholder that renders instantly
 * Shows title + thumbnail while full content loads
 */
const ArticleShell: React.FC<ArticleShellProps> = ({ title, thumbnail, isLoading, colors }) => {
    return (
        <View style={[styles.container, { backgroundColor: colors.darkpurple || '#000' }]}>
            {/* Thumbnail */}
            {thumbnail && (
                <Image
                    source={{ uri: thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            )}

            {/* Title Overlay */}
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.textcolor || '#fff' }]} numberOfLines={3}>
                    {title}
                </Text>
            </View>

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.gray || '#888'} />
                    <Text style={[styles.loadingText, { color: colors.gray || '#888' }]}>
                        Loading article...
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnail: {
        width: '100%',
        height: SCREEN_H * 0.4,
        position: 'absolute',
        top: 0,
    },
    titleContainer: {
        position: 'absolute',
        bottom: fh(100),
        left: fw(20),
        right: fw(20),
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: fw(15),
        borderRadius: fw(10),
    },
    title: {
        fontSize: ff(20),
        fontWeight: 'bold',
        lineHeight: ff(28),
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    loadingText: {
        marginTop: fh(10),
        fontSize: ff(14),
    },
});

export default ArticleShell;
