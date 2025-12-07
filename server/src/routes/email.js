import express from 'express';
import { sendDailyEmail, testEmailConnection } from '../services/emailService.js';

const router = express.Router();

// GET /api/email/status - Check email service status
router.get('/status', async (req, res) => {
    const result = await testEmailConnection();
    res.json(result);
});

// POST /api/email/test - Send test email
router.post('/test', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email address required' });
    }

    const result = await testEmailConnection(email);
    res.json(result);
});

// POST /api/email/send-daily - Manually trigger daily email
router.post('/send-daily', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email address required' });
    }

    const result = await sendDailyEmail(email);
    res.json(result);
});

export default router;
