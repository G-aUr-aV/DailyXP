import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { generateDailyEmail } from '../llm/index.js';
import UserStats from '../models/UserStats.js';
import Quest from '../models/Quest.js';

let transporter = null;

/**
 * Initialize email transporter
 */
export function initializeEmailService() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('📧 Email service: Not configured (missing SMTP credentials)');
        return false;
    }

    try {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT) || 587,
            secure: parseInt(SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        console.log('📧 Email service: Configured successfully');
        return true;
    } catch (error) {
        console.error('📧 Email service: Failed to initialize', error.message);
        return false;
    }
}

/**
 * Send daily coaching email
 */
export async function sendDailyEmail(recipientEmail) {
    if (!transporter) {
        console.log('📧 Email service not configured, skipping daily email');
        return { sent: false, reason: 'Email service not configured' };
    }

    try {
        // Get user stats and pending quests
        const stats = await UserStats.getStats();
        const currentMonday = Quest.getCurrentMonday();
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        const pendingQuests = await Quest.find({
            status: 'active',
            targetWeek: { $gte: currentMonday, $lt: nextMonday }
        }).sort({ deadline: 1 });

        // Generate email content with LLM
        const emailContent = await generateDailyEmail(stats, pendingQuests);

        // Send email
        const info = await transporter.sendMail({
            from: `"DailyXP Coach" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: emailContent.subject,
            html: emailContent.body
        });

        console.log('📧 Daily email sent:', info.messageId);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error('📧 Failed to send daily email:', error.message);
        return { sent: false, error: error.message };
    }
}

/**
 * Schedule daily email and weekly spillage processing
 */
export function scheduleJobs() {
    // Daily email at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running daily email job...');
        const recipientEmail = process.env.DAILY_EMAIL_RECIPIENT;
        if (recipientEmail) {
            await sendDailyEmail(recipientEmail);
        } else {
            console.log('📧 No recipient email configured (DAILY_EMAIL_RECIPIENT)');
        }
    }, {
        timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    });

    // Weekly spillage processing - Every Monday at 12:00 AM
    cron.schedule('0 0 * * 1', async () => {
        console.log('⏰ Processing weekly spillage...');
        try {
            const currentMonday = Quest.getCurrentMonday();

            const result = await Quest.updateMany(
                {
                    status: 'active',
                    targetWeek: { $lt: currentMonday }
                },
                {
                    $set: { targetWeek: currentMonday },
                    $inc: { spillCount: 1 }
                }
            );

            console.log(`📋 Spillage processed: ${result.modifiedCount} quests moved to current week`);
        } catch (error) {
            console.error('❌ Spillage processing failed:', error.message);
        }
    }, {
        timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    });

    console.log('⏰ Cron jobs scheduled: Daily email (9 AM), Weekly spillage (Monday 12:01 AM)');
}

/**
 * Test email configuration by sending a test email
 */
export async function testEmailConnection(recipientEmail) {
    if (!transporter) {
        return { success: false, error: 'Email service not configured' };
    }

    try {
        await transporter.verify();

        if (recipientEmail) {
            await transporter.sendMail({
                from: `"DailyXP Coach" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject: '🎮 DailyXP Email Test - Connection Successful!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 30px; border-radius: 15px;">
            <h1 style="color: #ffd700;">✅ Email Connection Successful!</h1>
            <p>Your DailyXP email service is configured correctly. You'll receive daily coaching emails at 9 AM.</p>
            <p style="color: #888; font-size: 14px; margin-top: 20px;">
              "The journey of a thousand quests begins with a single step." - Your Coach
            </p>
          </div>
        `
            });
            return { success: true, message: 'Test email sent successfully' };
        }

        return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export default {
    initializeEmailService,
    sendDailyEmail,
    scheduleJobs,
    testEmailConnection
};
