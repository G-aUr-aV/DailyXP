import express from 'express';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// All possible gear items organized by slot and rarity
const GEAR_DATABASE = {
    helmet: {
        common: { name: "Traveler's Hood", lore: "A simple cloth hood, worn by merchants and wanderers" },
        uncommon: { name: "Iron Helm", lore: "Forged in the fires of the frontier" },
        rare: { name: "Guardian's Crest", lore: "Worn by the royal guards of old" },
        epic: { name: "Dragon Visor", lore: "Scales of a fallen drake, molded into protection" },
        legendary: { name: "Crown of Aeons", lore: "Said to grant visions of time itself" },
        mythic: { name: "Helmet of the Immortal", lore: "Worn by the Prince in his darkest hour" }
    },
    shoulder: {
        common: { name: "Leather Spaulders", lore: "Humble protection for humble warriors" },
        uncommon: { name: "Steel Shoulders", lore: "Cold, reliable defense" },
        rare: { name: "Falcon Pauldrons", lore: "Swift as the desert wind" },
        epic: { name: "Obsidian Mantle", lore: "Carved from volcanic stone" },
        legendary: { name: "Phoenix Wings", lore: "Rise from defeat, reborn in flame" },
        mythic: { name: "Shoulders of Destiny", lore: "The weight of fate rests here" }
    },
    amulet: {
        common: { name: "Stone Pendant", lore: "A simple charm for luck" },
        uncommon: { name: "Silver Talisman", lore: "Blessed by moonlight" },
        rare: { name: "Sapphire Heart", lore: "Holds the ocean's calm" },
        epic: { name: "Eye of Prophecy", lore: "Sees what others cannot" },
        legendary: { name: "Sands of Time", lore: "A fragment of the hourglass" },
        mythic: { name: "Amulet of Kaileena", lore: "Empress's eternal blessing" }
    },
    cape: {
        common: { name: "Tattered Cloak", lore: "Worn but trustworthy" },
        uncommon: { name: "Nomad's Shroud", lore: "Dyed in desert sands" },
        rare: { name: "Silk Mantle", lore: "Woven by palace artisans" },
        epic: { name: "Shadow Veil", lore: "Blend into darkness itself" },
        legendary: { name: "Starweave Cape", lore: "Threads of captured starlight" },
        mythic: { name: "Cloak of the Dahaka", lore: "Torn from fate's guardian" }
    },
    chestplate: {
        common: { name: "Padded Vest", lore: "Basic but dependable" },
        uncommon: { name: "Chainmail Hauberk", lore: "Links of proven steel" },
        rare: { name: "Persian Cuirass", lore: "Ornate royal craftsmanship" },
        epic: { name: "Dragonscale Armor", lore: "Impervious to flame" },
        legendary: { name: "Armor of the Vizier", lore: "Enchanted with ancient magic" },
        mythic: { name: "Breastplate of Zurvan", lore: "God of time and space" }
    },
    gauntlet: {
        common: { name: "Cloth Wraps", lore: "Protection through practice" },
        uncommon: { name: "Studded Gloves", lore: "Extra grip, extra guard" },
        rare: { name: "Brass Knuckles", lore: "Strike with authority" },
        epic: { name: "Claws of the Sandwraith", lore: "Ghostly and devastating" },
        legendary: { name: "Gauntlets of Azad", lore: "Power of the empire" },
        mythic: { name: "Dagger of Time Grip", lore: "The hand that controls fate" }
    },
    belt: {
        common: { name: "Rope Belt", lore: "Simple but effective" },
        uncommon: { name: "Leather Sash", lore: "Comfortable for long journeys" },
        rare: { name: "Warrior's Girdle", lore: "Holds tools of battle" },
        epic: { name: "Serpent Coil", lore: "Alive with dark energy" },
        legendary: { name: "Golden Waistguard", lore: "Mark of a champion" },
        mythic: { name: "Belt of the Prince", lore: "Royal heritage incarnate" }
    },
    boots: {
        common: { name: "Sandals", lore: "Feel the earth beneath" },
        uncommon: { name: "Leather Boots", lore: "Made for the road" },
        rare: { name: "Swift Greaves", lore: "Move like the wind" },
        epic: { name: "Shadowstep Shoes", lore: "Leave no trace" },
        legendary: { name: "Winged Treads", lore: "Defy gravity itself" },
        mythic: { name: "Boots of Farah", lore: "Grace of the warrior princess" }
    }
};

// Rarity configuration with drop rates and colors
const RARITY_CONFIG = {
    common: { dropRate: 40, color: '#8B8B8B', order: 1 },
    uncommon: { dropRate: 25, color: '#2ECC71', order: 2 },
    rare: { dropRate: 18, color: '#3498DB', order: 3 },
    epic: { dropRate: 10, color: '#9B59B6', order: 4 },
    legendary: { dropRate: 5, color: '#F39C12', order: 5 },
    mythic: { dropRate: 2, color: '#E74C3C', order: 6 }
};

const GEAR_SLOTS = ['helmet', 'shoulder', 'amulet', 'cape', 'chestplate', 'gauntlet', 'belt', 'boots'];
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// Key milestone rewards
const KEY_MILESTONES = {
    level_5: { keys: 3, type: 'level', value: 5 },
    level_10: { keys: 5, type: 'level', value: 10 },
    level_15: { keys: 5, type: 'level', value: 15 },
    level_20: { keys: 10, type: 'level', value: 20 },
    level_25: { keys: 10, type: 'level', value: 25 },
    level_50: { keys: 25, type: 'level', value: 50 },
    level_75: { keys: 25, type: 'level', value: 75 },
    level_100: { keys: 50, type: 'level', value: 100 },
    streak_7: { keys: 3, type: 'streak', value: 7 },
    streak_14: { keys: 5, type: 'streak', value: 14 },
    streak_30: { keys: 10, type: 'streak', value: 30 },
    streak_60: { keys: 15, type: 'streak', value: 60 },
    streak_100: { keys: 25, type: 'streak', value: 100 }
};

// Helper: Calculate XP bonus based on equipped rarity set and user level
// Only ONE set can be equipped at a time
function calculateXPBonus(collectedGear, userLevel = 1, equippedSet = null) {
    // Base bonuses for completing a full set (all 8 slots) of a rarity
    const RARITY_BONUS = {
        common: 3,
        uncommon: 5,
        rare: 8,
        epic: 12,
        legendary: 18,
        mythic: 25
    };

    const SLOTS = ['helmet', 'shoulder', 'amulet', 'cape', 'chestplate', 'gauntlet', 'belt', 'boots'];

    const completedSets = [];
    const setProgress = {};

    // Check each rarity for set completion
    for (const rarity of Object.keys(RARITY_BONUS)) {
        const itemsOfRarity = collectedGear.filter(g => g.rarity === rarity);
        const slotsWithRarity = new Set(itemsOfRarity.map(g => g.slot));
        const count = slotsWithRarity.size;

        setProgress[rarity] = count;

        // Full set = all 8 slots have this rarity
        if (count === 8) {
            completedSets.push(rarity);
        }
    }

    // Only apply bonus from equipped set (if it's complete)
    let baseBonus = 0;
    if (equippedSet && completedSets.includes(equippedSet)) {
        baseBonus = RARITY_BONUS[equippedSet];
    }

    // Level scaling: +10% per 10 levels (level 10-19 = 1.1x, 20-29 = 1.2x, etc.)
    const levelMultiplier = 1 + (Math.floor(userLevel / 10) * 0.1);
    const scaledBonus = Math.round(baseBonus * levelMultiplier * 10) / 10;

    // Cap at 100%
    const finalBonus = Math.min(scaledBonus, 100);

    return {
        xpBonus: finalBonus,
        completedSets,
        setProgress,
        levelMultiplier: Math.round(levelMultiplier * 100) / 100,
        equippedSet: equippedSet && completedSets.includes(equippedSet) ? equippedSet : null,
        equippedSetBonus: baseBonus
    };
}

// Helper: Get available items in drop pool (excluding already collected)
function getAvailablePool(collectedGear) {
    const collected = new Set(collectedGear.map(g => g.itemId));
    const pool = [];

    for (const slot of GEAR_SLOTS) {
        for (const rarity of RARITIES) {
            const itemId = `${slot}_${rarity}`;
            if (!collected.has(itemId)) {
                pool.push({
                    slot,
                    rarity,
                    itemId,
                    ...GEAR_DATABASE[slot][rarity],
                    dropRate: RARITY_CONFIG[rarity].dropRate,
                    color: RARITY_CONFIG[rarity].color
                });
            }
        }
    }

    return pool;
}

// Helper: Roll for a random item from the pool
function rollForItem(pool) {
    if (pool.length === 0) return null;

    // Calculate total weight and adjusted probabilities
    const totalWeight = pool.reduce((sum, item) => sum + item.dropRate, 0);
    const roll = Math.random() * totalWeight;

    let cumulative = 0;
    for (const item of pool) {
        cumulative += item.dropRate;
        if (roll <= cumulative) {
            return item;
        }
    }

    // Fallback to last item
    return pool[pool.length - 1];
}

// GET /api/gear - Get current gear collection, keys, and stats
router.get('/', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        const gearSystem = stats.gearSystem || {
            keys: 0,
            totalKeysEarned: 0,
            keyMilestonesReached: [],
            collectedGear: [],
            chestsOpened: 0,
            xpBonusPercent: 0,
            lastXPMilestone: 0
        };

        // Get available pool for reference
        const availablePool = getAvailablePool(gearSystem.collectedGear || []);

        // Organize collected gear by slot
        const gearBySlot = {};
        for (const slot of GEAR_SLOTS) {
            gearBySlot[slot] = (gearSystem.collectedGear || []).find(g => g.slot === slot) || null;
        }

        // Calculate XP bonus with equipped set
        const equippedSet = gearSystem.equippedSet || null;
        const bonusInfo = calculateXPBonus(gearSystem.collectedGear || [], stats.level || 1, equippedSet);

        res.json({
            keys: gearSystem.keys || 0,
            totalKeysEarned: gearSystem.totalKeysEarned || 0,
            collectedGear: gearSystem.collectedGear || [],
            gearBySlot,
            chestsOpened: gearSystem.chestsOpened || 0,
            xpBonusPercent: bonusInfo.xpBonus,
            completedSets: bonusInfo.completedSets,
            setProgress: bonusInfo.setProgress,
            levelMultiplier: bonusInfo.levelMultiplier,
            equippedSet: bonusInfo.equippedSet,
            equippedSetBonus: bonusInfo.equippedSetBonus,
            userLevel: stats.level || 1,
            totalItems: 48,
            collectedCount: (gearSystem.collectedGear || []).length,
            availableCount: availablePool.length,
            slots: GEAR_SLOTS,
            rarityConfig: RARITY_CONFIG,
            gearDatabase: GEAR_DATABASE
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/gear/pool - Get available items in drop pool
router.get('/pool', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();
        const collectedGear = stats.gearSystem?.collectedGear || [];
        const pool = getAvailablePool(collectedGear);

        res.json({
            available: pool,
            totalAvailable: pool.length,
            totalCollected: collectedGear.length,
            totalItems: 48
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/gear/equip - Equip or unequip a rarity set
router.post('/equip', async (req, res, next) => {
    try {
        const { rarity } = req.body; // rarity or null to unequip
        const stats = await UserStats.getStats();

        // Initialize gearSystem if needed
        if (!stats.gearSystem) {
            stats.gearSystem = {
                keys: 0,
                totalKeysEarned: 0,
                keyMilestonesReached: [],
                collectedGear: [],
                chestsOpened: 0,
                xpBonusPercent: 0,
                lastXPMilestone: 0,
                equippedSet: null
            };
        }

        // If unequipping (null), just clear
        if (rarity === null || rarity === undefined) {
            stats.gearSystem.equippedSet = null;
            await stats.save();

            const bonusInfo = calculateXPBonus(stats.gearSystem.collectedGear, stats.level || 1, null);
            stats.gearSystem.xpBonusPercent = bonusInfo.xpBonus;
            await stats.save();

            return res.json({
                success: true,
                message: 'Set unequipped',
                equippedSet: null,
                xpBonusPercent: 0
            });
        }

        // Validate rarity
        const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        if (!validRarities.includes(rarity)) {
            return res.status(400).json({ error: 'Invalid rarity' });
        }

        // Check if set is complete (8/8)
        const collectedGear = stats.gearSystem.collectedGear || [];
        const itemsOfRarity = collectedGear.filter(g => g.rarity === rarity);
        const slotsWithRarity = new Set(itemsOfRarity.map(g => g.slot));

        if (slotsWithRarity.size < 8) {
            return res.status(400).json({
                error: `Cannot equip ${rarity} set - only ${slotsWithRarity.size}/8 pieces collected`
            });
        }

        // Equip the set
        stats.gearSystem.equippedSet = rarity;
        const bonusInfo = calculateXPBonus(collectedGear, stats.level || 1, rarity);
        stats.gearSystem.xpBonusPercent = bonusInfo.xpBonus;

        await stats.save();

        res.json({
            success: true,
            message: `${rarity} set equipped`,
            equippedSet: rarity,
            xpBonusPercent: bonusInfo.xpBonus,
            equippedSetBonus: bonusInfo.equippedSetBonus,
            levelMultiplier: bonusInfo.levelMultiplier
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/gear/open-chest - Open a chest using 1 key
router.post('/open-chest', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();

        // Initialize gearSystem if not exists
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

        // Check if user has keys
        if (stats.gearSystem.keys < 1) {
            return res.status(400).json({
                error: 'Not enough keys',
                keysRequired: 1,
                keysAvailable: stats.gearSystem.keys
            });
        }

        // Get available pool
        const pool = getAvailablePool(stats.gearSystem.collectedGear || []);

        if (pool.length === 0) {
            return res.status(400).json({
                error: 'All items collected!',
                message: 'Congratulations, you have collected all gear!'
            });
        }

        // Roll for item
        const wonItem = rollForItem(pool);

        // Deduct key and add item
        stats.gearSystem.keys -= 1;
        stats.gearSystem.chestsOpened += 1;

        const newGearItem = {
            slot: wonItem.slot,
            rarity: wonItem.rarity,
            itemId: wonItem.itemId,
            name: wonItem.name,
            lore: wonItem.lore,
            acquiredAt: new Date()
        };

        stats.gearSystem.collectedGear.push(newGearItem);

        // Recalculate XP bonus with equipped set
        const equippedSet = stats.gearSystem.equippedSet || null;
        const bonusInfo = calculateXPBonus(stats.gearSystem.collectedGear, stats.level || 1, equippedSet);

        // Auto-equip first completed set if none is equipped
        if (!stats.gearSystem.equippedSet && bonusInfo.completedSets.length > 0) {
            stats.gearSystem.equippedSet = bonusInfo.completedSets[0];
            // Recalculate with the new equipped set
            const newBonusInfo = calculateXPBonus(stats.gearSystem.collectedGear, stats.level || 1, stats.gearSystem.equippedSet);
            stats.gearSystem.xpBonusPercent = newBonusInfo.xpBonus;
        } else {
            stats.gearSystem.xpBonusPercent = bonusInfo.xpBonus;
        }

        await stats.save();

        // Final bonus info for response
        const finalBonusInfo = calculateXPBonus(stats.gearSystem.collectedGear, stats.level || 1, stats.gearSystem.equippedSet);

        res.json({
            success: true,
            reward: {
                ...newGearItem,
                color: RARITY_CONFIG[wonItem.rarity].color,
                rarityOrder: RARITY_CONFIG[wonItem.rarity].order
            },
            keysRemaining: stats.gearSystem.keys,
            chestsOpened: stats.gearSystem.chestsOpened,
            collectedCount: stats.gearSystem.collectedGear.length,
            xpBonusPercent: finalBonusInfo.xpBonus,
            completedSets: finalBonusInfo.completedSets,
            setProgress: finalBonusInfo.setProgress,
            equippedSet: stats.gearSystem.equippedSet,
            isNewSlot: !stats.gearSystem.collectedGear.some(g => g.slot === wonItem.slot && g.itemId !== wonItem.itemId)
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/gear/award-keys - Award keys (called internally or via API)
router.post('/award-keys', async (req, res, next) => {
    try {
        const { amount, reason } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({ error: 'Invalid key amount' });
        }

        const stats = await UserStats.getStats();

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

        stats.gearSystem.keys += amount;
        stats.gearSystem.totalKeysEarned += amount;

        await stats.save();

        res.json({
            success: true,
            keysAwarded: amount,
            reason: reason || 'Manual award',
            totalKeys: stats.gearSystem.keys,
            totalKeysEarned: stats.gearSystem.totalKeysEarned
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/gear/check-milestones - Check and award key milestones
router.post('/check-milestones', async (req, res, next) => {
    try {
        const stats = await UserStats.getStats();

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

        const newMilestones = [];
        const reachedMilestones = stats.gearSystem.keyMilestonesReached || [];

        // Check level milestones
        for (const [milestoneId, config] of Object.entries(KEY_MILESTONES)) {
            if (reachedMilestones.includes(milestoneId)) continue;

            let qualified = false;
            if (config.type === 'level' && stats.level >= config.value) {
                qualified = true;
            } else if (config.type === 'streak' && stats.streak >= config.value) {
                qualified = true;
            }

            if (qualified) {
                stats.gearSystem.keys += config.keys;
                stats.gearSystem.totalKeysEarned += config.keys;
                stats.gearSystem.keyMilestonesReached.push(milestoneId);
                newMilestones.push({
                    id: milestoneId,
                    keys: config.keys,
                    ...config
                });
            }
        }

        // Check XP milestones (1 key per 1000 XP)
        const xpMilestoneInterval = 1000;
        const currentXPMilestone = Math.floor(stats.totalXP / xpMilestoneInterval);
        const lastXPMilestone = stats.gearSystem.lastXPMilestone || 0;

        if (currentXPMilestone > lastXPMilestone) {
            const keysToAward = currentXPMilestone - lastXPMilestone;
            stats.gearSystem.keys += keysToAward;
            stats.gearSystem.totalKeysEarned += keysToAward;
            stats.gearSystem.lastXPMilestone = currentXPMilestone;

            newMilestones.push({
                id: `xp_${currentXPMilestone * xpMilestoneInterval}`,
                keys: keysToAward,
                type: 'xp',
                value: currentXPMilestone * xpMilestoneInterval
            });
        }

        // Award keys for level up (2 keys per level) - checked via levelKeysAwarded

        await stats.save();

        res.json({
            success: true,
            newMilestones,
            totalKeys: stats.gearSystem.keys,
            totalKeysEarned: stats.gearSystem.totalKeysEarned
        });
    } catch (error) {
        next(error);
    }
});

export default router;
