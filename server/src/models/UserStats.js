import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
    // Single user mode - only one stats document
    totalXP: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    currentLevelXP: {
        type: Number,
        default: 0
    },
    xpToNextLevel: {
        type: Number,
        default: 100
    },
    streak: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: Date,
        default: null
    },
    questsCompleted: {
        type: Number,
        default: 0
    },
    questsByType: {
        youtube: { type: Number, default: 0 },
        dsa: { type: Number, default: 0 },
        task: { type: Number, default: 0 }
    },
    achievements: [{
        type: { type: String },
        name: String,
        description: String,
        earnedAt: Date,
        xpBonus: Number
    }],
    weeklyStats: [{
        weekStart: Date,
        questsCompleted: Number,
        xpEarned: Number,
        spilledQuests: Number
    }]
}, {
    timestamps: true
});

// Calculate XP needed for a given level (exponential curve)
userStatsSchema.statics.getXPForLevel = function (level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Method to add XP and handle leveling
userStatsSchema.methods.addXP = async function (amount) {
    this.totalXP += amount;
    this.currentLevelXP += amount;

    // Check for level up - MANUAL NOW
    // while (this.currentLevelXP >= this.xpToNextLevel) {
    //     this.currentLevelXP -= this.xpToNextLevel;
    //     this.level += 1;
    //     this.xpToNextLevel = this.constructor.getXPForLevel(this.level + 1);
    // }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.lastActiveDate) {
        const lastActive = new Date(this.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            this.streak += 1;
        } else if (diffDays > 1) {
            this.streak = 1;
        }
    } else {
        this.streak = 1;
    }

    this.lastActiveDate = today;
    await this.save();

    return {
        totalXP: this.totalXP,
        level: this.level,
        currentLevelXP: this.currentLevelXP,
        xpToNextLevel: this.xpToNextLevel,
        streak: this.streak
    };
};

// Method to manually level up
userStatsSchema.methods.levelUp = async function () {
    if (this.currentLevelXP >= this.xpToNextLevel) {
        this.currentLevelXP -= this.xpToNextLevel;
        this.level += 1;
        this.xpToNextLevel = this.constructor.getXPForLevel(this.level + 1);
        await this.save();
        return {
            level: this.level,
            currentLevelXP: this.currentLevelXP,
            xpToNextLevel: this.xpToNextLevel
        };
    }
    throw new Error('Not enough XP to level up');
};

// Get or create stats (single user mode)
userStatsSchema.statics.getStats = async function () {
    let stats = await this.findOne();
    if (!stats) {
        stats = await this.create({});
    }
    return stats;
};

const UserStats = mongoose.model('UserStats', userStatsSchema);

export default UserStats;
