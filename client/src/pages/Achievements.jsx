import { useState, useEffect } from 'react';
import { statsAPI } from '../services/api';

function Achievements() {
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // All possible achievements with icons
    const allAchievements = [
        { type: 'first_quest', name: 'First Blood', description: 'Complete your first quest', icon: '🩸', xpBonus: 50, category: 'Milestone' },
        { type: 'streak_3', name: 'Hat Trick', description: 'Maintain a 3-day streak', icon: '🎩', xpBonus: 100, category: 'Streak' },
        { type: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚔️', xpBonus: 250, category: 'Streak' },
        { type: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '👑', xpBonus: 1000, category: 'Streak' },
        { type: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', xpBonus: 200, category: 'Level' },
        { type: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🎖️', xpBonus: 500, category: 'Level' },
        { type: 'level_25', name: 'Legend', description: 'Reach level 25', icon: '🏆', xpBonus: 2000, category: 'Level' },
        { type: 'video_master', name: 'Video Scholar', description: 'Complete 10 YouTube quests', icon: '📺', xpBonus: 300, category: 'Mastery' },
        { type: 'dsa_master', name: 'Algorithm Ace', description: 'Complete 10 DSA quests', icon: '💻', xpBonus: 300, category: 'Mastery' },
        { type: 'task_master', name: 'Task Titan', description: 'Complete 10 Task quests', icon: '📋', xpBonus: 300, category: 'Mastery' },
        { type: 'century', name: 'Century Club', description: 'Complete 100 quests', icon: '💯', xpBonus: 1000, category: 'Milestone' },
        { type: 'no_spill', name: 'Clean Sweep', description: 'Complete a week with no spillage', icon: '🧹', xpBonus: 150, category: 'Milestone' }
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

    const unlockedCount = allAchievements.filter(a => isUnlocked(a.type)).length;
    const progressPercent = Math.round((unlockedCount / allAchievements.length) * 100);

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
                <div>
                    <h1>🏆 Achievements</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                        Your collection of earned badges and milestones
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-lg)',
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--glass-border)'
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                        fontSize: '1.25rem'
                    }}>
                        {unlockedCount}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{allAchievements.length}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontWeight: 600 }}>Collection Progress</span>
                    <span style={{
                        background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                    }}>
                        {progressPercent}%
                    </span>
                </div>
                <div className="xp-bar">
                    <div className="xp-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{stats.level}</div>
                            <div className="stat-label">Current Level</div>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
                                borderColor: unlocked ? 'rgba(0, 255, 204, 0.3)' : 'var(--glass-border)',
                                boxShadow: unlocked ? '0 0 30px rgba(0, 255, 204, 0.1)' : 'none',
                                position: 'relative',
                                transition: 'all var(--transition-normal)',
                                background: unlocked
                                    ? 'linear-gradient(135deg, rgba(0, 255, 204, 0.05) 0%, var(--glass-bg) 100%)'
                                    : 'var(--glass-bg)'
                            }}
                        >
                            {/* Unlocked Checkmark */}
                            {unlocked && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    background: 'linear-gradient(135deg, var(--success) 0%, #34d399 100%)',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                                    border: '2px solid var(--bg-primary)'
                                }}>
                                    ✓
                                </div>
                            )}

                            {/* Category Tag */}
                            <div style={{
                                position: 'absolute',
                                top: 'var(--space-sm)',
                                right: 'var(--space-sm)',
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--text-muted)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                {achievement.category}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    filter: unlocked ? 'none' : 'grayscale(100%)',
                                    transition: 'all var(--transition-normal)'
                                }}>
                                    {achievement.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{
                                        margin: 0,
                                        color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontSize: '1.1rem'
                                    }}>
                                        {achievement.name}
                                    </h4>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: 'var(--space-xs)'
                                    }}>
                                        {achievement.description}
                                    </p>
                                    <div style={{
                                        marginTop: 'var(--space-sm)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)'
                                    }}>
                                        <span style={{
                                            background: unlocked
                                                ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))'
                                                : 'linear-gradient(135deg, var(--text-muted), var(--text-muted))',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>
                                            +{achievement.xpBonus} XP
                                        </span>
                                        {unlockedDate && (
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                • {unlockedDate}
                                            </span>
                                        )}
                                    </div>
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
