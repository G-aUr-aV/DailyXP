import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questAPI } from '../services/api';
import StyledDropdown from '../components/common/StyledDropdown';

const PLATFORM_OPTIONS = [
    { value: 'leetcode', label: 'LeetCode', icon: '🟠' },
    { value: 'codeforces', label: 'Codeforces', icon: '🔵' },
    { value: 'cses', label: 'CSES', icon: '🟢' },
    { value: 'codechef', label: 'CodeChef', icon: '👨‍🍳' },
    { value: 'other', label: 'Other', icon: '⚪' }
];

function CreateQuest() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        type: 'task',
        title: '',
        description: '',
        deadline: getToday(),
        videoUrl: '',
        platform: 'leetcode',
        problemUrl: '',
        difficulty: 'medium',
        topics: '',
        // Timer settings
        timerEnabled: false,
        alarmEnabled: false,
        alarmHours: 0,
        alarmMinutes: 30,
        alarmSeconds: 0
    });

    function getToday() {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // 11:59:59 PM
        return today.toISOString().split('T')[0];
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const questData = {
                type: formData.type,
                title: formData.title,
                description: formData.description,
                deadline: formData.deadline
            };

            // Add timer settings if enabled
            if (formData.timerEnabled) {
                // Calculate total alarm time in seconds
                const alarmTotalSeconds =
                    (parseInt(formData.alarmHours) || 0) * 3600 +
                    (parseInt(formData.alarmMinutes) || 0) * 60 +
                    (parseInt(formData.alarmSeconds) || 0);

                questData.timer = {
                    enabled: true,
                    alarmEnabled: formData.alarmEnabled,
                    alarmSeconds: alarmTotalSeconds || 1800 // Default 30 min = 1800 seconds
                };
            }

            if (formData.type === 'youtube') {
                questData.youtube = { videoUrl: formData.videoUrl };
                if (!questData.title && formData.videoUrl) {
                    questData.title = 'YouTube Tutorial';
                }
            }

            if (formData.type === 'dsa') {
                questData.dsa = {
                    platform: formData.platform,
                    problemUrl: formData.problemUrl,
                    difficulty: formData.difficulty,
                    topics: formData.topics.split(',').map(t => t.trim()).filter(Boolean)
                };
            }

            await questAPI.create(questData);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Loading stage messages
    const getLoadingMessage = () => {
        if (!loading) return '';
        return formData.type === 'youtube'
            ? '🤖 AI is analyzing video content...'
            : formData.type === 'dsa'
                ? '🤖 AI is evaluating problem complexity...'
                : '🤖 AI is determining quest difficulty...';
    };

    const questTypes = [
        { value: 'task', icon: '📋', label: 'Task', desc: 'General todos', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
        { value: 'youtube', icon: '📺', label: 'YouTube', desc: 'Video tutorials', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
        { value: 'dsa', icon: '💻', label: 'DSA', desc: 'Coding problems', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' }
    ];

    const selectedType = questTypes.find(t => t.value === formData.type);

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {/* Compact Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.75rem' }}>✨</span>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>New Quest</h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Create an adventure and earn XP</p>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                }}>
                    🤖 AI assigns XP automatically
                </div>
            </div>

            {error && (
                <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Main Content - Two Column Layout */}
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
                {/* Left Column - Type Selection */}
                <div style={{
                    width: '220px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        marginBottom: '4px'
                    }}>
                        Quest Type
                    </div>

                    {questTypes.map(type => {
                        const isSelected = formData.type === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    background: isSelected ? type.bg : 'var(--glass-bg)',
                                    border: isSelected ? `2px solid ${type.color}` : '1px solid transparent',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.border = `2px solid ${type.color}`;
                                    }
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = `0 8px 25px ${type.color}30`;
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.border = '1px solid transparent';
                                    }
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isSelected ? `linear-gradient(135deg, ${type.color}, ${type.color}99)` : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    flexShrink: 0
                                }}>
                                    {type.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: isSelected ? type.color : 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {type.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {/* Early bonus tip */}
                    <div style={{
                        marginTop: 'auto',
                        padding: '12px',
                        background: 'linear-gradient(135deg, rgba(0,255,204,0.08), rgba(139,92,246,0.08))',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,255,204,0.15)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                    }}>
                        ⚡ Complete early for <span style={{ color: 'var(--aurora-teal)', fontWeight: 600 }}>bonus XP!</span>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div style={{
                    flex: 1,
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Gradient top bar */}
                    <div style={{
                        height: '3px',
                        background: `linear-gradient(90deg, ${selectedType?.color || 'var(--aurora-teal)'}, ${selectedType?.color}66)`
                    }}></div>

                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Quest Title <span style={{ color: 'var(--error)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                className="form-input"
                                placeholder="What do you want to accomplish?"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                style={{ padding: '12px 14px' }}
                            />
                        </div>

                        {/* Description - compact */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea
                                name="description"
                                className="form-textarea"
                                placeholder="Add notes or details..."
                                value={formData.description}
                                onChange={handleChange}
                                style={{ minHeight: '70px', padding: '12px 14px', resize: 'none' }}
                            />
                        </div>

                        {/* Type-specific fields */}
                        {formData.type === 'youtube' && (
                            <div style={{
                                padding: '14px',
                                background: 'rgba(14, 165, 233, 0.08)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(14, 165, 233, 0.2)'
                            }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--quest-youtube)' }}>
                                    📺 Video URL <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <input
                                    type="url"
                                    name="videoUrl"
                                    className="form-input"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                    required
                                    style={{ padding: '10px 12px' }}
                                />
                            </div>
                        )}

                        {formData.type === 'dsa' && (
                            <div style={{
                                padding: '14px',
                                background: 'rgba(129, 140, 248, 0.08)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(129, 140, 248, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--quest-dsa)' }}>
                                        Platform
                                    </label>
                                    <StyledDropdown
                                        name="platform"
                                        options={PLATFORM_OPTIONS}
                                        value={formData.platform}
                                        onChange={handleChange}
                                        color="var(--quest-dsa)"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--quest-dsa)' }}>
                                        Problem URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="problemUrl"
                                        className="form-input"
                                        placeholder="https://leetcode.com/problems/..."
                                        value={formData.problemUrl}
                                        onChange={handleChange}
                                        style={{ padding: '10px 12px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Deadline - inline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    📅 Deadline
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    className="form-input"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    style={{ colorScheme: 'dark', padding: '10px 12px', width: '180px' }}
                                />
                            </div>
                        </div>

                        {/* Timer Configuration */}
                        <div
                            style={{
                                padding: '16px',
                                background: formData.timerEnabled
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 255, 204, 0.05))'
                                    : 'rgba(255, 255, 255, 0.02)',
                                borderRadius: 'var(--radius-md)',
                                border: formData.timerEnabled
                                    ? '2px solid rgba(139, 92, 246, 0.4)'
                                    : '1px solid transparent',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                                if (!formData.timerEnabled) {
                                    e.currentTarget.style.border = '2px solid var(--aurora-purple)';
                                }
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.2)';
                            }}
                            onMouseLeave={e => {
                                if (!formData.timerEnabled) {
                                    e.currentTarget.style.border = '1px solid transparent';
                                }
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: formData.timerEnabled ? '14px' : 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: formData.timerEnabled ? 'var(--aurora-purple)' : 'var(--text-secondary)' }}>
                                            Enable Timer
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Track time spent on this quest
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        timerEnabled: !prev.timerEnabled,
                                        alarmEnabled: !prev.timerEnabled ? prev.alarmEnabled : false
                                    }))}
                                    style={{
                                        width: '52px',
                                        height: '28px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: formData.timerEnabled
                                            ? 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-teal))'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '3px',
                                        left: formData.timerEnabled ? '27px' : '3px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </button>
                            </div>

                            {/* Alarm settings - only visible when timer enabled */}
                            {formData.timerEnabled && (
                                <div style={{
                                    paddingTop: '14px',
                                    borderTop: '1px solid rgba(139, 92, 246, 0.2)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: formData.alarmEnabled ? '12px' : 0
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1rem' }}>🔔</span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: formData.alarmEnabled ? 'var(--aurora-teal)' : 'var(--text-secondary)' }}>
                                                    Set Alarm
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    Get notified after set time
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, alarmEnabled: !prev.alarmEnabled }))}
                                            style={{
                                                width: '44px',
                                                height: '24px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: formData.alarmEnabled
                                                    ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))'
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                position: 'absolute',
                                                top: '3px',
                                                left: formData.alarmEnabled ? '23px' : '3px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }} />
                                        </button>
                                    </div>

                                    {/* Alarm duration input */}
                                    {formData.alarmEnabled && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 14px',
                                            background: 'rgba(0, 255, 204, 0.08)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgba(0, 255, 204, 0.2)',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '4px' }}>Ring after</span>

                                            {/* Hours */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <input
                                                    type="number"
                                                    name="alarmHours"
                                                    value={formData.alarmHours}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="23"
                                                    className="form-input"
                                                    style={{
                                                        width: '50px',
                                                        padding: '6px 8px',
                                                        textAlign: 'center',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>h</span>
                                            </div>

                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>:</span>

                                            {/* Minutes */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <input
                                                    type="number"
                                                    name="alarmMinutes"
                                                    value={formData.alarmMinutes}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="59"
                                                    className="form-input"
                                                    style={{
                                                        width: '50px',
                                                        padding: '6px 8px',
                                                        textAlign: 'center',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>m</span>
                                            </div>

                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>:</span>

                                            {/* Seconds */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <input
                                                    type="number"
                                                    name="alarmSeconds"
                                                    value={formData.alarmSeconds}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="59"
                                                    className="form-input"
                                                    style={{
                                                        width: '50px',
                                                        padding: '6px 8px',
                                                        textAlign: 'center',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }}></div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/')}
                                style={{ padding: '12px 24px' }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    background: loading
                                        ? 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))'
                                        : `linear-gradient(135deg, ${selectedType?.color || 'var(--aurora-teal)'}, ${selectedType?.color}cc)`,
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: loading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: loading
                                        ? '0 4px 30px rgba(139, 92, 246, 0.4)'
                                        : `0 4px 20px ${selectedType?.bg || 'rgba(0,255,204,0.3)'}`
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                                        <span>{getLoadingMessage()}</span>
                                    </>
                                ) : (
                                    <>⚔️ Start Quest</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* AI Analysis Overlay */}
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(10, 15, 28, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        marginBottom: '24px',
                        boxShadow: '0 0 60px rgba(139, 92, 246, 0.5)',
                        animation: 'levelPulse 2s ease-in-out infinite'
                    }}>
                        🤖
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        marginBottom: '12px',
                        background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        AI Analysis in Progress
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', maxWidth: '300px' }}>
                        {formData.type === 'youtube'
                            ? 'Analyzing video content to determine complexity and XP reward...'
                            : formData.type === 'dsa'
                                ? 'Evaluating problem difficulty and estimating XP reward...'
                                : 'Determining quest complexity and calculating XP reward...'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'var(--aurora-teal)',
                                animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite`
                            }}></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateQuest;
