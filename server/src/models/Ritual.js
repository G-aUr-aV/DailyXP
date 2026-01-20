import mongoose from 'mongoose';

const ritualSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
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
    isActive: {
        type: Boolean,
        default: true
    },
    // Identifier for custom ritual logic (e.g., 'workout', 'meditation', 'reading')
    // This allows different rituals to have different generation/completion behavior
    generatorType: {
        type: String,
        default: 'generic'
    },
    // Custom metadata for ritual-specific data
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Tracking stats for the ritual
    stats: {
        totalGenerated: { type: Number, default: 0 },
        totalCompleted: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 },
        lastCompletedDate: { type: Date, default: null }
    }
}, {
    timestamps: true
});

// Virtual for completion rate
ritualSchema.virtual('completionRate').get(function () {
    if (this.stats.totalGenerated === 0) return 0;
    return Math.round((this.stats.totalCompleted / this.stats.totalGenerated) * 100);
});

// Static method to get today's start (midnight)
ritualSchema.statics.getTodayStart = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Static method to get today's end (23:59:59)
ritualSchema.statics.getTodayEnd = function () {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};

// Method to check if streak should be broken
ritualSchema.methods.checkStreak = function () {
    if (!this.stats.lastCompletedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = new Date(this.stats.lastCompletedDate);
    lastCompleted.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

    // If more than 1 day has passed, streak is broken
    if (daysDiff > 1) {
        this.stats.currentStreak = 0;
    }
};

// Method to update streak on completion
ritualSchema.methods.recordCompletion = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = this.stats.lastCompletedDate
        ? new Date(this.stats.lastCompletedDate)
        : null;

    if (lastCompleted) {
        lastCompleted.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            // Consecutive day - increment streak
            this.stats.currentStreak += 1;
        } else if (daysDiff > 1) {
            // Streak broken - reset to 1
            this.stats.currentStreak = 1;
        }
        // If daysDiff === 0, same day completion - don't change streak
    } else {
        // First completion ever
        this.stats.currentStreak = 1;
    }

    // Update best streak if current is higher
    if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
    }

    this.stats.totalCompleted += 1;
    this.stats.lastCompletedDate = new Date();
};

// Index for efficient queries
ritualSchema.index({ isActive: 1 });
ritualSchema.index({ generatorType: 1 });

const Ritual = mongoose.model('Ritual', ritualSchema);

export default Ritual;
