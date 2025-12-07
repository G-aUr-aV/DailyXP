import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { questAPI, videoProgressAPI, statsAPI } from '../services/api';

function QuestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quest, setQuest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [progressHistory, setProgressHistory] = useState([]);

    // Video player state
    const iframeRef = useRef(null);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const saveIntervalRef = useRef(null);
    const lastSaveTimeRef = useRef(0);

    useEffect(() => {
        fetchQuest();
        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
            }
        };
    }, [id]);

    const fetchQuest = async () => {
        try {
            setLoading(true);
            const data = await questAPI.getById(id);
            setQuest(data);

            if (data.type === 'youtube' && data.youtube?.currentTime) {
                setCurrentVideoTime(data.youtube.currentTime);
                lastSaveTimeRef.current = data.youtube.currentTime;
            }

            // Fetch progress history for YouTube quests
            if (data.type === 'youtube') {
                try {
                    const history = await videoProgressAPI.getHistory(id);
                    setProgressHistory(history);
                } catch (err) {
                    console.error('Failed to fetch progress history:', err);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            const result = await questAPI.complete(id);

            // Check for new achievements
            const achievementResult = await statsAPI.checkAchievements();

            let message = `+${result.xpEarned} XP earned!`;
            if (result.earlyBonus) message += ' (Early bonus!)';
            if (achievementResult.newAchievements?.length > 0) {
                message += ` 🏆 New achievement: ${achievementResult.newAchievements[0].name}!`;
            }

            setToast({ type: 'xp', message });
            setTimeout(() => navigate('/'), 2500);
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Abandon this quest? This action cannot be undone.')) return;

        try {
            await questAPI.delete(id);
            navigate('/');
        } catch (err) {
            setToast({ type: 'error', message: err.message });
        }
    };

    // Save video progress
    const saveVideoProgress = useCallback(async (time) => {
        if (!quest || quest.type !== 'youtube') return;

        // Only save if time has changed significantly (at least 5 seconds)
        if (Math.abs(time - lastSaveTimeRef.current) < 5) return;

        try {
            const result = await videoProgressAPI.save(id, {
                currentTime: time,
                sessionDuration: time - lastSaveTimeRef.current
            });
            lastSaveTimeRef.current = time;
            setCurrentVideoTime(time);

            // Add new entry to progress history immediately
            const newEntry = {
                currentTime: time,
                timestamp: new Date().toISOString()
            };
            setProgressHistory(prev => [newEntry, ...prev]);

            // Show subtle save indicator
            setToast({ type: 'success', message: '💾 Progress saved' });
            setTimeout(() => setToast(null), 1500);
        } catch (err) {
            console.error('Failed to save video progress:', err);
            setToast({ type: 'error', message: 'Failed to save progress' });
            setTimeout(() => setToast(null), 2000);
        }
    }, [id, quest]);

    // Manual save button
    const handleManualSave = async () => {
        const time = currentVideoTime || lastSaveTimeRef.current;
        await saveVideoProgress(time);
    };

    // Time input state
    const [timeInput, setTimeInput] = useState({ hours: 0, minutes: 0, seconds: 0 });

    // Update time input fields
    const handleTimeInputChange = (field, value) => {
        const numValue = parseInt(value) || 0;
        const newTimeInput = { ...timeInput, [field]: numValue };
        setTimeInput(newTimeInput);
        const totalSeconds = (newTimeInput.hours * 3600) + (newTimeInput.minutes * 60) + newTimeInput.seconds;
        setCurrentVideoTime(totalSeconds);
    };

    // YouTube embed URL with start time
    const getYouTubeEmbedUrl = () => {
        if (!quest?.youtube?.videoId) return null;
        const startTime = Math.floor(quest.youtube.currentTime || 0);
        return `https://www.youtube.com/embed/${quest.youtube.videoId}?start=${startTime}&enablejsapi=1&rel=0`;
    };

    const getComplexityBadge = (complexity) => {
        const classes = {
            easy: 'badge-easy',
            medium: 'badge-medium',
            hard: 'badge-hard',
            epic: 'badge-epic'
        };
        return classes[complexity] || 'badge-medium';
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgressPercent = () => {
        if (!quest?.youtube?.duration || quest.youtube.duration === 0) return 0;
        return Math.round((currentVideoTime / quest.youtube.duration) * 100);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !quest) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p className="empty-state-text">{error || 'Quest not found'}</p>
                <Link to="/" className="btn btn-primary">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'xp' && '⚡'} {toast.message}
                    </div>
                </div>
            )}

            {/* Back Link */}
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                ← Back to Dashboard
            </Link>

            {/* Quest Header */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <span className={`quest-badge badge-${quest.type}`}>
                                {quest.type === 'youtube' ? '📺' : quest.type === 'dsa' ? '💻' : '📋'} {quest.type}
                            </span>
                            <span className={`quest-badge ${getComplexityBadge(quest.complexity)}`}>
                                {quest.complexity}
                            </span>
                            {quest.spillCount > 0 && (
                                <span className="quest-badge" style={{ background: 'var(--error)', color: 'white' }}>
                                    Spilled x{quest.spillCount}
                                </span>
                            )}
                        </div>
                        <h1 style={{ marginBottom: 'var(--space-xs)' }}>{quest.title}</h1>
                        <p className="text-muted">
                            {quest.status === 'completed'
                                ? `Completed on ${new Date(quest.completedAt).toLocaleDateString()}`
                                : `Due: ${new Date(quest.deadline).toLocaleDateString()}`
                            }
                        </p>
                    </div>
                    <div className="quest-xp" style={{ fontSize: '1.5rem' }}>
                        {quest.xpReward} XP
                    </div>
                </div>

                {quest.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        {quest.description}
                    </p>
                )}

                {/* LLM Analysis */}
                {quest.llmAnalysis?.reasoning && (
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(168, 85, 247, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        <p style={{ color: 'var(--accent-purple)', margin: 0, fontSize: '0.9rem' }}>
                            🤖 <strong>AI Analysis:</strong> {quest.llmAnalysis.reasoning}
                        </p>
                    </div>
                )}
            </div>

            {/* YouTube Player */}
            {quest.type === 'youtube' && quest.youtube?.videoId && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>📺 Video Tutorial</h3>
                    <div className="video-container">
                        <iframe
                            ref={iframeRef}
                            src={getYouTubeEmbedUrl()}
                            title={quest.youtube.videoTitle || quest.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                            <span className="text-muted">Progress: {getProgressPercent()}%</span>
                            <span className="text-muted">
                                {formatTime(currentVideoTime)} / {formatTime(quest.youtube.duration || 0)}
                            </span>
                        </div>
                        <div className="video-progress-bar" style={{ height: '8px' }}>
                            <div
                                className="video-progress-fill"
                                style={{ width: `${getProgressPercent()}%` }}
                            />
                        </div>
                    </div>

                    {/* Manual Progress Update */}
                    <div style={{
                        marginTop: 'var(--space-lg)',
                        padding: 'var(--space-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <p style={{ marginBottom: 'var(--space-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            📝 <strong>Update your progress:</strong> Enter the time you've watched up to (hh:mm:ss)
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', textAlign: 'center' }}
                                    placeholder="HH"
                                    value={timeInput.hours || Math.floor(currentVideoTime / 3600)}
                                    onChange={(e) => handleTimeInputChange('hours', e.target.value)}
                                    min="0"
                                    max="99"
                                />
                                <span className="text-muted">:</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', textAlign: 'center' }}
                                    placeholder="MM"
                                    value={timeInput.minutes || Math.floor((currentVideoTime % 3600) / 60)}
                                    onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
                                    min="0"
                                    max="59"
                                />
                                <span className="text-muted">:</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '70px', textAlign: 'center' }}
                                    placeholder="SS"
                                    value={timeInput.seconds || Math.floor(currentVideoTime % 60)}
                                    onChange={(e) => handleTimeInputChange('seconds', e.target.value)}
                                    min="0"
                                    max="59"
                                />
                            </div>
                            <button className="btn btn-secondary" onClick={handleManualSave}>
                                💾 Save Progress
                            </button>
                        </div>
                    </div>

                    {/* Progress History */}
                    {progressHistory.length > 0 && (
                        <div style={{ marginTop: 'var(--space-lg)' }}>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                                📊 Watch History
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                                {progressHistory.slice(0, 10).map((entry, i) => (
                                    <span
                                        key={i}
                                        className="quest-badge"
                                        style={{ background: 'rgba(255, 68, 68, 0.2)', color: 'var(--quest-youtube)' }}
                                    >
                                        {formatTime(entry.currentTime)} - {new Date(entry.timestamp).toLocaleDateString()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* DSA Problem Info */}
            {quest.type === 'dsa' && quest.dsa && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>💻 Problem Details</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                        <div>
                            <span className="text-muted">Platform:</span>
                            <span style={{ marginLeft: 'var(--space-sm)', textTransform: 'capitalize' }}>
                                {quest.dsa.platform}
                            </span>
                        </div>
                        {quest.dsa.difficulty && (
                            <div>
                                <span className="text-muted">Difficulty:</span>
                                <span className={`quest-badge badge-${quest.dsa.difficulty}`} style={{ marginLeft: 'var(--space-sm)' }}>
                                    {quest.dsa.difficulty}
                                </span>
                            </div>
                        )}
                        {quest.dsa.problemUrl && (
                            <div>
                                <a
                                    href={quest.dsa.problemUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    🔗 Open Problem on {quest.dsa.platform}
                                </a>
                            </div>
                        )}
                        {quest.dsa.topics?.length > 0 && (
                            <div>
                                <span className="text-muted">Topics:</span>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                    {quest.dsa.topics.map((topic, i) => (
                                        <span key={i} className="quest-badge badge-task">{topic}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            {quest.status === 'active' && (
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        🗑️ Abandon
                    </button>
                    <button className="btn btn-success" onClick={handleComplete} style={{ flex: 1 }}>
                        ✓ Complete Quest (+{quest.xpReward} XP)
                    </button>
                </div>
            )}

            {quest.status === 'completed' && (
                <div className="card" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'var(--success)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--success)', margin: 0, fontSize: '1.25rem' }}>
                        ✅ Quest Completed! +{quest.xpReward} XP earned
                    </p>
                </div>
            )}
        </div>
    );
}

export default QuestDetail;
