/**
 * CSES Service
 * Fetches problem details from CSES (Code Submission Evaluation System)
 * Note: CSES doesn't have a public API, so we scrape basic info from the page
 */

/**
 * Extract problem ID from CSES URL
 * @param {string} url - CSES problem URL
 * @returns {string|null} - Problem ID or null
 */
export function extractCSESProblemId(url) {
    if (!url) return null;

    // Handle CSES URL format:
    // https://cses.fi/problemset/task/1068
    // https://cses.fi/problemset/task/1068/
    const match = url.match(/cses\.fi\/problemset\/task\/(\d+)/i);
    return match ? match[1] : null;
}

/**
 * Fetch problem details from CSES
 * @param {string} problemId - CSES problem ID
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCSESProblem(problemId) {
    if (!problemId) return null;

    try {
        const response = await fetch(`https://cses.fi/problemset/task/${problemId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.error(`CSES fetch error: ${response.status}`);
            return null;
        }

        const html = await response.text();

        // Extract title from page
        // Look for h1 inside title-block
        const titleMatch = html.match(/<div class="title-block">[\s\S]*?<h1>([^<]+)<\/h1>/);
        const title = titleMatch ? titleMatch[1].trim() : null;

        if (!title) {
            console.error('Could not extract CSES problem title');
            return null;
        }

        // Try to extract time/memory limits
        // <li><b>Time limit:</b> 1.00 s</li>
        const timeLimitMatch = html.match(/Time limit:<\/b>\s*([\d.]+)\s*s/i);
        const timeLimit = timeLimitMatch ? parseFloat(timeLimitMatch[1]) : null;

        // Extract Topic/Category from sidebar
        // <div class="nav sidebar"><h4>String Algorithms</h4>
        const categoryMatch = html.match(/<div class="nav sidebar">\s*<h4>([^<]+)<\/h4>/);
        const category = categoryMatch ? categoryMatch[1].trim() : null;

        // Extract Description
        // Content is in <div class="md">...</div>
        // Content is in <div class="md">...</div>
        let description = '';
        let constraintsText = '';
        const mdContentMatch = html.match(/<div class="md">([\s\S]*?)<\/div>/);

        if (mdContentMatch) {
            let mdContent = mdContentMatch[1];

            // Extract Constraints if available
            // Look for h1 with id="constraints" and get content until next h1 or end
            const constraintsMatch = mdContent.match(/<h1 id="constraints">Constraints<\/h1>([\s\S]*?)(<h1|$)/i);
            if (constraintsMatch) {
                constraintsText = constraintsMatch[1]
                    .replace(/<span class="math[^"]*">([^<]+)<\/span>/g, '$1')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\\le/g, '<=')
                    .replace(/\\ge/g, '>=')
                    .replace(/\\cdot/g, '*')
                    .replace(/\\times/g, 'x')
                    .trim()
                    .replace(/\s+/g, ' ');
            }

            // Remove headers like "Input", "Output" and "Constraints" to keep just the problem statement
            const inputIndex = mdContent.indexOf('<h1');
            if (inputIndex !== -1) {
                mdContent = mdContent.substring(0, inputIndex);
            }

            // Convert paragraph tags to newlines
            mdContent = mdContent.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');

            // Strip remaining HTML tags
            description = mdContent.replace(/<[^>]+>/g, '').trim();

            // Decode HTML entities and Latex in description too
            description = description
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\\le/g, '<=')
                .replace(/\\ge/g, '>=')
                .replace(/\\cdot/g, '*')
                .replace(/\\times/g, 'x');

            // Do NOT append constraints to description logic here as per user request
            // We return it separately
        }

        return {
            id: problemId,
            title: title,
            difficulty: null,
            topics: category ? [category] : [],
            description: description || '',
            constraints: constraintsText || '', // Return separately
            url: `https://cses.fi/problemset/task/${problemId}`,
            timeLimit: timeLimit
        };
    } catch (error) {
        console.error('Error fetching CSES problem:', error.message);
        return null;
    }
}

/**
 * Fetch problem from URL
 * @param {string} url - CSES problem URL
 * @returns {Object|null} - Problem details or null
 */
export async function fetchCSESProblemFromUrl(url) {
    const problemId = extractCSESProblemId(url);
    if (!problemId) {
        console.error('Invalid CSES URL:', url);
        return null;
    }
    return fetchCSESProblem(problemId);
}
