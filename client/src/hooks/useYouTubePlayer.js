import { useState, useRef, useEffect, useCallback } from 'react';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * Custom hook for YouTube player functionality
 * Handles iframe API, playback state, and progress tracking
 * 
 * @param {Object} options
 * @param {string} options.videoId - YouTube video ID
 * @param {React.RefObject} options.containerRef - Ref to the container div
 * @param {number} options.startTime - Initial start time in seconds
 * @param {Function} options.onProgress - Callback with current time (called periodically)
 * @param {Function} options.onReady - Callback when player is ready
 * @param {Function} options.onStateChange - Callback when playback state changes
 * @param {number} options.progressInterval - How often to call onProgress (ms)
 */
export const useYouTubePlayer = ({
    videoId,
    containerRef,
    startTime = 0,
    onProgress = null,
    onReady = null,
    onStateChange = null,
    progressInterval = UI_CONSTANTS.PROGRESS_SAVE_INTERVAL
} = {}) => {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(startTime);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const apiLoadedRef = useRef(false);

    // Load YouTube IFrame API
    const loadYouTubeAPI = useCallback(() => {
        return new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }

            if (!apiLoadedRef.current) {
                apiLoadedRef.current = true;
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };
        });
    }, []);

    // Initialize player
    const initPlayer = useCallback(async () => {
        if (!videoId || !containerRef?.current) return;

        await loadYouTubeAPI();

        // Destroy existing player if any
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId,
            playerVars: {
                autoplay: 0,
                start: Math.floor(startTime),
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: (event) => {
                    setIsReady(true);
                    const dur = event.target.getDuration();
                    setDuration(dur);
                    onReady?.(event);
                },
                onStateChange: (event) => {
                    const playing = event.data === window.YT.PlayerState.PLAYING;
                    setIsPlaying(playing);
                    onStateChange?.(event);
                }
            }
        });
    }, [videoId, containerRef, startTime, loadYouTubeAPI, onReady, onStateChange]);

    // Start progress tracking
    const startProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) return;

        progressIntervalRef.current = setInterval(() => {
            if (playerRef.current?.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                onProgress?.(time);
            }
        }, progressInterval);
    }, [progressInterval, onProgress]);

    // Stop progress tracking
    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    // Control methods
    const play = useCallback(() => {
        playerRef.current?.playVideo?.();
    }, []);

    const pause = useCallback(() => {
        playerRef.current?.pauseVideo?.();
    }, []);

    const seekTo = useCallback((seconds, allowSeekAhead = true) => {
        playerRef.current?.seekTo?.(seconds, allowSeekAhead);
        setCurrentTime(seconds);
    }, []);

    const getCurrentTime = useCallback(() => {
        return playerRef.current?.getCurrentTime?.() || 0;
    }, []);

    const getDuration = useCallback(() => {
        return playerRef.current?.getDuration?.() || duration;
    }, [duration]);

    // Handle playback state changes for progress tracking
    useEffect(() => {
        if (isPlaying) {
            startProgressTracking();
        } else {
            stopProgressTracking();
            // Save final position when pausing
            if (playerRef.current?.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                onProgress?.(time);
            }
        }
    }, [isPlaying, startProgressTracking, stopProgressTracking, onProgress]);

    // Initialize player when videoId changes
    useEffect(() => {
        if (videoId) {
            initPlayer();
        }

        return () => {
            stopProgressTracking();
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, initPlayer, stopProgressTracking]);

    return {
        isReady,
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        seekTo,
        getCurrentTime,
        getDuration,
        player: playerRef.current
    };
};

export default useYouTubePlayer;
