/**
 * Codeforces Service
 * Fetches problem details from Codeforces API
 */

import * as cheerio from 'cheerio';

/**
 * Extract contest ID and problem index from Codeforces URL
 * @param {string} url - Codeforces problem URL
 * @returns {Object|null} - { contestId, problemIndex } or null
 */
export function extractCodeforcesProblemInfo(url) {
    if (!url) return null;

    // Handle various Codeforces URL formats:
    // https://codeforces.com/problemset/problem/1/A
    // https://codeforces.com/contest/1/problem/A
    // https://codeforces.com/gym/100001/problem/A
    // https://codeforces.com/edu/course/2/lesson/7/1/practice/contest/289390/problem/C

    // Format: /problemset/problem/{contestId}/{index}
    let match = url.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z]\d?)/i);
    if (match) {
        return { contestId: match[1], problemIndex: match[2].toUpperCase() };
    }

    // Format: /contest/{contestId}/problem/{index}
    match = url.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z]\d?)/i);
    if (match) {
        return { contestId: match[1], problemIndex: match[2].toUpperCase() };
    }

    // Format: /gym/{gymId}/problem/{index}
    match = url.match(/codeforces\.com\/gym\/(\d+)\/problem\/([A-Za-z]\d?)/i);
    if (match) {
        return { contestId: match[1], problemIndex: match[2].toUpperCase(), isGym: true };
    }

    // Format: /edu/course/.../contest/{contestId}/problem/{index} (EDU courses)
    match = url.match(/codeforces\.com\/edu\/.*\/contest\/(\d+)\/problem\/([A-Za-z]\d?)/i);
    if (match) {
        return { contestId: match[1], problemIndex: match[2].toUpperCase(), isEdu: true };
    }

    return null;
}

/**
 * Fetch problem details from Codeforces API
 * @param {string} contestId - Contest ID
 * @param {string} problemIndex - Problem index (A, B, C, etc.)
 * @param {boolean} isEdu - Whether this is an EDU contest
 * @param {string} originalUrl - Original URL for EDU scraping
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCodeforcesProblem(contestId, problemIndex, isEdu = false, originalUrl = null) {
    if (!contestId || !problemIndex) return null;

    let problem = null;
    let apiSuccess = false;

    // Try API first (won't work for EDU contests)
    if (!isEdu) {
        try {
            const response = await fetch(
                `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`
            );

            if (response.ok) {
                const data = await response.json();

                if (data.status === 'OK' && data.result?.problems) {
                    problem = data.result.problems.find(
                        p => p.index.toUpperCase() === problemIndex.toUpperCase()
                    );
                    if (problem) {
                        apiSuccess = true;
                        console.log(`[CF API] Found problem: ${problem.name}`);
                    }
                }
            }
        } catch (err) {
            console.log('[CF API] API failed, will try scraping:', err.message);
        }
    }

    // Map Codeforces rating to difficulty
    const getDifficulty = (rating) => {
        if (!rating) return 'unknown';
        if (rating <= 1200) return 'easy';
        if (rating <= 1600) return 'medium';
        if (rating <= 2100) return 'hard';
        return 'epic';
    };

    let description = '';
    let constraints = '';
    let scrapedTitle = '';

    // Scrape problem page for description and constraints
    try {
        // For EDU, use original URL; otherwise construct standard URL
        const pageUrl = isEdu && originalUrl ? originalUrl : `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;
        console.log(`[CF Scraper] Fetching: ${pageUrl}`);
        const pageResponse = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Linux"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            }
        });

        if (pageResponse.ok) {
            const html = await pageResponse.text();

            // Use Cheerio to parse HTML correctly
            const $ = cheerio.load(html);
            const $ps = $('.problem-statement');

            if ($ps.length > 0) {
                console.log('[CF Scraper] Found problem-statement via Cheerio');

                // Extract title from header for fallback
                const $header = $ps.find('.header');
                scrapedTitle = $header.find('.title').text().trim();

                // 1. Extract Constraints from Header
                const timeLimit = $header.find('.time-limit').text().replace('time limit per test', '').trim();
                const memoryLimit = $header.find('.memory-limit').text().replace('memory limit per test', '').trim();

                let inputSpec = '';
                const $input = $ps.find('.input-specification');
                if ($input.length > 0) {
                    const $inputClone = $input.clone();
                    $inputClone.find('.section-title').remove();
                    inputSpec = $inputClone.text().replace(/\s+/g, ' ').trim();
                }

                constraints = `Time: ${timeLimit}\nMemory: ${memoryLimit}\n\nInput Constraints:\n${inputSpec}`.trim();

                // 2. Prepare Description
                const $desc = $ps.clone();

                // Remove header, input/output specs, sample tests, note
                $desc.find('.header').remove();
                $desc.find('.input-specification').remove();
                $desc.find('.output-specification').remove();
                $desc.find('.sample-tests').remove();
                $desc.find('.note').remove();

                // 3. Process MathJax for LLM-friendly text
                $desc.find('script[type="math/tex"]').each((i, el) => {
                    const latex = $(el).text();
                    $(el).replaceWith(`$${latex}$`);
                });
                $desc.find('.MathJax_Preview').remove();
                $desc.find('.MathJax').remove();
                $desc.find('.MJX_Assistive_MathML').remove();

                // Clean text
                description = $desc.text().replace(/\s+/g, ' ').trim();
            } else {
                console.log('[CF Scraper] problem-statement NOT found by Cheerio');
            }
        } else {
            console.log(`[CF Scraper] Request failed with status: ${pageResponse.status} ${pageResponse.statusText}`);
            if (pageResponse.status === 403 || pageResponse.status === 503) {
                console.log('[CF Scraper] Likely blocked by Cloudflare or anti-bot.');
            }
        }
    } catch (scrapeErr) {
        console.error('Error scraping Codeforces page:', scrapeErr.message);
        // Continue with empty description
    }

    // Return result - use API data if available, fallback to scraped data
    return {
        id: `${contestId}${problemIndex}`,
        title: problem?.name || scrapedTitle || `Problem ${problemIndex}`,
        contestId: problem?.contestId || parseInt(contestId),
        index: problem?.index || problemIndex,
        rating: problem?.rating || null,
        difficulty: getDifficulty(problem?.rating),
        topics: problem?.tags || [],
        description: description || '',
        constraints: constraints || '',
        url: originalUrl || `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`
    };
}

/**
 * Fetch problem from URL
 * @param {string} url - Codeforces problem URL
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCodeforcesProblemFromUrl(url) {
    const info = extractCodeforcesProblemInfo(url);
    if (!info) {
        console.error('Invalid Codeforces URL:', url);
        return null;
    }
    return fetchCodeforcesProblem(info.contestId, info.problemIndex, info.isEdu || false, url);
}
