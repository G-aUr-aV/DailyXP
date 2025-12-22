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
 * Get video info from YouTube Data API v3
 * Falls back to noembed for basic info if API key not available
 */
export async function getVideoInfo(videoId) {
    const apiKey = process.env.YOUTUBE_DATA_API_V3_KEY;

    // If we have an API key, use YouTube Data API for full info including duration
    if (apiKey) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
            );

            if (!response.ok) {
                console.error('YouTube API error:', response.status);
                return await getVideoInfoFallback(videoId);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                console.error('Video not found:', videoId);
                return await getVideoInfoFallback(videoId);
            }

            const video = data.items[0];
            const duration = parseDuration(video.contentDetails?.duration);

            return {
                title: video.snippet?.title || 'Unknown Video',
                duration: duration,
                thumbnailUrl: video.snippet?.thumbnails?.maxres?.url ||
                    video.snippet?.thumbnails?.high?.url ||
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                author: video.snippet?.channelTitle || 'Unknown'
            };
        } catch (error) {
            console.error('Error fetching from YouTube API:', error);
            return await getVideoInfoFallback(videoId);
        }
    }

    // Fallback to noembed if no API key
    return await getVideoInfoFallback(videoId);
}

/**
 * Fallback method using noembed.com (no duration available)
 */
async function getVideoInfoFallback(videoId) {
    try {
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
        console.error('Error fetching video info (fallback):', error);
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
