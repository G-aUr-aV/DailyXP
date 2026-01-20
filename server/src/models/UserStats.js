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
    // Track quests by complexity level
    questsByComplexity: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
        epic: { type: Number, default: 0 }
    },
    // Track records for achievement unlocks
    records: {
        bestSingleQuestXP: { type: Number, default: 0 },
        bestDailyXP: { type: Number, default: 0 },
        bestWeeklyXP: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        totalEpicQuests: { type: Number, default: 0 },
        totalHardQuests: { type: Number, default: 0 },
        perfectWeeks: { type: Number, default: 0 }, // Weeks with 100%+ completion
        speedCompletions: { type: Number, default: 0 }, // Quests completed same day as created
        weekendWarrior: { type: Number, default: 0 }, // Quests completed on weekends
        earlyBird: { type: Number, default: 0 }, // Quests completed before 9 AM
        nightOwl: { type: Number, default: 0 } // Quests completed after 10 PM
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
    }],
    // Gear Collection & Lootbox System
    gearSystem: {
        keys: { type: Number, default: 0 },
        totalKeysEarned: { type: Number, default: 0 },
        keyMilestonesReached: [String], // ['level_5', 'level_10', 'xp_1000', ...]
        collectedGear: [{
            slot: String,      // 'helmet', 'shoulder', 'amulet', etc.
            rarity: String,    // 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'
            itemId: String,    // 'helmet_common', 'boots_legendary', etc.
            name: String,      // Display name
            lore: String,      // Flavor text
            acquiredAt: { type: Date, default: Date.now }
        }],
        chestsOpened: { type: Number, default: 0 },
        xpBonusPercent: { type: Number, default: 0 },
        lastXPMilestone: { type: Number, default: 0 }, // Track XP milestone for key rewards
        equippedSet: { type: String, default: null } // Which rarity set is equipped: 'common', 'epic', etc.
    }
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
