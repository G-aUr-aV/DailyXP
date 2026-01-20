import { useState, useEffect, useMemo } from 'react';
import { statsAPI } from '../services/api';

function Achievements() {
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTier, setSelectedTier] = useState(null); // null means show all tiers
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unlocked', 'locked'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Tier configuration with colors and rarity
    const tierConfig = {
        Bronze: {
            gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
            glow: 'rgba(205, 127, 50, 0.4)',
            border: '#CD7F32',
            rarity: 'Common'
        },
        Silver: {
            gradient: 'linear-gradient(135deg, #C0C0C0 0%, #708090 100%)',
            glow: 'rgba(192, 192, 192, 0.4)',
            border: '#C0C0C0',
            rarity: 'Uncommon'
        },
        Gold: {
            gradient: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
            glow: 'rgba(255, 215, 0, 0.5)',
            border: '#FFD700',
            rarity: 'Rare'
        },
        Platinum: {
            gradient: 'linear-gradient(135deg, #E5E4E2 0%, #A0D0D0 100%)',
            glow: 'rgba(160, 208, 208, 0.5)',
            border: '#A0D0D0',
            rarity: 'Epic'
        },
        Diamond: {
            gradient: 'linear-gradient(135deg, #B9F2FF 0%, #00BFFF 100%)',
            glow: 'rgba(185, 242, 255, 0.6)',
            border: '#00BFFF',
            rarity: 'Legendary'
        }
    };

    // Category icons for visual appeal
    const categoryIcons = {
        'Milestone': '🏅',
        'Streak': '🔥',
        'Level': '⬆️',
        'YouTube': '📺',
        'DSA': '💻',
        'Task': '📋',
        'XP': '✨',
        'Diversity': '🌈',
        'Complexity': '💀',
        'Time': '⏰',
        'Speed': '⚡',
        'Records': '🏆',
        'Secret': '🔮'
    };

    // All possible achievements - synchronized with backend
    // Using sprite sheets: weapons, artifacts, armor, treasures, magic (each 8 icons in 2x4 or 4x2 layout)
    const allAchievements = useMemo(() => [
        // === MILESTONE ACHIEVEMENTS === (weapons sprite)
        { type: 'first_quest', name: 'First Blood', description: 'Complete your first quest', sprite: { sheet: 'weapons', row: 0, col: 0 }, xpBonus: 50, category: 'Milestone', tier: 'Bronze' },
        { type: 'quests_10', name: 'Getting Started', description: 'Complete 10 quests', sprite: { sheet: 'weapons', row: 0, col: 1 }, xpBonus: 100, category: 'Milestone', tier: 'Bronze' },
        { type: 'quests_25', name: 'Dedicated', description: 'Complete 25 quests', sprite: { sheet: 'weapons', row: 0, col: 2 }, xpBonus: 200, category: 'Milestone', tier: 'Silver' },
        { type: 'quests_50', name: 'Half Century', description: 'Complete 50 quests', sprite: { sheet: 'weapons', row: 0, col: 3 }, xpBonus: 400, category: 'Milestone', tier: 'Silver' },
        { type: 'century', name: 'Century Club', description: 'Complete 100 quests', sprite: { sheet: 'weapons', row: 1, col: 0 }, xpBonus: 1000, category: 'Milestone', tier: 'Gold' },
        { type: 'quests_250', name: 'Quest Enthusiast', description: 'Complete 250 quests', sprite: { sheet: 'weapons', row: 1, col: 1 }, xpBonus: 2500, category: 'Milestone', tier: 'Platinum' },
        { type: 'quests_500', name: 'Quest Addict', description: 'Complete 500 quests', sprite: { sheet: 'weapons', row: 1, col: 2 }, xpBonus: 5000, category: 'Milestone', tier: 'Diamond' },
        { type: 'quests_1000', name: 'Quest Legend', description: 'Complete 1000 quests', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 10000, category: 'Milestone', tier: 'Diamond' },

        // === STREAK ACHIEVEMENTS === (artifacts sprite - hourglass/time themed)
        { type: 'streak_3', name: 'Hat Trick', description: 'Maintain a 3-day streak', sprite: { sheet: 'artifacts', row: 0, col: 0 }, xpBonus: 100, category: 'Streak', tier: 'Bronze' },
        { type: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', sprite: { sheet: 'artifacts', row: 0, col: 1 }, xpBonus: 250, category: 'Streak', tier: 'Silver' },
        { type: 'streak_14', name: 'Fortnight Fighter', description: 'Maintain a 14-day streak', sprite: { sheet: 'artifacts', row: 0, col: 2 }, xpBonus: 500, category: 'Streak', tier: 'Silver' },
        { type: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', sprite: { sheet: 'artifacts', row: 0, col: 3 }, xpBonus: 1000, category: 'Streak', tier: 'Gold' },
        { type: 'streak_60', name: 'Two Month Titan', description: 'Maintain a 60-day streak', sprite: { sheet: 'artifacts', row: 1, col: 0 }, xpBonus: 2000, category: 'Streak', tier: 'Platinum' },
        { type: 'streak_100', name: 'Century Streak', description: 'Maintain a 100-day streak', sprite: { sheet: 'artifacts', row: 1, col: 1 }, xpBonus: 5000, category: 'Streak', tier: 'Diamond' },
        { type: 'streak_365', name: 'Year of Dedication', description: 'Maintain a 365-day streak', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 25000, category: 'Streak', tier: 'Diamond' },

        // === LEVEL ACHIEVEMENTS === (armor sprite)
        { type: 'level_5', name: 'Rising Star', description: 'Reach level 5', sprite: { sheet: 'armor', row: 0, col: 0 }, xpBonus: 200, category: 'Level', tier: 'Bronze' },
        { type: 'level_10', name: 'Veteran', description: 'Reach level 10', sprite: { sheet: 'armor', row: 0, col: 1 }, xpBonus: 500, category: 'Level', tier: 'Silver' },
        { type: 'level_15', name: 'Seasoned Pro', description: 'Reach level 15', sprite: { sheet: 'armor', row: 0, col: 2 }, xpBonus: 750, category: 'Level', tier: 'Silver' },
        { type: 'level_20', name: 'Elite', description: 'Reach level 20', sprite: { sheet: 'armor', row: 0, col: 3 }, xpBonus: 1000, category: 'Level', tier: 'Gold' },
        { type: 'level_25', name: 'Legend', description: 'Reach level 25', sprite: { sheet: 'armor', row: 1, col: 0 }, xpBonus: 2000, category: 'Level', tier: 'Gold' },
        { type: 'level_50', name: 'Grandmaster', description: 'Reach level 50', sprite: { sheet: 'armor', row: 1, col: 1 }, xpBonus: 5000, category: 'Level', tier: 'Platinum' },
        { type: 'level_75', name: 'Mythic', description: 'Reach level 75', sprite: { sheet: 'armor', row: 1, col: 2 }, xpBonus: 7500, category: 'Level', tier: 'Diamond' },
        { type: 'level_100', name: 'Transcendent', description: 'Reach level 100', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 15000, category: 'Level', tier: 'Diamond' },

        // === YOUTUBE MASTERY === (magic sprite - knowledge/scrolls)
        { type: 'video_master', name: 'Video Scholar', description: 'Complete 10 YouTube quests', sprite: { sheet: 'magic', row: 0, col: 0 }, xpBonus: 300, category: 'YouTube', tier: 'Bronze' },
        { type: 'video_expert', name: 'Video Expert', description: 'Complete 25 YouTube quests', sprite: { sheet: 'magic', row: 0, col: 1 }, xpBonus: 600, category: 'YouTube', tier: 'Silver' },
        { type: 'video_guru', name: 'Video Guru', description: 'Complete 50 YouTube quests', sprite: { sheet: 'magic', row: 0, col: 2 }, xpBonus: 1200, category: 'YouTube', tier: 'Gold' },
        { type: 'video_legend', name: 'Video Legend', description: 'Complete 100 YouTube quests', sprite: { sheet: 'magic', row: 0, col: 3 }, xpBonus: 2500, category: 'YouTube', tier: 'Platinum' },

        // === DSA MASTERY === (magic sprite - arcane/knowledge)
        { type: 'dsa_master', name: 'Algorithm Ace', description: 'Complete 10 DSA quests', sprite: { sheet: 'magic', row: 1, col: 0 }, xpBonus: 300, category: 'DSA', tier: 'Bronze' },
        { type: 'dsa_expert', name: 'Code Warrior', description: 'Complete 25 DSA quests', sprite: { sheet: 'magic', row: 1, col: 1 }, xpBonus: 600, category: 'DSA', tier: 'Silver' },
        { type: 'dsa_guru', name: 'Algorithm Architect', description: 'Complete 50 DSA quests', sprite: { sheet: 'magic', row: 1, col: 2 }, xpBonus: 1200, category: 'DSA', tier: 'Gold' },
        { type: 'dsa_legend', name: 'Competitive Programmer', description: 'Complete 100 DSA quests', sprite: { sheet: 'magic', row: 1, col: 3 }, xpBonus: 2500, category: 'DSA', tier: 'Platinum' },

        // === TASK MASTERY === (armor sprite - tools/utility)
        { type: 'task_master', name: 'Task Titan', description: 'Complete 10 Task quests', sprite: { sheet: 'armor', row: 1, col: 3 }, xpBonus: 300, category: 'Task', tier: 'Bronze' },
        { type: 'task_expert', name: 'Task Terminator', description: 'Complete 25 Task quests', sprite: { sheet: 'weapons', row: 1, col: 3 }, xpBonus: 600, category: 'Task', tier: 'Silver' },
        { type: 'task_guru', name: 'Productivity Pro', description: 'Complete 50 Task quests', sprite: { sheet: 'artifacts', row: 1, col: 2 }, xpBonus: 1200, category: 'Task', tier: 'Gold' },
        { type: 'task_legend', name: 'Task Force One', description: 'Complete 100 Task quests', sprite: { sheet: 'artifacts', row: 1, col: 3 }, xpBonus: 2500, category: 'Task', tier: 'Platinum' },

        // === XP MILESTONES === (treasures sprite)
        { type: 'xp_1k', name: 'XP Starter', description: 'Earn 1,000 total XP', sprite: { sheet: 'treasures', row: 0, col: 2 }, xpBonus: 100, category: 'XP', tier: 'Bronze' },
        { type: 'xp_5k', name: 'XP Hunter', description: 'Earn 5,000 total XP', sprite: { sheet: 'treasures', row: 0, col: 1 }, xpBonus: 300, category: 'XP', tier: 'Bronze' },
        { type: 'xp_10k', name: 'XP Collector', description: 'Earn 10,000 total XP', sprite: { sheet: 'treasures', row: 0, col: 3 }, xpBonus: 500, category: 'XP', tier: 'Silver' },
        { type: 'xp_25k', name: 'XP Hoarder', description: 'Earn 25,000 total XP', sprite: { sheet: 'treasures', row: 1, col: 0 }, xpBonus: 1000, category: 'XP', tier: 'Silver' },
        { type: 'xp_50k', name: 'XP Baron', description: 'Earn 50,000 total XP', sprite: { sheet: 'treasures', row: 1, col: 1 }, xpBonus: 2000, category: 'XP', tier: 'Gold' },
        { type: 'xp_100k', name: 'XP Tycoon', description: 'Earn 100,000 total XP', sprite: { sheet: 'treasures', row: 1, col: 2 }, xpBonus: 5000, category: 'XP', tier: 'Platinum' },
        { type: 'xp_500k', name: 'XP Mogul', description: 'Earn 500,000 total XP', sprite: { sheet: 'treasures', row: 1, col: 3 }, xpBonus: 15000, category: 'XP', tier: 'Diamond' },
        { type: 'xp_1m', name: 'XP Millionaire', description: 'Earn 1,000,000 total XP', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 50000, category: 'XP', tier: 'Diamond' },

        // === DIVERSITY ACHIEVEMENTS === (mixed)
        { type: 'diverse_learner', name: 'Diverse Learner', description: 'Complete 5 quests in each category', sprite: { sheet: 'artifacts', row: 0, col: 3 }, xpBonus: 500, category: 'Diversity', tier: 'Silver' },
        { type: 'balanced_master', name: 'Balanced Master', description: 'Complete 25 quests in each category', sprite: { sheet: 'artifacts', row: 1, col: 2 }, xpBonus: 2000, category: 'Diversity', tier: 'Gold' },
        { type: 'triple_threat', name: 'Triple Threat', description: 'Complete 50 quests in each category', sprite: { sheet: 'weapons', row: 0, col: 0 }, xpBonus: 5000, category: 'Diversity', tier: 'Platinum' },

        // === COMPLEXITY ACHIEVEMENTS === (weapons sprite)
        { type: 'hard_first', name: 'Challenge Accepted', description: 'Complete your first Hard quest', sprite: { sheet: 'weapons', row: 0, col: 0 }, xpBonus: 150, category: 'Complexity', tier: 'Bronze' },
        { type: 'hard_10', name: 'Hardened Warrior', description: 'Complete 10 Hard quests', sprite: { sheet: 'weapons', row: 0, col: 1 }, xpBonus: 500, category: 'Complexity', tier: 'Silver' },
        { type: 'hard_25', name: 'Iron Will', description: 'Complete 25 Hard quests', sprite: { sheet: 'armor', row: 0, col: 2 }, xpBonus: 1200, category: 'Complexity', tier: 'Gold' },
        { type: 'hard_50', name: 'Unbreakable', description: 'Complete 50 Hard quests', sprite: { sheet: 'armor', row: 0, col: 1 }, xpBonus: 3000, category: 'Complexity', tier: 'Platinum' },
        { type: 'hard_100', name: 'Titanium Core', description: 'Complete 100 Hard quests', sprite: { sheet: 'armor', row: 0, col: 0 }, xpBonus: 8000, category: 'Complexity', tier: 'Diamond' },
        { type: 'epic_first', name: 'Boss Slayer', description: 'Complete your first Epic quest', sprite: { sheet: 'magic', row: 0, col: 3 }, xpBonus: 300, category: 'Complexity', tier: 'Silver' },
        { type: 'epic_5', name: 'Dragon Slayer', description: 'Complete 5 Epic quests', sprite: { sheet: 'treasures', row: 1, col: 3 }, xpBonus: 1000, category: 'Complexity', tier: 'Gold' },
        { type: 'epic_10', name: 'Raid Boss', description: 'Complete 10 Epic quests', sprite: { sheet: 'magic', row: 1, col: 2 }, xpBonus: 2500, category: 'Complexity', tier: 'Platinum' },
        { type: 'epic_25', name: 'God Mode', description: 'Complete 25 Epic quests', sprite: { sheet: 'magic', row: 1, col: 3 }, xpBonus: 7500, category: 'Complexity', tier: 'Diamond' },
        { type: 'epic_50', name: 'Immortal', description: 'Complete 50 Epic quests', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 20000, category: 'Complexity', tier: 'Diamond' },

        // === TIME-BASED ACHIEVEMENTS === (artifacts - time themed)
        { type: 'early_bird_5', name: 'Early Bird', description: 'Complete 5 quests before 9 AM', sprite: { sheet: 'artifacts', row: 0, col: 0 }, xpBonus: 200, category: 'Time', tier: 'Bronze' },
        { type: 'early_bird_25', name: 'Dawn Warrior', description: 'Complete 25 quests before 9 AM', sprite: { sheet: 'artifacts', row: 0, col: 1 }, xpBonus: 750, category: 'Time', tier: 'Silver' },
        { type: 'night_owl_5', name: 'Night Owl', description: 'Complete 5 quests after 10 PM', sprite: { sheet: 'artifacts', row: 1, col: 0 }, xpBonus: 200, category: 'Time', tier: 'Bronze' },
        { type: 'night_owl_25', name: 'Midnight Grinder', description: 'Complete 25 quests after 10 PM', sprite: { sheet: 'artifacts', row: 1, col: 1 }, xpBonus: 750, category: 'Time', tier: 'Silver' },
        { type: 'weekend_5', name: 'Weekend Warrior', description: 'Complete 5 quests on weekends', sprite: { sheet: 'weapons', row: 0, col: 2 }, xpBonus: 200, category: 'Time', tier: 'Bronze' },
        { type: 'weekend_25', name: 'No Days Off', description: 'Complete 25 quests on weekends', sprite: { sheet: 'weapons', row: 0, col: 3 }, xpBonus: 800, category: 'Time', tier: 'Silver' },

        // === SPEED ACHIEVEMENTS === (magic - lightning themed)
        { type: 'speed_demon_5', name: 'Speed Demon', description: 'Complete 5 quests same day as created', sprite: { sheet: 'magic', row: 0, col: 0 }, xpBonus: 300, category: 'Speed', tier: 'Bronze' },
        { type: 'speed_demon_25', name: 'Lightning Fast', description: 'Complete 25 quests same day as created', sprite: { sheet: 'magic', row: 0, col: 1 }, xpBonus: 1000, category: 'Speed', tier: 'Silver' },
        { type: 'perfect_week_1', name: 'Perfect Week', description: 'Complete all weekly goals', sprite: { sheet: 'treasures', row: 1, col: 0 }, xpBonus: 500, category: 'Speed', tier: 'Silver' },
        { type: 'perfect_week_5', name: 'Consistency King', description: 'Complete all weekly goals 5 times', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 2000, category: 'Speed', tier: 'Gold' },
        { type: 'perfect_week_10', name: 'Unstoppable', description: 'Complete all weekly goals 10 times', sprite: { sheet: 'treasures', row: 0, col: 0 }, xpBonus: 5000, category: 'Speed', tier: 'Platinum' },

        // === RECORD BREAKERS === (treasures - hunting themed)
        { type: 'big_quest_300', name: 'Big Game Hunter', description: 'Complete a quest worth 300+ XP', sprite: { sheet: 'weapons', row: 1, col: 0 }, xpBonus: 200, category: 'Records', tier: 'Bronze' },
        { type: 'big_quest_500', name: 'Whale Hunter', description: 'Complete a quest worth 500+ XP', sprite: { sheet: 'weapons', row: 1, col: 1 }, xpBonus: 500, category: 'Records', tier: 'Silver' },
        { type: 'daily_xp_1000', name: 'Power Day', description: 'Earn 1,000+ XP in a single day', sprite: { sheet: 'magic', row: 1, col: 0 }, xpBonus: 400, category: 'Records', tier: 'Bronze' },
        { type: 'daily_xp_2500', name: 'Super Grind Day', description: 'Earn 2,500+ XP in a single day', sprite: { sheet: 'magic', row: 1, col: 1 }, xpBonus: 1000, category: 'Records', tier: 'Silver' },
        { type: 'daily_xp_5000', name: 'Legendary Day', description: 'Earn 5,000+ XP in a single day', sprite: { sheet: 'magic', row: 1, col: 2 }, xpBonus: 3000, category: 'Records', tier: 'Gold' },
        { type: 'weekly_xp_5000', name: 'Productive Week', description: 'Earn 5,000+ XP in a week', sprite: { sheet: 'treasures', row: 0, col: 1 }, xpBonus: 500, category: 'Records', tier: 'Bronze' },
        { type: 'weekly_xp_10000', name: 'Beast Mode Week', description: 'Earn 10,000+ XP in a week', sprite: { sheet: 'treasures', row: 0, col: 2 }, xpBonus: 1500, category: 'Records', tier: 'Silver' },
        { type: 'weekly_xp_20000', name: 'Absolute Unit', description: 'Earn 20,000+ XP in a week', sprite: { sheet: 'treasures', row: 0, col: 3 }, xpBonus: 5000, category: 'Records', tier: 'Gold' },

        // === SECRET ACHIEVEMENTS === (mixed mystical)
        { type: 'all_easy_10', name: 'Warm Up Complete', description: 'Complete 10 Easy quests', sprite: { sheet: 'armor', row: 1, col: 0 }, xpBonus: 100, category: 'Secret', tier: 'Bronze' },
        { type: 'balanced_complexity', name: 'Well Rounded', description: 'Complete 10+ in Easy, Medium, and Hard', sprite: { sheet: 'artifacts', row: 0, col: 3 }, xpBonus: 1500, category: 'Secret', tier: 'Gold' },
        { type: 'streak_comeback', name: 'Phoenix Rising', description: 'Rebuild a 7+ streak after losing one', sprite: { sheet: 'magic', row: 0, col: 3 }, xpBonus: 300, category: 'Secret', tier: 'Silver' }
    ], []);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = ['All', ...new Set(allAchievements.map(a => a.category))];
        return cats;
    }, [allAchievements]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [achievementsData, statsData] = await Promise.all([
                statsAPI.getAchievements(),
                statsAPI.get()
            ]);
            setAchievements(achievementsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch achievements:', err);
        } finally {
            setLoading(false);
        }
    };

    const isUnlocked = (type) => achievements.some(a => a.type === type);
    const getUnlockedDate = (type) => {
        const achievement = achievements.find(a => a.type === type);
        return achievement ? new Date(achievement.earnedAt).toLocaleDateString() : null;
    };

    // Helper to get sprite background style
    const getSpriteStyle = (sprite) => {
        if (!sprite) return {};
        const spriteSheets = {
            weapons: '/achievements/weapons.png',
            artifacts: '/achievements/artifacts.png',
            armor: '/achievements/armor.png',
            treasures: '/achievements/treasures.png',
            magic: '/achievements/magic.png'
        };
        // Each sprite sheet has 8 icons in a 4x2 layout (4 cols, 2 rows)
        // Using percentage-based positioning: each icon takes 25% width, 50% height
        // For col 0-3: 0%, 33.33%, 66.67%, 100%
        // For row 0-1: 0%, 100%
        const colPercent = (sprite.col / 3) * 100;
        const rowPercent = (sprite.row / 1) * 100;

        return {
            backgroundImage: `url(${spriteSheets[sprite.sheet]})`,
            backgroundPosition: `${colPercent}% ${rowPercent}%`,
            backgroundSize: '400% 200%',
            backgroundRepeat: 'no-repeat'
        };
    };

    // Filter achievements based on selected category, tier, and status
    const filteredAchievements = useMemo(() => {
        let filtered = allAchievements;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(a => a.category === selectedCategory);
        }

        // Filter by tier
        if (selectedTier) {
            filtered = filtered.filter(a => a.tier === selectedTier);
        }

        // Filter by status (unlocked/locked)
        if (statusFilter === 'unlocked') {
            filtered = filtered.filter(a => isUnlocked(a.type));
        } else if (statusFilter === 'locked') {
            filtered = filtered.filter(a => !isUnlocked(a.type));
        }

        return filtered;
    }, [selectedCategory, selectedTier, statusFilter, allAchievements, achievements]);

    // Calculate stats
    const unlockedCount = allAchievements.filter(a => isUnlocked(a.type)).length;
    const totalXPFromAchievements = achievements.reduce((sum, a) => sum + (a.xpBonus || 0), 0);
    const progressPercent = Math.round((unlockedCount / allAchievements.length) * 100);

    // Calculate tier breakdown
    const tierBreakdown = useMemo(() => {
        const breakdown = {};
        Object.keys(tierConfig).forEach(tier => {
            const tierAchievements = allAchievements.filter(a => a.tier === tier);
            const unlocked = tierAchievements.filter(a => isUnlocked(a.type)).length;
            breakdown[tier] = { total: tierAchievements.length, unlocked };
        });
        return breakdown;
    }, [allAchievements, achievements, tierConfig]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
            {/* Hero Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(138, 43, 226, 0.1) 50%, rgba(255, 107, 107, 0.1) 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-xl)',
                marginBottom: 'var(--space-xl)',
                border: '1px solid var(--glass-border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Animated background particles */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 20% 80%, rgba(0, 255, 204, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.1) 0%, transparent 30%)
                    `,
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
                        <div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                margin: 0,
                                background: 'linear-gradient(135deg, #00FFCC 0%, #8A2BE2 50%, #FF6B6B 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 800
                            }}>
                                🏆 Achievement Hall
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontSize: '1.1rem' }}>
                                Your legendary collection of earned victories
                            </p>
                        </div>

                        {/* Main Progress Circle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-lg)'
                        }}>
                            <div style={{
                                position: 'relative',
                                width: '120px',
                                height: '120px'
                            }}>
                                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                    {/* Background circle */}
                                    <circle
                                        cx="50" cy="50" r="45"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="50" cy="50" r="45"
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${progressPercent * 2.83} 283`}
                                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#00FFCC" />
                                            <stop offset="50%" stopColor="#8A2BE2" />
                                            <stop offset="100%" stopColor="#FF6B6B" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '1.8rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #00FFCC, #8A2BE2)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        {progressPercent}%
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                    <span style={{ color: 'var(--aurora-teal)' }}>{unlockedCount}</span>
                                    <span style={{ color: 'var(--text-muted)' }}> / {allAchievements.length}</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Achievements Unlocked
                                </div>
                                <div style={{
                                    marginTop: 'var(--space-xs)',
                                    fontSize: '0.85rem',
                                    color: 'var(--aurora-green)'
                                }}>
                                    +{totalXPFromAchievements.toLocaleString()} XP earned
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tier Progress Bars */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 'var(--space-md)',
                        marginTop: 'var(--space-xl)'
                    }}>
                        {Object.entries(tierBreakdown).map(([tier, data]) => {
                            const isSelected = selectedTier === tier;
                            return (
                                <div
                                    key={tier}
                                    onClick={() => setSelectedTier(isSelected ? null : tier)}
                                    style={{
                                        background: isSelected
                                            ? `linear-gradient(135deg, ${tierConfig[tier].glow} 0%, var(--glass-bg) 100%)`
                                            : 'var(--glass-bg)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-sm)',
                                        border: isSelected
                                            ? `2px solid ${tierConfig[tier].border}`
                                            : `1px solid ${tierConfig[tier].border}30`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                        boxShadow: isSelected ? `0 0 20px ${tierConfig[tier].glow}` : 'none'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 'var(--space-xs)'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: tierConfig[tier].border
                                        }}>
                                            {tier}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {data.unlocked}/{data.total}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(data.unlocked / data.total) * 100}%`,
                                            background: tierConfig[tier].gradient,
                                            borderRadius: '3px',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    {[
                        { label: 'Level', value: stats.level, icon: '⬆️', color: '#00FFCC' },
                        { label: 'Total XP', value: stats.totalXP?.toLocaleString(), icon: '✨', color: '#FFD700' },
                        { label: 'Streak', value: `${stats.streak} days`, icon: '🔥', color: '#FF6B6B' },
                        { label: 'Quests', value: stats.questsCompleted, icon: '📜', color: '#8A2BE2' }
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{
                            textAlign: 'center',
                            padding: 'var(--space-md)',
                            background: `linear-gradient(135deg, ${stat.color}10 0%, var(--glass-bg) 100%)`,
                            borderColor: `${stat.color}30`
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>{stat.icon}</div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: stat.color
                            }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category Filter Pills */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-lg)',
                padding: 'var(--space-md)',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)'
            }}>
                {categories.map(cat => {
                    const isActive = selectedCategory === cat;
                    const catCount = cat === 'All'
                        ? allAchievements.length
                        : allAchievements.filter(a => a.category === cat).length;
                    const unlockedInCat = cat === 'All'
                        ? unlockedCount
                        : allAchievements.filter(a => a.category === cat && isUnlocked(a.type)).length;

                    return (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: isActive
                                    ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))'
                                    : 'transparent',
                                border: isActive ? 'none' : '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-full)',
                                color: isActive ? '#000' : 'var(--text-primary)',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.85rem'
                            }}
                        >
                            {cat !== 'All' && <span>{categoryIcons[cat]}</span>}
                            <span>{cat}</span>
                            <span style={{
                                background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem'
                            }}>
                                {unlockedInCat}/{catCount}
                            </span>
                        </button>
                    );
                })}

                {/* Divider */}
                <div style={{
                    width: '1px',
                    height: '24px',
                    background: 'var(--glass-border)',
                    margin: '0 var(--space-xs)'
                }} />

                {/* Status Filter Toggle */}
                {['all', 'unlocked', 'locked'].map(status => {
                    const isActive = statusFilter === status;
                    const label = status === 'all' ? '🎮 All' : status === 'unlocked' ? '✅ Unlocked' : '🔒 Locked';
                    const count = status === 'all'
                        ? allAchievements.length
                        : status === 'unlocked'
                            ? unlockedCount
                            : allAchievements.length - unlockedCount;

                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: isActive
                                    ? status === 'unlocked'
                                        ? 'linear-gradient(135deg, #00FF88, #00CC66)'
                                        : status === 'locked'
                                            ? 'linear-gradient(135deg, #666, #444)'
                                            : 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))'
                                    : 'transparent',
                                border: isActive ? 'none' : '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-full)',
                                color: isActive ? (status === 'locked' ? '#fff' : '#000') : 'var(--text-primary)',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.85rem'
                            }}
                        >
                            <span>{label}</span>
                            <span style={{
                                background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem'
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Active Tier Filter Indicator */}
            {selectedTier && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: `linear-gradient(135deg, ${tierConfig[selectedTier].glow} 0%, var(--glass-bg) 100%)`,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${tierConfig[selectedTier].border}`,
                    marginBottom: 'var(--space-md)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span style={{ color: tierConfig[selectedTier].border, fontWeight: 700 }}>
                            🎯 Showing {selectedTier} tier achievements
                        </span>
                        <span style={{
                            background: tierConfig[selectedTier].gradient,
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: selectedTier === 'Gold' || selectedTier === 'Diamond' ? '#000' : '#fff'
                        }}>
                            {filteredAchievements.length} achievements
                        </span>
                    </div>
                    <button
                        onClick={() => setSelectedTier(null)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)'
                        }}
                    >
                        ✕ Clear filter
                    </button>
                </div>
            )}

            {/* Achievement Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 'var(--space-md)'
            }}>
                {filteredAchievements.map(achievement => {
                    const unlocked = isUnlocked(achievement.type);
                    const unlockedDate = getUnlockedDate(achievement.type);
                    const tier = tierConfig[achievement.tier];

                    return (
                        <div
                            key={achievement.type}
                            style={{
                                position: 'relative',
                                background: unlocked
                                    ? `linear-gradient(135deg, ${tier.glow} 0%, var(--glass-bg) 100%)`
                                    : 'var(--glass-bg)',
                                borderRadius: 'var(--radius-lg)',
                                border: `2px solid ${unlocked ? tier.border : 'var(--glass-border)'}`,
                                padding: 'var(--space-lg)',
                                opacity: unlocked ? 1 : 0.6,
                                transition: 'all 0.3s ease',
                                boxShadow: unlocked ? `0 0 30px ${tier.glow}` : 'none',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Tier Ribbon */}
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '-35px',
                                transform: 'rotate(45deg)',
                                background: tier.gradient,
                                padding: '4px 40px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: achievement.tier === 'Gold' || achievement.tier === 'Diamond' ? '#000' : '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: unlocked ? `0 2px 10px ${tier.glow}` : 'none'
                            }}>
                                {achievement.tier}
                            </div>

                            {/* Unlocked Badge */}
                            {unlocked && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '-8px',
                                    width: '40px',
                                    height: '40px',
                                    background: tier.gradient,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    boxShadow: `0 0 20px ${tier.glow}`,
                                    border: '3px solid var(--bg-primary)'
                                }}>
                                    ✓
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                                {/* Icon - Persian/Prince of Persia style sprite */}
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: 'var(--radius-md)',
                                    filter: unlocked ? 'none' : 'grayscale(100%) brightness(0.7)',
                                    transition: 'all 0.3s ease',
                                    border: `2px solid ${tier.border}40`,
                                    boxShadow: unlocked ? `0 0 15px ${tier.glow}` : 'none',
                                    ...getSpriteStyle(achievement.sprite)
                                }} />

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                                        marginBottom: 'var(--space-xs)'
                                    }}>
                                        {achievement.name}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--space-sm)'
                                    }}>
                                        {achievement.description}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* XP Reward */}
                                        <span style={{
                                            background: unlocked ? tier.gradient : 'var(--glass-bg)',
                                            padding: '4px 10px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: unlocked
                                                ? (achievement.tier === 'Gold' || achievement.tier === 'Diamond' ? '#000' : '#fff')
                                                : 'var(--text-muted)'
                                        }}>
                                            +{achievement.xpBonus.toLocaleString()} XP
                                        </span>

                                        {/* Category Badge */}
                                        <span style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.7rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            {categoryIcons[achievement.category]} {achievement.category}
                                        </span>

                                        {/* Unlocked Date */}
                                        {unlockedDate && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                🗓️ {unlockedDate}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredAchievements.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-xxl)',
                    color: 'var(--text-muted)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔍</div>
                    <p>No achievements found in this category</p>
                </div>
            )}
        </div>
    );
}

export default Achievements;
