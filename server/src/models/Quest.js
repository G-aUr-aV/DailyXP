import mongoose from 'mongoose';

const questSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['youtube', 'dsa', 'task'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'spilled'],
        default: 'active'
    },
    xpReward: {
        type: Number,
        default: 50
    },
    complexity: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'epic'],
        default: 'medium'
    },
    deadline: {
        type: Date,
        default: function () {
            return Quest.getNextMonday();
        }
    },
    targetWeek: {
        type: Date,
        default: function () {
            return Quest.getCurrentMonday();
        }
    },
    completedAt: {
        type: Date,
        default: null
    },
    spillCount: {
        type: Number,
        default: 0
    },

    // YouTube specific fields
    youtube: {
        videoId: String,
        videoUrl: String,
        videoTitle: String,
        duration: Number, // Total duration in seconds
        currentTime: { type: Number, default: 0 },
        thumbnailUrl: String,
        completed: { type: Boolean, default: false }
    },

    // DSA problem specific fields
    dsa: {
        platform: String,
        problemUrl: String,
        difficulty: String,
        rating: Number,
        topics: [String],
        problemNumber: String
    },

    // LLM analysis data
    llmAnalysis: {
        reasoning: String,
        analyzedAt: Date
    },

    // Status of the background analysis
    analysisStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },

    // Timer feature - tracks work duration on tasks
    timer: {
        enabled: { type: Boolean, default: false },
        currentTime: { type: Number, default: 0 }, // Elapsed seconds
        isRunning: { type: Boolean, default: false },
        lastStartedAt: { type: Date }, // When timer was last started
        alarmEnabled: { type: Boolean, default: false },
        alarmSeconds: { type: Number, default: 60 }, // Alarm after N seconds (default 1 min)
        alarmTriggered: { type: Boolean, default: false },
        pauseHistory: [{
            pausedAt: { type: Date, required: true },
            resumedAt: { type: Date },
            duration: { type: Number, required: true }, // Session duration in seconds
            reason: { type: String, default: '' }
        }]
    }
}, {
    timestamps: true
});

// Static method to get next Monday
questSchema.statics.getNextMonday = function () {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
};

// Static method to get current week's Monday
questSchema.statics.getCurrentMonday = function () {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
};

// Virtual for XP display with complexity multiplier
questSchema.virtual('displayXP').get(function () {
    const multipliers = {
        easy: 1,
        medium: 2,
        hard: 4,
        epic: 10
    };
    return this.xpReward * (multipliers[this.complexity] || 1);
});

// Virtual for days until deadline
questSchema.virtual('daysRemaining').get(function () {
    if (!this.deadline) return null;
    const now = new Date();
    const diff = this.deadline - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
questSchema.index({ status: 1, targetWeek: 1 });
questSchema.index({ type: 1 });
questSchema.index({ 'youtube.videoId': 1 }); // For extension API lookups

const Quest = mongoose.model('Quest', questSchema);

export default Quest;
