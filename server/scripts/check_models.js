import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');

// Simple dotenv parser since we might not have dotenv package available in this script scope comfortably without node_modules hassle
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('No API key found in .env!');
    process.exit(1);
}

console.log(`Checking models with key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error('API Error:', JSON.stringify(data.error, null, 2));
    } else if (data.models) {
        console.log('\nAvailable Gemini Models:');
        data.models
            .filter(m => m.name.includes('gemini'))
            .forEach(m => {
                console.log(`\nID: ${m.name}`);
                console.log(`Name: ${m.displayName}`);
                console.log(`Methods: ${m.supportedGenerationMethods.join(', ')}`);
            });
    } else {
        console.log('Unexpected response:', data);
    }
} catch (error) {
    console.error('Network Error:', error.message);
}
