/**
 * Extension API Routes
 * 
 * API endpoints designed for the DailyXP Browser Extension
 * to sync YouTube watch progress from the YouTube website.
 * 
 * The extension will:
 * 1. Detect when user is on a YouTube video page
 * 2. Extract video ID and current timestamp
 * 3. Call these APIs to update progress
 */

import express from 'express';
import VideoProgress from '../models/VideoProgress.js';
import Quest from '../models/Quest.js';

const router = express.Router();

/**
 * GET /api/extension/quest/by-video/:videoId
 * 
 * Find an active quest by YouTube video ID.
 * The extension uses this to check if the current video is a tracked quest.
 * 
 * @param videoId - YouTube video ID (e.g., 'dQw4w9WgXcQ')
 * @returns Quest object if found, null otherwise
 */
router.get('/quest/by-video/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;

        if (!videoId || videoId.length !== 11) {
            return res.status(400).json({ error: 'Invalid video ID' });
        }

        // Find quest with this video ID (active quests first)
        const quest = await Quest.findOne({
            'youtube.videoId': videoId,
            type: 'youtube'
        }).sort({ status: 1, createdAt: -1 }); // 'active' comes before 'completed'

        if (!quest) {
            return res.json({
                found: false,
                quest: null,
                message: 'No quest found for this video'
            });
        }

        res.json({
            found: true,
            quest: {
                id: quest._id,
                title: quest.title,
                status: quest.status,
                xpReward: quest.xpReward,
                complexity: quest.complexity,
                deadline: quest.deadline,
                youtube: {
                    videoId: quest.youtube.videoId,
                    videoTitle: quest.youtube.videoTitle,
                    duration: quest.youtube.duration,
                    currentTime: quest.youtube.currentTime,
                    completed: quest.youtube.completed
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/extension/quests/youtube
 * 
 * Get all active YouTube quests.
 * The extension can use this to show a list of tracked videos.
 * 
 * @returns Array of active YouTube quests with video IDs
 */
router.get('/quests/youtube', async (req, res, next) => {
    try {
        const quests = await Quest.find({
            type: 'youtube',
            status: 'active'
        }).select('title youtube.videoId youtube.videoTitle youtube.currentTime youtube.duration xpReward complexity deadline')
            .sort({ deadline: 1 });

        res.json({
            count: quests.length,
            quests: quests.map(q => ({
                id: q._id,
                title: q.title,
                videoId: q.youtube.videoId,
                videoTitle: q.youtube.videoTitle,
                currentTime: q.youtube.currentTime,
                duration: q.youtube.duration,
                progressPercent: q.youtube.duration ? Math.round((q.youtube.currentTime / q.youtube.duration) * 100) : 0,
                xpReward: q.xpReward,
                complexity: q.complexity,
                deadline: q.deadline
            }))
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/extension/progress/by-video/:videoId
 * 
 * Update progress for a quest using YouTube video ID.
 * This is the main endpoint the extension will call to sync progress.
 * 
 * @param videoId - YouTube video ID
 * @body currentTime - Current playback position in seconds
 * @body sessionDuration - Optional, how long they watched in this session
 * @body videoDuration - Optional, total video duration (will update quest if missing)
 * @returns Updated progress info
 */
router.post('/progress/by-video/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const { currentTime, sessionDuration, videoDuration } = req.body;

        if (!videoId || videoId.length !== 11) {
            return res.status(400).json({ error: 'Invalid video ID' });
        }

        if (typeof currentTime !== 'number' || currentTime < 0) {
            return res.status(400).json({ error: 'currentTime must be a positive number' });
        }

        // Find active quest with this video ID
        const quest = await Quest.findOne({
            'youtube.videoId': videoId,
            type: 'youtube',
            status: 'active'
        });

        if (!quest) {
            return res.status(404).json({
                error: 'No active quest found for this video',
                videoId
            });
        }

        // Update duration if provided and we don't have it
        if (videoDuration && (!quest.youtube.duration || quest.youtube.duration === 0)) {
            quest.youtube.duration = videoDuration;
        }

        // Calculate percent complete
        const duration = quest.youtube.duration || videoDuration || 0;
        const percentComplete = duration ? Math.round((currentTime / duration) * 100) : 0;

        // Save progress to time-series collection
        const progress = new VideoProgress({
            questId: quest._id,
            currentTime,
            metadata: {
                sessionDuration: sessionDuration || 0,
                percentComplete,
                videoTitle: quest.youtube.videoTitle,
                source: 'extension' // Mark as coming from extension
            }
        });
        await progress.save();

        // Update quest's current time
        quest.youtube.currentTime = currentTime;

        // Auto-mark video as completed if >95% watched
        if (percentComplete >= 95) {
            quest.youtube.completed = true;
        }

        await quest.save();

        res.json({
            success: true,
            questId: quest._id,
            questTitle: quest.title,
            currentTime,
            percentComplete,
            videoCompleted: quest.youtube.completed,
            xpReward: quest.xpReward
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/extension/progress/batch
 * 
 * Batch update progress for multiple videos at once.
 * Useful when extension syncs multiple videos on browser close.
 * 
 * @body updates - Array of { videoId, currentTime, sessionDuration }
 * @returns Array of results for each update
 */
router.post('/progress/batch', async (req, res, next) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'updates must be a non-empty array' });
        }

        if (updates.length > 20) {
            return res.status(400).json({ error: 'Maximum 20 updates per batch' });
        }

        const results = [];

        for (const update of updates) {
            const { videoId, currentTime, sessionDuration } = update;

            if (!videoId || typeof currentTime !== 'number') {
                results.push({ videoId, success: false, error: 'Invalid data' });
                continue;
            }

            try {
                const quest = await Quest.findOne({
                    'youtube.videoId': videoId,
                    type: 'youtube',
                    status: 'active'
                });

                if (!quest) {
                    results.push({ videoId, success: false, error: 'Quest not found' });
                    continue;
                }

                const percentComplete = quest.youtube.duration
                    ? Math.round((currentTime / quest.youtube.duration) * 100)
                    : 0;

                // Save progress
                const progress = new VideoProgress({
                    questId: quest._id,
                    currentTime,
                    metadata: {
                        sessionDuration: sessionDuration || 0,
                        percentComplete,
                        videoTitle: quest.youtube.videoTitle,
                        source: 'extension-batch'
                    }
                });
                await progress.save();

                // Update quest
                quest.youtube.currentTime = currentTime;
                if (percentComplete >= 95) quest.youtube.completed = true;
                await quest.save();

                results.push({
                    videoId,
                    success: true,
                    questId: quest._id,
                    questTitle: quest.title,
                    percentComplete
                });
            } catch (err) {
                results.push({ videoId, success: false, error: err.message });
            }
        }

        res.json({
            processed: updates.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/extension/status
 * 
 * Health check endpoint for the extension.
 * Returns server status and basic stats.
 */
router.get('/status', async (req, res, next) => {
    try {
        const activeYouTubeQuests = await Quest.countDocuments({
            type: 'youtube',
            status: 'active'
        });

        res.json({
            status: 'ok',
            server: 'DailyXP',
            version: '1.0.0',
            activeYouTubeQuests,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
