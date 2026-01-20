import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ritualAPI } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/common';
import { useToast } from '../hooks';

function Rituals() {
    const [rituals, setRituals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newRitual, setNewRitual] = useState({
        name: '',
        description: '',
        xpReward: 50,
        complexity: 'medium'
    });

    const navigate = useNavigate();
    const { showToast } = useToast();

    const complexityConfig = {
        easy: { label: 'Easy', color: '#4CAF50', xp: 25 },
        medium: { label: 'Medium', color: '#2196F3', xp: 50 },
        hard: { label: 'Hard', color: '#FF9800', xp: 100 },
        epic: { label: 'Epic', color: '#9C27B0', xp: 200 }
    };

    useEffect(() => {
        fetchRituals();
    }, []);

    const fetchRituals = async () => {
        try {
            setLoading(true);
            const data = await ritualAPI.getAll();
            setRituals(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRitual = async (e) => {
        e.preventDefault();
        if (!newRitual.name.trim()) return;

        try {
            setCreating(true);
            const result = await ritualAPI.create(newRitual);
            showToast('Ritual created! Today\'s quest has been generated.', 'success');
            setRituals([result.ritual, ...rituals]);
            setShowCreateModal(false);
            setNewRitual({ name: '', description: '', xpReward: 50, complexity: 'medium' });
        } catch (err) {
            showToast('Failed to create ritual: ' + err.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleGenerateAll = async () => {
        try {
            const result = await ritualAPI.generateAll();
            showToast(`Generated quests for ${result.results.length} rituals`, 'success');
            fetchRituals();
        } catch (err) {
            showToast('Failed to generate quests: ' + err.message, 'error');
        }
    };

    const getTodayStatus = (ritual) => {
        if (!ritual.todayQuest) return 'pending';
        return ritual.todayQuest.status;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return { label: 'Done ✓', bg: 'linear-gradient(135deg, #00C853, #00E676)', color: '#000' };
            case 'active':
                return { label: 'Active', bg: 'linear-gradient(135deg, #2196F3, #03A9F4)', color: '#fff' };
            case 'pending':
            default:
                return { label: 'Not Started', bg: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' };
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
            {/* Hero Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(0, 255, 204, 0.1) 50%, rgba(255, 215, 0, 0.1) 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-xl)',
                marginBottom: 'var(--space-xl)',
                border: '1px solid var(--glass-border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 20% 80%, rgba(138, 43, 226, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(0, 255, 204, 0.15) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
                        <div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                margin: 0,
                                background: 'linear-gradient(135deg, #8A2BE2 0%, #00FFCC 50%, #FFD700 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: 800
                            }}>
                                ⚔️ Daily Rituals
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontSize: '1.1rem' }}>
                                Your recurring daily quests - build habits, earn XP every day
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                onClick={handleGenerateAll}
                                className="btn"
                                style={{
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                ⚡ Generate Today's Quests
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-gold"
                            >
                                ✨ New Ritual
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'var(--space-md)',
                        marginTop: 'var(--space-xl)'
                    }}>
                        {[
                            {
                                label: 'Active Rituals',
                                value: rituals.filter(r => r.isActive).length,
                                icon: '⚔️',
                                color: '#8A2BE2'
                            },
                            {
                                label: 'Completed Today',
                                value: rituals.filter(r => r.todayQuest?.status === 'completed').length,
                                icon: '✅',
                                color: '#00C853'
                            },
                            {
                                label: 'Total Completed',
                                value: rituals.reduce((sum, r) => sum + (r.stats?.totalCompleted || 0), 0),
                                icon: '📈',
                                color: '#FFD700'
                            },
                            {
                                label: 'Best Streak',
                                value: Math.max(...rituals.map(r => r.stats?.bestStreak || 0), 0),
                                icon: '🔥',
                                color: '#FF6B6B'
                            }
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'var(--glass-bg)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-md)',
                                textAlign: 'center',
                                border: `1px solid ${stat.color}30`
                            }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--error)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)'
                }}>
                    <p style={{ color: 'var(--error)', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Rituals Grid */}
            {rituals.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-lg)'
                }}>
                    {rituals.map(ritual => {
                        const status = getTodayStatus(ritual);
                        const statusBadge = getStatusBadge(status);
                        const complexity = complexityConfig[ritual.complexity];

                        return (
                            <div
                                key={ritual._id}
                                onClick={() => navigate(`/rituals/${ritual._id}`)}
                                style={{
                                    background: status === 'completed'
                                        ? 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, var(--glass-bg) 100%)'
                                        : 'var(--glass-bg)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-lg)',
                                    border: status === 'completed'
                                        ? '2px solid rgba(0, 200, 83, 0.5)'
                                        : '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Status Ribbon */}
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '-35px',
                                    transform: 'rotate(45deg)',
                                    background: statusBadge.bg,
                                    padding: '4px 40px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: statusBadge.color,
                                    textTransform: 'uppercase'
                                }}>
                                    {statusBadge.label}
                                </div>

                                {/* Inactive Badge */}
                                {!ritual.isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'var(--space-sm)',
                                        left: 'var(--space-sm)',
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        Paused
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: 'var(--radius-md)',
                                        background: `linear-gradient(135deg, ${complexity.color}40, ${complexity.color}20)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        border: `2px solid ${complexity.color}60`
                                    }}>
                                        ⚔️
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            marginBottom: 'var(--space-xs)',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {ritual.name}
                                        </h3>

                                        {ritual.description && (
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.85rem',
                                                color: 'var(--text-secondary)',
                                                marginBottom: 'var(--space-sm)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {ritual.description}
                                            </p>
                                        )}

                                        {/* Badges Row */}
                                        <div style={{
                                            display: 'flex',
                                            gap: 'var(--space-sm)',
                                            flexWrap: 'wrap',
                                            marginBottom: 'var(--space-md)'
                                        }}>
                                            <span style={{
                                                background: `${complexity.color}30`,
                                                color: complexity.color,
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {complexity.label}
                                            </span>
                                            <span style={{
                                                background: 'rgba(255, 215, 0, 0.2)',
                                                color: '#FFD700',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                +{ritual.xpReward} XP
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div style={{
                                            display: 'flex',
                                            gap: 'var(--space-lg)',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <span title="Current Streak">
                                                🔥 {ritual.stats?.currentStreak || 0} day streak
                                            </span>
                                            <span title="Completion Rate">
                                                📊 {ritual.completionRate || 0}% rate
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon="⚔️"
                    title="No rituals yet. Create your first daily ritual to build consistent habits!"
                    action={{ label: 'Create Ritual', onClick: () => setShowCreateModal(true) }}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 'var(--space-lg)'
                }} onClick={() => setShowCreateModal(false)}>
                    <div
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--space-xl)',
                            maxWidth: '500px',
                            width: '100%',
                            border: '1px solid var(--glass-border)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{
                            margin: 0,
                            marginBottom: 'var(--space-lg)',
                            background: 'linear-gradient(135deg, #8A2BE2, #00FFCC)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            ✨ Create New Ritual
                        </h2>

                        <form onSubmit={handleCreateRitual}>
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                                    Ritual Name *
                                </label>
                                <input
                                    type="text"
                                    value={newRitual.name}
                                    onChange={e => setNewRitual({ ...newRitual, name: e.target.value })}
                                    placeholder="e.g., Morning Workout, Read for 30 mins"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                                    Description
                                </label>
                                <textarea
                                    value={newRitual.description}
                                    onChange={e => setNewRitual({ ...newRitual, description: e.target.value })}
                                    placeholder="Optional: Add more details about this ritual"
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                                    Difficulty
                                </label>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    {Object.entries(complexityConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setNewRitual({ ...newRitual, complexity: key, xpReward: config.xp })}
                                            style={{
                                                flex: 1,
                                                padding: 'var(--space-sm)',
                                                background: newRitual.complexity === key
                                                    ? `${config.color}30`
                                                    : 'var(--glass-bg)',
                                                border: newRitual.complexity === key
                                                    ? `2px solid ${config.color}`
                                                    : '1px solid var(--glass-border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: newRitual.complexity === key ? config.color : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{config.label}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>+{config.xp} XP</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-gold"
                                    style={{ flex: 1 }}
                                    disabled={creating || !newRitual.name.trim()}
                                >
                                    {creating ? 'Creating...' : 'Create Ritual'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Rituals;
