/**
 * Toast notification component
 * Displays temporary notifications for success, error, XP, and info messages
 */

const TOAST_STYLES = {
    container: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out'
    },
    base: {
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: 600,
        fontSize: '0.95rem',
        minWidth: '250px',
        maxWidth: '400px'
    },
    types: {
        success: {
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: 'white'
        },
        error: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: 'white'
        },
        xp: {
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(168, 85, 247, 0.9))',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            color: 'white'
        },
        info: {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            color: 'white'
        }
    },
    icons: {
        success: '✅',
        error: '⚠️',
        xp: '⚡',
        info: 'ℹ️'
    }
};

function Toast({ toast, onDismiss }) {
    if (!toast) return null;

    const { message, type = 'info' } = toast;
    const typeStyle = TOAST_STYLES.types[type] || TOAST_STYLES.types.info;
    const icon = TOAST_STYLES.icons[type] || TOAST_STYLES.icons.info;

    return (
        <div style={TOAST_STYLES.container}>
            <div
                style={{ ...TOAST_STYLES.base, ...typeStyle }}
                onClick={onDismiss}
                role="alert"
            >
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span>{message}</span>
            </div>
        </div>
    );
}

export default Toast;
