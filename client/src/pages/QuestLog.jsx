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

    const handleDelete = async (questId) => {
        if (!window.confirm('Abandon this quest? This action cannot be undone.')) return;

        try {
            await questAPI.delete(questId);
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
                <h1>📜 Quest Log</h1>
                <Link to="/quests/new" className="btn btn-gold">
                    ➕ New Quest
                </Link>
            </div>

            {error && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--error)',
                    background: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <p style={{ color: 'var(--error)', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                    <div>
                        <label className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>Status</label>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            {['all', 'active', 'completed'].map(status => (
                                <button
                                    key={status}
                                    className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('status', status)}
                                    style={{ textTransform: 'capitalize', padding: 'var(--space-xs) var(--space-md)' }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>Type</label>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            {['all', 'youtube', 'dsa', 'task'].map(type => (
                                <button
                                    key={type}
                                    className={`btn ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('type', type)}
                                    style={{ textTransform: 'capitalize', padding: 'var(--space-xs) var(--space-md)' }}
                                >
                                    {type === 'youtube' ? '📺' : type === 'dsa' ? '💻' : type === 'task' ? '📋' : '🌐'} {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

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
