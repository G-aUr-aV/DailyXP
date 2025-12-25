import { Link } from 'react-router-dom';

/**
 * PageHeader component for consistent page headers
 * 
 * @param {Object} props
 * @param {string} props.title - Page title with optional emoji
 * @param {string} props.subtitle - Description text
 * @param {Object} props.action - Action button config { label, to?, onClick?, variant? }
 * @param {React.ReactNode} props.badges - Optional badges/pills to show
 * @param {React.ReactNode} props.children - Additional content in header
 */
function PageHeader({
    title,
    subtitle = null,
    action = null,
    badges = null,
    children = null
}) {
    return (
        <div className="dashboard-header">
            <div>
                <h1>{title}</h1>
                {(subtitle || badges) && (
                    <div style={{
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-xs)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {subtitle && <span>{subtitle}</span>}
                        {badges}
                    </div>
                )}
                {children}
            </div>
            {action && (
                action.to ? (
                    <Link
                        to={action.to}
                        className={`btn ${action.variant || 'btn-gold'}`}
                    >
                        {action.icon && <span>{action.icon}</span>}
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className={`btn ${action.variant || 'btn-primary'}`}
                    >
                        {action.icon && <span>{action.icon}</span>}
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}

export default PageHeader;
