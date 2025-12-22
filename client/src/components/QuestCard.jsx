import { Link } from 'react-router-dom';

function QuestCard({ quest, onComplete }) {
    const getComplexityClass = (complexity) => {
        return `badge-${complexity || 'medium'}`;
    };

    const getTypeClass = (type) => {
        return `badge-${type}`;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'youtube': return '📺';
            case 'dsa': return '💻';
            case 'task': return '📋';
            default: return '📌';
        }
    };

    const getDaysRemaining = () => {
        if (!quest.deadline) return null;
        const now = new Date();
        const deadline = new Date(quest.deadline);
        const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const daysRemaining = getDaysRemaining();
    const isUrgent = daysRemaining !== null && daysRemaining <= 2;
    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    const getDeadlineStyle = () => {
        if (isOverdue) return { color: 'var(--error)', fontWeight: 600 };
        if (isUrgent) return { color: 'var(--warning)', fontWeight: 600 };
        return { color: 'var(--text-muted)' };
    };

    return (
        <div className="card quest-card" data-type={quest.type}>
            {quest.spillCount > 0 && (
                <span className="quest-spilled">Spilled ×{quest.spillCount}</span>
            )}

            <div className="quest-header">
                <Link to={`/quests/${quest._id}`} style={{ textDecoration: 'none' }}>
                    <h4 className="quest-title">{quest.title}</h4>
                </Link>
                <div className="quest-xp">{quest.xpReward} XP</div>
            </div>

            {quest.description && (
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginTop: 'var(--space-sm)',
                    lineHeight: 1.5
                }}>
                    {quest.description.slice(0, 100)}{quest.description.length > 100 ? '...' : ''}
                </p>
            )}

            <div className="quest-meta">
                <span className={`quest-badge ${getTypeClass(quest.type)}`}>
                    {getTypeIcon(quest.type)} {quest.type}
                </span>
                <span className={`quest-badge ${getComplexityClass(quest.complexity)}`}>
                    {quest.complexity}
                </span>
                {daysRemaining !== null && (
                    <span style={{
                        ...getDeadlineStyle(),
                        marginLeft: 'auto',
                        fontSize: '0.85rem'
                    }}>
                        {isOverdue ? `${Math.abs(daysRemaining)}d overdue ⚠️` :
                            daysRemaining === 0 ? '⏰ Due today' :
                                `${daysRemaining}d left`}
                    </span>
                )}
            </div>

            {quest.type === 'youtube' && quest.youtube?.currentTime > 0 && (
                <div className="video-progress-bar" style={{ marginTop: 'var(--space-lg)', height: '6px' }}>
                    <div
                        className="video-progress-fill"
                        style={{
                            width: `${quest.youtube.duration ? (quest.youtube.currentTime / quest.youtube.duration * 100) : 0}%`
                        }}
                    />
                </div>
            )}

            {quest.status === 'active' && (
                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
                    <Link to={`/quests/${quest._id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        {quest.type === 'youtube' ? '▶️ Continue' : '👁️ View'}
                    </Link>
                    <button
                        className="btn btn-success"
                        onClick={() => onComplete && onComplete(quest._id)}
                        style={{ flex: 1 }}
                    >
                        ✓ Complete
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuestCard;
