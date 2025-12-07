/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url) {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Get video info from YouTube (using noembed.com for no-API-key solution)
 */
export async function getVideoInfo(videoId) {
    try {
        // Use noembed.com for basic video info without API key
        const response = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return {
            title: data.title || 'Unknown Video',
            duration: 0, // noembed doesn't provide duration
            thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: data.author_name || 'Unknown'
        };
    } catch (error) {
        console.error('Error fetching video info:', error);
        return null;
    }
}

/**
 * Parse YouTube video duration string (PT1H2M3S format)
 */
export function parseDuration(duration) {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to human readable duration
 */
export function formatDuration(seconds) {
    if (!seconds || seconds === 0) return 'Unknown';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default {
    extractYouTubeVideoId,
    getVideoInfo,
    parseDuration,
    formatDuration
};
