/**
 * LLM Client - Provider Switcher
 * Supports multiple LLM providers (Gemini, Cerebras)
 * Set LLM_PROVIDER in .env to switch: 'gemini' or 'cerebras'
 */

import dotenv from 'dotenv';
dotenv.config();

// Import providers
import { GeminiClient, testGeminiConnection, USE_MOCK as GEMINI_MOCK } from './providers/gemini.js';
import { CerebrasClient, testCerebrasConnection, USE_MOCK as CEREBRAS_MOCK } from './providers/cerebras.js';

// Get provider from env (default to cerebras)
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'cerebras';

/**
 * Get the appropriate client based on LLM_PROVIDER
 */
function getClient() {
    switch (LLM_PROVIDER.toLowerCase()) {
        case 'gemini':
            return new GeminiClient();
        case 'cerebras':
        default:
            return new CerebrasClient();
    }
}

/**
 * Check if running in mock mode
 */
export const USE_MOCK = LLM_PROVIDER.toLowerCase() === 'gemini' ? GEMINI_MOCK : CEREBRAS_MOCK;

// Export singleton client instance
export const geminiClient = getClient(); // Keep old name for backward compatibility
export const llmClient = getClient();    // New generic name

// Re-export client classes for direct use if needed
export { GeminiClient } from './providers/gemini.js';
export { CerebrasClient } from './providers/cerebras.js';

/**
 * Test LLM connection status
 */
export async function testLLMConnection() {
    console.log(`🤖 LLM Provider: ${LLM_PROVIDER}`);

    switch (LLM_PROVIDER.toLowerCase()) {
        case 'gemini':
            return testGeminiConnection();
        case 'cerebras':
        default:
            return testCerebrasConnection();
    }
}
