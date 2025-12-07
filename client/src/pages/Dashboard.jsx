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
        end.setDate(end.getDate() - 1); // End is exclusive, show last day of week

        const options = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
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
                    <h1>Quest Dashboard</h1>
                    <p className="text-muted">{formatWeekRange()}</p>
                </div>
                <Link to="/quests/new" className="btn btn-gold">
                    ➕ New Quest
                </Link>
            </div>

            {/* Stats Panel */}
            <StatsPanel stats={dashboardData?.stats} />

            {/* Spillage Warning */}
            {dashboardData?.spilledCount > 0 && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--warning)',
                    background: 'rgba(245, 158, 11, 0.1)'
                }}>
                    <p style={{ color: 'var(--warning)', margin: 0 }}>
                        ⚠️ {dashboardData.spilledCount} quest(s) spilled over from previous weeks!
                    </p>
                </div>
            )}

            {/* Active Quests */}
            <section style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="section-header">
                    <h2 className="section-title">
                        ⚔️ Active Quests ({dashboardData?.activeQuests?.length || 0})
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
                            ✅ Completed This Week ({dashboardData.completedQuests.length})
                        </h2>
                    </div>
                    <div className="quest-grid">
                        {dashboardData.completedQuests.slice(0, 3).map(quest => (
                            <div key={quest._id} className="card" style={{ opacity: 0.7 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{quest.title}</span>
                                    <span className="text-gold">+{quest.xpReward} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {dashboardData.completedQuests.length > 3 && (
                        <Link to="/quests?status=completed" className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }}>
                            View All Completed
                        </Link>
                    )}
                </section>
            )}
        </div>
    );
}

export default Dashboard;
