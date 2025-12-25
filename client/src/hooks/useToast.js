import { useState, useCallback, useRef, useEffect } from 'react';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * Custom hook for toast notifications
 * Provides a unified way to show success, error, and XP notifications
 * 
 * @param {Object} options
 * @param {number} options.duration - How long toast stays visible (ms)
 */
export const useToast = ({ duration = UI_CONSTANTS.TOAST_DURATION } = {}) => {
    const [toast, setToast] = useState(null);
    const timeoutRef = useRef(null);

    // Clear any existing timeout
    const clearToastTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Show a toast notification
    const showToast = useCallback((message, type = 'info') => {
        clearToastTimeout();

        setToast({ message, type });

        timeoutRef.current = setTimeout(() => {
            setToast(null);
        }, duration);
    }, [duration, clearToastTimeout]);

    // Convenience methods for different toast types
    const showSuccess = useCallback((message) => {
        showToast(message, 'success');
    }, [showToast]);

    const showError = useCallback((message) => {
        showToast(message, 'error');
    }, [showToast]);

    const showXP = useCallback((xpAmount, bonus = false) => {
        const message = `+${xpAmount} XP earned!${bonus ? ' (Early bonus!)' : ''}`;
        showToast(message, 'xp');
    }, [showToast]);

    const showInfo = useCallback((message) => {
        showToast(message, 'info');
    }, [showToast]);

    // Hide toast immediately
    const hideToast = useCallback(() => {
        clearToastTimeout();
        setToast(null);
    }, [clearToastTimeout]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearToastTimeout();
    }, [clearToastTimeout]);

    return {
        toast,
        showToast,
        showSuccess,
        showError,
        showXP,
        showInfo,
        hideToast
    };
};

export default useToast;
