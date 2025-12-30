/**
 * Quest Complexity Analyzer
 * Analyzes quest difficulty using LLM or mock fallback
 */

import { geminiClient, USE_MOCK } from './client.js';
import { XP_REWARDS } from './constants.js';
import { mockComplexityAnalysis } from './mock.js';
import {
    getYouTubeComplexityPrompt,
    getDSAComplexityPrompt,
    getLeetCodeComplexityPrompt,
    getCodeforcesComplexityPrompt,
    getCSESComplexityPrompt,
    getTaskComplexityPrompt
} from './prompts/index.js';

/**
 * Get the appropriate DSA prompt based on platform
 * @param {Object} quest - The quest to analyze
 * @returns {string} - The prompt string
 */
function getDSAPromptForPlatform(quest) {
    const platform = quest.dsa?.platform?.toLowerCase() || 'other';

    switch (platform) {
        case 'leetcode':
            return getLeetCodeComplexityPrompt(quest);
        case 'codeforces':
            return getCodeforcesComplexityPrompt(quest);
        case 'cses':
            return getCSESComplexityPrompt(quest);
        default:
            return getDSAComplexityPrompt(quest);
    }
}

/**
 * Analyze quest complexity using LLM (or mock)
 * @param {Object} quest - The quest to analyze
 * @returns {Promise<{complexity: string, xpReward: number, reasoning: string}>}
 */
export async function analyzeQuestComplexity(quest) {
    if (USE_MOCK) {
        return mockComplexityAnalysis(quest);
    }

    try {
        // Get appropriate prompt based on quest type
        let prompt;
        switch (quest.type) {
            case 'youtube':
                prompt = getYouTubeComplexityPrompt(quest);
                break;
            case 'dsa':
                prompt = getDSAPromptForPlatform(quest);
                break;
            default:
                prompt = getTaskComplexityPrompt(quest);
        }

        const result = await geminiClient.generateJSON(prompt);

        if (result) {
            // Use LLM-assigned XP if provided, otherwise fall back to fixed values
            const xpReward = result.xpReward && typeof result.xpReward === 'number'
                ? Math.min(600, Math.max(50, result.xpReward))  // Clamp between 50-600
                : (XP_REWARDS[result.complexity] || XP_REWARDS.medium);

            // Build reasoning with difficulty rating if available
            let reasoning = result.reasoning || 'Analyzed by AI';
            if (result.difficultyRating !== undefined) {
                reasoning = `[${result.difficultyRating}/10] ${reasoning}`;
            }

            return {
                complexity: result.complexity || 'medium',
                xpReward: xpReward,
                reasoning: reasoning,
                difficultyRating: result.difficultyRating
            };
        }

        return mockComplexityAnalysis(quest);
    } catch (error) {
        console.error('LLM analysis error:', error);
        return mockComplexityAnalysis(quest);
    }
}
