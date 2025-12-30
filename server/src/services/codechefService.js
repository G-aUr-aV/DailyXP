/**
 * CodeChef Service
 * Fetches problem details from CodeChef
 * Note: CodeChef has a public API but we'll scrape for better data
 */

import * as cheerio from 'cheerio';

/**
 * Extract problem code from CodeChef URL
 * @param {string} url - CodeChef problem URL
 * @returns {string|null} - Problem code or null
 */
export function extractCodeChefProblemCode(url) {
    if (!url) return null;

    // Handle various CodeChef URL formats:
    // https://www.codechef.com/problems/FLOW001
    // https://www.codechef.com/submit/FLOW001
    // https://www.codechef.com/PRACTICE/problems/FLOW001
    // https://www.codechef.com/START123/problems/FLOW001

    // Format: /problems/{code}
    let match = url.match(/codechef\.com\/(?:problems|submit)\/([A-Za-z0-9_]+)/i);
    if (match) {
        return match[1].toUpperCase();
    }

    // Format: /{contest}/problems/{code}
    match = url.match(/codechef\.com\/[A-Za-z0-9_]+\/problems\/([A-Za-z0-9_]+)/i);
    if (match) {
        return match[1].toUpperCase();
    }

    return null;
}

/**
 * Fetch problem details from CodeChef
 * @param {string} problemCode - CodeChef problem code (e.g., FLOW001)
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCodeChefProblem(problemCode) {
    if (!problemCode) {
        console.error('No problem code provided');
        return null;
    }

    try {
        // Use CodeChef's API to get problem details
        const apiUrl = `https://www.codechef.com/api/contests/PRACTICE/problems/${problemCode}`;
        console.log(`[CodeChef API] Fetching: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`[CodeChef API] Error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || data.status === 'error') {
            console.error('[CodeChef API] Problem not found');
            return null;
        }

        // Extract title from problem_name
        const title = data.problem_name || problemCode;

        // Extract difficulty rating (e.g., "2324")
        let difficultyRating = null;
        let difficulty = 'unknown';

        if (data.difficulty_rating) {
            difficultyRating = parseInt(data.difficulty_rating);
            console.log(`[CodeChef API] Difficulty rating: ${difficultyRating}`);

            // Map rating to difficulty category
            if (difficultyRating < 1000) {
                difficulty = 'easy';
            } else if (difficultyRating < 1400) {
                difficulty = 'easy';
            } else if (difficultyRating < 1800) {
                difficulty = 'medium';
            } else if (difficultyRating < 2200) {
                difficulty = 'hard';
            } else {
                difficulty = 'epic';
            }
        }

        // Extract description from body or problemComponents.statement
        let description = '';
        if (data.problemComponents?.statement) {
            // Clean HTML from statement
            description = data.problemComponents.statement
                .replace(/<[^>]+>/g, ' ')
                .replace(/\\r\\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        } else if (data.body) {
            description = data.body
                .replace(/<[^>]+>/g, ' ')
                .replace(/\\r\\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Extract tags
        const tags = [];
        if (data.user_tags && Array.isArray(data.user_tags)) {
            tags.push(...data.user_tags);
        }
        if (data.computed_tags && Array.isArray(data.computed_tags)) {
            tags.push(...data.computed_tags);
        }

        // Extract constraints
        let constraints = '';
        if (data.problemComponents?.constraints) {
            constraints = data.problemComponents.constraints
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        console.log(`[CodeChef API] Found: ${title} (Rating: ${difficultyRating}, Difficulty: ${difficulty})`);

        return {
            id: problemCode,
            title: title,
            difficulty: difficulty,
            rating: difficultyRating,
            description: description.slice(0, 2000),
            topics: [...new Set(tags)].slice(0, 10), // Deduplicate and limit
            constraints: constraints,
            url: `https://www.codechef.com/problems/${problemCode}`
        };
    } catch (error) {
        console.error('[CodeChef API] Error fetching problem:', error.message);
        return null;
    }
}

/**
 * Fetch problem from URL
 * @param {string} url - CodeChef problem URL
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCodeChefProblemFromUrl(url) {
    const problemCode = extractCodeChefProblemCode(url);
    if (!problemCode) {
        console.error('Invalid CodeChef URL:', url);
        return null;
    }
    return fetchCodeChefProblem(problemCode);
}
