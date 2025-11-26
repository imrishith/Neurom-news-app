import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    Modal,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomVideoPlayerProps {
    videoUri: string;
    posterUri: string;
    style?: ViewStyle;
    onPlaybackEnd?: () => void;
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
    paused: parentPaused,
    onFullscreenToggle,
}) => {
    const insets = useSafeAreaInsets();
    const videoRef = useRef<VideoRef>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isInternalPlaying, setIsInternalPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userPlayedOverride, setUserPlayedOverride] = useState(false);

    const isVideoPaused = parentPaused || (userPlayedOverride ? !isInternalPlaying : !isInternalPlaying);

    useEffect(() => {
        resetControlTimeout();
        return () => clearControlTimeout();
    }, [controlsVisible, isVideoPaused]);

    const clearControlTimeout = () => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
            controlsTimeout.current = null;
        }
    };

    const resetControlTimeout = () => {
        clearControlTimeout();
        if (!isVideoPaused && controlsVisible) {
            controlsTimeout.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
    };

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
        setIsLoading(false);
        if (currentTime > 0 && videoRef.current) {
            videoRef.current.seek(currentTime);
        }
    };

    const handleSeek = (value: number) => {
        const seekTime = value * duration;
        videoRef.current?.seek(seekTime);
        setCurrentTime(seekTime);
        resetControlTimeout();
    };

    const skip = (seconds: number) => {
        let newTime = currentTime + seconds;
        if (newTime < 0) newTime = 0;
        if (newTime > duration) newTime = duration;
        
        videoRef.current?.seek(newTime);
        setCurrentTime(newTime);
        resetControlTimeout();
    };

    const handleEnd = () => {
        onPlayToggle(false);
        setIsInternalPlaying(false);
        setControlsVisible(true);
        setUserPlayedOverride(false);
        if (isFullScreen) {
            toggleFullscreen();
        }
        onPlaybackEnd?.();
    };

    const handlePlayPauseToggle = () => {
        const shouldPlay = isVideoPaused;
        onPlayToggle(shouldPlay);
        setIsInternalPlaying(shouldPlay);
        setUserPlayedOverride(shouldPlay);
        
        if (shouldPlay) {
            resetControlTimeout();
        } else {
            setControlsVisible(true);
        }
    };

    const handleTapOverlay = () => {
        setControlsVisible(!controlsVisible);
        if (!controlsVisible) resetControlTimeout();
    };

    const toggleFullscreen = () => {
        const newStatus = !isFullScreen;
        setIsFullScreen(newStatus);
        onFullscreenToggle(newStatus);
        setControlsVisible(true);
    };

    const renderPlayerContent = (isModal: boolean) => (
        <View style={[styles.playerWrapper, isModal && styles.modalPlayerWrapper]}>
            <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode={isModal ? "contain" : "cover"}
                paused={isVideoPaused}
                muted={isMuted}
                poster={posterUri}
                posterResizeMode="cover"
                onLoad={handleLoad}
                onProgress={handleProgress}
                onEnd={handleEnd}
                onLoadStart={() => setIsLoading(true)}
                controls={false}
            />

            {isLoading && (
                <View style={styles.centerOverlay}>
                    <ActivityIndicator size="large" color="#997DDF" />
                </View>
            )}

            <TouchableOpacity 
                style={styles.controlsOverlay} 
                activeOpacity={1} 
                onPress={handleTapOverlay}
            >
                {/* Center Controls - Now Absolutely Positioned */}
                {(controlsVisible || isVideoPaused) && (
                    <View style={styles.centerControlsRow}>
                        <TouchableOpacity onPress={() => skip(-10)} style={styles.skipButton}>
                            <Ionicons name="play-back" size={30} color="#fff" />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.centerPlayButton}
                            onPress={handlePlayPauseToggle}
                        >
                            <Ionicons
                                name={isVideoPaused ? 'play-circle' : 'pause-circle'}
                                size={64}
                                color="rgba(255, 255, 255, 0.9)"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => skip(10)} style={styles.skipButton}>
                            <Ionicons name="play-forward" size={30} color="#fff" />
                            <Text style={styles.skipText}>10</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom Controls - Now Absolutely Positioned */}
                {controlsVisible && (
                    <View style={[
                        styles.bottomControlsContainer, 
                        isModal ? { paddingBottom: insets.bottom + 20, paddingHorizontal: 40 } : { paddingBottom: 10 }
                    ]}>
                        <View style={styles.progressContainer}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={progress}
                                onSlidingComplete={handleSeek}
                                onSlidingStart={() => clearControlTimeout()}
                                minimumTrackTintColor="#997DDF"
                                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                thumbTintColor="#997DDF"
                            />
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconButton}>
                                <Ionicons
                                    name={isMuted ? 'volume-mute' : 'volume-high'}
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleFullscreen} style={styles.iconButton}>
                                <Ionicons
                                    name={isModal ? 'contract' : 'expand-sharp'}
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, style]}>
            {!isFullScreen ? renderPlayerContent(false) : (
                <View style={[styles.placeholder, {backgroundColor: '#000'}]}/>
            )}

            <Modal
                visible={isFullScreen}
                transparent={false}
                animationType="fade"
                supportedOrientations={['portrait', 'landscape']}
                onRequestClose={toggleFullscreen}
            >
                <View style={styles.modalContainer}>
                    <StatusBar hidden={true} />
                    {renderPlayerContent(true)}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1080 / 800,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    placeholder: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    playerWrapper: {
        width: '100%',
        height: '100%',
    },
    modalPlayerWrapper: {
        flex: 1,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        // REMOVED justifyContent: 'space-between' to stop layout shifts
    },
    centerControlsRow: {
        ...StyleSheet.absoluteFillObject, // This ensures it covers the whole screen centered
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15, // Ensure it sits below the bottom bar touch-wise if needed, but visually middle
        gap: 40,
    },
    centerPlayButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    skipText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: -4,
    },
    bottomControlsContainer: {
        position: 'absolute', // Pin to bottom
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        paddingHorizontal: 16,
        
        paddingTop: 10,
        zIndex: 20, // Sit on top of everything else
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    slider: {
        flex: 1,
        height: 30,
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        width: 40,
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 5,
    },
    iconButton: {
        padding: 8,
    },
});

export default CustomVideoPlayer;