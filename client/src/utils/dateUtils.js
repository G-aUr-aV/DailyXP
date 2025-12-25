/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateInput) => {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = date - now;
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    const absMinutes = Math.abs(diffMinutes);

    // Past dates
    if (diffMs < 0) {
        if (absDays >= 1) return `${absDays}d ago`;
        if (absHours >= 1) return `${absHours}h ago`;
        if (absMinutes >= 1) return `${absMinutes}m ago`;
        return 'just now';
    }

    // Future dates
    if (absDays >= 1) return `in ${absDays}d`;
    if (absHours >= 1) return `in ${absHours}h`;
    if (absMinutes >= 1) return `in ${absMinutes}m`;
    return 'now';
};

/**
 * Format a date as full human-readable string
 * @param {string|Date} dateInput - Date to format
 * @param {string} label - Optional label prefix
 * @returns {string} Full date string (e.g., "Wed, Dec 25, 2024, 1:30 PM")
 */
export const formatFullDate = (dateInput, label = '') => {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    const formatted = date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return label ? `${label}: ${formatted}` : formatted;
};

/**
 * Format a date for display in compact form
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Short date (e.g., "Dec 25")
 */
export const formatDisplayDate = (dateInput) => {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format a date for deadline display
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Deadline format (e.g., "Sun, Dec 29")
 */
export const formatDeadline = (dateInput) => {
    if (!dateInput) return '';

    const deadline = new Date(dateInput);
    return deadline.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Get the current week boundaries (Monday to Sunday)
 * @param {Date} referenceDate - Date to base the week on (defaults to now)
 * @returns {{ start: Date, end: Date }} Week start and end dates
 */
export const getWeekBoundaries = (referenceDate = new Date()) => {
    const current = new Date(referenceDate);
    const day = current.getDay();

    // Get Monday (start of week)
    const monday = new Date(current);
    monday.setDate(current.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    // Get Sunday (end of week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
};

/**
 * Get the coming Sunday from today
 * @returns {string} ISO date string for coming Sunday
 */
export const getComingSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;

    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    sunday.setHours(23, 59, 59, 999);

    return sunday.toISOString().split('T')[0];
};

/**
 * Check if a date falls within any of the provided date ranges
 * @param {string|Date} dateInput - Date to check
 * @param {Array<{from: string, to: string}>} ranges - Array of date ranges
 * @returns {boolean} True if date is in any range
 */
export const isInDateRange = (dateInput, ranges) => {
    if (!dateInput || !ranges || ranges.length === 0) return true;

    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    const dateMs = date.getTime();

    return ranges.some(range => {
        const from = new Date(range.from);
        from.setHours(0, 0, 0, 0);

        const to = new Date(range.to);
        to.setHours(23, 59, 59, 999);

        return dateMs >= from.getTime() && dateMs <= to.getTime();
    });
};

/**
 * Get days remaining until a deadline
 * @param {string|Date} deadline - The deadline date
 * @returns {number} Days remaining (negative if past)
 */
export const getDaysRemaining = (deadline) => {
    if (!deadline) return 0;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;

    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get date presets for quick filtering
 * @returns {Array<{label: string, from: string, to: string}>}
 */
export const getDatePresets = () => {
    const today = new Date().toISOString().split('T')[0];
    const { start: weekStart, end: weekEnd } = getWeekBoundaries();

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    return [
        { label: 'Today', from: today, to: today },
        {
            label: 'This Week',
            from: weekStart.toISOString().split('T')[0],
            to: weekEnd.toISOString().split('T')[0]
        },
        {
            label: 'This Month',
            from: monthStart.toISOString().split('T')[0],
            to: monthEnd.toISOString().split('T')[0]
        }
    ];
};
