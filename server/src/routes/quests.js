import express from 'express';
import Quest from '../models/Quest.js';
import UserStats from '../models/UserStats.js';
import { analyzeQuestComplexity } from '../llm/index.js';
import { extractYouTubeVideoId, getVideoInfo } from '../utils/youtube.js';
import { fetchDSAProblem, detectPlatform } from '../services/dsaService.js';
import Ritual from '../models/Ritual.js';

const router = express.Router();

// POST /api/quests/leetcode/fetch - Fetch LeetCode problem details from URL
router.post('/leetcode/fetch', async (req, res, next) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'LeetCode URL is required' });
        }

        const problemDetails = await fetchDSAProblem(url);

        if (!problemDetails) {
            return res.status(404).json({
                error: 'Could not fetch problem details. Please check the URL or try again.'
            });
        }

        res.json(problemDetails);
    } catch (error) {
        next(error);
    }
});

// POST /api/quests/dsa/fetch - Fetch DSA problem details from any platform URL
router.post('/dsa/fetch', async (req, res, next) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'Problem URL is required' });
        }

        const platform = detectPlatform(url);
        if (platform === 'unknown') {
            return res.status(400).json({
                error: 'Unsupported platform. Supported: LeetCode, Codeforces, CSES, CodeChef'
            });
        }

        const problemDetails = await fetchDSAProblem(url);

        // Even if fetch returns null, allow creating quest with URL
        if (!problemDetails) {
            // Return minimal data allowing quest creation
            return res.json({
                platform,
                title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Problem`,
                description: '',
                difficulty: 'unknown',
                topics: [],
                url: url,
                warning: 'Could not fetch full problem details. You can still create the quest.'
            });
        }

        res.json(problemDetails);
    } catch (error) {
        next(error);
    }
});

// GET /api/quests - List all quests with optional filters
router.get('/', async (req, res, next) => {
    try {
        const { status, type, platform, week, dateFrom, dateTo, dateField = 'deadline', dateRanges, spilled } = req.query;
        const filter = {};

        if (status) {
            if (status === 'active') {
                filter.status = { $in: ['active', 'spilled'] };
            } else {
                filter.status = status;
            }
        }
        if (type) filter.type = type;
        if (platform) filter['dsa.platform'] = platform;

        // Filter for spilled quests only
        if (spilled === 'true') {
            filter.spillCount = { $gt: 0 };
        }

        // Filter by target week
        if (week === 'current') {
            const currentMonday = Quest.getCurrentMonday();
            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(nextMonday.getDate() + 7);
            filter.targetWeek = { $gte: currentMonday, $lt: nextMonday };
        } else if (week === 'future') {
            const currentMonday = Quest.getCurrentMonday();
            const nextMonday = new Date(currentMonday);
            nextMonday.setDate(nextMonday.getDate() + 7);
            filter.targetWeek = { $gte: nextMonday };
        }

        const allowedDateFields = ['createdAt', 'deadline', 'completedAt'];
        const filterField = allowedDateFields.includes(dateField) ? dateField : 'deadline';

        // Multiple date ranges (OR condition)
        // Format: dateRanges=[{"from":"2024-01-01","to":"2024-01-31"},{"from":"2024-03-01","to":"2024-03-31"}]
        if (dateRanges) {
            try {
                const ranges = JSON.parse(dateRanges);
                if (Array.isArray(ranges) && ranges.length > 0) {
                    const orConditions = ranges.map(range => {
                        const condition = {};
                        if (range.from) {
                            const fromDate = new Date(range.from);
                            fromDate.setHours(0, 0, 0, 0);
                            condition[filterField] = condition[filterField] || {};
                            condition[filterField].$gte = fromDate;
                        }
                        if (range.to) {
                            const toDate = new Date(range.to);
                            toDate.setHours(23, 59, 59, 999);
                            condition[filterField] = condition[filterField] || {};
                            condition[filterField].$lte = toDate;
                        }
                        return condition;
                    }).filter(c => Object.keys(c).length > 0);

                    if (orConditions.length > 0) {
                        filter.$or = orConditions;
                    }
                }
            } catch (e) {
                console.error('Invalid dateRanges format:', e);
            }
        }
        // Single date range (backward compatible)
        else if (dateFrom || dateTo) {
            filter[filterField] = {};
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                filter[filterField].$gte = fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                filter[filterField].$lte = toDate;
            }
        }

        const quests = await Quest.find(filter)
            .sort({ deadline: 1, createdAt: -1 });

        res.json(quests);
    } catch (error) {
        next(error);
    }
});

// GET /api/quests/week/:date - Get quests for a specific week
router.get('/week/:date', async (req, res, next) => {
    try {
        const weekStart = new Date(req.params.date);
        weekStart.setHours(0, 0, 0, 0);

        // Get Monday of that week
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + diff);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const quests = await Quest.find({
            targetWeek: { $gte: weekStart, $lt: weekEnd }
        }).sort({ deadline: 1 });

        res.json({ weekStart, weekEnd, quests });
    } catch (error) {
        next(error);
    }
});

// GET /api/quests/dashboard - Get dashboard data (quests with deadline by end of current week Sunday)
router.get('/dashboard', async (req, res, next) => {
    try {
        const currentMonday = Quest.getCurrentMonday();
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);
        // Set to exactly 12:00 AM Monday (deadline expires at this point)
        nextMonday.setHours(0, 0, 0, 0);

        // Get current week's Sunday at 11:59:59 PM for display
        const currentSunday = new Date(nextMonday);
        currentSunday.setSeconds(currentSunday.getSeconds() - 1);

        const [activeQuestsRaw, completedQuests, stats, weeklyQuests] = await Promise.all([
            Quest.find({
                status: 'active',
                deadline: { $lt: nextMonday } // Deadline before next Monday 12 AM
            }).sort({ deadline: 1 }),
            Quest.find({
                status: 'completed',
                completedAt: { $gte: currentMonday, $lt: nextMonday } // Completed this week
            }).sort({ completedAt: -1 }),
            UserStats.getStats(),
            // Fetch strict weekly quests for goal calculation (aligned with stats.js logic)
            Quest.find({
                targetWeek: { $gte: currentMonday, $lt: nextMonday }
            })
        ]);

        // Filter out expired ritual quests (rituals with deadline passed)
        const now = new Date();
        const activeQuests = activeQuestsRaw.filter(quest => {
            // If it's a ritual quest and deadline has passed, don't show on dashboard
            if (quest.ritualId && quest.deadline < now) {
                return false;
            }
            return true;
        });

        // Count spilled quests
        const spilledCount = activeQuests.filter(q => q.spillCount > 0).length;

        // Calculate Weekly Goal (XP)
        const weeklyEarnedXP = weeklyQuests.filter(q => q.status === 'completed').reduce((sum, q) => sum + (q.xpReward || 0), 0);
        // Fixed weekly goal as per user request
        const weeklyTargetXP = 7500;

        res.json({
            weekStart: currentMonday,
            weekEnd: currentSunday, // Display Sunday as end of week
            activeQuests,
            completedQuests,
            spilledCount,
            stats: {
                totalXP: stats.totalXP,
                level: stats.level,
                currentLevelXP: stats.currentLevelXP,
                xpToNextLevel: stats.xpToNextLevel,
                streak: stats.streak,
                questsCompleted: stats.questsCompleted,
                weekly: {
                    current: weeklyEarnedXP,
                    target: weeklyTargetXP,
                    progress: weeklyTargetXP > 0 ? Math.round((weeklyEarnedXP / weeklyTargetXP) * 100) : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/quests/:id - Get single quest
router.get('/:id', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        res.json(quest);
    } catch (error) {
        next(error);
    }
});

// POST /api/quests - Create new quest
router.post('/', async (req, res, next) => {
    try {
        const { type, title, description, deadline, youtube, dsa, timer } = req.body;

        // Normalize deadline to end of day (23:59:59)
        let normalizedDeadline = new Date(deadline || Quest.getNextMonday());
        normalizedDeadline.setHours(23, 59, 59, 999);

        // Create base quest
        const questData = {
            type,
            title,
            description,
            deadline: normalizedDeadline,
            targetWeek: Quest.getCurrentMonday()
        };

        // Handle timer settings
        if (timer && timer.enabled) {
            questData.timer = {
                enabled: true,
                currentTime: 0,
                isRunning: false,
                alarmEnabled: timer.alarmEnabled || false,
                alarmSeconds: timer.alarmSeconds || 1800,
                alarmTriggered: false,
                pauseHistory: []
            };
        }

        // Handle YouTube quest
        if (type === 'youtube' && youtube?.videoUrl) {
            const videoId = extractYouTubeVideoId(youtube.videoUrl);
            if (videoId) {
                const videoInfo = await getVideoInfo(videoId);
                questData.youtube = {
                    videoId,
                    videoUrl: youtube.videoUrl,
                    videoTitle: videoInfo?.title || title,
                    duration: videoInfo?.duration || 0,
                    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    currentTime: 0,
                    completed: false
                };
            }
        }

        // Handle DSA quest - auto-fetch problem details from platform
        if (type === 'dsa' && dsa) {
            const platform = dsa.platform || detectPlatform(dsa.problemUrl) || 'other';

            // Initialize DSA data with user-provided values
            questData.dsa = {
                platform: platform,
                problemUrl: dsa.problemUrl,
                difficulty: dsa.difficulty,
                topics: dsa.topics || [],
                problemNumber: dsa.problemNumber
            };

            // Try to fetch problem details from supported platforms
            if (dsa.problemUrl && ['leetcode', 'codeforces', 'cses', 'codechef'].includes(platform)) {
                try {
                    const problemDetails = await fetchDSAProblem(dsa.problemUrl);
                    if (problemDetails) {
                        // Postfill/override with fetched data
                        questData.dsa.difficulty = problemDetails.difficulty || dsa.difficulty;
                        questData.dsa.topics = problemDetails.topics?.length > 0
                            ? problemDetails.topics
                            : (dsa.topics || []);

                        // Update title if not provided by user
                        if (!title || title === dsa.problemUrl) {
                            questData.title = problemDetails.title;
                        }

                        // Add description from platform if available
                        if (problemDetails.description && !description) {
                            questData.description = problemDetails.description.slice(0, 5000);
                        }

                        // Store fetched platform title for LLM analysis
                        questData.dsa.platformTitle = problemDetails.title;

                        // Combine description and constraints (if any) for LLM analysis
                        // This ensures LLM sees constraints but UI (using quest.description) stays clean
                        let fullContext = problemDetails.description;
                        if (problemDetails.constraints) {
                            fullContext += `\n\nConstraints: ${problemDetails.constraints}`;
                        }
                        questData.dsa.platformDescription = fullContext;

                        // For Codeforces, store rating
                        if (platform === 'codeforces' && problemDetails.rating) {
                            questData.dsa.rating = problemDetails.rating;
                        }
                    }
                } catch (err) {
                    console.error('Error fetching DSA problem details:', err.message);
                    // Continue with user-provided data
                }
            }
        }

        // Create quest first
        const quest = new Quest(questData);

        // Analyze complexity with LLM (async, updates quest)
        analyzeQuestComplexity(quest)
            .then(async (analysis) => {
                if (analysis) {
                    quest.complexity = analysis.complexity;
                    quest.xpReward = analysis.xpReward;
                    quest.llmAnalysis = {
                        reasoning: analysis.reasoning,
                        analyzedAt: new Date()
                    };
                    quest.analysisStatus = 'completed';
                    await quest.save();
                }
            })
            .catch(async err => {
                console.error('LLM analysis error:', err);
                quest.analysisStatus = 'failed';
                await quest.save();
            });

        await quest.save();
        res.status(201).json(quest);
    } catch (error) {
        next(error);
    }
});

// PUT /api/quests/:id - Update quest
router.put('/:id', async (req, res, next) => {
    try {
        const { title, description, deadline, status, youtube, dsa } = req.body;

        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (title) quest.title = title;
        if (description !== undefined) quest.description = description;
        if (deadline) {
            const normalizedDeadline = new Date(deadline);
            normalizedDeadline.setHours(23, 59, 59, 999);
            quest.deadline = normalizedDeadline;
        }
        if (status) quest.status = status;

        if (youtube && quest.type === 'youtube') {
            Object.assign(quest.youtube, youtube);
        }
        if (dsa && quest.type === 'dsa') {
            Object.assign(quest.dsa, dsa);
        }

        await quest.save();
        res.json(quest);
    } catch (error) {
        next(error);
    }
});

// PUT /api/quests/:id/complete - Mark quest as complete
router.put('/:id/complete', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (quest.status === 'completed') {
            return res.status(400).json({ error: 'Quest already completed' });
        }

        // Calculate XP with bonuses
        let xpEarned = quest.xpReward;
        const daysEarly = quest.daysRemaining;

        // Early completion bonus (10% - normalized with gear bonuses)
        if (daysEarly > 0) {
            xpEarned = Math.floor(xpEarned * 1.10);
        }

        // Update quest
        quest.status = 'completed';
        quest.completedAt = new Date();

        if (quest.type === 'youtube') {
            quest.youtube.completed = true;
        }

        await quest.save();

        // Update ritual stats if this is a ritual quest
        if (quest.ritualId) {
            const ritual = await Ritual.findById(quest.ritualId);
            if (ritual) {
                ritual.recordCompletion();
                await ritual.save();
            }
        }

        // Update user stats
        const stats = await UserStats.getStats();
        stats.questsCompleted += 1;
        stats.questsByType[quest.type] = (stats.questsByType[quest.type] || 0) + 1;

        // === Track complexity-based stats ===
        if (!stats.questsByComplexity) {
            stats.questsByComplexity = { easy: 0, medium: 0, hard: 0, epic: 0 };
        }
        const complexity = quest.complexity || 'medium';
        stats.questsByComplexity[complexity] = (stats.questsByComplexity[complexity] || 0) + 1;

        // === Track records for achievements ===
        if (!stats.records) {
            stats.records = {
                bestSingleQuestXP: 0,
                bestDailyXP: 0,
                bestWeeklyXP: 0,
                longestStreak: 0,
                totalEpicQuests: 0,
                totalHardQuests: 0,
                perfectWeeks: 0,
                speedCompletions: 0,
                weekendWarrior: 0,
                earlyBird: 0,
                nightOwl: 0
            };
        }

        // Track best single quest XP
        if (xpEarned > (stats.records.bestSingleQuestXP || 0)) {
            stats.records.bestSingleQuestXP = xpEarned;
        }

        // Track hard/epic quests
        if (complexity === 'hard') {
            stats.records.totalHardQuests = (stats.records.totalHardQuests || 0) + 1;
        } else if (complexity === 'epic') {
            stats.records.totalEpicQuests = (stats.records.totalEpicQuests || 0) + 1;
        }

        // Track time-based achievements
        const completedHour = quest.completedAt.getHours();
        const completedDay = quest.completedAt.getDay(); // 0 = Sunday, 6 = Saturday

        // Early Bird (completed before 9 AM)
        if (completedHour < 9) {
            stats.records.earlyBird = (stats.records.earlyBird || 0) + 1;
        }

        // Night Owl (completed after 10 PM / 22:00)
        if (completedHour >= 22) {
            stats.records.nightOwl = (stats.records.nightOwl || 0) + 1;
        }

        // Weekend Warrior (completed on Saturday or Sunday)
        if (completedDay === 0 || completedDay === 6) {
            stats.records.weekendWarrior = (stats.records.weekendWarrior || 0) + 1;
        }

        // Speed Demon (completed same day as created)
        const createdDate = quest.createdAt.toDateString();
        const completedDate = quest.completedAt.toDateString();
        if (createdDate === completedDate) {
            stats.records.speedCompletions = (stats.records.speedCompletions || 0) + 1;
        }

        // Track longest streak
        if (stats.streak > (stats.records.longestStreak || 0)) {
            stats.records.longestStreak = stats.streak;
        }

        // Calculate and track daily XP (approximate - check if this is a new daily high)
        // Get today's completed quests
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayQuests = await Quest.find({
            status: 'completed',
            completedAt: { $gte: today, $lt: tomorrow }
        });
        const todayXP = todayQuests.reduce((sum, q) => sum + (q.xpReward || 0), 0);

        if (todayXP > (stats.records.bestDailyXP || 0)) {
            stats.records.bestDailyXP = todayXP;
        }

        // Calculate and track weekly XP
        const currentMonday = Quest.getCurrentMonday();
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        const weekQuests = await Quest.find({
            status: 'completed',
            completedAt: { $gte: currentMonday, $lt: nextMonday }
        });
        const weekXP = weekQuests.reduce((sum, q) => sum + (q.xpReward || 0), 0);

        if (weekXP > (stats.records.bestWeeklyXP || 0)) {
            stats.records.bestWeeklyXP = weekXP;
        }

        // Check for perfect week (weekly XP >= target)
        const weeklyTarget = 7500;
        if (weekXP >= weeklyTarget) {
            // Only increment once per week
            const weekKey = currentMonday.toISOString();
            if (!stats._perfectWeekTracked || stats._perfectWeekTracked !== weekKey) {
                stats.records.perfectWeeks = (stats.records.perfectWeeks || 0) + 1;
                stats._perfectWeekTracked = weekKey;
            }
        }

        const newStats = await stats.addXP(xpEarned);

        res.json({
            quest,
            xpEarned,
            earlyBonus: daysEarly > 0,
            newStats
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/quests/:id - Delete quest
router.delete('/:id', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        // Block deletion of incomplete ritual quests
        if (quest.ritualId && quest.status !== 'completed') {
            return res.status(403).json({
                error: 'Cannot delete incomplete ritual quests. Complete them or wait for them to expire.'
            });
        }

        await Quest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quest deleted', quest });
    } catch (error) {
        next(error);
    }
});

// POST /api/quests/:id/retry-analysis - Retry LLM analysis for stuck quests
router.post('/:id/retry-analysis', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        // Allow re-analysis anytime (no status check)

        // Reset to pending and trigger analysis
        quest.analysisStatus = 'pending';
        await quest.save();

        // Run analysis async
        analyzeQuestComplexity(quest)
            .then(async (analysis) => {
                if (analysis) {
                    quest.complexity = analysis.complexity;
                    quest.xpReward = analysis.xpReward;
                    quest.llmAnalysis = {
                        reasoning: analysis.reasoning,
                        analyzedAt: new Date()
                    };
                    quest.analysisStatus = 'completed';
                    await quest.save();
                    console.log(`Retry analysis completed for quest ${quest._id}`);
                }
            })
            .catch(async err => {
                console.error('Retry LLM analysis error:', err);
                quest.analysisStatus = 'failed';
                await quest.save();
            });

        res.json({ message: 'Analysis retry started', quest });
    } catch (error) {
        next(error);
    }
});

// POST /api/quests/process-spillage - Process weekly spillage (should be called by cron)
router.post('/process-spillage', async (req, res, next) => {
    try {
        const currentMonday = Quest.getCurrentMonday();

        // Find all incomplete quests from past weeks
        const spilledQuests = await Quest.updateMany(
            {
                status: 'active',
                targetWeek: { $lt: currentMonday }
            },
            {
                $set: { targetWeek: currentMonday },
                $inc: { spillCount: 1 }
            }
        );

        res.json({
            message: 'Spillage processed',
            questsMoved: spilledQuests.modifiedCount,
            newTargetWeek: currentMonday
        });
    } catch (error) {
        next(error);
    }
});

// ============ TIMER ENDPOINTS ============

// PUT /api/quests/:id/timer/start - Start or resume timer
router.put('/:id/timer/start', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (!quest.timer?.enabled) {
            return res.status(400).json({ error: 'Timer not enabled for this quest' });
        }

        if (quest.timer.isRunning) {
            return res.status(400).json({ error: 'Timer already running' });
        }

        // If there's an incomplete pause entry (paused but not resumed), mark it as resumed
        if (quest.timer.pauseHistory && quest.timer.pauseHistory.length > 0) {
            const lastEntry = quest.timer.pauseHistory[quest.timer.pauseHistory.length - 1];
            if (lastEntry && !lastEntry.resumedAt) {
                lastEntry.resumedAt = new Date();
            }
        }

        quest.timer.isRunning = true;
        quest.timer.lastStartedAt = new Date();

        await quest.save();
        res.json({ quest, message: 'Timer started' });
    } catch (error) {
        next(error);
    }
});

// PUT /api/quests/:id/timer/pause - Pause timer and save session
router.put('/:id/timer/pause', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (!quest.timer?.enabled) {
            return res.status(400).json({ error: 'Timer not enabled for this quest' });
        }

        if (!quest.timer.isRunning) {
            return res.status(400).json({ error: 'Timer not running' });
        }

        const { reason, currentTime } = req.body;
        const now = new Date();

        // Calculate session duration (from lastStartedAt to now)
        const sessionDuration = quest.timer.lastStartedAt
            ? Math.floor((now - quest.timer.lastStartedAt) / 1000)
            : 0;

        // Update current time with session duration
        const newCurrentTime = currentTime !== undefined
            ? currentTime
            : (quest.timer.currentTime || 0) + sessionDuration;

        // Add to pause history only if duration > 0
        if (sessionDuration > 0) {
            quest.timer.pauseHistory.push({
                pausedAt: now,
                duration: sessionDuration,
                reason: reason || ''
            });
        }

        quest.timer.currentTime = newCurrentTime;
        quest.timer.isRunning = false;
        quest.timer.lastStartedAt = null;

        await quest.save();
        res.json({
            quest,
            message: 'Timer paused',
            sessionDuration,
            totalTime: quest.timer.currentTime
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/quests/:id/timer/reset - Reset timer to 0
router.put('/:id/timer/reset', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (!quest.timer?.enabled) {
            return res.status(400).json({ error: 'Timer not enabled for this quest' });
        }

        quest.timer.currentTime = 0;
        quest.timer.isRunning = false;
        quest.timer.lastStartedAt = null;
        quest.timer.alarmTriggered = false;
        // Keep pauseHistory for audit purposes, or clear with: quest.timer.pauseHistory = [];

        await quest.save();
        res.json({ quest, message: 'Timer reset' });
    } catch (error) {
        next(error);
    }
});

// PUT /api/quests/:id/timer/sync - Sync current time (periodic saves while running)
router.put('/:id/timer/sync', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        if (!quest.timer?.enabled) {
            return res.status(400).json({ error: 'Timer not enabled for this quest' });
        }

        const { currentTime } = req.body;
        if (currentTime !== undefined) {
            quest.timer.currentTime = currentTime;
        }

        // Check if alarm should trigger
        if (quest.timer.alarmEnabled && !quest.timer.alarmTriggered) {
            const alarmThreshold = quest.timer.alarmSeconds || 1800;
            if (quest.timer.currentTime >= alarmThreshold) {
                quest.timer.alarmTriggered = true;
            }
        }

        await quest.save();
        res.json({
            quest,
            alarmTriggered: quest.timer.alarmTriggered,
            message: 'Timer synced'
        });
    } catch (error) {
        next(error);
    }
});

export default router;

