/**
 * Daily Email Generator
 * Generates motivational daily emails using LLM
 */

import { geminiClient, USE_MOCK } from './client.js';
import { mockDailyEmail } from './mock.js';
import { getDailyEmailPrompt } from './prompts/index.js';

/**
 * Generate daily email content with trainer persona
 * @param {Object} stats - User stats
 * @param {Array} pendingQuests - List of pending quests
 * @returns {Promise<{subject: string, body: string}>}
 */
export async function generateDailyEmail(stats, pendingQuests) {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    if (USE_MOCK) {
        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    }

    try {
        const prompt = getDailyEmailPrompt(stats, pendingQuests, dayOfWeek);
        const result = await geminiClient.generateJSON(prompt);

        if (result) {
            return result;
        }

        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    } catch (error) {
        console.error('Email generation error:', error);
        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    }
}
