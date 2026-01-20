import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ritualAPI, questAPI } from '../services/api';
import { LoadingSpinner } from '../components/common';
import { useToast } from '../hooks';
import QuestCard from '../components/QuestCard';

function RitualDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [ritual, setRitual] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const complexityConfig = {
        easy: { label: 'Easy', color: '#4CAF50', xp: 25 },
        medium: { label: 'Medium', color: '#2196F3', xp: 50 },
        hard: { label: 'Hard', color: '#FF9800', xp: 100 },
        epic: { label: 'Epic', color: '#9C27B0', xp: 200 }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ritualData, historyData] = await Promise.all([
                ritualAPI.getById(id),
                ritualAPI.getHistory(id, { limit: 30 })
            ]);
            setRitual(ritualData);
            setHistory(historyData.history || []);
            setEditForm({
                name: ritualData.name,
                description: ritualData.description,
                complexity: ritualData.complexity,
                xpReward: ritualData.xpReward,
                isActive: ritualData.isActive
            });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!ritual.todayQuest) {
            try {
                await ritualAPI.generateToday(id);
                await fetchData();
            } catch (err) {
                showToast('Failed to generate quest: ' + err.message, 'error');
                return;
            }
        }
        if (ritual.todayQuest?.status === 'completed') return;
        try {
            setCompleting(true);
            await questAPI.complete(ritual.todayQuest._id);
            showToast(`+${ritual.xpReward} XP earned! Ritual completed!`, 'success');
            await fetchData();
        } catch (err) {
            showToast('Failed to complete: ' + err.message, 'error');
        } finally {
            setCompleting(false);
        }
    };

    const handleSave = async () => {
        try {
            await ritualAPI.update(id, editForm);
            showToast('Ritual updated!', 'success');
            setEditing(false);
            await fetchData();
        } catch (err) {
            showToast('Failed to update: ' + err.message, 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await ritualAPI.delete(id);
            showToast('Ritual deleted', 'success');
            navigate('/rituals');
        } catch (err) {
            showToast('Failed to delete: ' + err.message, 'error');
        }
    };

    const handleToggleActive = async () => {
        try {
            await ritualAPI.update(id, { isActive: !ritual.isActive });
            showToast(ritual.isActive ? 'Ritual paused' : 'Ritual activated', 'success');
            await fetchData();
        } catch (err) {
            showToast('Failed to update: ' + err.message, 'error');
        }
    };

    // Calendar data for last 30 days
    const getCalendarData = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const historyEntry = history.find(h => {
                const hDate = new Date(h.ritualDate);
                return hDate.toISOString().split('T')[0] === dateStr;
            });
            days.push({
                date,
                dateStr,
                status: historyEntry?.status || null,
                isToday: i === 0
            });
        }
        return days;
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !ritual) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', borderColor: 'var(--error)' }}>
                <h2>❌ {error || 'Ritual not found'}</h2>
                <Link to="/rituals" className="btn">Back to Rituals</Link>
            </div>
        );
    }

    const complexity = complexityConfig[ritual.complexity];
    const calendarData = getCalendarData();
    const isCompleted = ritual.todayQuest?.status === 'completed';
    const completedCount = history.filter(h => h.status === 'completed').length;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-xxl)' }}>
            {/* Breadcrumb */}
            <Link
                to="/rituals"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
                ← Back to Rituals
            </Link>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xl)',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-lg)',
                padding: '4px',
                border: '1px solid var(--glass-border)',
                width: 'fit-content'
            }}>
                {[
                    { id: 'overview', label: '⚔️ Overview', icon: '' },
                    { id: 'history', label: '📜 History', count: history.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: 'var(--space-sm) var(--space-lg)',
                            background: activeTab === tab.id
                                ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(0, 255, 204, 0.2))'
                                : 'transparent',
                            border: activeTab === tab.id
                                ? '1px solid rgba(138, 43, 226, 0.5)'
                                : '1px solid transparent',
                            borderRadius: 'var(--radius-md)',
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)'
                        }}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span style={{
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: 'var(--space-xl)',
                        marginBottom: 'var(--space-xl)'
                    }}>
                        {/* LEFT COLUMN: Ritual Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            {/* Ritual Header Card */}
                            <div className="card" style={{
                                background: isCompleted
                                    ? 'linear-gradient(135deg, rgba(0, 200, 83, 0.12) 0%, var(--glass-bg) 100%)'
                                    : 'linear-gradient(135deg, rgba(138, 43, 226, 0.12) 0%, rgba(0, 255, 204, 0.08) 100%)',
                                border: isCompleted ? '2px solid rgba(0, 200, 83, 0.4)' : undefined,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Status Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: isCompleted
                                        ? 'linear-gradient(90deg, #00C853, #00E676)'
                                        : ritual.isActive
                                            ? 'linear-gradient(90deg, #8A2BE2, #00FFCC)'
                                            : 'rgba(255,255,255,0.1)'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                                    <div style={{ flex: 1 }}>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 700,
                                                    background: 'var(--glass-bg)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: 'var(--space-sm)',
                                                    color: 'var(--text-primary)',
                                                    width: '100%'
                                                }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <span style={{ fontSize: '1.8rem' }}>⚔️</span>
                                                <h1 style={{
                                                    margin: 0,
                                                    fontSize: '1.5rem',
                                                    fontWeight: 700,
                                                    background: 'linear-gradient(135deg, #8A2BE2, #00FFCC)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                    {ritual.name}
                                                </h1>
                                                {isCompleted && <span style={{ color: '#00C853', fontSize: '1.2rem' }}>✓</span>}
                                            </div>
                                        )}

                                        {editing ? (
                                            <textarea
                                                value={editForm.description}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                placeholder="Description"
                                                rows={2}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--glass-bg)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: 'var(--space-sm)',
                                                    color: 'var(--text-primary)',
                                                    marginTop: 'var(--space-sm)',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        ) : (
                                            ritual.description && (
                                                <p style={{ color: 'var(--text-secondary)', margin: 0, marginBottom: 'var(--space-md)', fontSize: '0.95rem' }}>
                                                    {ritual.description}
                                                </p>
                                            )
                                        )}

                                        {/* Tags */}
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                            <span style={{
                                                background: `${complexity.color}25`,
                                                color: complexity.color,
                                                padding: '4px 10px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                {complexity.label}
                                            </span>
                                            <span style={{
                                                background: 'rgba(255, 215, 0, 0.15)',
                                                color: '#FFD700',
                                                padding: '4px 10px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                +{ritual.xpReward} XP
                                            </span>
                                            {!ritual.isActive && (
                                                <span style={{
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: '#EF4444',
                                                    padding: '4px 10px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    ⏸️ Paused
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                        {!editing && (
                                            <>
                                                <button
                                                    onClick={() => setEditing(true)}
                                                    title="Edit"
                                                    style={{
                                                        background: 'var(--glass-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: 'var(--space-sm)',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={handleToggleActive}
                                                    title={ritual.isActive ? 'Pause' : 'Activate'}
                                                    style={{
                                                        background: 'var(--glass-bg)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: 'var(--space-sm)',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {ritual.isActive ? '⏸️' : '▶️'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Edit Mode Actions */}
                                {editing && (
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                        <button onClick={handleSave} className="btn btn-gold" style={{ flex: 1 }}>
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="btn"
                                            style={{ flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'var(--space-sm)'
                            }}>
                                {[
                                    { label: 'Current Streak', value: ritual.stats?.currentStreak || 0, suffix: ' days', icon: '🔥', color: '#FF6B6B' },
                                    { label: 'Best Streak', value: ritual.stats?.bestStreak || 0, suffix: ' days', icon: '🏆', color: '#FFD700' },
                                    { label: 'Completed', value: completedCount, suffix: '', icon: '✅', color: '#00C853' },
                                    { label: 'Rate', value: ritual.completionRate || 0, suffix: '%', icon: '📊', color: '#2196F3' }
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        background: 'var(--glass-bg)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-md)',
                                        textAlign: 'center',
                                        border: `1px solid ${stat.color}20`
                                    }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{stat.icon}</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>
                                            {stat.value}{stat.suffix}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Danger Zone (Collapsible) */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                padding: 'var(--space-md)'
                            }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                                >
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>⚠️ Danger Zone</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{showDeleteConfirm ? '▲' : '▼'}</span>
                                </div>
                                {showDeleteConfirm && (
                                    <div style={{ marginTop: 'var(--space-md)' }}>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, marginBottom: 'var(--space-sm)' }}>
                                            This will deactivate the ritual. History is preserved.
                                        </p>
                                        <button
                                            onClick={handleDelete}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px solid #EF4444',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 'var(--space-sm) var(--space-md)',
                                                color: '#EF4444',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                width: '100%'
                                            }}
                                        >
                                            🗑️ Delete Ritual
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Today's Quest & Calendar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            {/* Today's Quest - Prominent CTA */}
                            <div className="card" style={{
                                background: isCompleted
                                    ? 'linear-gradient(135deg, rgba(0, 200, 83, 0.15) 0%, rgba(0, 200, 83, 0.05) 100%)'
                                    : 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(138, 43, 226, 0.08) 100%)',
                                border: isCompleted ? '2px solid rgba(0, 200, 83, 0.4)' : '2px solid rgba(255, 215, 0, 0.3)',
                                textAlign: 'center',
                                padding: 'var(--space-xl)'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>
                                    {isCompleted ? '🎉' : '⏰'}
                                </div>
                                <h3 style={{ margin: 0, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                                    {isCompleted ? 'Completed Today!' : "Today's Quest"}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, marginBottom: 'var(--space-md)' }}>
                                    {isCompleted
                                        ? `+${ritual.xpReward} XP earned`
                                        : 'Complete your daily ritual to earn XP'}
                                </p>
                                <button
                                    onClick={handleComplete}
                                    className={isCompleted ? 'btn' : 'btn btn-gold'}
                                    disabled={isCompleted || completing}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-md)',
                                        fontSize: '1rem',
                                        ...(isCompleted && {
                                            background: 'var(--glass-bg)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-muted)'
                                        })
                                    }}
                                >
                                    {completing ? '⏳ Completing...' : isCompleted ? '✓ Done for today' : `Complete (+${ritual.xpReward} XP)`}
                                </button>
                            </div>

                            {/* 30-Day Calendar */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📅 Last 30 Days</h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {completedCount}/{history.length} completed
                                    </span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: '4px'
                                }}>
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                        <div key={i} style={{
                                            textAlign: 'center',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                            padding: '4px'
                                        }}>
                                            {day}
                                        </div>
                                    ))}

                                    {(() => {
                                        const firstDay = calendarData[0]?.date.getDay() || 0;
                                        const cells = [];
                                        for (let i = 0; i < firstDay; i++) {
                                            cells.push(<div key={`pad-${i}`} />);
                                        }
                                        calendarData.forEach((day, idx) => {
                                            const bgColor = day.status === 'completed'
                                                ? '#00C853'
                                                : day.status === 'active'
                                                    ? '#2196F3'
                                                    : day.isToday
                                                        ? 'rgba(138, 43, 226, 0.5)'
                                                        : 'rgba(255, 255, 255, 0.08)';
                                            cells.push(
                                                <div
                                                    key={idx}
                                                    title={`${day.date.toLocaleDateString()} - ${day.status || 'No data'}`}
                                                    style={{
                                                        aspectRatio: '1',
                                                        background: bgColor,
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.65rem',
                                                        color: day.status === 'completed' ? '#fff' : 'var(--text-muted)',
                                                        fontWeight: day.isToday ? 700 : 400,
                                                        border: day.isToday ? '2px solid #8A2BE2' : 'none'
                                                    }}
                                                >
                                                    {day.date.getDate()}
                                                </div>
                                            );
                                        });
                                        return cells;
                                    })()}
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ width: '10px', height: '10px', background: '#00C853', borderRadius: '2px' }} />
                                        Done
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ width: '10px', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px' }} />
                                        Missed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'history' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ margin: 0 }}>📜 Quest History</h3>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {history.length} quest{history.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {history.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: 'var(--space-md)'
                        }}>
                            {history.map((quest) => (
                                <QuestCard
                                    key={quest._id}
                                    quest={quest}
                                    onComplete={async (questId) => {
                                        try {
                                            await questAPI.complete(questId);
                                            showToast('Quest completed! +XP earned!', 'success');
                                            await fetchData();
                                        } catch (err) {
                                            showToast('Failed to complete: ' + err.message, 'error');
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📭</div>
                            <p style={{ margin: 0 }}>No quest history yet. Complete your first ritual!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default RitualDetail;

