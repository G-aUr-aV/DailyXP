import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { questAPI } from '../services/api';
import QuestCard from '../components/QuestCard';

function QuestLog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState([]);
    const [error, setError] = useState(null);

    const statusFilter = searchParams.get('status') || 'all';
    const typeFilter = searchParams.get('type') || 'all';

    const fetchQuests = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (typeFilter !== 'all') params.type = typeFilter;

            const data = await questAPI.getAll(params);
            setQuests(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuests();
    }, [statusFilter, typeFilter]);

    const handleComplete = async (questId) => {
        try {
            await questAPI.complete(questId);
            await fetchQuests();
        } catch (err) {
            setError(err.message);
        }
    };

    const setFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'all') {
            newParams.delete(key);
        } else {
            newParams.set(key, value);
        }
        setSearchParams(newParams);
    };

    const FilterPill = ({ active, onClick, children }) => (
        <button
            className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onClick}
            style={{
                padding: 'var(--space-xs) var(--space-md)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem'
            }}
        >
            {children}
        </button>
    );

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
                    <h1>📜 Quest Log</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                        Your complete adventure history
                    </p>
                </div>
                <Link to="/quests/new" className="btn btn-gold">
                    <span>✨</span> New Quest
                </Link>
            </div>

            {error && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--error)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)'
                }}>
                    <p style={{ color: 'var(--error)', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                        <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
                            Status
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            {['all', 'active', 'completed'].map(status => (
                                <FilterPill
                                    key={status}
                                    active={statusFilter === status}
                                    onClick={() => setFilter('status', status)}
                                >
                                    {status === 'all' ? '🌐' : status === 'active' ? '⚡' : '✅'} {status}
                                </FilterPill>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
                            Type
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            {[
                                { value: 'all', icon: '🌐', label: 'All' },
                                { value: 'youtube', icon: '📺', label: 'YouTube' },
                                { value: 'dsa', icon: '💻', label: 'DSA' },
                                { value: 'task', icon: '📋', label: 'Task' }
                            ].map(type => (
                                <FilterPill
                                    key={type.value}
                                    active={typeFilter === type.value}
                                    onClick={() => setFilter('type', type.value)}
                                >
                                    {type.icon} {type.label}
                                </FilterPill>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quest Count */}
            {quests.length > 0 && (
                <p style={{
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.9rem'
                }}>
                    Showing <span style={{ color: 'var(--aurora-teal)', fontWeight: 600 }}>{quests.length}</span> quest{quests.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* Quest List */}
            {quests.length > 0 ? (
                <div className="quest-grid">
                    {quests.map(quest => (
                        <QuestCard
                            key={quest._id}
                            quest={quest}
                            onComplete={handleComplete}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <p className="empty-state-text">
                        {statusFilter === 'completed'
                            ? 'No completed quests yet. Time to finish some adventures!'
                            : 'No quests found. Start your journey by creating a new quest!'}
                    </p>
                    <Link to="/quests/new" className="btn btn-primary">
                        Create Quest
                    </Link>
                </div>
            )}
        </div>
    );
}

export default QuestLog;
