import { Link } from 'react-router-dom';

/**
 * EmptyState component for displaying when no data is available
 * Provides consistent empty state UI across the application
 * 
 * @param {Object} props
 * @param {string} props.icon - Emoji icon to display
 * @param {string} props.title - Main message
 * @param {string} props.description - Secondary description (optional)
 * @param {Object} props.action - Action button config { label, to?, onClick? }
 */
function EmptyState({
    icon = '📭',
    title = 'Nothing here yet',
    description = null,
    action = null
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <p className="empty-state-text">{title}</p>
            {description && (
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    marginTop: 'var(--space-xs)'
                }}>
                    {description}
                </p>
            )}
            {action && (
                action.to ? (
                    <Link to={action.to} className="btn btn-primary">
                        {action.label}
                    </Link>
                ) : (
                    <button onClick={action.onClick} className="btn btn-primary">
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}

export default EmptyState;
