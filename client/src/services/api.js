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

export default {
    quest: questAPI,
    videoProgress: videoProgressAPI,
    stats: statsAPI,
    llm: llmAPI,
};
