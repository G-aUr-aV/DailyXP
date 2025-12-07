import express from 'express';
import { analyzeQuestComplexity, generateDailyEmail, testLLMConnection } from '../llm/index.js';
import Quest from '../models/Quest.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// GET /api/llm/status - Check LLM service status
router.get('/status', async (req, res, next) => {
    try {
        const status = await testLLMConnection();
        res.json(status);
    } catch (error) {
        next(error);
    }
});

// POST /api/llm/analyze - Manually trigger complexity analysis for a quest
router.post('/analyze/:questId', async (req, res, next) => {
    try {
        const quest = await Quest.findById(req.params.questId);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        const analysis = await analyzeQuestComplexity(quest);

        if (analysis) {
            quest.complexity = analysis.complexity;
            quest.xpReward = analysis.xpReward;
            quest.llmAnalysis = {
                reasoning: analysis.reasoning,
                analyzedAt: new Date()
            };
            await quest.save();
        }

        res.json({ quest, analysis });
    } catch (error) {
        next(error);
    }
});

// POST /api/llm/daily-email - Generate daily email content (for testing)
router.post('/daily-email', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        const currentMonday = Quest.getCurrentMonday();
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        const pendingQuests = await Quest.find({
            status: 'active',
            targetWeek: { $gte: currentMonday, $lt: nextMonday }
        }).sort({ deadline: 1 });

        const emailContent = await generateDailyEmail(stats, pendingQuests);

        res.json({
            subject: emailContent.subject,
            body: emailContent.body,
            generatedAt: new Date()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
