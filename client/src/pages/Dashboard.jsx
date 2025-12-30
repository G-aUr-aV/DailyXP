import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { questAPI, statsAPI } from '../services/api';
import StatsPanel from '../components/StatsPanel';
import QuestCard from '../components/QuestCard';
import QuestFilter from '../components/QuestFilter';
import { Toast, EmptyState, PageHeader, LoadingSpinner } from '../components/common';
import { useToast } from '../hooks';
import { formatDuration } from '../utils/timeFormatters';
import { formatDisplayDate, isInDateRange } from '../utils/dateUtils';
import { DEFAULT_DASHBOARD_FILTERS, QUEST_TYPE_CONFIG } from '../utils/constants';

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [timerElapsed, setTimerElapsed] = useState({});
    const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);

    const timerIntervalRef = useRef(null);
    const { toast, showXP, showError, hideToast } = useToast();

    // Fetch dashboard data
    const fetchDashboard = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await questAPI.getDashboard();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Poll for pending analysis
    useEffect(() => {
        const hasPending = dashboardData?.activeQuests?.some(q => q.analysisStatus === 'pending');

        let interval;
        if (hasPending) {
            interval = setInterval(() => fetchDashboard(true), 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [dashboardData]);

    // Real-time timer updates for running timers
    useEffect(() => {
        const runningQuests = (dashboardData?.activeQuests || [])
            .filter(q => q.timer?.enabled && q.timer?.isRunning);

        if (runningQuests.length > 0) {
            const calculateElapsed = () => {
                const elapsed = {};
                runningQuests.forEach(q => {
                    if (q.timer?.lastStartedAt) {
                        const lastStarted = new Date(q.timer.lastStartedAt).getTime();
                        const elapsedSinceStart = Math.floor((Date.now() - lastStarted) / 1000);
                        elapsed[q._id] = (q.timer.currentTime || 0) + elapsedSinceStart;
                    } else {
                        elapsed[q._id] = q.timer.currentTime || 0;
                    }
                });
                setTimerElapsed(elapsed);
            };

            calculateElapsed();
            timerIntervalRef.current = setInterval(calculateElapsed, 1000);

            return () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
            };
        }
    }, [dashboardData?.activeQuests]);

    // Handler for completing a quest
    const handleComplete = async (questId) => {
        try {
            const result = await questAPI.complete(questId);
            showXP(result.xpEarned, result.earlyBonus);
            await statsAPI.checkAchievements();
            await fetchDashboard();
        } catch (err) {
            showError(err.message);
        }
    };

    // Format week range for display
    const formatWeekRange = () => {
        if (!dashboardData?.weekStart) return 'This Week';
        const start = new Date(dashboardData.weekStart);
        const end = new Date(dashboardData.weekEnd);
        end.setDate(end.getDate() - 1);
        return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
    };

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Apply filters to quests
    const getFilteredQuests = () => {
        const allQuests = [
            ...(dashboardData?.activeQuests || []).map(q => ({ ...q, _status: 'active' })),
            ...(dashboardData?.completedQuests || []).map(q => ({ ...q, _status: 'completed' }))
        ];

        return allQuests.filter(quest => {
            if (filters.status !== 'all' && quest._status !== filters.status) return false;
            if (filters.type !== 'all' && quest.type !== filters.type) return false;

            // Platform filter
            if (filters.platform && filters.platform !== 'all') {
                if (quest.type !== 'DSA' || quest.dsa?.platform !== filters.platform) return false;
            }

            if (filters.dateRanges.length > 0) {
                const fieldValue = quest[filters.dateField];
                if (!isInDateRange(fieldValue, filters.dateRanges)) return false;
            }
            if (filters.spilled && (!quest.spillCount || quest.spillCount === 0)) return false;
            return true;
        });
    };

    const filteredQuests = getFilteredQuests();
    const hasActiveFilters = filters.status !== 'active' || filters.type !== 'all' || filters.platform !== 'all' ||
        filters.spilled || filters.dateRanges.length > 0;

    const runningQuests = (dashboardData?.activeQuests || [])
        .filter(q => q.timer?.enabled && q.timer?.isRunning);
    const totalTimers = (dashboardData?.activeQuests || [])
        .filter(q => q.timer?.enabled).length;

    // Loading state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Error state
    if (error) {
        return (
            <EmptyState
                icon="⚠️"
                title={`Error: ${error}`}
                action={{ label: 'Retry', onClick: fetchDashboard }}
            />
        );
    }

    return (
        <div>
            {/* Toast Notifications */}
            <Toast toast={toast} onDismiss={hideToast} />

            {/* Page Header */}
            <PageHeader
                title={`${getGreeting()}, Adventurer!`}
                badges={
                    <>
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
                        {totalTimers > 0 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '2px 10px',
                                background: runningQuests.length > 0 ? 'rgba(0, 255, 204, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.85rem',
                                color: runningQuests.length > 0 ? 'var(--aurora-teal)' : 'var(--aurora-purple)'
                            }}>
                                {runningQuests.length > 0 && (
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'var(--aurora-teal)',
                                        animation: 'pulse 1s ease-in-out infinite'
                                    }} />
                                )}
                                ⏱️ {runningQuests.length > 0
                                    ? `${runningQuests.length} running`
                                    : `${totalTimers} timer${totalTimers > 1 ? 's' : ''}`}
                            </span>
                        )}
                    </>
                }
                action={{ to: '/quests/new', label: 'New Quest', icon: '✨', variant: 'btn-gold' }}
            />

            {/* Running Timers Section */}
            {runningQuests.length > 0 && (
                <RunningTimersSection
                    quests={runningQuests}
                    timerElapsed={timerElapsed}
                />
            )}

            {/* Stats Panel */}
            <StatsPanel
                stats={dashboardData?.stats}
                onLevelUp={async (result) => {
                    showXP(0, 0); // Hack to trigger some celebration or toast - or manually add toast
                    // Actually showXP isn't appropriate for level up maybe?
                    // I'll just refresh dashboard.
                    await fetchDashboard(true);
                    // Or maybe use toast directly
                    // But StatsPanel might fail to find 'toast' context if I don't pass it?
                    // No, StatsPanel doesn't use toast.
                    // I'll just refresh.
                }}
            />

            {/* Quest Filter */}
            <QuestFilter
                onFilterChange={setFilters}
                config={{ mode: 'client', defaultCollapsed: true }}
                resultCount={filteredQuests.length}
            />

            {/* Quest List */}
            {filteredQuests.length > 0 ? (
                <div className="quest-grid">
                    {filteredQuests.map(quest => (
                        <QuestCard
                            key={quest._id}
                            quest={quest}
                            onComplete={quest._status === 'active' ? handleComplete : null}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="📭"
                    title={hasActiveFilters
                        ? 'No quests match your filters. Try adjusting them!'
                        : 'No quests this week. Time to embark on a new adventure!'}
                    action={hasActiveFilters
                        ? { label: 'Clear All Filters', onClick: () => setFilters(DEFAULT_DASHBOARD_FILTERS) }
                        : { to: '/quests/new', label: 'Create Your First Quest' }
                    }
                />
            )}
        </div>
    );
}

/**
 * Running Timers Section - displays active timer quests
 */
function RunningTimersSection({ quests, timerElapsed }) {
    return (
        <div style={{
            marginBottom: 'var(--space-xl)',
            background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.08), rgba(139, 92, 246, 0.05))',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid rgba(0, 255, 204, 0.3)',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0, 255, 204, 0.15)'
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 20px',
                background: 'linear-gradient(90deg, rgba(0, 255, 204, 0.1), transparent)',
                borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--aurora-teal)',
                    boxShadow: '0 0 10px var(--aurora-teal)',
                    animation: 'pulse 1s ease-in-out infinite'
                }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--aurora-teal)' }}>
                    ⏱️ Active Timers
                </span>
                <span style={{
                    padding: '2px 10px',
                    background: 'rgba(0, 255, 204, 0.2)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--aurora-teal)'
                }}>{quests.length} running</span>
            </div>

            {/* Running Quest Cards */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quests.map(quest => (
                    <RunningTimerCard
                        key={quest._id}
                        quest={quest}
                        elapsed={timerElapsed[quest._id] ?? quest.timer?.currentTime ?? 0}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Running Timer Card - individual timer quest display
 */
function RunningTimerCard({ quest, elapsed }) {
    const typeConfig = QUEST_TYPE_CONFIG[quest.type] || QUEST_TYPE_CONFIG.task;

    return (
        <Link
            to={`/quests/${quest._id}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0, 255, 204, 0.2)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 255, 204, 0.1)';
                e.currentTarget.style.border = '2px solid rgba(0, 255, 204, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 255, 204, 0.2)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.border = '1px solid rgba(0, 255, 204, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                }}>
                    {typeConfig.icon}
                </div>
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {quest.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {typeConfig.label} • {quest.complexity}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: 'var(--aurora-teal)',
                    textShadow: '0 0 20px rgba(0, 255, 204, 0.5)'
                }}>
                    {formatDuration(elapsed)}
                </div>
                <div style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                }}>
                    Continue →
                </div>
            </div>
        </Link>
    );
}

export default Dashboard;
