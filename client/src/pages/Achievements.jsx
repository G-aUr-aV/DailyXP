import { useState, useEffect } from 'react';
import { statsAPI } from '../services/api';

function Achievements() {
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // All possible achievements with icons
    const allAchievements = [
        { type: 'first_quest', name: 'First Blood', description: 'Complete your first quest', icon: '🩸', xpBonus: 50 },
        { type: 'streak_3', name: 'Hat Trick', description: 'Maintain a 3-day streak', icon: '🎩', xpBonus: 100 },
        { type: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚔️', xpBonus: 250 },
        { type: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '👑', xpBonus: 1000 },
        { type: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', xpBonus: 200 },
        { type: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🎖️', xpBonus: 500 },
        { type: 'level_25', name: 'Legend', description: 'Reach level 25', icon: '🏆', xpBonus: 2000 },
        { type: 'video_master', name: 'Video Scholar', description: 'Complete 10 YouTube quests', icon: '📺', xpBonus: 300 },
        { type: 'dsa_master', name: 'Algorithm Ace', description: 'Complete 10 DSA quests', icon: '💻', xpBonus: 300 },
        { type: 'task_master', name: 'Task Titan', description: 'Complete 10 Task quests', icon: '📋', xpBonus: 300 },
        { type: 'century', name: 'Century Club', description: 'Complete 100 quests', icon: '💯', xpBonus: 1000 },
        { type: 'no_spill', name: 'Clean Sweep', description: 'Complete a week with no spillage', icon: '🧹', xpBonus: 150 }
    ];

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

    const isUnlocked = (type) => {
        return achievements.some(a => a.type === type);
    };

    const getUnlockedDate = (type) => {
        const achievement = achievements.find(a => a.type === type);
        return achievement ? new Date(achievement.earnedAt).toLocaleDateString() : null;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1>🏆 Achievements</h1>
                <div className="text-muted">
                    {achievements.length} / {allAchievements.length} Unlocked
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{stats.level}</div>
                            <div className="stat-label">Level</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.totalXP.toLocaleString()}</div>
                            <div className="stat-label">Total XP</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.questsCompleted}</div>
                            <div className="stat-label">Quests Done</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievement Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--space-md)'
            }}>
                {allAchievements.map(achievement => {
                    const unlocked = isUnlocked(achievement.type);
                    const unlockedDate = getUnlockedDate(achievement.type);

                    return (
                        <div
                            key={achievement.type}
                            className="card"
                            style={{
                                opacity: unlocked ? 1 : 0.5,
                                borderColor: unlocked ? 'var(--accent-gold)' : 'var(--border-color)',
                                boxShadow: unlocked ? 'var(--shadow-glow-gold)' : 'none',
                                position: 'relative'
                            }}
                        >
                            {unlocked && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: 'var(--success)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>
                                    ✓
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    filter: unlocked ? 'none' : 'grayscale(100%)'
                                }}>
                                    {achievement.icon}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: unlocked ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                                        {achievement.name}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {achievement.description}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
                                        <span className="text-gold">+{achievement.xpBonus} XP</span>
                                        {unlockedDate && (
                                            <span className="text-muted" style={{ marginLeft: 'var(--space-sm)' }}>
                                                • Unlocked {unlockedDate}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Achievements;
