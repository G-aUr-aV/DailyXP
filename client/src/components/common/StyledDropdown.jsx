import { useState, useRef, useEffect } from 'react';

/**
 * StyledDropdown - A custom styled dropdown component matching the site's aesthetic
 * Features: Glass morphism, aurora glow, smooth animations
 */
function StyledDropdown({
    options,
    value,
    onChange,
    name,
    placeholder = 'Select an option',
    color = 'var(--aurora-teal)'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Find the currently selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle option selection
    const handleSelect = (option) => {
        onChange({ target: { name, value: option.value } });
        setIsOpen(false);
    };

    return (
        <div
            ref={dropdownRef}
            style={{ position: 'relative', width: '100%' }}
        >
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '40px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: isOpen ? `2px solid ${color}` : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isOpen ? `0 0 0 3px ${color}20, 0 0 20px ${color}10` : 'none'
                }}
            >
                {selectedOption?.icon && <span>{selectedOption.icon}</span>}
                <span style={{ flex: 1 }}>{selectedOption?.label || placeholder}</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                        position: 'absolute',
                        right: '12px',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)'
                    }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 204, 0.1)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        animation: 'dropdownSlideIn 0.2s ease'
                    }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: option.value === value
                                    ? `linear-gradient(135deg, ${color}15, ${color}05)`
                                    : 'transparent',
                                border: 'none',
                                borderLeft: option.value === value ? `3px solid ${color}` : '3px solid transparent',
                                color: option.value === value ? color : 'var(--text-primary)',
                                fontSize: '0.95rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (option.value !== value) {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (option.value !== value) {
                                    e.target.style.background = 'transparent';
                                }
                            }}
                        >
                            {option.icon && <span style={{ fontSize: '1.1rem' }}>{option.icon}</span>}
                            <span>{option.label}</span>
                            {option.value === value && (
                                <span style={{ marginLeft: 'auto', color: color }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StyledDropdown;
