import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import questRoutes from './routes/quests.js';
import videoProgressRoutes from './routes/videoProgress.js';
import statsRoutes from './routes/stats.js';
import llmRoutes from './routes/llm.js';
import emailRoutes from './routes/email.js';
import extensionRoutes from './routes/extension.js';
import gearRoutes from './routes/gear.js';
import ritualsRoutes from './routes/rituals.js';

// Import services
import { initializeEmailService, scheduleJobs } from './services/emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CLIENT_URL || 'http://localhost:5173',
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        // Also allow browser extension origins (chrome-extension://, moz-extension://)
        if (!origin ||
            allowedOrigins.includes(origin) ||
            origin.startsWith('chrome-extension://') ||
            origin.startsWith('moz-extension://')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for development - tighten in production
        }
    },
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/api/quests', questRoutes);
app.use('/api/video-progress', videoProgressRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/gear', gearRoutes);
app.use('/api/rituals', ritualsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// MongoDB connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyxp');
        console.log(`🎮 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    await connectDB();

    // Initialize email service and cron jobs
    initializeEmailService();
    scheduleJobs();

    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════╗
║     🎮 DailyXP Server Running! 🎮              ║
║     Port: ${PORT}                               ║
║     Mode: ${process.env.NODE_ENV || 'development'}                      ║
╚═══════════════════════════════════════════════╝
    `);
    });
};

startServer();

export default app;
