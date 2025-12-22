import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questAPI, statsAPI } from '../services/api';
import StatsPanel from '../components/StatsPanel';
import QuestCard from '../components/QuestCard';

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await questAPI.getDashboard();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleComplete = async (questId) => {
        try {
            const result = await questAPI.complete(questId);

            // Show XP toast
            setToast({
                type: 'xp',
                message: `+${result.xpEarned} XP earned!${result.earlyBonus ? ' (Early bonus!)' : ''}`
            });

            // Check for new achievements
            await statsAPI.checkAchievements();

            // Refresh dashboard
            await fetchDashboard();

            // Clear toast after 3 seconds
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const formatWeekRange = () => {
        if (!dashboardData?.weekStart) return 'This Week';
        const start = new Date(dashboardData.weekStart);
        const end = new Date(dashboardData.weekEnd);
        end.setDate(end.getDate() - 1);

        const options = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p className="empty-state-text">Error: {error}</p>
                <button className="btn btn-primary" onClick={fetchDashboard}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'xp' && '⚡'} {toast.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>{getGreeting()}, Adventurer!</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.85rem',
                            color: 'var(--aurora-blue)'
                        }}>
                            📅 {formatWeekRange()}
                        </span>
                    </p>
                </div>
                <Link to="/quests/new" className="btn btn-gold">
                    <span>✨</span> New Quest
                </Link>
            </div>

            {/* Stats Panel */}
            <StatsPanel stats={dashboardData?.stats} />

            {/* Spillage Warning */}
            {dashboardData?.spilledCount > 0 && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--warning)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.1)'
                }}>
                    <p style={{ color: 'var(--warning)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                        <strong>{dashboardData.spilledCount} quest(s)</strong> spilled over from previous weeks!
                    </p>
                </div>
            )}

            {/* Active Quests */}
            <section style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="section-header">
                    <h2 className="section-title">
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))',
                            borderRadius: 'var(--radius-sm)',
                            marginRight: 'var(--space-sm)'
                        }}>⚔️</span>
                        Active Quests
                        <span style={{
                            marginLeft: 'var(--space-sm)',
                            padding: '2px 10px',
                            background: 'rgba(0, 255, 204, 0.15)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.85rem',
                            color: 'var(--aurora-teal)'
                        }}>
                            {dashboardData?.activeQuests?.length || 0}
                        </span>
                    </h2>
                </div>

                {dashboardData?.activeQuests?.length > 0 ? (
                    <div className="quest-grid">
                        {dashboardData.activeQuests.map(quest => (
                            <QuestCard
                                key={quest._id}
                                quest={quest}
                                onComplete={handleComplete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <p className="empty-state-text">No active quests this week. Time to embark on a new adventure!</p>
                        <Link to="/quests/new" className="btn btn-primary">
                            Create Your First Quest
                        </Link>
                    </div>
                )}
            </section>

            {/* Completed Quests */}
            {dashboardData?.completedQuests?.length > 0 && (
                <section>
                    <div className="section-header">
                        <h2 className="section-title">
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: 'linear-gradient(135deg, var(--success), #34d399)',
                                borderRadius: 'var(--radius-sm)',
                                marginRight: 'var(--space-sm)'
                            }}>✅</span>
                            Completed This Week
                            <span style={{
                                marginLeft: 'var(--space-sm)',
                                padding: '2px 10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.85rem',
                                color: 'var(--success)'
                            }}>
                                {dashboardData.completedQuests.length}
                            </span>
                        </h2>
                    </div>
                    <div className="quest-grid">
                        {dashboardData.completedQuests.slice(0, 3).map(quest => (
                            <div key={quest._id} className="card" style={{
                                opacity: 0.8,
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--glass-bg) 100%)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{
                                            color: 'var(--text-secondary)',
                                            textDecoration: 'line-through',
                                            textDecorationColor: 'var(--success)'
                                        }}>{quest.title}</span>
                                    </div>
                                    <span className="text-gold" style={{ fontWeight: 700 }}>+{quest.xpReward} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {dashboardData.completedQuests.length > 3 && (
                        <Link to="/quests?status=completed" className="btn btn-secondary" style={{ marginTop: 'var(--space-lg)' }}>
                            View All Completed ({dashboardData.completedQuests.length})
                        </Link>
                    )}
                </section>
            )}
        </div>
    );
}

export default Dashboard;
