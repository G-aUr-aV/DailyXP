import express from 'express';
import Ritual from '../models/Ritual.js';
import Quest from '../models/Quest.js';
import { fetchLeetCodeDailyChallenge } from '../services/leetcodeService.js';
import { analyzeQuestComplexity } from '../llm/index.js';

const router = express.Router();

// Helper: Get today's date normalized to midnight
const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Helper: Get today's end (23:59:59)
const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

// Map LeetCode difficulty to complexity
const difficultyToComplexity = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'easy';
        case 'medium': return 'medium';
        case 'hard': return 'hard';
        default: return 'medium';
    }
};

// Map complexity to base XP
const complexityToXP = (complexity) => {
    switch (complexity) {
        case 'easy': return 50;
        case 'medium': return 100;
        case 'hard': return 200;
        case 'epic': return 500;
        default: return 100;
    }
};

// Helper: Generate a quest instance for a ritual
const generateQuestForRitual = async (ritual, date = null) => {
    const targetDate = date || getTodayStart();
    const deadline = new Date(targetDate);
    deadline.setHours(23, 59, 59, 999);

    // Check if quest already exists for this ritual + date
    const existing = await Quest.findOne({
        ritualId: ritual._id,
        ritualDate: targetDate
    });

    if (existing) {
        return { quest: existing, created: false };
    }

    let questData = {
        type: 'task',
        title: ritual.name,
        description: ritual.description,
        xpReward: ritual.xpReward,
        complexity: ritual.complexity,
        deadline: deadline,
        targetWeek: Quest.getCurrentMonday(),
        ritualId: ritual._id,
        ritualDate: targetDate,
        analysisStatus: 'completed'
    };

    // Handle custom generator types
    if (ritual.generatorType === 'leetcode-daily') {
        console.log('Generating LeetCode Daily quest...');
        const dailyProblem = await fetchLeetCodeDailyChallenge();

        if (dailyProblem) {
            const complexity = difficultyToComplexity(dailyProblem.difficulty);
            questData = {
                type: 'dsa',
                title: `LC Daily: ${dailyProblem.title}`,
                description: dailyProblem.description?.slice(0, 500) || `LeetCode #${dailyProblem.id}`,
                xpReward: complexityToXP(complexity),
                complexity: complexity,
                deadline: deadline,
                targetWeek: Quest.getCurrentMonday(),
                ritualId: ritual._id,
                ritualDate: targetDate,
                analysisStatus: 'pending', // Let LLM analyze for more accurate XP
                dsa: {
                    platform: 'leetcode',
                    problemUrl: dailyProblem.url,
                    difficulty: dailyProblem.difficulty,
                    topics: dailyProblem.topics || [],
                    problemNumber: dailyProblem.id,
                    platformTitle: dailyProblem.title,
                    platformDescription: dailyProblem.description
                }
            };

            console.log(`LeetCode Daily quest: ${dailyProblem.title} (${complexity})`);
        } else {
            console.warn('Failed to fetch LeetCode Daily, creating fallback quest');
            questData.title = 'LeetCode Daily Challenge';
            questData.description = 'Complete today\'s LeetCode daily problem';
            questData.type = 'dsa';
            questData.dsa = {
                platform: 'leetcode',
                problemUrl: 'https://leetcode.com/problemset/',
                difficulty: 'unknown'
            };
        }
    }

    // Create quest
    const quest = new Quest(questData);
    await quest.save();

    // Trigger LLM analysis for DSA quests
    if (quest.type === 'dsa' && quest.analysisStatus === 'pending') {
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
    }

    // Update ritual stats
    ritual.stats.totalGenerated += 1;
    await ritual.save();

    return { quest, created: true };
};

// GET /api/rituals - List all rituals with today's quest status
router.get('/', async (req, res, next) => {
    try {
        const rituals = await Ritual.find().sort({ createdAt: -1 });
        const todayStart = getTodayStart();

        // Get today's quest status for each ritual
        const ritualsWithStatus = await Promise.all(
            rituals.map(async (ritual) => {
                const todayQuest = await Quest.findOne({
                    ritualId: ritual._id,
                    ritualDate: todayStart
                });

                // Check and update streak if needed
                ritual.checkStreak();

                return {
                    ...ritual.toObject(),
                    todayQuest: todayQuest ? {
                        _id: todayQuest._id,
                        status: todayQuest.status,
                        completedAt: todayQuest.completedAt
                    } : null,
                    completionRate: ritual.completionRate
                };
            })
        );

        res.json(ritualsWithStatus);
    } catch (error) {
        next(error);
    }
});

// POST /api/rituals - Create new ritual
router.post('/', async (req, res, next) => {
    try {
        const { name, description, xpReward, complexity, generatorType, metadata } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Ritual name is required' });
        }

        const ritual = new Ritual({
            name,
            description: description || '',
            xpReward: xpReward || 50,
            complexity: complexity || 'medium',
            generatorType: generatorType || 'generic',
            metadata: metadata || {}
        });

        await ritual.save();

        // Optionally generate today's quest immediately
        const { quest } = await generateQuestForRitual(ritual);

        res.status(201).json({
            ritual,
            todayQuest: quest
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/rituals/:id - Get single ritual with details
router.get('/:id', async (req, res, next) => {
    try {
        const ritual = await Ritual.findById(req.params.id);
        if (!ritual) {
            return res.status(404).json({ error: 'Ritual not found' });
        }

        const todayStart = getTodayStart();
        const todayQuest = await Quest.findOne({
            ritualId: ritual._id,
            ritualDate: todayStart
        });

        // Check streak
        ritual.checkStreak();

        res.json({
            ...ritual.toObject(),
            todayQuest,
            completionRate: ritual.completionRate
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/rituals/:id - Update ritual
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, xpReward, complexity, isActive, generatorType, metadata } = req.body;

        const ritual = await Ritual.findById(req.params.id);
        if (!ritual) {
            return res.status(404).json({ error: 'Ritual not found' });
        }

        if (name) ritual.name = name;
        if (description !== undefined) ritual.description = description;
        if (xpReward !== undefined) ritual.xpReward = xpReward;
        if (complexity) ritual.complexity = complexity;
        if (isActive !== undefined) ritual.isActive = isActive;
        if (generatorType) ritual.generatorType = generatorType;
        if (metadata !== undefined) ritual.metadata = metadata;

        await ritual.save();
        res.json(ritual);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/rituals/:id - Delete ritual (soft delete if has history)
router.delete('/:id', async (req, res, next) => {
    try {
        const ritual = await Ritual.findById(req.params.id);
        if (!ritual) {
            return res.status(404).json({ error: 'Ritual not found' });
        }

        // Check if ritual has any quest history
        const questCount = await Quest.countDocuments({ ritualId: ritual._id });

        if (questCount > 0) {
            // Soft delete - just deactivate
            ritual.isActive = false;
            await ritual.save();
            res.json({ message: 'Ritual deactivated (has history)', ritual });
        } else {
            // Hard delete
            await Ritual.findByIdAndDelete(req.params.id);
            res.json({ message: 'Ritual deleted' });
        }
    } catch (error) {
        next(error);
    }
});

// GET /api/rituals/:id/history - Get completion history for a ritual
router.get('/:id/history', async (req, res, next) => {
    try {
        const ritual = await Ritual.findById(req.params.id);
        if (!ritual) {
            return res.status(404).json({ error: 'Ritual not found' });
        }

        const { limit = 30, offset = 0 } = req.query;

        // Return full quest documents for displaying as quest cards
        const history = await Quest.find({ ritualId: ritual._id })
            .sort({ ritualDate: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await Quest.countDocuments({ ritualId: ritual._id });

        res.json({
            ritual: {
                _id: ritual._id,
                name: ritual.name,
                stats: ritual.stats
            },
            history,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/rituals/:id/generate - Generate today's quest for a ritual
router.post('/:id/generate', async (req, res, next) => {
    try {
        const ritual = await Ritual.findById(req.params.id);
        if (!ritual) {
            return res.status(404).json({ error: 'Ritual not found' });
        }

        if (!ritual.isActive) {
            return res.status(400).json({ error: 'Ritual is not active' });
        }

        const { quest, created } = await generateQuestForRitual(ritual);

        res.json({
            quest,
            created,
            message: created ? 'Quest generated' : 'Quest already exists for today'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/rituals/generate-daily - Generate today's quests for all active rituals
router.post('/generate-daily', async (req, res, next) => {
    try {
        const activeRituals = await Ritual.find({ isActive: true });
        const results = [];

        for (const ritual of activeRituals) {
            const { quest, created } = await generateQuestForRitual(ritual);
            results.push({
                ritualId: ritual._id,
                ritualName: ritual.name,
                questId: quest._id,
                created
            });
        }

        res.json({
            message: `Processed ${results.length} rituals`,
            results
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/rituals/today/quests - Get all today's ritual quests
router.get('/today/quests', async (req, res, next) => {
    try {
        const todayStart = getTodayStart();

        const quests = await Quest.find({
            ritualId: { $ne: null },
            ritualDate: todayStart
        }).populate('ritualId', 'name generatorType');

        res.json(quests);
    } catch (error) {
        next(error);
    }
});

export default router;
