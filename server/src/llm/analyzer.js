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
    getTaskComplexityPrompt
} from './prompts/index.js';

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
                prompt = getDSAComplexityPrompt(quest);
                break;
            default:
                prompt = getTaskComplexityPrompt(quest);
        }

        const result = await geminiClient.generateJSON(prompt);

        if (result) {
            return {
                complexity: result.complexity || 'medium',
                xpReward: XP_REWARDS[result.complexity] || XP_REWARDS.medium,
                reasoning: result.reasoning || 'Analyzed by AI'
            };
        }

        return mockComplexityAnalysis(quest);
    } catch (error) {
        console.error('LLM analysis error:', error);
        return mockComplexityAnalysis(quest);
    }
}
