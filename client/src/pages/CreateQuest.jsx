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
        deadline: getNextMonday(),
        // YouTube fields
        videoUrl: '',
        // DSA fields
        platform: 'leetcode',
        problemUrl: '',
        difficulty: 'medium',
        topics: ''
    });

    function getNextMonday() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        return nextMonday.toISOString().split('T')[0];
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
                questData.youtube = {
                    videoUrl: formData.videoUrl
                };
                // Use video URL as title hint if no title provided
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

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: 'var(--space-lg)' }}>📜 New Quest</h1>

            {error && (
                <div className="card" style={{
                    marginBottom: 'var(--space-lg)',
                    borderColor: 'var(--error)',
                    background: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <p style={{ color: 'var(--error)', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                {/* Quest Type */}
                <div className="form-group">
                    <label className="form-label">Quest Type</label>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {['task', 'youtube', 'dsa'].map(type => (
                            <button
                                key={type}
                                type="button"
                                className={`btn ${formData.type === type ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFormData(prev => ({ ...prev, type }))}
                                style={{ flex: 1, textTransform: 'capitalize' }}
                            >
                                {type === 'youtube' ? '📺' : type === 'dsa' ? '💻' : '📋'} {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div className="form-group">
                    <label className="form-label">Quest Title</label>
                    <input
                        type="text"
                        name="title"
                        className="form-input"
                        placeholder="Enter quest title..."
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <textarea
                        name="description"
                        className="form-textarea"
                        placeholder="Quest details..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                {/* YouTube Fields */}
                {formData.type === 'youtube' && (
                    <div className="form-group">
                        <label className="form-label">YouTube Video URL</label>
                        <input
                            type="url"
                            name="videoUrl"
                            className="form-input"
                            placeholder="https://youtube.com/watch?v=..."
                            value={formData.videoUrl}
                            onChange={handleChange}
                            required
                        />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                            Your progress will be automatically tracked as you watch.
                        </p>
                    </div>
                )}

                {/* DSA Fields */}
                {formData.type === 'dsa' && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Platform</label>
                            <select
                                name="platform"
                                className="form-select"
                                value={formData.platform}
                                onChange={handleChange}
                            >
                                <option value="leetcode">LeetCode</option>
                                <option value="hackerrank">HackerRank</option>
                                <option value="codeforces">Codeforces</option>
                                <option value="codechef">CodeChef</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Problem URL (Optional)</label>
                            <input
                                type="url"
                                name="problemUrl"
                                className="form-input"
                                placeholder="https://leetcode.com/problems/..."
                                value={formData.problemUrl}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Difficulty</label>
                            <select
                                name="difficulty"
                                className="form-select"
                                value={formData.difficulty}
                                onChange={handleChange}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Topics (comma-separated)</label>
                            <input
                                type="text"
                                name="topics"
                                className="form-input"
                                placeholder="arrays, dynamic programming, graphs..."
                                value={formData.topics}
                                onChange={handleChange}
                            />
                        </div>
                    </>
                )}

                {/* Deadline */}
                <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input
                        type="date"
                        name="deadline"
                        className="form-input"
                        value={formData.deadline}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                        Default: Next Monday. Complete early for bonus XP! ⚡
                    </p>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                        style={{ flex: 1 }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-gold"
                        disabled={loading}
                        style={{ flex: 2 }}
                    >
                        {loading ? 'Creating...' : '⚔️ Start Quest'}
                    </button>
                </div>
            </form>

            <div className="card" style={{ marginTop: 'var(--space-lg)', background: 'rgba(0, 212, 255, 0.1)', borderColor: 'var(--accent-cyan)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    💡 <strong>Pro tip:</strong> Quest complexity and XP rewards are automatically determined by our AI based on content analysis!
                </p>
            </div>
        </div>
    );
}

export default CreateQuest;
