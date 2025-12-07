import express from 'express';
import VideoProgress from '../models/VideoProgress.js';
import Quest from '../models/Quest.js';

const router = express.Router();

// POST /api/video-progress/:questId - Save video progress
router.post('/:questId', async (req, res, next) => {
    try {
        const { questId } = req.params;
        const { currentTime, sessionDuration } = req.body;

        // Verify quest exists and is a YouTube quest
        const quest = await Quest.findById(questId);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        if (quest.type !== 'youtube') {
            return res.status(400).json({ error: 'Quest is not a YouTube quest' });
        }

        // Calculate percent complete
        const percentComplete = quest.youtube.duration
            ? Math.round((currentTime / quest.youtube.duration) * 100)
            : 0;

        // Save progress to time-series collection
        const progress = new VideoProgress({
            questId,
            currentTime,
            metadata: {
                sessionDuration: sessionDuration || 0,
                percentComplete,
                videoTitle: quest.youtube.videoTitle
            }
        });
        await progress.save();

        // Update quest's current time
        quest.youtube.currentTime = currentTime;

        // Auto-complete if >95% watched
        if (percentComplete >= 95) {
            quest.youtube.completed = true;
        }

        await quest.save();

        res.json({
            saved: true,
            currentTime,
            percentComplete,
            autoCompleted: quest.youtube.completed
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/video-progress/:questId - Get progress history
router.get('/:questId', async (req, res, next) => {
    try {
        const { questId } = req.params;
        const { limit = 50 } = req.query;

        const history = await VideoProgress.find({ questId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(history);
    } catch (error) {
        next(error);
    }
});

// GET /api/video-progress/:questId/latest - Get latest progress
router.get('/:questId/latest', async (req, res, next) => {
    try {
        const { questId } = req.params;

        const latest = await VideoProgress.findOne({ questId })
            .sort({ timestamp: -1 });

        if (!latest) {
            return res.json({ currentTime: 0, percentComplete: 0 });
        }

        res.json({
            currentTime: latest.currentTime,
            percentComplete: latest.metadata?.percentComplete || 0,
            lastWatched: latest.timestamp
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/video-progress/:questId/timeline - Get timeline for visualization
router.get('/:questId/timeline', async (req, res, next) => {
    try {
        const { questId } = req.params;

        const quest = await Quest.findById(questId);
        if (!quest || quest.type !== 'youtube') {
            return res.status(404).json({ error: 'YouTube quest not found' });
        }

        const history = await VideoProgress.find({ questId })
            .sort({ timestamp: 1 });

        // Create timeline data points
        const timeline = history.map(entry => ({
            timestamp: entry.timestamp,
            videoTime: entry.currentTime,
            percent: entry.metadata?.percentComplete || 0
        }));

        res.json({
            videoDuration: quest.youtube.duration,
            currentTime: quest.youtube.currentTime,
            timeline
        });
    } catch (error) {
        next(error);
    }
});

export default router;
