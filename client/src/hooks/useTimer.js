import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for timer functionality
 * Extracted from QuestDetail.jsx for reusability
 * 
 * @param {Object} options
 * @param {number} options.initialTime - Initial time in seconds
 * @param {number} options.alarmDuration - Duration before alarm triggers (optional)
 * @param {Function} options.onAlarm - Callback when alarm triggers
 * @param {Function} options.onTick - Callback on each tick with current time
 * @param {Function} options.onStart - Callback when timer starts
 * @param {Function} options.onPause - Callback when timer pauses
 * @param {Function} options.onReset - Callback when timer resets
 */
export const useTimer = ({
    initialTime = 0,
    alarmDuration = null,
    onAlarm = null,
    onTick = null,
    onStart = null,
    onPause = null,
    onReset = null
} = {}) => {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isAlarmActive, setIsAlarmActive] = useState(false);
    const [hasAlarmTriggered, setHasAlarmTriggered] = useState(false);

    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const audioContextRef = useRef(null);
    const chimeIntervalRef = useRef(null);

    // Create audio context for chime
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Play a gentle chime sound
    const playChime = useCallback(() => {
        try {
            const audioContext = getAudioContext();

            // Create oscillator for the chime
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Pleasant chime frequency (C5 note)
            oscillator.frequency.value = 523.25;
            oscillator.type = 'sine';

            // Gentle envelope
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            oscillator.start(now);
            oscillator.stop(now + 0.5);
        } catch (e) {
            console.error('Audio error:', e);
        }
    }, [getAudioContext]);

    // Stop chime interval
    const stopChime = useCallback(() => {
        if (chimeIntervalRef.current) {
            clearInterval(chimeIntervalRef.current);
            chimeIntervalRef.current = null;
        }
    }, []);

    // Start continuous chiming for alarm
    const startChiming = useCallback(() => {
        stopChime();
        playChime(); // Immediate first chime
        chimeIntervalRef.current = setInterval(playChime, 3000);
    }, [playChime, stopChime]);

    // Dismiss alarm
    const dismissAlarm = useCallback(() => {
        setIsAlarmActive(false);
        stopChime();
    }, [stopChime]);

    // Start the timer
    const start = useCallback(() => {
        if (isRunning) return;

        setIsRunning(true);
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            setTime(prev => {
                const newTime = prev + 1;
                onTick?.(newTime);
                return newTime;
            });
        }, 1000);

        onStart?.();
    }, [isRunning, onStart, onTick]);

    // Pause the timer
    const pause = useCallback(() => {
        if (!isRunning) return;

        setIsRunning(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        onPause?.(time);
    }, [isRunning, time, onPause]);

    // Reset the timer
    const reset = useCallback((newInitialTime = 0) => {
        setIsRunning(false);
        setTime(newInitialTime);
        setIsAlarmActive(false);
        setHasAlarmTriggered(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        stopChime();
        onReset?.();
    }, [stopChime, onReset]);

    // Check for alarm trigger
    useEffect(() => {
        if (alarmDuration && time >= alarmDuration && isRunning && !hasAlarmTriggered) {
            setHasAlarmTriggered(true);
            setIsAlarmActive(true);
            startChiming();
            onAlarm?.();
        }
    }, [time, alarmDuration, isRunning, hasAlarmTriggered, startChiming, onAlarm]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            stopChime();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopChime]);

    return {
        time,
        setTime,
        isRunning,
        isAlarmActive,
        hasAlarmTriggered,
        start,
        pause,
        reset,
        dismissAlarm,
        playChime
    };
};

export default useTimer;
