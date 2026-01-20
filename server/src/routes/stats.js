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

        const weeklyCompleted = weeklyQuests.filter(q => q.status === 'completed');
        const weeklyEarnedXP = weeklyCompleted.reduce((sum, q) => sum + (q.xpReward || 0), 0);
        // Fixed weekly goal
        const weeklyTotalXP = 7500;
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
            questsByComplexity: stats.questsByComplexity || { easy: 0, medium: 0, hard: 0, epic: 0 },
            records: stats.records || {},
            achievements: stats.achievements,
            weekly: {
                current: weeklyEarnedXP,
                target: weeklyTotalXP,
                spilled: weeklySpilled,
                progress: weeklyTotalXP > 0 ? Math.round((weeklyEarnedXP / weeklyTotalXP) * 100) : 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/stats/levelup - Manual level up
router.post('/levelup', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        const result = await stats.levelUp();

        // Award 2 Guardian Keys per level up
        if (!stats.gearSystem) {
            stats.gearSystem = {
                keys: 0,
                totalKeysEarned: 0,
                keyMilestonesReached: [],
                collectedGear: [],
                chestsOpened: 0,
                xpBonusPercent: 0,
                lastXPMilestone: 0
            };
        }

        const keysAwarded = 2;
        stats.gearSystem.keys += keysAwarded;
        stats.gearSystem.totalKeysEarned += keysAwarded;
        await stats.save();

        res.json({
            ...result,
            keysAwarded,
            totalKeys: stats.gearSystem.keys
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
            // === MILESTONE ACHIEVEMENTS ===
            {
                type: 'first_quest',
                name: 'First Blood',
                description: 'Complete your first quest',
                condition: stats.questsCompleted >= 1,
                xpBonus: 50
            },
            {
                type: 'quests_10',
                name: 'Getting Started',
                description: 'Complete 10 quests',
                condition: stats.questsCompleted >= 10,
                xpBonus: 100
            },
            {
                type: 'quests_25',
                name: 'Dedicated',
                description: 'Complete 25 quests',
                condition: stats.questsCompleted >= 25,
                xpBonus: 200
            },
            {
                type: 'quests_50',
                name: 'Half Century',
                description: 'Complete 50 quests',
                condition: stats.questsCompleted >= 50,
                xpBonus: 400
            },
            {
                type: 'century',
                name: 'Century Club',
                description: 'Complete 100 quests',
                condition: stats.questsCompleted >= 100,
                xpBonus: 1000
            },
            {
                type: 'quests_250',
                name: 'Quest Enthusiast',
                description: 'Complete 250 quests',
                condition: stats.questsCompleted >= 250,
                xpBonus: 2500
            },
            {
                type: 'quests_500',
                name: 'Quest Addict',
                description: 'Complete 500 quests',
                condition: stats.questsCompleted >= 500,
                xpBonus: 5000
            },
            {
                type: 'quests_1000',
                name: 'Quest Legend',
                description: 'Complete 1000 quests',
                condition: stats.questsCompleted >= 1000,
                xpBonus: 10000
            },

            // === STREAK ACHIEVEMENTS ===
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
                type: 'streak_14',
                name: 'Fortnight Fighter',
                description: 'Maintain a 14-day streak',
                condition: stats.streak >= 14,
                xpBonus: 500
            },
            {
                type: 'streak_30',
                name: 'Monthly Master',
                description: 'Maintain a 30-day streak',
                condition: stats.streak >= 30,
                xpBonus: 1000
            },
            {
                type: 'streak_60',
                name: 'Two Month Titan',
                description: 'Maintain a 60-day streak',
                condition: stats.streak >= 60,
                xpBonus: 2000
            },
            {
                type: 'streak_100',
                name: 'Century Streak',
                description: 'Maintain a 100-day streak',
                condition: stats.streak >= 100,
                xpBonus: 5000
            },
            {
                type: 'streak_365',
                name: 'Year of Dedication',
                description: 'Maintain a 365-day streak',
                condition: stats.streak >= 365,
                xpBonus: 25000
            },

            // === LEVEL ACHIEVEMENTS ===
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
                type: 'level_15',
                name: 'Seasoned Pro',
                description: 'Reach level 15',
                condition: stats.level >= 15,
                xpBonus: 750
            },
            {
                type: 'level_20',
                name: 'Elite',
                description: 'Reach level 20',
                condition: stats.level >= 20,
                xpBonus: 1000
            },
            {
                type: 'level_25',
                name: 'Legend',
                description: 'Reach level 25',
                condition: stats.level >= 25,
                xpBonus: 2000
            },
            {
                type: 'level_50',
                name: 'Grandmaster',
                description: 'Reach level 50',
                condition: stats.level >= 50,
                xpBonus: 5000
            },
            {
                type: 'level_75',
                name: 'Mythic',
                description: 'Reach level 75',
                condition: stats.level >= 75,
                xpBonus: 7500
            },
            {
                type: 'level_100',
                name: 'Transcendent',
                description: 'Reach level 100',
                condition: stats.level >= 100,
                xpBonus: 15000
            },

            // === YOUTUBE MASTERY ===
            {
                type: 'video_master',
                name: 'Video Scholar',
                description: 'Complete 10 YouTube quests',
                condition: (stats.questsByType?.youtube || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'video_expert',
                name: 'Video Expert',
                description: 'Complete 25 YouTube quests',
                condition: (stats.questsByType?.youtube || 0) >= 25,
                xpBonus: 600
            },
            {
                type: 'video_guru',
                name: 'Video Guru',
                description: 'Complete 50 YouTube quests',
                condition: (stats.questsByType?.youtube || 0) >= 50,
                xpBonus: 1200
            },
            {
                type: 'video_legend',
                name: 'Video Legend',
                description: 'Complete 100 YouTube quests',
                condition: (stats.questsByType?.youtube || 0) >= 100,
                xpBonus: 2500
            },

            // === DSA MASTERY ===
            {
                type: 'dsa_master',
                name: 'Algorithm Ace',
                description: 'Complete 10 DSA quests',
                condition: (stats.questsByType?.dsa || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'dsa_expert',
                name: 'Code Warrior',
                description: 'Complete 25 DSA quests',
                condition: (stats.questsByType?.dsa || 0) >= 25,
                xpBonus: 600
            },
            {
                type: 'dsa_guru',
                name: 'Algorithm Architect',
                description: 'Complete 50 DSA quests',
                condition: (stats.questsByType?.dsa || 0) >= 50,
                xpBonus: 1200
            },
            {
                type: 'dsa_legend',
                name: 'Competitive Programmer',
                description: 'Complete 100 DSA quests',
                condition: (stats.questsByType?.dsa || 0) >= 100,
                xpBonus: 2500
            },

            // === TASK MASTERY ===
            {
                type: 'task_master',
                name: 'Task Titan',
                description: 'Complete 10 Task quests',
                condition: (stats.questsByType?.task || 0) >= 10,
                xpBonus: 300
            },
            {
                type: 'task_expert',
                name: 'Task Terminator',
                description: 'Complete 25 Task quests',
                condition: (stats.questsByType?.task || 0) >= 25,
                xpBonus: 600
            },
            {
                type: 'task_guru',
                name: 'Productivity Pro',
                description: 'Complete 50 Task quests',
                condition: (stats.questsByType?.task || 0) >= 50,
                xpBonus: 1200
            },
            {
                type: 'task_legend',
                name: 'Task Force One',
                description: 'Complete 100 Task quests',
                condition: (stats.questsByType?.task || 0) >= 100,
                xpBonus: 2500
            },

            // === XP MILESTONES ===
            {
                type: 'xp_1k',
                name: 'XP Starter',
                description: 'Earn 1,000 total XP',
                condition: stats.totalXP >= 1000,
                xpBonus: 100
            },
            {
                type: 'xp_5k',
                name: 'XP Hunter',
                description: 'Earn 5,000 total XP',
                condition: stats.totalXP >= 5000,
                xpBonus: 300
            },
            {
                type: 'xp_10k',
                name: 'XP Collector',
                description: 'Earn 10,000 total XP',
                condition: stats.totalXP >= 10000,
                xpBonus: 500
            },
            {
                type: 'xp_25k',
                name: 'XP Hoarder',
                description: 'Earn 25,000 total XP',
                condition: stats.totalXP >= 25000,
                xpBonus: 1000
            },
            {
                type: 'xp_50k',
                name: 'XP Baron',
                description: 'Earn 50,000 total XP',
                condition: stats.totalXP >= 50000,
                xpBonus: 2000
            },
            {
                type: 'xp_100k',
                name: 'XP Tycoon',
                description: 'Earn 100,000 total XP',
                condition: stats.totalXP >= 100000,
                xpBonus: 5000
            },
            {
                type: 'xp_500k',
                name: 'XP Mogul',
                description: 'Earn 500,000 total XP',
                condition: stats.totalXP >= 500000,
                xpBonus: 15000
            },
            {
                type: 'xp_1m',
                name: 'XP Millionaire',
                description: 'Earn 1,000,000 total XP',
                condition: stats.totalXP >= 1000000,
                xpBonus: 50000
            },

            // === DIVERSITY ACHIEVEMENTS ===
            {
                type: 'diverse_learner',
                name: 'Diverse Learner',
                description: 'Complete at least 5 quests in each category',
                condition: (stats.questsByType?.youtube || 0) >= 5 &&
                    (stats.questsByType?.dsa || 0) >= 5 &&
                    (stats.questsByType?.task || 0) >= 5,
                xpBonus: 500
            },
            {
                type: 'balanced_master',
                name: 'Balanced Master',
                description: 'Complete at least 25 quests in each category',
                condition: (stats.questsByType?.youtube || 0) >= 25 &&
                    (stats.questsByType?.dsa || 0) >= 25 &&
                    (stats.questsByType?.task || 0) >= 25,
                xpBonus: 2000
            },
            {
                type: 'triple_threat',
                name: 'Triple Threat',
                description: 'Complete at least 50 quests in each category',
                condition: (stats.questsByType?.youtube || 0) >= 50 &&
                    (stats.questsByType?.dsa || 0) >= 50 &&
                    (stats.questsByType?.task || 0) >= 50,
                xpBonus: 5000
            },

            // === COMPLEXITY ACHIEVEMENTS (THE GRIND) ===
            {
                type: 'hard_first',
                name: 'Challenge Accepted',
                description: 'Complete your first Hard quest',
                condition: (stats.questsByComplexity?.hard || 0) >= 1,
                xpBonus: 150
            },
            {
                type: 'hard_10',
                name: 'Hardened Warrior',
                description: 'Complete 10 Hard quests',
                condition: (stats.questsByComplexity?.hard || 0) >= 10,
                xpBonus: 500
            },
            {
                type: 'hard_25',
                name: 'Iron Will',
                description: 'Complete 25 Hard quests',
                condition: (stats.questsByComplexity?.hard || 0) >= 25,
                xpBonus: 1200
            },
            {
                type: 'hard_50',
                name: 'Unbreakable',
                description: 'Complete 50 Hard quests',
                condition: (stats.questsByComplexity?.hard || 0) >= 50,
                xpBonus: 3000
            },
            {
                type: 'hard_100',
                name: 'Titanium Core',
                description: 'Complete 100 Hard quests',
                condition: (stats.questsByComplexity?.hard || 0) >= 100,
                xpBonus: 8000
            },
            {
                type: 'epic_first',
                name: 'Boss Slayer',
                description: 'Complete your first Epic quest',
                condition: (stats.questsByComplexity?.epic || 0) >= 1,
                xpBonus: 300
            },
            {
                type: 'epic_5',
                name: 'Dragon Slayer',
                description: 'Complete 5 Epic quests',
                condition: (stats.questsByComplexity?.epic || 0) >= 5,
                xpBonus: 1000
            },
            {
                type: 'epic_10',
                name: 'Raid Boss',
                description: 'Complete 10 Epic quests',
                condition: (stats.questsByComplexity?.epic || 0) >= 10,
                xpBonus: 2500
            },
            {
                type: 'epic_25',
                name: 'God Mode',
                description: 'Complete 25 Epic quests',
                condition: (stats.questsByComplexity?.epic || 0) >= 25,
                xpBonus: 7500
            },
            {
                type: 'epic_50',
                name: 'Immortal',
                description: 'Complete 50 Epic quests',
                condition: (stats.questsByComplexity?.epic || 0) >= 50,
                xpBonus: 20000
            },

            // === SPECIAL TIME-BASED ACHIEVEMENTS ===
            {
                type: 'early_bird_5',
                name: 'Early Bird',
                description: 'Complete 5 quests before 9 AM',
                condition: (stats.records?.earlyBird || 0) >= 5,
                xpBonus: 200
            },
            {
                type: 'early_bird_25',
                name: 'Dawn Warrior',
                description: 'Complete 25 quests before 9 AM',
                condition: (stats.records?.earlyBird || 0) >= 25,
                xpBonus: 750
            },
            {
                type: 'night_owl_5',
                name: 'Night Owl',
                description: 'Complete 5 quests after 10 PM',
                condition: (stats.records?.nightOwl || 0) >= 5,
                xpBonus: 200
            },
            {
                type: 'night_owl_25',
                name: 'Midnight Grinder',
                description: 'Complete 25 quests after 10 PM',
                condition: (stats.records?.nightOwl || 0) >= 25,
                xpBonus: 750
            },
            {
                type: 'weekend_5',
                name: 'Weekend Warrior',
                description: 'Complete 5 quests on weekends',
                condition: (stats.records?.weekendWarrior || 0) >= 5,
                xpBonus: 200
            },
            {
                type: 'weekend_25',
                name: 'No Days Off',
                description: 'Complete 25 quests on weekends',
                condition: (stats.records?.weekendWarrior || 0) >= 25,
                xpBonus: 800
            },

            // === SPEED & EFFICIENCY ACHIEVEMENTS ===
            {
                type: 'speed_demon_5',
                name: 'Speed Demon',
                description: 'Complete 5 quests on the same day they were created',
                condition: (stats.records?.speedCompletions || 0) >= 5,
                xpBonus: 300
            },
            {
                type: 'speed_demon_25',
                name: 'Lightning Fast',
                description: 'Complete 25 quests on the same day they were created',
                condition: (stats.records?.speedCompletions || 0) >= 25,
                xpBonus: 1000
            },
            {
                type: 'perfect_week_1',
                name: 'Perfect Week',
                description: 'Complete all weekly goals in a single week',
                condition: (stats.records?.perfectWeeks || 0) >= 1,
                xpBonus: 500
            },
            {
                type: 'perfect_week_5',
                name: 'Consistency King',
                description: 'Complete all weekly goals 5 times',
                condition: (stats.records?.perfectWeeks || 0) >= 5,
                xpBonus: 2000
            },
            {
                type: 'perfect_week_10',
                name: 'Unstoppable',
                description: 'Complete all weekly goals 10 times',
                condition: (stats.records?.perfectWeeks || 0) >= 10,
                xpBonus: 5000
            },

            // === RECORD BREAKERS ===
            {
                type: 'big_quest_300',
                name: 'Big Game Hunter',
                description: 'Complete a single quest worth 300+ XP',
                condition: (stats.records?.bestSingleQuestXP || 0) >= 300,
                xpBonus: 200
            },
            {
                type: 'big_quest_500',
                name: 'Whale Hunter',
                description: 'Complete a single quest worth 500+ XP',
                condition: (stats.records?.bestSingleQuestXP || 0) >= 500,
                xpBonus: 500
            },
            {
                type: 'daily_xp_1000',
                name: 'Power Day',
                description: 'Earn 1,000+ XP in a single day',
                condition: (stats.records?.bestDailyXP || 0) >= 1000,
                xpBonus: 400
            },
            {
                type: 'daily_xp_2500',
                name: 'Super Grind Day',
                description: 'Earn 2,500+ XP in a single day',
                condition: (stats.records?.bestDailyXP || 0) >= 2500,
                xpBonus: 1000
            },
            {
                type: 'daily_xp_5000',
                name: 'Legendary Day',
                description: 'Earn 5,000+ XP in a single day',
                condition: (stats.records?.bestDailyXP || 0) >= 5000,
                xpBonus: 3000
            },
            {
                type: 'weekly_xp_5000',
                name: 'Productive Week',
                description: 'Earn 5,000+ XP in a single week',
                condition: (stats.records?.bestWeeklyXP || 0) >= 5000,
                xpBonus: 500
            },
            {
                type: 'weekly_xp_10000',
                name: 'Beast Mode Week',
                description: 'Earn 10,000+ XP in a single week',
                condition: (stats.records?.bestWeeklyXP || 0) >= 10000,
                xpBonus: 1500
            },
            {
                type: 'weekly_xp_20000',
                name: 'Absolute Unit',
                description: 'Earn 20,000+ XP in a single week',
                condition: (stats.records?.bestWeeklyXP || 0) >= 20000,
                xpBonus: 5000
            },

            // === SECRET / HIDDEN ACHIEVEMENTS ===
            {
                type: 'all_easy_10',
                name: 'Warm Up Complete',
                description: 'Complete 10 Easy quests to build momentum',
                condition: (stats.questsByComplexity?.easy || 0) >= 10,
                xpBonus: 100
            },
            {
                type: 'balanced_complexity',
                name: 'Well Rounded',
                description: 'Complete 10+ quests in Easy, Medium, and Hard',
                condition: (stats.questsByComplexity?.easy || 0) >= 10 &&
                    (stats.questsByComplexity?.medium || 0) >= 10 &&
                    (stats.questsByComplexity?.hard || 0) >= 10,
                xpBonus: 1500
            },
            {
                type: 'streak_comeback',
                name: 'Phoenix Rising',
                description: 'Build a streak after losing one (reach 7+ streak again)',
                condition: stats.streak >= 7 && (stats.records?.longestStreak || 0) > stats.streak,
                xpBonus: 300
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
