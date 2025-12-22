import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questAPI } from '../services/api';

function CreateQuest() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        type: 'task',
        title: '',
        description: '',
        deadline: getComingSunday(),
        videoUrl: '',
        platform: 'leetcode',
        problemUrl: '',
        difficulty: 'medium',
        topics: ''
    });

    function getComingSunday() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
        const comingSunday = new Date(today);
        comingSunday.setDate(today.getDate() + daysUntilSunday);
        comingSunday.setHours(23, 59, 59, 999); // 11:59:59 PM
        return comingSunday.toISOString().split('T')[0];
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
        { value: 'youtube', icon: '📺', label: 'YouTube', desc: 'Video tutorials', color: '#ff7b54', bg: 'rgba(255, 123, 84, 0.15)' },
        { value: 'dsa', icon: '💻', label: 'DSA', desc: 'Coding problems', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
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
                                    border: `2px solid ${isSelected ? type.color : 'var(--glass-border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    textAlign: 'left'
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
                                background: 'rgba(255, 123, 84, 0.08)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(255, 123, 84, 0.2)'
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
                                background: 'rgba(139, 92, 246, 0.08)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--quest-dsa)' }}>
                                            Platform
                                        </label>
                                        <select name="platform" className="form-select" value={formData.platform} onChange={handleChange} style={{ padding: '10px 12px' }}>
                                            <option value="leetcode">LeetCode</option>
                                            <option value="hackerrank">HackerRank</option>
                                            <option value="codeforces">Codeforces</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--quest-dsa)' }}>
                                            Difficulty
                                        </label>
                                        <select name="difficulty" className="form-select" value={formData.difficulty} onChange={handleChange} style={{ padding: '10px 12px' }}>
                                            <option value="easy">🌱 Easy</option>
                                            <option value="medium">⚡ Medium</option>
                                            <option value="hard">🔥 Hard</option>
                                        </select>
                                    </div>
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
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--quest-dsa)' }}>
                                        Topics <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="topics"
                                        className="form-input"
                                        placeholder="arrays, dp, graphs..."
                                        value={formData.topics}
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
