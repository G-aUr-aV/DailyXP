/**
 * DSA Service - Unified DSA platform fetching service
 * Detects platform from URL and fetches problem details
 */

import { fetchLeetCodeProblemFromUrl } from './leetcodeService.js';
import { fetchCodeforcesProblemFromUrl } from './codeforcesService.js';
import { fetchCSESProblemFromUrl } from './csesService.js';

/**
 * Detect DSA platform from URL
 * @param {string} url - Problem URL
 * @returns {string} - Platform name: 'leetcode', 'codeforces', 'cses', or 'unknown'
 */
export function detectPlatform(url) {
    if (!url) return 'unknown';

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('leetcode.com') || lowerUrl.includes('leetcode.cn')) {
        return 'leetcode';
    }
    if (lowerUrl.includes('codeforces.com')) {
        return 'codeforces';
    }
    if (lowerUrl.includes('cses.fi')) {
        return 'cses';
    }

    return 'unknown';
}

/**
 * Fetch problem details from any supported DSA platform
 * @param {string} url - Problem URL
 * @returns {Object|null} - Problem details with standardized format, or null
 */
export async function fetchDSAProblem(url) {
    const platform = detectPlatform(url);

    let problemDetails = null;

    switch (platform) {
        case 'leetcode':
            problemDetails = await fetchLeetCodeProblemFromUrl(url);
            break;
        case 'codeforces':
            problemDetails = await fetchCodeforcesProblemFromUrl(url);
            break;
        case 'cses':
            problemDetails = await fetchCSESProblemFromUrl(url);
            break;
        default:
            return null;
    }

    if (!problemDetails) return null;

    // Return standardized format
    return {
        platform,
        id: problemDetails.id,
        title: problemDetails.title,
        difficulty: problemDetails.difficulty || 'unknown',
        description: problemDetails.description || '',
        topics: problemDetails.topics || [],
        url: problemDetails.url || url,
        rating: problemDetails.rating, // For Codeforces
        constraints: problemDetails.constraints // For CSES (or others)
    };
}
