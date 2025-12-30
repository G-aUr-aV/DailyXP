/**
 * LeetCode Service
 * Fetches problem details from LeetCode using their GraphQL API
 */

/**
 * Extract problem slug from LeetCode URL
 * @param {string} url - LeetCode problem URL
 * @returns {string|null} - Problem slug or null if invalid
 */
export function extractLeetCodeSlug(url) {
    if (!url) return null;

    // Handle various LeetCode URL formats:
    // https://leetcode.com/problems/two-sum/
    // https://leetcode.com/problems/two-sum
    // https://leetcode.com/problems/two-sum/description/
    // https://leetcode.cn/problems/two-sum/
    const match = url.match(/leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
}

/**
 * Fetch problem details from LeetCode GraphQL API
 * @param {string} slug - Problem slug (e.g., "two-sum")
 * @returns {Object|null} - Problem details or null if failed
 */
export async function fetchLeetCodeProblem(slug) {
    if (!slug) return null;

    const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        content
        difficulty
        topicTags {
          name
          slug
        }
        stats
        hints
        similarQuestions
      }
    }
  `;

    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': `https://leetcode.com/problems/${slug}/`,
                'Origin': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: { titleSlug: slug }
            })
        });

        if (!response.ok) {
            console.error(`LeetCode API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.errors || !data.data?.question) {
            console.error('LeetCode API response error:', data.errors);
            return null;
        }

        const question = data.data.question;

        // Clean HTML content to plain text for description
        // Parse description and constraints from HTML content
        let description = '';
        let constraints = '';

        if (question.content) {
            // Try to split on "Constraints:"
            // Regex to find <strong>Constraints:</strong> or similar header
            const parts = question.content.split(/<strong>\s*Constraints:?\s*<\/strong>|<p>\s*Constraints:?\s*<\/p>/i);

            if (parts.length > 1) {
                description = parts[0];
                constraints = parts.slice(1).join(' ');
            } else {
                description = question.content;
            }

            // Clean HTML
            const clean = (html) => html
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

            description = clean(description).slice(0, 2000);
            constraints = clean(constraints).slice(0, 1000);
        }

        return {
            id: question.questionFrontendId,
            title: question.title,
            slug: question.titleSlug,
            difficulty: question.difficulty?.toLowerCase() || 'unknown',
            description: description,
            constraints: constraints,
            topics: question.topicTags?.map(t => t.name) || [],
            url: `https://leetcode.com/problems/${slug}/`
        };
    } catch (error) {
        console.error('Error fetching LeetCode problem:', error.message);
        return null;
    }
}

/**
 * Fetch problem from URL
 * @param {string} url - LeetCode problem URL
 * @returns {Object|null} - Problem details or null if failed
 */
export async function fetchLeetCodeProblemFromUrl(url) {
    const slug = extractLeetCodeSlug(url);
    if (!slug) {
        console.error('Invalid LeetCode URL:', url);
        return null;
    }
    return fetchLeetCodeProblem(slug);
}
