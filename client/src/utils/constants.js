/**
 * Application-wide constants and configuration
 */

// Quest Types
export const QUEST_TYPES = {
    YOUTUBE: 'youtube',
    DSA: 'dsa',
    TASK: 'task'
};

export const QUEST_TYPE_CONFIG = {
    [QUEST_TYPES.YOUTUBE]: {
        icon: '📺',
        label: 'YouTube',
        color: '#ff7b54',
        gradient: 'linear-gradient(135deg, #ff9966, #ff5e62)'
    },
    [QUEST_TYPES.DSA]: {
        icon: '💻',
        label: 'DSA',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)'
    },
    [QUEST_TYPES.TASK]: {
        icon: '📋',
        label: 'Task',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)'
    }
};

// Quest Status
export const QUEST_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed'
};

export const QUEST_STATUS_CONFIG = {
    [QUEST_STATUS.ACTIVE]: {
        icon: '⚡',
        label: 'Active',
        color: null // Uses default gradient
    },
    [QUEST_STATUS.COMPLETED]: {
        icon: '✅',
        label: 'Done',
        color: '#22c55e'
    }
};

// Quest Complexity
export const QUEST_COMPLEXITY = {
    TRIVIAL: 'trivial',
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EPIC: 'epic'
};

export const QUEST_COMPLEXITY_CONFIG = {
    [QUEST_COMPLEXITY.TRIVIAL]: {
        label: 'Trivial',
        color: '#64748b',
        xpMultiplier: 0.5,
        description: 'Quick task, minimal effort'
    },
    [QUEST_COMPLEXITY.EASY]: {
        label: 'Easy',
        color: '#22c55e',
        xpMultiplier: 1,
        description: 'Straightforward task'
    },
    [QUEST_COMPLEXITY.MEDIUM]: {
        label: 'Medium',
        color: '#eab308',
        xpMultiplier: 1.5,
        description: 'Moderate effort required'
    },
    [QUEST_COMPLEXITY.HARD]: {
        label: 'Hard',
        color: '#f97316',
        xpMultiplier: 2,
        description: 'Significant challenge'
    },
    [QUEST_COMPLEXITY.EPIC]: {
        label: 'Epic',
        color: '#ef4444',
        xpMultiplier: 3,
        description: 'Major undertaking'
    }
};

// DSA Platforms
export const DSA_PLATFORMS = {
    LEETCODE: 'leetcode',
    CODEFORCES: 'codeforces',
    HACKERRANK: 'hackerrank',
    CODECHEF: 'codechef',
    GFG: 'geeksforgeeks',
    OTHER: 'other'
};

export const DSA_PLATFORM_CONFIG = {
    [DSA_PLATFORMS.LEETCODE]: {
        label: 'LeetCode',
        icon: '🔸',
        color: '#ffa116'
    },
    [DSA_PLATFORMS.CODEFORCES]: {
        label: 'Codeforces',
        icon: '🔵',
        color: '#1890ff'
    },
    [DSA_PLATFORMS.HACKERRANK]: {
        label: 'HackerRank',
        icon: '🟢',
        color: '#2ec866'
    },
    [DSA_PLATFORMS.CODECHEF]: {
        label: 'CodeChef',
        icon: '🟤',
        color: '#5b4638'
    },
    [DSA_PLATFORMS.GFG]: {
        label: 'GeeksforGeeks',
        icon: '🟢',
        color: '#2f8d46'
    },
    [DSA_PLATFORMS.OTHER]: {
        label: 'Other',
        icon: '📝',
        color: '#64748b'
    }
};

// DSA Difficulty
export const DSA_DIFFICULTY = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
};

export const DSA_DIFFICULTY_CONFIG = {
    [DSA_DIFFICULTY.EASY]: {
        color: '#22c55e',
        label: 'Easy'
    },
    [DSA_DIFFICULTY.MEDIUM]: {
        color: '#eab308',
        label: 'Medium'
    },
    [DSA_DIFFICULTY.HARD]: {
        color: '#ef4444',
        label: 'Hard'
    }
};

// Filter Options
export const STATUS_FILTER_OPTIONS = [
    { value: 'all', icon: '🌐', label: 'All' },
    { value: 'active', icon: '⚡', label: 'Active' },
    { value: 'completed', icon: '✅', label: 'Done' },
    { value: 'spilled', icon: '🔄', label: 'Spilled', color: '#ef4444', isSpilledToggle: true }
];

export const TYPE_FILTER_OPTIONS = [
    { value: 'all', icon: '🌐', label: 'All', color: '#64748b' },
    { value: QUEST_TYPES.YOUTUBE, icon: '📺', label: 'YouTube', color: '#ff7b54' },
    { value: QUEST_TYPES.DSA, icon: '💻', label: 'DSA', color: '#8b5cf6' },
    { value: QUEST_TYPES.TASK, icon: '📋', label: 'Task', color: '#3b82f6' }
];

export const DATE_FIELD_OPTIONS = [
    { value: 'deadline', icon: '📅', label: 'Deadline' },
    { value: 'createdAt', icon: '🆕', label: 'Created' },
    { value: 'completedAt', icon: '✅', label: 'Completed' }
];

// Default Filter Values
export const DEFAULT_FILTERS = {
    status: 'all',
    type: 'all',
    platform: 'all',
    spilled: false,
    dateField: 'deadline',
    dateRanges: []
};

export const DEFAULT_DASHBOARD_FILTERS = {
    status: 'active',
    type: 'all',
    spilled: false,
    dateField: 'deadline',
    dateRanges: []
};

// Timer Defaults
export const TIMER_DEFAULTS = {
    DEFAULT_ALARM_DURATION: 30 * 60, // 30 minutes in seconds
    MIN_ALARM_DURATION: 60, // 1 minute
    MAX_ALARM_DURATION: 4 * 60 * 60, // 4 hours
    CHIME_DURATION: 500, // milliseconds
    CHIME_INTERVAL: 3000 // milliseconds between chimes
};

// UI Constants
export const UI_CONSTANTS = {
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    PROGRESS_SAVE_INTERVAL: 10000 // 10 seconds
};

// API Endpoints (for reference)
export const API_ENDPOINTS = {
    QUESTS: '/api/quests',
    STATS: '/api/stats',
    VIDEO_PROGRESS: '/api/video-progress'
};
