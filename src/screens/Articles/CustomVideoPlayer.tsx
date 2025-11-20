import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { fw, fh, ff, fr, getLayoutConfig } from '../../../utils/responsive';

interface CustomVideoPlayerProps {
    videoUri: string;
    posterUri: string;
    style?: ViewStyle;
    onPlaybackEnd?: () => void;
    // Callback to notify the parent to start/stop playback
    onPlayToggle: (shouldPlay: boolean) => void; 
    paused: boolean; 
    onFullscreenToggle: (isFullScreen: boolean) => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ 
    videoUri, 
    posterUri, 
    style, 
    onPlaybackEnd, 
    onPlayToggle,
    paused: parentPaused, // Use the paused state passed from parent
    onFullscreenToggle,
}) => {
    // INTERNAL STATE: Controls if video is currently playing OR paused by user interaction
    const [isInternalPlaying, setIsInternalPlaying] = useState(false); 
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(false); 
    const [isFullScreen, setIsFullScreen] = useState(false); 
    
    // Flag to override the parent's aggressive 'paused' prop when the user explicitly hits play.
    const [userPlayedOverride, setUserPlayedOverride] = useState(false); 
    
    const videoRef = useRef<Video | null>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // --- Core Logic for Pausing ---
    // The Video component is paused if:
    // 1. The user has NOT overridden the parent's pause AND the parent forces a pause.
    // 2. The internal control state is paused (user click)
    const isVideoPaused = userPlayedOverride 
        ? !isInternalPlaying // If overriding, only use internal state
        : parentPaused || !isInternalPlaying; // If not overriding, respect both

    // Effect to handle auto-hiding of controls
    useEffect(() => {
        if (!isVideoPaused && controlsVisible) {
            // If video is playing and controls are visible, set a timeout to hide them
            controlsTimeout.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
        
        // Cleanup function to clear the timeout
        return () => {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        };
    }, [controlsVisible, isVideoPaused]);

    // Format time helper function
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgress = (data: { currentTime: number }) => {
        setCurrentTime(data.currentTime);
        if (duration > 0) {
            setProgress(data.currentTime / duration);
        }
    };

    const handleLoad = (data: { duration: number }) => {
        setDuration(data.duration);
    }

    const handleSeek = (value: number) => {
        const seekTime = value * duration;
        videoRef.current?.seek(seekTime);
        setCurrentTime(seekTime);
    };

    const handleEnd = () => {
        // When video ends, tell parent to set playing to false
        onPlayToggle(false); 
        setIsInternalPlaying(false);
        setControlsVisible(false); 
        setUserPlayedOverride(false); // Reset override
        onPlaybackEnd?.(); 
    };
    
    // Handles Play/Pause by checking effective state (parent + local)
    const handlePlayPauseToggle = () => {
        // If currently paused, we want to play (shouldPlay = true)
        const shouldPlay = isVideoPaused; 
        
        // 1. Update parent state (Crucial: tells ArticleTextMode to start/stop playing)
        onPlayToggle(shouldPlay); 
        
        // 2. Update local state
        setIsInternalPlaying(shouldPlay);

        // 3. Set/Reset override flag
        setUserPlayedOverride(shouldPlay); 
        
        // 4. Show controls when pausing, hide them when playing (will auto-hide later)
        setControlsVisible(!shouldPlay);
    };

    // Handle tapping the video area for play/pause/show controls
    const handleTapVideo = () => {
        if (controlsVisible) {
            // If controls are already visible, toggle play/pause on tap
            handlePlayPauseToggle();
        } else {
            // If controls are hidden, show them
            setControlsVisible(true);
        }
    };

    // ⭐ REVISED Fullscreen Toggle logic
    const handleFullscreen = () => {
        const newFullScreenState = !isFullScreen;
        setIsFullScreen(newFullScreenState);
        onFullscreenToggle(newFullScreenState); // Notify parent for layout change

        if (videoRef.current) {
            if (newFullScreenState) {
                // If switching to fullscreen, present the player
                videoRef.current.presentFullscreenPlayer();
            } else {
                // If switching out of fullscreen, dismiss the player
                videoRef.current.dismissFullscreenPlayer();
            }
        } 
    };
    
    return (
        <View style={[styles.container, style]}>
            <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode={isFullScreen ? "contain" : "cover"}
                paused={isVideoPaused} // Use the combined paused state
                muted={isMuted}
                poster={posterUri}
                posterResizeMode="cover"
                onLoad={handleLoad}
                onProgress={handleProgress}
                onEnd={handleEnd}
                // Show controls briefly on load
                onLoadStart={() => setControlsVisible(true)} 
                onError={(e) => console.log('Video Error:', e)}
            />

            {/* Controls Overlay - Tap to show controls or play/pause */}
            <TouchableOpacity 
                style={styles.controlsOverlay} 
                activeOpacity={1} 
                onPress={handleTapVideo} 
            >
                
                {/* Center Play/Pause Button (Visible only when video is paused) */}
                {isVideoPaused && (
                    <TouchableOpacity
                        style={styles.centerPlayButton}
                        onPress={handlePlayPauseToggle}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={'play-circle'} // Always show play when paused
                            size={getLayoutConfig().isTablet ? fw(80) : fw(64)}
                            color="rgba(255, 255, 255, 0.9)"
                        />
                    </TouchableOpacity>
                )}
                
                {/* Bottom Controls (Visible when controlsVisible is true) */}
                {controlsVisible && (
                    <View style={styles.bottomControlsContainer}>

                        {/* Top of Bottom Bar: Progress Bar */}
                        <View style={styles.progressContainer}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={progress}
                                onSlidingComplete={handleSeek}
                                minimumTrackTintColor="#997DDF"
                                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                thumbTintColor="#997DDF"
                            />
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>

                        {/* Bottom of Bottom Bar: Mute, and Fullscreen Buttons */}
                        <View style={styles.actionRow}>
                            {/* Left: Sound Toggle */}
                            <TouchableOpacity
                                style={styles.muteButton}
                                onPress={() => setIsMuted(!isMuted)}
                            >
                                <Ionicons
                                    name={isMuted ? 'volume-mute' : 'volume-high'}
                                    size={getLayoutConfig().isTablet ? fw(28) : fw(24)}
                                    color="#fff"
                                />
                            </TouchableOpacity>

                            {/* Right: Fullscreen Toggle */}
                            <TouchableOpacity
                                style={styles.fullscreenButton}
                                onPress={handleFullscreen}
                            >
                                <Ionicons
                                    // ⭐ Dynamically change icon based on state
                                    name={isFullScreen ? 'contract-sharp' : 'expand-sharp'} 
                                    size={getLayoutConfig().isTablet ? fw(28) : fw(24)}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Tappable transparent area to hide controls */}
                        <TouchableOpacity 
                            style={styles.hideControlsButton} 
                            activeOpacity={0} 
                            onPress={() => setControlsVisible(false)} 
                        />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1080 / 800,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerPlayButton: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    // Main container for the bottom controls bar
    bottomControlsContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: fw(getLayoutConfig().isTablet ? 20 : 16),
        paddingVertical: fh(getLayoutConfig().isTablet ? 12 : 8),
        // The container itself is transparent
        backgroundColor: 'transparent',
        zIndex: 5,
    },
    // NEW: Tappable area to register touch events to hide controls, if the user taps outside the buttons
    hideControlsButton: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1, // Ensure buttons above are tappable
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: fw(getLayoutConfig().isTablet ? 12 : 8),
        // Adding a subtle background for visibility on video
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: fr(getLayoutConfig().isTablet ? 6 : 4),
        paddingHorizontal: fw(getLayoutConfig().isTablet ? 12 : 8),
        paddingVertical: fh(getLayoutConfig().isTablet ? 6 : 4),
        marginBottom: fh(getLayoutConfig().isTablet ? 6 : 4),
    },
    slider: {
        flex: 1,
        height: fh(getLayoutConfig().isTablet ? 36 : 30),
        marginHorizontal: fw(getLayoutConfig().isTablet ? -10 : -8),
    },
    timeText: {
        color: '#fff',
        fontSize: ff(getLayoutConfig().isTablet ? 14 : 12),
        fontWeight: '500',
        width: fw(getLayoutConfig().isTablet ? 40 : 35),
        textAlign: 'center',
        // Adding shadow for better contrast against video
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 2
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Allows space for all buttons
        gap: fw(getLayoutConfig().isTablet ? 24 : 20), // Add space between icons
        alignItems: 'center',
        marginTop: fh(getLayoutConfig().isTablet ? 6 : 4),
        paddingHorizontal: fw(getLayoutConfig().isTablet ? 10 : 8), // Pad this row too
    },
    // Styled button for tap targets
    muteButton: {
        padding: fw(getLayoutConfig().isTablet ? 10 : 8),
        width: fw(getLayoutConfig().isTablet ? 48 : 40), 
        height: fw(getLayoutConfig().isTablet ? 48 : 40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenButton: {
        padding: fw(getLayoutConfig().isTablet ? 10 : 8),
        marginLeft: 'auto', // Push to the right edge
        width: fw(getLayoutConfig().isTablet ? 48 : 40),
        height: fw(getLayoutConfig().isTablet ? 48 : 40),
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomVideoPlayer;