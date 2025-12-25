/**
 * Time formatting utility functions
 */

/**
 * Format seconds as HH:MM:SS or MM:SS
 * @param {number} totalSeconds - Total seconds to format
 * @param {boolean} forceHours - Always show hours even if 0
 * @returns {string} Formatted time string
 */
export const formatDuration = (totalSeconds, forceHours = false) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) {
        return forceHours ? '0:00:00' : '00:00';
    }

    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0 || forceHours) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Format seconds as short human-readable duration
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} Short duration (e.g., "2h 30m", "45m", "30s")
 */
export const formatDurationShort = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds <= 0) {
        return '0s';
    }

    const seconds = Math.floor(totalSeconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 && h === 0) parts.push(`${s}s`); // Only show seconds if under an hour

    return parts.length > 0 ? parts.join(' ') : '0s';
};

/**
 * Format seconds for compact display (e.g., in cards)
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Compact format
 */
export const formatTimeCompact = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) {
        return '0:00';
    }

    const seconds = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Parse time components to total seconds
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes  
 * @param {number} seconds - Seconds
 * @returns {number} Total seconds
 */
export const parseTimeToSeconds = (hours = 0, minutes = 0, seconds = 0) => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;

    return (h * 3600) + (m * 60) + s;
};

/**
 * Parse a duration string (MM:SS or HH:MM:SS) to seconds
 * @param {string} timeString - Time string to parse
 * @returns {number} Total seconds
 */
export const parseTimeString = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;

    const parts = timeString.split(':').map(p => parseInt(p, 10) || 0);

    if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    }

    return parseInt(timeString, 10) || 0;
};

/**
 * Get progress percentage
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const getProgressPercent = (current, total) => {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
};
