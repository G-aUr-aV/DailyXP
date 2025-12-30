/**
 * Cerebras API Client
 * Handles all communication with the Cerebras Inference API
 * High-speed inference with better rate limits than Gemini free tier
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk';
import dotenv from 'dotenv';
dotenv.config();

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'llama-4-scout-17b-16e-instruct';
const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE) || 0;

export const USE_MOCK = !CEREBRAS_API_KEY || CEREBRAS_API_KEY === 'your-cerebras-api-key-here';

/**
 * Cerebras API Client class
 */
export class CerebrasClient {
    constructor() {
        this.apiKey = CEREBRAS_API_KEY;
        this.model = CEREBRAS_MODEL;
        this.client = new Cerebras({ apiKey: this.apiKey });
    }

    /**
     * Generate content from a prompt
     * @param {string} prompt - The prompt to send
     * @returns {Promise<string>} - The generated text response
     */
    async generateContent(prompt) {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                max_completion_tokens: 2048,
                temperature: LLM_TEMPERATURE,
                top_p: 1,
                stream: false
            });

            return completion.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Cerebras API error:', error.message || error);
            throw new Error(`Cerebras API error: ${error.status || error.message}`);
        }
    }

    /**
     * Generate content and parse JSON response
     * @param {string} prompt - The prompt expecting JSON response
     * @returns {Promise<object|null>} - Parsed JSON or null
     */
    async generateJSON(prompt) {
        try {
            const text = await this.generateContent(prompt);
            if (!text) return null;

            // Remove markdown code blocks if present
            let cleanText = text.replace(/```json\n?|\n?```/g, '').replace(/```\n?|\n?```/g, '');

            // Find the JSON object string
            const start = cleanText.indexOf('{');
            const end = cleanText.lastIndexOf('}');

            if (start !== -1 && end !== -1) {
                cleanText = cleanText.substring(start, end + 1);
                return JSON.parse(cleanText);
            }

            console.error('Failed to parse JSON from LLM response:', text);
            return null;
        } catch (error) {
            console.error('LLM JSON parsing error:', error);
            return null;
        }
    }
}

/**
 * Test Cerebras connection status
 */
export async function testCerebrasConnection() {
    if (USE_MOCK) {
        return {
            status: 'mock',
            message: 'Running in mock mode. Set CEREBRAS_API_KEY for real analysis.',
            connected: false
        };
    }

    try {
        const client = new CerebrasClient();
        await client.generateContent('Say "connected" and nothing else.');
        return { status: 'connected', message: 'Cerebras API connected', connected: true };
    } catch (error) {
        return { status: 'error', message: error.message, connected: false };
    }
}
