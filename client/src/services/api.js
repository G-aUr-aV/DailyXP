const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Quest API
export const questAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/quests${query ? `?${query}` : ''}`);
    },

    getDashboard: () => fetchAPI('/quests/dashboard'),

    getById: (id) => fetchAPI(`/quests/${id}`),

    create: (data) => fetchAPI('/quests', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchAPI(`/quests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    complete: (id) => fetchAPI(`/quests/${id}/complete`, {
        method: 'PUT',
    }),

    delete: (id) => fetchAPI(`/quests/${id}`, {
        method: 'DELETE',
    }),

    processSpillage: () => fetchAPI('/quests/process-spillage', {
        method: 'POST',
    }),

    // Timer controls
    timerStart: (id) => fetchAPI(`/quests/${id}/timer/start`, { method: 'PUT' }),
    timerPause: (id, data = {}) => fetchAPI(`/quests/${id}/timer/pause`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    timerReset: (id) => fetchAPI(`/quests/${id}/timer/reset`, { method: 'PUT' }),
    timerSync: (id, currentTime) => fetchAPI(`/quests/${id}/timer/sync`, {
        method: 'PUT',
        body: JSON.stringify({ currentTime }),
    }),

    // Analysis retry
    retryAnalysis: (id) => fetchAPI(`/quests/${id}/retry-analysis`, {
        method: 'POST',
    }),
};

// Video Progress API
export const videoProgressAPI = {
    save: (questId, data) => fetchAPI(`/video-progress/${questId}`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getHistory: (questId) => fetchAPI(`/video-progress/${questId}`),

    getLatest: (questId) => fetchAPI(`/video-progress/${questId}/latest`),

    getTimeline: (questId) => fetchAPI(`/video-progress/${questId}/timeline`),
};

// Stats API
export const statsAPI = {
    get: () => fetchAPI('/stats'),

    getAchievements: () => fetchAPI('/stats/achievements'),

    checkAchievements: () => fetchAPI('/stats/check-achievements', {
        method: 'POST',
    }),

    levelUp: () => fetchAPI('/stats/levelup', {
        method: 'POST',
    }),
};

// LLM API
export const llmAPI = {
    getStatus: () => fetchAPI('/llm/status'),

    analyzeQuest: (questId) => fetchAPI(`/llm/analyze/${questId}`, {
        method: 'POST',
    }),

    generateDailyEmail: () => fetchAPI('/llm/daily-email', {
        method: 'POST',
    }),
};

// Gear Collection & Lootbox API
export const gearAPI = {
    get: () => fetchAPI('/gear'),

    getPool: () => fetchAPI('/gear/pool'),

    openChest: () => fetchAPI('/gear/open-chest', {
        method: 'POST',
    }),

    equip: (rarity) => fetchAPI('/gear/equip', {
        method: 'POST',
        body: JSON.stringify({ rarity }),
    }),

    awardKeys: (amount, reason) => fetchAPI('/gear/award-keys', {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
    }),

    checkMilestones: () => fetchAPI('/gear/check-milestones', {
        method: 'POST',
    }),
};

// Ritual API
export const ritualAPI = {
    getAll: () => fetchAPI('/rituals'),

    getById: (id) => fetchAPI(`/rituals/${id}`),

    create: (data) => fetchAPI('/rituals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id, data) => fetchAPI(`/rituals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchAPI(`/rituals/${id}`, {
        method: 'DELETE',
    }),

    getHistory: (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/rituals/${id}/history${query ? `?${query}` : ''}`);
    },

    generateToday: (id) => fetchAPI(`/rituals/${id}/generate`, {
        method: 'POST',
    }),

    generateAll: () => fetchAPI('/rituals/generate-daily', {
        method: 'POST',
    }),
};

export default {
    quest: questAPI,
    videoProgress: videoProgressAPI,
    stats: statsAPI,
    llm: llmAPI,
    gear: gearAPI,
    ritual: ritualAPI,
};

