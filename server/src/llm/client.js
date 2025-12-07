/**
 * Gemini API Client
 * Handles all communication with the Gemini API
 */

import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const USE_MOCK = !GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here';

/**
 * Gemini API Client class
 */
export class GeminiClient {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        this.model = GEMINI_MODEL;
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Generate content from a prompt
     * @param {string} prompt - The prompt to send
     * @returns {Promise<string>} - The generated text response
     */
    async generateContent(prompt) {
        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * Generate content and parse JSON response
     * @param {string} prompt - The prompt expecting JSON response
     * @returns {Promise<object|null>} - Parsed JSON or null
     */
    async generateJSON(prompt) {
        const text = await this.generateContent(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    }
}

// Singleton instance
export const geminiClient = new GeminiClient();

/**
 * Test LLM connection status
 */
export async function testLLMConnection() {
    if (USE_MOCK) {
        return {
            status: 'mock',
            message: 'Running in mock mode. Set GEMINI_API_KEY for real analysis.',
            connected: false
        };
    }

    try {
        const client = new GeminiClient();
        await client.generateContent('Say "connected" and nothing else.');
        return { status: 'connected', message: 'Gemini API connected', connected: true };
    } catch (error) {
        return { status: 'error', message: error.message, connected: false };
    }
}
