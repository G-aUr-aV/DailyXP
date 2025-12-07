/**
 * LLM Service - Main export file
 * Modular structure for better maintainability
 */

export { GeminiClient, testLLMConnection } from './client.js';
export { analyzeQuestComplexity } from './analyzer.js';
export { generateDailyEmail } from './emailGenerator.js';
export { XP_REWARDS } from './constants.js';

// Default export for backward compatibility
import { analyzeQuestComplexity } from './analyzer.js';
import { generateDailyEmail } from './emailGenerator.js';
import { testLLMConnection } from './client.js';

export default {
    analyzeQuestComplexity,
    generateDailyEmail,
    testLLMConnection
};
