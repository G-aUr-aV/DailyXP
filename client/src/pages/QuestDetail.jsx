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
    const [completing, setCompleting] = useState(false);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const lastSaveTimeRef = useRef(0);
    const [timeInput, setTimeInput] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const playerRef = useRef(null);
    const iframeRef = useRef(null);
    const progressIntervalRef = useRef(null);

    useEffect(() => { fetchQuest(); }, [id]);

    // Initialize YouTube IFrame API
    useEffect(() => {
        if (!quest?.youtube?.videoId) return;

        // Load YouTube IFrame API script
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Initialize player when API is ready
        const initPlayer = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player('youtube-player', {
                videoId: quest.youtube.videoId,
                playerVars: {
                    autoplay: 0,
                    start: Math.floor(quest.youtube?.currentTime || 0),
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [quest?.youtube?.videoId]);

    const onPlayerReady = (event) => {
        // Get actual video duration from YouTube
        const duration = event.target.getDuration();
        if (duration && duration > 0) {
            setVideoDuration(duration);
        }

        // Seek to saved position
        if (quest?.youtube?.currentTime && quest.youtube.currentTime > 0) {
            event.target.seekTo(quest.youtube.currentTime, true);
        }
    };

    const onPlayerStateChange = (event) => {
        const playerState = event.data;

        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        if (playerState === 1) {
            // Playing - start tracking progress
            setIsPlaying(true);
            startProgressTracking();
        } else if (playerState === 2) {
            // Paused - update time inputs with current position
            setIsPlaying(false);
            stopProgressTracking();
            updateTimeInputFromPlayer();
        } else if (playerState === 0) {
            // Ended
            setIsPlaying(false);
            stopProgressTracking();
            updateTimeInputFromPlayer();
        } else {
            setIsPlaying(false);
        }
    };

    const startProgressTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                setCurrentVideoTime(Math.floor(currentTime));
            }
        }, 1000);
    };

    const stopProgressTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    const updateTimeInputFromPlayer = () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
            const currentTime = Math.floor(playerRef.current.getCurrentTime());
            setCurrentVideoTime(currentTime);
            setTimeInput({
                hours: Math.floor(currentTime / 3600),
                minutes: Math.floor((currentTime % 3600) / 60),
                seconds: Math.floor(currentTime % 60)
            });
        }
    };

    const fetchQuest = async () => {
        try {
            setLoading(true);
            const data = await questAPI.getById(id);
            setQuest(data);
            if (data.type === 'youtube') {
                if (data.youtube?.currentTime) {
                    setCurrentVideoTime(data.youtube.currentTime);
                    lastSaveTimeRef.current = data.youtube.currentTime;
                    // Pre-fill time inputs
                    const t = data.youtube.currentTime;
                    setTimeInput({
                        hours: Math.floor(t / 3600),
                        minutes: Math.floor((t % 3600) / 60),
                        seconds: Math.floor(t % 60)
                    });
                }
                if (data.youtube?.duration) {
                    setVideoDuration(data.youtube.duration);
                }
                try { setProgressHistory(await videoProgressAPI.getHistory(id)); } catch (err) { console.error(err); }
            }
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const handleComplete = async () => {
        try {
            setCompleting(true);
            const result = await questAPI.complete(id);
            const achievementResult = await statsAPI.checkAchievements();
            let message = `+${result.xpEarned} XP earned!`;
            if (result.earlyBonus) message += ' (Early bonus!)';
            if (achievementResult.newAchievements?.length > 0) message += ` 🏆 ${achievementResult.newAchievements[0].name}!`;
            setToast({ type: 'xp', message });
            setTimeout(() => navigate('/'), 2000);
        } catch (err) { setToast({ type: 'error', message: err.message }); setTimeout(() => setToast(null), 3000); } finally { setCompleting(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Abandon this quest?')) return;
        try { await questAPI.delete(id); navigate('/'); } catch (err) { setToast({ type: 'error', message: err.message }); }
    };

    const saveVideoProgress = useCallback(async (time) => {
        if (!quest || quest.type !== 'youtube') return;
        // Allow saving even if same as last time (manual save)
        try {
            const sessionDuration = time > lastSaveTimeRef.current ? time - lastSaveTimeRef.current : 0;
            await videoProgressAPI.save(id, { currentTime: time, sessionDuration });
            lastSaveTimeRef.current = time;
            setCurrentVideoTime(time);
            setProgressHistory(prev => [{ currentTime: time, timestamp: new Date().toISOString(), metadata: { sessionDuration } }, ...prev]);
            setToast({ type: 'success', message: '💾 Progress saved!' });
            setTimeout(() => setToast(null), 1500);
        } catch (err) { setToast({ type: 'error', message: 'Save failed' }); setTimeout(() => setToast(null), 2000); }
    }, [id, quest]);

    const handleTimeInputChange = (field, value) => {
        const numValue = parseInt(value) || 0;
        const newTimeInput = { ...timeInput, [field]: numValue };
        setTimeInput(newTimeInput);
        setCurrentVideoTime((newTimeInput.hours * 3600) + (newTimeInput.minutes * 60) + newTimeInput.seconds);
    };

    // Sync current player time to inputs
    const syncFromPlayer = () => {
        updateTimeInputFromPlayer();
    };

    // Direct YouTube watch URL with timestamp
    const getYouTubeWatchUrl = () => {
        if (!quest?.youtube?.videoId) return null;
        const startTime = Math.floor(currentVideoTime || 0);
        return `https://www.youtube.com/watch?v=${quest.youtube.videoId}&t=${startTime}s`;
    };

    const formatTime = (s) => `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    const formatTimeShort = (s) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Use videoDuration state which gets updated from YouTube API
    const getProgressPercent = () => {
        const duration = videoDuration || quest?.youtube?.duration || 0;
        if (!duration) return 0;
        return Math.min(100, Math.round((currentVideoTime / duration) * 100));
    };

    const getDaysRemaining = () => quest?.deadline ? Math.ceil((new Date(quest.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    // Format relative time
    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Format full timestamp
    const formatFullTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const typeConfig = {
        youtube: { icon: '📺', label: 'YouTube Tutorial', color: '#ff7b54', bg: 'rgba(255, 123, 84, 0.15)', gradient: 'linear-gradient(135deg, #ff7b54, #ffab76)' },
        dsa: { icon: '💻', label: 'DSA Problem', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
        task: { icon: '📋', label: 'Task', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }
    };
    const complexityConfig = {
        easy: { label: 'Easy', color: '#22c55e', icon: '🌱' },
        medium: { label: 'Medium', color: '#eab308', icon: '⚡' },
        hard: { label: 'Hard', color: '#ef4444', icon: '🔥' },
        epic: { label: 'Epic', color: '#a855f7', icon: '💎' }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (error || !quest) return <div className="empty-state"><div className="empty-state-icon">⚠️</div><p className="empty-state-text">{error || 'Quest not found'}</p><Link to="/" className="btn btn-primary">Back</Link></div>;

    const type = typeConfig[quest.type] || typeConfig.task;
    const complexity = complexityConfig[quest.complexity] || complexityConfig.medium;
    const daysRemaining = getDaysRemaining();
    const isOverdue = daysRemaining !== null && daysRemaining < 0;
    const isVideoQuest = quest.type === 'youtube' && quest.youtube?.videoId;
    const isDsaQuest = quest.type === 'dsa';
    const isTaskQuest = quest.type === 'task';
    const actualDuration = videoDuration || quest.youtube?.duration || 0;

    // History items to show
    const historyToShow = showAllHistory ? progressHistory : progressHistory.slice(0, 3);

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.type === 'xp' && '⚡'} {toast.message}</div></div>}

            {/* Compact Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link to="/" style={{ padding: '8px 14px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>← Back</Link>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '6px 12px', background: type.bg, border: `1px solid ${type.color}40`, borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, color: type.color }}>{type.icon} {quest.type}</span>
                        <span style={{ padding: '6px 12px', background: `${complexity.color}20`, border: `1px solid ${complexity.color}40`, borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, color: complexity.color }}>{complexity.icon} {complexity.label}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--error)' : 'var(--text-muted)' }}>
                        {isOverdue ? `⚠️ ${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? '⏰ Due today' : `📅 ${daysRemaining}d left`}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{quest.xpReward} XP</div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>

                {/* ===== VIDEO QUEST LAYOUT ===== */}
                {isVideoQuest && (
                    <>
                        {/* Left Panel - Info & Controls */}
                        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                            {/* Title Card */}
                            <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                <div style={{ height: '3px', background: type.gradient }}></div>
                                <div style={{ padding: '14px' }}>
                                    <h1 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', lineHeight: 1.3 }}>{quest.title}</h1>
                                    {quest.youtube?.videoTitle && quest.youtube.videoTitle !== quest.title && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{quest.youtube.videoTitle}</p>
                                    )}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {quest.llmAnalysis?.reasoning && (
                                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1rem' }}>🤖</span>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{quest.llmAnalysis.reasoning}</p>
                                </div>
                            )}

                            {/* Progress Card */}
                            <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📊 Progress
                                        {isPlaying && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1s ease-in-out infinite' }}></span>}
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{getProgressPercent()}%</span>
                                </div>

                                {/* Progress Bar with clickable markers */}
                                <div style={{ position: 'relative', marginBottom: '6px' }}>
                                    <div className="xp-bar" style={{ height: '10px' }}>
                                        <div className="xp-bar-fill" style={{ width: `${getProgressPercent()}%`, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                    {/* Progress markers for history */}
                                    {actualDuration > 0 && progressHistory.slice(0, 10).map((entry, i) => (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            left: `${Math.min(100, (entry.currentTime / actualDuration) * 100)}%`,
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '4px',
                                            height: '14px',
                                            background: i === 0 ? 'var(--aurora-teal)' : 'rgba(255, 255, 255, 0.3)',
                                            borderRadius: '2px'
                                        }} title={`Checkpoint: ${formatTimeShort(entry.currentTime)}`}></div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>{formatTimeShort(currentVideoTime)}</span>
                                    <span>{formatTimeShort(actualDuration)}</span>
                                </div>

                                {/* Time Input with Sync Button */}
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update progress</span>
                                        <button
                                            onClick={syncFromPlayer}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'rgba(0, 255, 204, 0.1)',
                                                border: '1px solid rgba(0, 255, 204, 0.3)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--aurora-teal)',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            🔄 Sync from video
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        <input type="number" className="form-input" style={{ width: '44px', textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem' }} value={timeInput.hours} onChange={(e) => handleTimeInputChange('hours', e.target.value)} min="0" placeholder="H" />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>:</span>
                                        <input type="number" className="form-input" style={{ width: '44px', textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem' }} value={timeInput.minutes} onChange={(e) => handleTimeInputChange('minutes', e.target.value)} min="0" max="59" placeholder="M" />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>:</span>
                                        <input type="number" className="form-input" style={{ width: '44px', textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem' }} value={timeInput.seconds} onChange={(e) => handleTimeInputChange('seconds', e.target.value)} min="0" max="59" placeholder="S" />
                                        <button onClick={() => saveVideoProgress(currentVideoTime)} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>💾 Save</button>
                                    </div>
                                </div>
                            </div>

                            {/* Watch History Card */}
                            {progressHistory.length > 0 && (
                                <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📜 Watch History
                                            <span style={{ padding: '2px 8px', background: type.bg, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', color: type.color }}>{progressHistory.length}</span>
                                        </span>
                                    </div>
                                    <div style={{ maxHeight: showAllHistory ? '200px' : 'auto', overflowY: showAllHistory ? 'auto' : 'visible' }}>
                                        {historyToShow.map((entry, i) => {
                                            const percent = actualDuration ? Math.round((entry.currentTime / actualDuration) * 100) : 0;
                                            const sessionDuration = entry.metadata?.sessionDuration || 0;
                                            return (
                                                <div key={i} style={{
                                                    padding: '10px 14px',
                                                    borderBottom: i < historyToShow.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: i === 0 ? 'rgba(0, 255, 204, 0.03)' : 'transparent'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: i === 0 ? 'var(--aurora-teal)' : 'var(--text-muted)',
                                                            boxShadow: i === 0 ? '0 0 8px var(--aurora-teal)' : 'none'
                                                        }}></div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: i === 0 ? 'var(--aurora-teal)' : 'var(--text-primary)' }}>
                                                                    {formatTimeShort(entry.currentTime)}
                                                                </span>
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    background: `${type.color}15`,
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    fontSize: '0.65rem',
                                                                    color: type.color,
                                                                    fontWeight: 600
                                                                }}>{percent}%</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                {formatFullTimestamp(entry.timestamp)}
                                                                {sessionDuration > 0 && <span style={{ marginLeft: '8px', color: 'var(--aurora-blue)' }}>+{formatTimeShort(sessionDuration)} watched</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {formatRelativeTime(entry.timestamp)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {progressHistory.length > 3 && (
                                        <button
                                            onClick={() => setShowAllHistory(!showAllHistory)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                border: 'none',
                                                borderTop: '1px solid var(--glass-border)',
                                                color: 'var(--aurora-teal)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            {showAllHistory ? '▲ Show less' : `▼ View all ${progressHistory.length} checkpoints`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Spacer */}
                            <div style={{ flex: 1 }}></div>

                            {/* Actions */}
                            {quest.status === 'active' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={handleDelete} style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem' }}>🗑️</button>
                                    <button onClick={handleComplete} disabled={completing} style={{ flex: 1, padding: '12px 14px', background: 'linear-gradient(135deg, var(--success), #34d399)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: completing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        {completing ? <><div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> Completing...</> : <>✨ Complete (+{quest.xpReward} XP)</>}
                                    </button>
                                </div>
                            )}

                            {quest.status === 'completed' && (
                                <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.25rem' }}>🎉</span>
                                    <p style={{ margin: '6px 0 0 0', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Completed! +{quest.xpReward} XP</p>
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Video Player */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            {/* Video Container */}
                            <div style={{ flex: 1, background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '3px', background: type.gradient }}></div>

                                {/* Video Header with YouTube Button */}
                                <div style={{
                                    padding: '10px 14px',
                                    borderBottom: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(0, 0, 0, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={quest.youtube?.thumbnailUrl}
                                            alt=""
                                            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                                        />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {quest.youtube?.videoTitle?.substring(0, 50) || quest.title}
                                            {quest.youtube?.videoTitle?.length > 50 && '...'}
                                        </span>
                                    </div>
                                    <a
                                        href={getYouTubeWatchUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 14px',
                                            background: 'linear-gradient(135deg, #FF0000, #CC0000)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-full)',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            textDecoration: 'none',
                                            boxShadow: '0 2px 10px rgba(255, 0, 0, 0.3)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        Watch on YouTube
                                    </a>
                                </div>

                                {/* Video Player using YouTube IFrame API */}
                                <div style={{ flex: 1, position: 'relative', minHeight: '300px', background: '#000' }}>
                                    <div
                                        id="youtube-player"
                                        ref={iframeRef}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    />
                                </div>

                                {/* Video Footer */}
                                <div style={{
                                    padding: '10px 14px',
                                    borderTop: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    fontSize: '0.8rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                                        <span>⏱️ {formatTimeShort(actualDuration)} total</span>
                                        <span style={{ color: isPlaying ? 'var(--success)' : 'var(--text-muted)' }}>
                                            {isPlaying ? '▶️' : '⏸️'} {formatTimeShort(currentVideoTime)} watched
                                        </span>
                                        <span style={{ color: getProgressPercent() >= 95 ? 'var(--success)' : 'var(--aurora-purple)' }}>
                                            {getProgressPercent() >= 95 ? '✅ Ready to complete!' : `${100 - getProgressPercent()}% remaining`}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isPlaying && <span style={{ padding: '2px 8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontWeight: 600, fontSize: '0.7rem' }}>● LIVE</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== TASK / DSA QUEST LAYOUT ===== */}
                {(isTaskQuest || isDsaQuest) && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ flex: 1, background: 'var(--glass-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '4px', background: type.gradient }}></div>
                            <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '16px', filter: 'drop-shadow(0 0 20px var(--aurora-teal))' }}>{type.icon}</div>
                                    <h1 style={{ fontSize: '2rem', margin: '0 0 12px 0', background: 'linear-gradient(135deg, var(--text-primary), var(--aurora-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{quest.title}</h1>
                                    {quest.description && <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 auto', maxWidth: '600px', lineHeight: 1.6 }}>{quest.description}</p>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{quest.status === 'completed' ? '✅' : '⏳'}</div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                        <div style={{ fontWeight: 600, color: quest.status === 'completed' ? 'var(--success)' : 'var(--aurora-teal)', textTransform: 'capitalize' }}>{quest.status}</div>
                                    </div>
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{isOverdue ? '⚠️' : '📅'}</div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Deadline</div>
                                        <div style={{ fontWeight: 600, color: isOverdue ? 'var(--error)' : 'var(--text-primary)' }}>{new Date(quest.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{complexity.icon}</div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Difficulty</div>
                                        <div style={{ fontWeight: 600, color: complexity.color }}>{complexity.label}</div>
                                    </div>
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Reward</div>
                                        <div style={{ fontWeight: 700, background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{quest.xpReward} XP</div>
                                    </div>
                                </div>
                                {quest.llmAnalysis?.reasoning && (
                                    <div style={{ padding: '16px 20px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🤖</div>
                                        <div><div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--aurora-purple)' }}>AI Analysis</div><p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{quest.llmAnalysis.reasoning}</p></div>
                                    </div>
                                )}
                                {isDsaQuest && quest.dsa && (
                                    <div style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>💻</span>
                                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Problem Details</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Platform:</span> <span style={{ fontWeight: 600, textTransform: 'capitalize', marginLeft: '8px' }}>{quest.dsa.platform}</span></div>
                                            {quest.dsa.topics?.length > 0 && (
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Topics:</span>
                                                    {quest.dsa.topics.map((t, i) => <span key={i} style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--aurora-blue)' }}>{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        {quest.dsa.problemUrl && <a href={quest.dsa.problemUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>🔗 Open Problem on {quest.dsa.platform}</a>}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}></div>
                                {quest.status === 'active' && (
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                        <button onClick={handleDelete} style={{ padding: '14px 24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--error)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}>🗑️ Abandon</button>
                                        <button onClick={handleComplete} disabled={completing} style={{ padding: '14px 48px', background: 'linear-gradient(135deg, var(--success), #34d399)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 700, fontSize: '1.1rem', cursor: completing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}>
                                            {completing ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Completing...</> : <>✨ Complete Quest (+{quest.xpReward} XP)</>}
                                        </button>
                                    </div>
                                )}
                                {quest.status === 'completed' && (
                                    <div style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                                        <h2 style={{ color: 'var(--success)', margin: '0 0 8px 0', fontSize: '1.5rem' }}>Quest Completed!</h2>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You earned <span style={{ fontWeight: 700, background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+{quest.xpReward} XP</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuestDetail;
