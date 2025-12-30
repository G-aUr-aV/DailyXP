import { useState, useEffect } from 'react';
import { questAPI } from '../services/api';
import QuestCard from '../components/QuestCard';
import QuestFilter from '../components/QuestFilter';
import { EmptyState, PageHeader, LoadingSpinner } from '../components/common';
import { DEFAULT_FILTERS } from '../utils/constants';

function QuestLog() {
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState([]);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const fetchQuests = async () => {
        try {
            setLoading(true);
            const params = {};

            if (filters.status !== 'all') params.status = filters.status;
            if (filters.type !== 'all') params.type = filters.type;
            if (filters.platform && filters.platform !== 'all') params.platform = filters.platform;
            if (filters.spilled) params.spilled = 'true';
            params.dateField = filters.dateField;

            if (filters.dateRanges.length > 0) {
                params.dateRanges = JSON.stringify(filters.dateRanges);
            }

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
    }, [filters]);

    const handleComplete = async (questId) => {
        try {
            await questAPI.complete(questId);
            await fetchQuests();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const hasActiveFilters = filters.status !== 'all' ||
        filters.type !== 'all' ||
        filters.spilled ||
        filters.dateRanges.length > 0;

    return (
        <div>
            {/* Page Header */}
            <PageHeader
                title="📜 Quest Log"
                subtitle="Your complete adventure history"
                action={{ to: '/quests/new', label: 'New Quest', icon: '✨', variant: 'btn-gold' }}
            />

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

            {/* Quest Filter */}
            <QuestFilter
                onFilterChange={handleFilterChange}
                config={{ mode: 'url', defaultCollapsed: true }}
                resultCount={quests.length}
            />

            {/* Content Area */}
            {loading ? (
                <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                    <LoadingSpinner />
                </div>
            ) : quests.length > 0 ? (
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
                <EmptyState
                    icon="📭"
                    title={hasActiveFilters
                        ? 'No quests match your filters. Try adjusting them!'
                        : 'No quests found. Start your journey by creating a new quest!'}
                    action={hasActiveFilters
                        ? { label: 'Clear All Filters', onClick: () => setFilters(DEFAULT_FILTERS) }
                        : { to: '/quests/new', label: 'Create Quest' }
                    }
                />
            )}
        </div>
    );
}

export default QuestLog;
