import express from 'express';
import UserStats from '../models/UserStats.js';
import Quest from '../models/Quest.js';

const router = express.Router();

// GET /api/stats - Get user stats
router.get('/', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();

        // Get weekly summary
        const currentMonday = Quest.getCurrentMonday();
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        const weeklyQuests = await Quest.find({
            targetWeek: { $gte: currentMonday, $lt: nextMonday }
        });

        const weeklyCompleted = weeklyQuests.filter(q => q.status === 'completed').length;
        const weeklyTotal = weeklyQuests.length;
        const weeklySpilled = weeklyQuests.filter(q => q.spillCount > 0).length;

        res.json({
            totalXP: stats.totalXP,
            level: stats.level,
            currentLevelXP: stats.currentLevelXP,
            xpToNextLevel: stats.xpToNextLevel,
            xpProgress: Math.round((stats.currentLevelXP / stats.xpToNextLevel) * 100),
            streak: stats.streak,
            questsCompleted: stats.questsCompleted,
            questsByType: stats.questsByType,
            achievements: stats.achievements,
            weekly: {
                completed: weeklyCompleted,
                total: weeklyTotal,
                spilled: weeklySpilled,
                progress: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/stats/achievements - Get all achievements
router.get('/achievements', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        res.json(stats.achievements || []);
    } catch (error) {
        next(error);
    }
});

// GET /api/stats/leaderboard - Weekly leaderboard (for single user, shows personal records)
router.get('/leaderboard', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();

        // Get best weeks
        const bestWeeks = (stats.weeklyStats || [])
            .sort((a, b) => b.xpEarned - a.xpEarned)
            .slice(0, 5);

        res.json({
            currentLevel: stats.level,
            totalXP: stats.totalXP,
            longestStreak: stats.streak, // TODO: Track max streak separately
            bestWeeks
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stats/check-achievements - Check and award new achievements
router.post('/check-achievements', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        const newAchievements = [];
        const existingTypes = new Set((stats.achievements || []).map(a => a.type));

        // Define achievement conditions
        const achievementConditions = [
            {
                type: 'first_quest',
                name: 'First Blood',
                description: 'Complete your first quest',
                condition: stats.questsCompleted >= 1,
                xpBonus: 50
            },
            {
                type: 'streak_3',
                name: 'Hat Trick',
                description: 'Maintain a 3-day streak',
                condition: stats.streak >= 3,
                xpBonus: 100
            },
            {
                type: 'streak_7',
                name: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                condition: stats.streak >= 7,
                xpBonus: 250
            },
            {
                type: 'streak_30',
                name: 'Monthly Master',
                description: 'Maintain a 30-day streak',
                condition: stats.streak >= 30,
                xpBonus: 1000
            },
            {
                type: 'level_5',
                name: 'Rising Star',
                description: 'Reach level 5',
                condition: stats.level >= 5,
                xpBonus: 200
            },
            {
                type: 'level_10',
                name: 'Veteran',
                description: 'Reach level 10',
                condition: stats.level >= 10,
                xpBonus: 500
            },
            {
                type: 'level_25',
                name: 'Legend',
                description: 'Reach level 25',
                condition: stats.level >= 25,
                xpBonus: 2000
            },
            {
                type: 'video_master',
                name: 'Video Scholar',
                description: 'Complete 10 YouTube quests',
                condition: (stats.questsByType?.youtube || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'dsa_master',
                name: 'Algorithm Ace',
                description: 'Complete 10 DSA quests',
                condition: (stats.questsByType?.dsa || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'task_master',
                name: 'Task Titan',
                description: 'Complete 10 Task quests',
                condition: (stats.questsByType?.task || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'century',
                name: 'Century Club',
                description: 'Complete 100 quests',
                condition: stats.questsCompleted >= 100,
                xpBonus: 1000
            }
        ];

        // Check and award achievements
        for (const achievement of achievementConditions) {
            if (achievement.condition && !existingTypes.has(achievement.type)) {
                const newAchievement = {
                    type: achievement.type,
                    name: achievement.name,
                    description: achievement.description,
                    earnedAt: new Date(),
                    xpBonus: achievement.xpBonus
                };

                stats.achievements = stats.achievements || [];
                stats.achievements.push(newAchievement);
                newAchievements.push(newAchievement);

                // Award XP bonus
                stats.totalXP += achievement.xpBonus;
                stats.currentLevelXP += achievement.xpBonus;
            }
        }

        if (newAchievements.length > 0) {
            await stats.save();
        }

        res.json({
            newAchievements,
            totalAchievements: stats.achievements?.length || 0
        });
    } catch (error) {
        next(error);
    }
});

export default router;
