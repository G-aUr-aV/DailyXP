/**
 * Loading spinner component
 * Consistent loading indicator across the application
 * 
 * @param {Object} props
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.message - Optional loading message
 */
function LoadingSpinner({ size = 'md', message = null }) {
    const sizeConfig = {
        sm: { width: '24px', height: '24px' },
        md: { width: '48px', height: '48px' },
        lg: { width: '64px', height: '64px' }
    };

    const spinnerSize = sizeConfig[size] || sizeConfig.md;

    return (
        <div className="loading">
            <div
                className="spinner"
                style={spinnerSize}
            />
            {message && (
                <p style={{
                    marginTop: 'var(--space-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default LoadingSpinner;
