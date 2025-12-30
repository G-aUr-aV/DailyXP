import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Wave from 'react-wavify';
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

    // Timer state
    const [timerTime, setTimerTime] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [showTimerHistory, setShowTimerHistory] = useState(false);
    const timerIntervalRef = useRef(null);
    const [alarmTriggered, setAlarmTriggered] = useState(false);
    const [alarmRinging, setAlarmRinging] = useState(false);
    const [hoveredTile, setHoveredTile] = useState(null);
    const [hoveredBlock, setHoveredBlock] = useState(null);
    const [showTopics, setShowTopics] = useState(false);
    const [expandedDescription, setExpandedDescription] = useState(false);
    const alarmAudioRef = useRef(null);

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
            // Playing - start tracking progress and auto-start timer
            setIsPlaying(true);
            startProgressTracking();
            // Auto-start timer if enabled and not running
            if (quest?.timer?.enabled && !timerRunning) {
                autoStartTimer();
            }
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

    // Auto-start timer (without toast) when video plays
    const autoStartTimer = async () => {
        if (!quest?.timer?.enabled || timerRunning) return;
        try {
            await questAPI.timerStart(id);
            setTimerRunning(true);
            startTimerInterval();
        } catch (err) {
            console.error('Auto-start timer failed:', err);
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

    const fetchQuest = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
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
        } catch (err) { setError(err.message); } finally {
            if (!silent) setLoading(false);
        }
    };

    // Retry analysis handler
    const handleRetryAnalysis = async () => {
        try {
            setToast({ type: 'info', message: '🔄 Retrying analysis...' });
            await questAPI.retryAnalysis(id);
            setToast({ type: 'success', message: '✨ Analysis started! It may take a few seconds.' });
            // Fetch immediately then let the polling take over
            await fetchQuest(true);
        } catch (err) {
            setToast({ type: 'error', message: `Failed to retry analysis: ${err.message}` });
        }
    };

    // Poll for pending analysis
    useEffect(() => {
        let interval;
        if (quest?.analysisStatus === 'pending') {
            interval = setInterval(() => fetchQuest(true), 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        }
    }, [quest?.analysisStatus]);

    // Timer functions
    const startTimer = async () => {
        if (!quest?.timer?.enabled) return;
        try {
            await questAPI.timerStart(id);
            setTimerRunning(true);
            startTimerInterval();
            setToast({ type: 'success', message: '⏱️ Timer started!' });
            setTimeout(() => setToast(null), 1500);
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 2000);
        }
    };

    const pauseTimer = async () => {
        if (!quest?.timer?.enabled) return;

        try {
            stopTimerInterval();
            const result = await questAPI.timerPause(id, { currentTime: timerTime });
            setTimerRunning(false);
            if (result.quest) setQuest(result.quest);

            const sessionDuration = result.sessionDuration || 0;
            if (sessionDuration > 0) {
                setToast({ type: 'success', message: `⏸️ Timer paused (+${formatTimerTime(sessionDuration)} session)` });
            } else {
                setToast({ type: 'info', message: '⚠️ No new time to save' });
            }
            setTimeout(() => setToast(null), 2000);
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 2000);
        }
    };

    const resetTimer = async () => {
        if (!quest?.timer?.enabled) return;
        if (!window.confirm('Reset timer to 0? Session history will be kept.')) return;
        try {
            stopTimerInterval();
            const result = await questAPI.timerReset(id);
            setTimerTime(0);
            setTimerRunning(false);
            setAlarmTriggered(false);
            if (result.quest) setQuest(result.quest);
            setToast({ type: 'success', message: '↺ Timer reset' });
            setTimeout(() => setToast(null), 1500);
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 2000);
        }
    };

    const startTimerInterval = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            setTimerTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimerInterval = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };


    // Initialize timer state from quest data - calculate elapsed time if timer was running
    useEffect(() => {
        if (quest?.timer?.enabled) {
            let initialTime = quest.timer.currentTime || 0;

            // If timer is running, calculate elapsed time since lastStartedAt
            if (quest.timer.isRunning && quest.timer.lastStartedAt) {
                const lastStarted = new Date(quest.timer.lastStartedAt).getTime();
                const now = Date.now();
                const elapsedSinceStart = Math.floor((now - lastStarted) / 1000);
                initialTime = (quest.timer.currentTime || 0) + elapsedSinceStart;
            }

            setTimerTime(initialTime);
            setTimerRunning(quest.timer.isRunning || false);
            setAlarmTriggered(quest.timer.alarmTriggered || false);

            if (quest.timer.isRunning) {
                startTimerInterval();
            }
        }
        return () => stopTimerInterval();
    }, [quest?._id, quest?.timer?.enabled]);

    // Check for alarm trigger
    useEffect(() => {
        if (quest?.timer?.enabled && quest?.timer?.alarmEnabled && !alarmTriggered) {
            const alarmThreshold = quest.timer.alarmSeconds || 1800; // Default 30 min
            if (timerTime >= alarmThreshold) {
                setAlarmTriggered(true);
                setAlarmRinging(true);

                // Create and play gentle chime alarm sound
                // Using Web Audio API with softer, melodic tones
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // Create a gentle chime function
                    const playChime = () => {
                        // First note (higher, softer)
                        const osc1 = audioContext.createOscillator();
                        const gain1 = audioContext.createGain();
                        osc1.connect(gain1);
                        gain1.connect(audioContext.destination);
                        osc1.frequency.value = 523; // C5 note
                        osc1.type = 'sine';
                        gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
                        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        osc1.start(audioContext.currentTime);
                        osc1.stop(audioContext.currentTime + 0.5);

                        // Second note (lower, follows first)
                        const osc2 = audioContext.createOscillator();
                        const gain2 = audioContext.createGain();
                        osc2.connect(gain2);
                        gain2.connect(audioContext.destination);
                        osc2.frequency.value = 659; // E5 note
                        osc2.type = 'sine';
                        gain2.gain.setValueAtTime(0.15, audioContext.currentTime + 0.15);
                        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.65);
                        osc2.start(audioContext.currentTime + 0.15);
                        osc2.stop(audioContext.currentTime + 0.65);

                        // Third note (highest, completes the chime)
                        const osc3 = audioContext.createOscillator();
                        const gain3 = audioContext.createGain();
                        osc3.connect(gain3);
                        gain3.connect(audioContext.destination);
                        osc3.frequency.value = 784; // G5 note
                        osc3.type = 'sine';
                        gain3.gain.setValueAtTime(0.12, audioContext.currentTime + 0.3);
                        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.9);
                        osc3.start(audioContext.currentTime + 0.3);
                        osc3.stop(audioContext.currentTime + 0.9);
                    };

                    // Play chime immediately and then every 3 seconds
                    playChime();
                    const intervalId = setInterval(playChime, 3000);

                    alarmAudioRef.current = { audioContext, intervalId };
                } catch (e) {
                    console.log('Audio not available');
                }

                // Sync with server
                questAPI.timerSync(id, timerTime).catch(() => { });
            }
        }
    }, [timerTime, quest?.timer?.alarmEnabled, quest?.timer?.alarmSeconds, alarmTriggered]);

    // Function to dismiss alarm
    const dismissAlarm = () => {
        setAlarmRinging(false);
        if (alarmAudioRef.current) {
            try {
                clearInterval(alarmAudioRef.current.intervalId);
                alarmAudioRef.current.audioContext.close();
                alarmAudioRef.current = null;
            } catch (e) { }
        }
    };

    // Cleanup alarm on unmount
    useEffect(() => {
        return () => {
            if (alarmAudioRef.current) {
                try {
                    clearInterval(alarmAudioRef.current.intervalId);
                    alarmAudioRef.current.audioContext.close();
                } catch (e) { }
            }
        };
    }, []);

    const formatTimerTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

        // Check if this exact timestamp was already saved
        const alreadySaved = progressHistory.some(entry => entry.currentTime === time);
        if (alreadySaved) {
            setToast({ type: 'info', message: `⚠️ Timestamp ${formatTimeShort(time)} already saved` });
            setTimeout(() => setToast(null), 2000);
            return;
        }

        // Pause video first
        if (playerRef.current && playerRef.current.pauseVideo) {
            playerRef.current.pauseVideo();
        }

        try {
            const sessionDuration = time > lastSaveTimeRef.current ? time - lastSaveTimeRef.current : 0;
            let focusTime = 0;

            // If timer is running, pause it and get the session duration
            if (quest.timer?.enabled && timerRunning) {
                stopTimerInterval();
                try {
                    const timerResult = await questAPI.timerPause(id, { currentTime: timerTime });
                    focusTime = timerResult.sessionDuration || 0;
                    setTimerRunning(false);
                    if (timerResult.quest) setQuest(timerResult.quest);
                } catch (timerErr) {
                    console.error('Timer pause failed:', timerErr);
                }
            }

            // Save video progress
            await videoProgressAPI.save(id, { currentTime: time, sessionDuration });
            lastSaveTimeRef.current = time;
            setCurrentVideoTime(time);

            // Add to history with both video watched time and focus time
            setProgressHistory(prev => [{
                currentTime: time,
                timestamp: new Date().toISOString(),
                metadata: { sessionDuration, focusTime }
            }, ...prev]);

            const message = focusTime > 0
                ? `💾 Saved! (+${formatTimerTime(focusTime)} focus time)`
                : '💾 Progress saved!';
            setToast({ type: 'success', message });
            setTimeout(() => setToast(null), 2000);
        } catch (err) {
            setToast({ type: 'error', message: 'Save failed' });
            setTimeout(() => setToast(null), 2000);
        }
    }, [id, quest, timerTime, timerRunning, progressHistory]);

    const handleTimeInputChange = (field, value) => {
        const numValue = parseInt(value) || 0;
        const newTimeInput = { ...timeInput, [field]: numValue };
        const newSeconds = (newTimeInput.hours * 3600) + (newTimeInput.minutes * 60) + newTimeInput.seconds;

        // Pause and seek video to match input
        if (playerRef.current) {
            if (playerRef.current.pauseVideo) playerRef.current.pauseVideo();
            if (playerRef.current.seekTo) playerRef.current.seekTo(newSeconds, true);
        }

        setTimeInput(newTimeInput);
        setCurrentVideoTime(newSeconds);
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
        youtube: {
            icon: '📺', label: 'YouTube Tutorial', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
            waveColors: { front: 'rgba(14, 165, 233, 0.2)', middle: 'rgba(14, 165, 233, 0.12)', back: 'rgba(14, 165, 233, 0.06)' }
        },
        dsa: {
            icon: '💻', label: 'DSA Problem', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', gradient: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
            waveColors: { front: 'rgba(129, 140, 248, 0.2)', middle: 'rgba(129, 140, 248, 0.12)', back: 'rgba(129, 140, 248, 0.06)' }
        },
        task: {
            icon: '📋', label: 'Task', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            waveColors: { front: 'rgba(59, 130, 246, 0.2)', middle: 'rgba(59, 130, 246, 0.12)', back: 'rgba(59, 130, 246, 0.06)' }
        }
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

    // Wave colors for stat tiles
    const waveColors = type.waveColors || { front: 'rgba(59, 130, 246, 0.2)', middle: 'rgba(59, 130, 246, 0.12)', back: 'rgba(59, 130, 246, 0.06)' };

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.type === 'xp' && '⚡'} {toast.message}</div></div>}

            {/* Alarm Overlay Modal */}
            {alarmRinging && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(255, 107, 107, 0.1))',
                        borderRadius: 'var(--radius-xl)',
                        border: '2px solid rgba(239, 68, 68, 0.5)',
                        maxWidth: '400px',
                        animation: 'pulse 0.5s ease-in-out infinite alternate'
                    }}>
                        {/* Alarm Icon */}
                        <div style={{
                            fontSize: '5rem',
                            marginBottom: '24px',
                            animation: 'shake 0.3s ease-in-out infinite'
                        }}>
                            🔔
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: '#ef4444',
                            marginBottom: '12px',
                            background: 'none',
                            WebkitBackgroundClip: 'unset',
                            WebkitTextFillColor: 'unset'
                        }}>
                            Time's Up!
                        </h2>

                        {/* Message */}
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1.1rem',
                            marginBottom: '8px'
                        }}>
                            You've been working for
                        </p>

                        {/* Timer Display */}
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: 'var(--aurora-teal)',
                            marginBottom: '24px',
                            textShadow: '0 0 30px rgba(0, 255, 204, 0.5)'
                        }}>
                            {formatTimerTime(timerTime)}
                        </div>

                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            marginBottom: '32px'
                        }}>
                            Alarm set for {formatTimerTime(quest?.timer?.alarmSeconds || 1800)}
                        </p>

                        {/* Dismiss Button */}
                        <button
                            onClick={dismissAlarm}
                            style={{
                                padding: '16px 48px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                color: 'white',
                                cursor: 'pointer',
                                boxShadow: '0 4px 30px rgba(239, 68, 68, 0.4)',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            🔕 Dismiss Alarm
                        </button>
                    </div>
                </div>
            )}

            {/* Add shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

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
                    <div style={{
                        padding: '8px 16px',
                        background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 255, 204, 0.1)',
                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 255, 204, 0.3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: isOverdue ? 'var(--error)' : 'var(--aurora-teal)'
                    }}>
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
                                <div
                                    onMouseEnter={() => setHoveredBlock('ai-youtube')}
                                    onMouseLeave={() => setHoveredBlock(null)}
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(139, 92, 246, 0.08)',
                                        borderRadius: 'var(--radius-md)',
                                        border: hoveredBlock === 'ai-youtube' ? `2px solid ${type.color}` : '1px solid rgba(139, 92, 246, 0.2)',
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'flex-start',
                                        transition: 'all 0.3s ease',
                                        transform: hoveredBlock === 'ai-youtube' ? 'translateY(-2px)' : 'translateY(0)',
                                        boxShadow: hoveredBlock === 'ai-youtube' ? `0 8px 25px ${type.color}15` : 'none',
                                        cursor: 'default'
                                    }}
                                >
                                    <span style={{ fontSize: '1rem' }}>🤖</span>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{quest.llmAnalysis.reasoning}</p>
                                </div>
                            )}

                            {/* Timer Bar for YouTube Quest */}
                            {quest.timer?.enabled && (
                                <div
                                    onMouseEnter={() => setHoveredBlock('timer-youtube')}
                                    onMouseLeave={() => setHoveredBlock(null)}
                                    style={{
                                        padding: '14px 16px',
                                        background: timerRunning
                                            ? 'linear-gradient(90deg, rgba(0, 255, 204, 0.15), rgba(139, 92, 246, 0.1), rgba(0, 255, 204, 0.15))'
                                            : 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: hoveredBlock === 'timer-youtube'
                                            ? `2px solid ${type.color}`
                                            : timerRunning
                                                ? '1px solid rgba(0, 255, 204, 0.4)'
                                                : '1px solid var(--glass-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        boxShadow: hoveredBlock === 'timer-youtube'
                                            ? `0 8px 30px ${type.color}20`
                                            : timerRunning
                                                ? '0 0 20px rgba(0, 255, 204, 0.2)'
                                                : 'none',
                                        transition: 'all 0.3s ease',
                                        transform: hoveredBlock === 'timer-youtube' ? 'translateY(-2px)' : 'translateY(0)',
                                        cursor: 'default'
                                    }}>
                                    {/* Timer Display */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: timerRunning
                                                ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))'
                                                : 'rgba(139, 92, 246, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            boxShadow: timerRunning ? '0 0 15px rgba(0, 255, 204, 0.4)' : 'none'
                                        }}>
                                            {timerRunning && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: '-2px',
                                                    borderRadius: '50%',
                                                    border: '2px solid transparent',
                                                    borderTopColor: 'var(--aurora-teal)',
                                                    animation: 'spin 1s linear infinite'
                                                }} />
                                            )}
                                            <span style={{ fontSize: '1rem' }}>⏱️</span>
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                fontFamily: 'monospace',
                                                color: timerRunning ? 'var(--aurora-teal)' : 'var(--text-primary)',
                                                lineHeight: 1,
                                                textShadow: timerRunning ? '0 0 15px rgba(0, 255, 204, 0.5)' : 'none'
                                            }}>
                                                {formatTimerTime(timerTime)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {timerRunning ? '● Running' : timerTime > 0 ? 'Paused' : 'Not started'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Control Buttons */}
                                    {quest.status === 'active' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {!timerRunning ? (
                                                <button
                                                    onClick={startTimer}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))',
                                                        border: 'none',
                                                        color: 'white',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 15px rgba(0, 255, 204, 0.4)'
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={pauseTimer}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                        border: 'none',
                                                        color: 'white',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                                                    }}
                                                >
                                                    ⏸
                                                </button>
                                            )}
                                            <button
                                                onClick={resetTimer}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    color: 'var(--error)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ↺
                                            </button>
                                        </div>
                                    )}
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

                                {/* Time Input */}
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update progress</span>
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
                                <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', maxHeight: '220px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📜 Watch History
                                            <span style={{ padding: '2px 8px', background: type.bg, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', color: type.color }}>{progressHistory.length}</span>
                                        </span>
                                        {/* Show total timer time if available */}
                                        {quest.timer?.enabled && quest.timer.pauseHistory?.length > 0 && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--aurora-purple)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                ⏱️ {formatTimerTime(quest.timer.pauseHistory.reduce((sum, s) => sum + (s.duration || 0), 0))} total focus time
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                        {historyToShow.map((entry, i) => {
                                            const percent = actualDuration ? Math.round((entry.currentTime / actualDuration) * 100) : 0;
                                            const sessionDuration = entry.metadata?.sessionDuration || 0;
                                            // Use focusTime saved in metadata (from timer)
                                            const focusTime = entry.metadata?.focusTime || 0;

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
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                <span>{formatFullTimestamp(entry.timestamp)}</span>
                                                                {sessionDuration > 0 && (
                                                                    <span style={{ color: 'var(--aurora-blue)' }}>
                                                                        +{formatTimeShort(sessionDuration)} watched
                                                                    </span>
                                                                )}
                                                                {focusTime > 0 && (
                                                                    <span style={{
                                                                        color: 'var(--aurora-purple)',
                                                                        padding: '1px 6px',
                                                                        background: 'rgba(139, 92, 246, 0.15)',
                                                                        borderRadius: 'var(--radius-sm)'
                                                                    }}>
                                                                        ⏱️ {formatTimerTime(focusTime)} focus
                                                                    </span>
                                                                )}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="custom-tooltip-container">
                                            <span style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                📅 {new Date(quest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="custom-tooltip">
                                                <span className="tooltip-label">Created</span>
                                                <span className="tooltip-date">
                                                    {new Date(quest.createdAt).toLocaleDateString(undefined, {
                                                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="tooltip-time">
                                                    {new Date(quest.createdAt).toLocaleTimeString(undefined, {
                                                        hour: 'numeric', minute: '2-digit', second: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="custom-tooltip-container">
                                            <span style={{ color: isOverdue ? 'var(--error)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                ⏰ {new Date(quest.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="custom-tooltip" style={{ right: 0, left: 'auto' }}>
                                                <span className="tooltip-label" style={{ color: isOverdue ? 'var(--error)' : 'var(--aurora-teal)' }}>
                                                    {isOverdue ? 'Overdue' : 'Deadline'}
                                                </span>
                                                <span className="tooltip-date">
                                                    {new Date(quest.deadline).toLocaleDateString(undefined, {
                                                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="tooltip-time">
                                                    {new Date(quest.deadline).toLocaleTimeString(undefined, {
                                                        hour: 'numeric', minute: '2-digit', second: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {isPlaying && <span style={{ padding: '2px 8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontWeight: 600, fontSize: '0.7rem' }}>● LIVE</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== TASK / DSA QUEST LAYOUT ===== */}
                {(isTaskQuest || isDsaQuest) && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0, overflowY: 'auto' }}>
                        <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)', overflow: 'visible' }}>
                            <div style={{ height: '4px', background: type.gradient }}></div>
                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '16px', filter: 'drop-shadow(0 0 20px var(--aurora-teal))' }}>{type.icon}</div>
                                    <h1 style={{ fontSize: '2rem', margin: '0 0 12px 0', background: 'linear-gradient(135deg, var(--text-primary), var(--aurora-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{quest.title}</h1>
                                    {quest.description && (
                                        <div style={{
                                            margin: '16px auto',
                                            width: '100%',
                                            maxWidth: '800px',
                                            padding: '24px',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--glass-border)',
                                            borderLeft: `3px solid ${type.color}`,
                                            textAlign: 'left'
                                        }}>
                                            <div style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '0.75rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                marginBottom: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '6px'
                                            }}>
                                                <span>📝 Problem Statement</span>
                                                {quest.description.length > 300 && (
                                                    <button
                                                        onClick={() => setExpandedDescription(!expandedDescription)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: type.color,
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'none'}
                                                    >
                                                        {expandedDescription ? 'Collapse' : 'Expand'}
                                                        <span style={{ fontSize: '1rem' }}>{expandedDescription ? '🔼' : '🔽'}</span>
                                                    </button>
                                                )}
                                            </div>
                                            <p style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '1rem',
                                                margin: 0,
                                                lineHeight: 1.7,
                                                whiteSpace: 'pre-wrap',
                                                maxHeight: expandedDescription ? 'none' : '150px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                maskImage: expandedDescription ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                                WebkitMaskImage: expandedDescription ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)'
                                            }}>
                                                {quest.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                                    {/* Created Tile */}
                                    <div
                                        onMouseEnter={() => setHoveredTile('created')}
                                        onMouseLeave={() => setHoveredTile(null)}
                                        style={{
                                            padding: '20px',
                                            background: 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredTile === 'created' ? `2px solid ${type.color}` : '1px solid var(--glass-border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredTile === 'created' ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: hoveredTile === 'created' ? `var(--shadow-md), 0 0 30px ${type.color}20` : 'none'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', borderRadius: '4px 0 0 4px', background: hoveredTile === 'created' ? type.gradient : 'transparent', boxShadow: hoveredTile === 'created' ? `0 0 15px ${type.color}50` : 'none', transition: 'all 0.3s ease' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: hoveredTile === 'created' ? '60%' : '0%', transition: 'height 1.8s cubic-bezier(0.33, 1, 0.68, 1)', overflow: 'hidden', zIndex: 0 }}>
                                            <Wave fill={waveColors.back} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '140%', transform: 'skewX(-3deg)' }} options={{ height: 25, amplitude: 12, speed: 0.05, points: 3 }} />
                                            <Wave fill={waveColors.middle} paused={false} style={{ position: 'absolute', bottom: 0, left: '0', width: '100%', height: '115%' }} options={{ height: 20, amplitude: 18, speed: 0.1, points: 4 }} />
                                            <Wave fill={waveColors.front} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '95%', transform: 'skewX(3deg)' }} options={{ height: 18, amplitude: 20, speed: 0.15, points: 6 }} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🆕</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Created</div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{quest.createdAt ? new Date(quest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{quest.createdAt ? new Date(quest.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}</div>
                                        </div>
                                    </div>

                                    {/* Status Tile */}
                                    <div
                                        onMouseEnter={() => setHoveredTile('status')}
                                        onMouseLeave={() => setHoveredTile(null)}
                                        style={{
                                            padding: '20px',
                                            background: 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredTile === 'status' ? `2px solid ${type.color}` : '1px solid var(--glass-border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredTile === 'status' ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: hoveredTile === 'status' ? `var(--shadow-md), 0 0 30px ${type.color}20` : 'none'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', borderRadius: '4px 0 0 4px', background: hoveredTile === 'status' ? type.gradient : 'transparent', boxShadow: hoveredTile === 'status' ? `0 0 15px ${type.color}50` : 'none', transition: 'all 0.3s ease' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: hoveredTile === 'status' ? '60%' : '0%', transition: 'height 1.8s cubic-bezier(0.33, 1, 0.68, 1)', overflow: 'hidden', zIndex: 0 }}>
                                            <Wave fill={waveColors.back} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '140%', transform: 'skewX(-3deg)' }} options={{ height: 25, amplitude: 12, speed: 0.05, points: 3 }} />
                                            <Wave fill={waveColors.middle} paused={false} style={{ position: 'absolute', bottom: 0, left: '0', width: '100%', height: '115%' }} options={{ height: 20, amplitude: 18, speed: 0.1, points: 4 }} />
                                            <Wave fill={waveColors.front} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '95%', transform: 'skewX(3deg)' }} options={{ height: 18, amplitude: 20, speed: 0.15, points: 6 }} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{quest.status === 'completed' ? '✅' : '⏳'}</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                            <div style={{ fontWeight: 600, color: quest.status === 'completed' ? 'var(--success)' : 'var(--aurora-teal)', textTransform: 'capitalize' }}>{quest.status}</div>
                                        </div>
                                    </div>

                                    {/* Deadline Tile */}
                                    <div
                                        onMouseEnter={() => setHoveredTile('deadline')}
                                        onMouseLeave={() => setHoveredTile(null)}
                                        style={{
                                            padding: '20px',
                                            background: isOverdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredTile === 'deadline' ? `2px solid ${type.color}` : isOverdue ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredTile === 'deadline' ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: hoveredTile === 'deadline' ? `var(--shadow-md), 0 0 30px ${type.color}20` : 'none'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', borderRadius: '4px 0 0 4px', background: hoveredTile === 'deadline' ? type.gradient : 'transparent', boxShadow: hoveredTile === 'deadline' ? `0 0 15px ${type.color}50` : 'none', transition: 'all 0.3s ease' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: hoveredTile === 'deadline' ? '60%' : '0%', transition: 'height 1.8s cubic-bezier(0.33, 1, 0.68, 1)', overflow: 'hidden', zIndex: 0 }}>
                                            <Wave fill={waveColors.back} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '140%', transform: 'skewX(-3deg)' }} options={{ height: 25, amplitude: 12, speed: 0.05, points: 3 }} />
                                            <Wave fill={waveColors.middle} paused={false} style={{ position: 'absolute', bottom: 0, left: '0', width: '100%', height: '115%' }} options={{ height: 20, amplitude: 18, speed: 0.1, points: 4 }} />
                                            <Wave fill={waveColors.front} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '95%', transform: 'skewX(3deg)' }} options={{ height: 18, amplitude: 20, speed: 0.15, points: 6 }} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{isOverdue ? '⚠️' : '📅'}</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: isOverdue ? 'var(--error)' : 'var(--text-muted)', marginBottom: '4px' }}>{isOverdue ? 'Overdue' : 'Deadline'}</div>
                                            <div style={{ fontWeight: 600, color: isOverdue ? 'var(--error)' : 'var(--text-primary)' }}>{new Date(quest.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(quest.deadline).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    {/* Difficulty Tile */}
                                    <div
                                        onMouseEnter={() => setHoveredTile('difficulty')}
                                        onMouseLeave={() => setHoveredTile(null)}
                                        style={{
                                            padding: '20px',
                                            background: 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredTile === 'difficulty' ? `2px solid ${type.color}` : '1px solid var(--glass-border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredTile === 'difficulty' ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: hoveredTile === 'difficulty' ? `var(--shadow-md), 0 0 30px ${type.color}20` : 'none'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', borderRadius: '4px 0 0 4px', background: hoveredTile === 'difficulty' ? type.gradient : 'transparent', boxShadow: hoveredTile === 'difficulty' ? `0 0 15px ${type.color}50` : 'none', transition: 'all 0.3s ease' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: hoveredTile === 'difficulty' ? '60%' : '0%', transition: 'height 1.8s cubic-bezier(0.33, 1, 0.68, 1)', overflow: 'hidden', zIndex: 0 }}>
                                            <Wave fill={waveColors.back} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '140%', transform: 'skewX(-3deg)' }} options={{ height: 25, amplitude: 12, speed: 0.05, points: 3 }} />
                                            <Wave fill={waveColors.middle} paused={false} style={{ position: 'absolute', bottom: 0, left: '0', width: '100%', height: '115%' }} options={{ height: 20, amplitude: 18, speed: 0.1, points: 4 }} />
                                            <Wave fill={waveColors.front} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '95%', transform: 'skewX(3deg)' }} options={{ height: 18, amplitude: 20, speed: 0.15, points: 6 }} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{complexity.icon}</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                {quest.dsa?.platform === 'codeforces' && quest.dsa?.rating ? 'CF Rating' : 'Difficulty'}
                                            </div>
                                            <div style={{
                                                fontWeight: 600, color:
                                                    quest.analysisStatus === 'pending' ? 'var(--text-muted)' :
                                                        (quest.dsa?.platform === 'codeforces' && quest.dsa?.rating)
                                                            ? (quest.dsa.rating >= 2400 ? '#ff0000' :
                                                                quest.dsa.rating >= 2100 ? '#ff8c00' :
                                                                    quest.dsa.rating >= 1900 ? '#a0a' :
                                                                        quest.dsa.rating >= 1600 ? '#0000ff' :
                                                                            quest.dsa.rating >= 1400 ? '#03a89e' :
                                                                                quest.dsa.rating >= 1200 ? '#008000' : '#808080')
                                                            : complexity.color
                                            }}>
                                                {quest.analysisStatus === 'pending' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.9rem', animation: 'pulse 1.5s infinite' }}>Analyzing...</span>
                                                    </span>
                                                ) : quest.analysisStatus === 'failed' ? (
                                                    <span style={{ color: 'var(--error, #ff4444)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        ⚠️ Failed
                                                    </span>
                                                ) : (
                                                    quest.dsa?.platform === 'codeforces' && quest.dsa?.rating
                                                        ? quest.dsa.rating
                                                        : (quest.dsa?.platform === 'leetcode' && quest.dsa?.difficulty)
                                                            ? quest.dsa.difficulty
                                                            : complexity.label
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reward Tile */}
                                    <div
                                        onMouseEnter={() => setHoveredTile('reward')}
                                        onMouseLeave={() => setHoveredTile(null)}
                                        style={{
                                            padding: '20px',
                                            background: 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredTile === 'reward' ? `2px solid ${type.color}` : '1px solid var(--glass-border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'default',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredTile === 'reward' ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: hoveredTile === 'reward' ? `var(--shadow-md), 0 0 30px ${type.color}20` : 'none'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', borderRadius: '4px 0 0 4px', background: hoveredTile === 'reward' ? type.gradient : 'transparent', boxShadow: hoveredTile === 'reward' ? `0 0 15px ${type.color}50` : 'none', transition: 'all 0.3s ease' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: hoveredTile === 'reward' ? '60%' : '0%', transition: 'height 1.8s cubic-bezier(0.33, 1, 0.68, 1)', overflow: 'hidden', zIndex: 0 }}>
                                            <Wave fill={waveColors.back} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '140%', transform: 'skewX(-3deg)' }} options={{ height: 25, amplitude: 12, speed: 0.05, points: 3 }} />
                                            <Wave fill={waveColors.middle} paused={false} style={{ position: 'absolute', bottom: 0, left: '0', width: '100%', height: '115%' }} options={{ height: 20, amplitude: 18, speed: 0.1, points: 4 }} />
                                            <Wave fill={waveColors.front} paused={false} style={{ position: 'absolute', bottom: 0, left: '-10%', width: '120%', height: '95%', transform: 'skewX(3deg)' }} options={{ height: 18, amplitude: 20, speed: 0.15, points: 6 }} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Reward</div>
                                            <div style={{ fontWeight: 700, background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                {quest.analysisStatus === 'pending' ? (
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Analyzing...</span>
                                                ) : quest.analysisStatus === 'failed' ? (
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--error, #ff4444)', WebkitTextFillColor: 'var(--error, #ff4444)' }}>Failed</span>
                                                ) : (
                                                    `${quest.xpReward} XP`
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timer Bar - Compact inline design */}
                                {quest.timer?.enabled && (
                                    <div
                                        onMouseEnter={() => setHoveredBlock('timer-task')}
                                        onMouseLeave={() => setHoveredBlock(null)}
                                        style={{
                                            marginBottom: '24px',
                                            padding: '16px 24px',
                                            background: timerRunning
                                                ? 'linear-gradient(90deg, rgba(0, 255, 204, 0.15), rgba(139, 92, 246, 0.1), rgba(0, 255, 204, 0.15))'
                                                : 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: 'var(--radius-full)',
                                            border: hoveredBlock === 'timer-task'
                                                ? `2px solid ${type.color}`
                                                : timerRunning
                                                    ? '1px solid rgba(0, 255, 204, 0.4)'
                                                    : '1px solid var(--glass-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '20px',
                                            boxShadow: hoveredBlock === 'timer-task'
                                                ? `0 8px 30px ${type.color}20`
                                                : timerRunning
                                                    ? '0 0 25px rgba(0, 255, 204, 0.2)'
                                                    : 'none',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredBlock === 'timer-task' ? 'translateY(-2px)' : 'translateY(0)',
                                            cursor: 'default'
                                        }}>
                                        {/* Left: Timer Display */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {/* Circular indicator */}
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: timerRunning
                                                    ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))'
                                                    : 'rgba(139, 92, 246, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                boxShadow: timerRunning ? '0 0 20px rgba(0, 255, 204, 0.4)' : 'none'
                                            }}>
                                                {timerRunning && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        inset: '-3px',
                                                        borderRadius: '50%',
                                                        border: '2px solid transparent',
                                                        borderTopColor: 'var(--aurora-teal)',
                                                        animation: 'spin 1s linear infinite'
                                                    }} />
                                                )}
                                                <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                                            </div>

                                            {/* Time display */}
                                            <div>
                                                <div style={{
                                                    fontSize: '2rem',
                                                    fontWeight: 800,
                                                    fontFamily: 'monospace',
                                                    color: timerRunning ? 'var(--aurora-teal)' : 'var(--text-primary)',
                                                    lineHeight: 1,
                                                    textShadow: timerRunning ? '0 0 20px rgba(0, 255, 204, 0.5)' : 'none'
                                                }}>
                                                    {formatTimerTime(timerTime)}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-muted)',
                                                    marginTop: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    {timerRunning ? (
                                                        <>
                                                            <span style={{
                                                                width: '6px',
                                                                height: '6px',
                                                                borderRadius: '50%',
                                                                background: 'var(--aurora-teal)',
                                                                animation: 'pulse 1s ease-in-out infinite'
                                                            }} />
                                                            Running
                                                        </>
                                                    ) : timerTime > 0 ? 'Paused' : 'Not started'}
                                                    {quest.timer.pauseHistory?.length > 0 && (
                                                        <button
                                                            onClick={() => setShowTimerHistory(!showTimerHistory)}
                                                            style={{
                                                                background: showTimerHistory ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--aurora-purple)',
                                                                padding: '4px 8px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.85rem',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            • {quest.timer.pauseHistory.length} session{quest.timer.pauseHistory.length > 1 ? 's' : ''}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center: Alarm Badge (if enabled) */}
                                        {quest.timer?.alarmEnabled && (
                                            <div style={{
                                                padding: '6px 14px',
                                                background: alarmTriggered
                                                    ? 'rgba(239, 68, 68, 0.2)'
                                                    : 'rgba(139, 92, 246, 0.15)',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: alarmTriggered ? 'var(--error)' : 'var(--aurora-purple)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                🔔 {alarmTriggered ? 'Triggered!' : formatTimerTime(quest.timer.alarmSeconds || 1800)}
                                            </div>
                                        )}

                                        {/* Right: Control Buttons */}
                                        {quest.status === 'active' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {!timerRunning ? (
                                                    <button
                                                        onClick={startTimer}
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-green))',
                                                            border: 'none',
                                                            color: 'white',
                                                            fontSize: '1.25rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 15px rgba(0, 255, 204, 0.4)',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        ▶
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={pauseTimer}
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                            border: 'none',
                                                            color: 'white',
                                                            fontSize: '1.25rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        ⏸
                                                    </button>
                                                )}
                                                <button
                                                    onClick={resetTimer}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'transparent',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        color: 'var(--error)',
                                                        fontSize: '1rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                    }}
                                                >
                                                    ↺
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Session History Section */}
                                {showTimerHistory && quest.timer?.pauseHistory?.length > 0 && (
                                    <div style={{
                                        marginBottom: '24px',
                                        padding: '20px',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid rgba(139, 92, 246, 0.15)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '1.25rem' }}>📊</span>
                                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Session History</span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: 'rgba(139, 92, 246, 0.2)',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--aurora-purple)'
                                                }}>
                                                    {quest.timer.pauseHistory.length} session{quest.timer.pauseHistory.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setShowTimerHistory(false)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '1.2rem'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            maxHeight: '300px',
                                            overflowY: 'auto'
                                        }}>
                                            {(() => {
                                                // Calculate cumulative totals for each session
                                                const sessions = quest.timer.pauseHistory.slice();
                                                let runningTotal = 0;
                                                const sessionsWithTotal = sessions.map(s => {
                                                    runningTotal += (s.duration || 0);
                                                    return { ...s, cumulativeTotal: runningTotal };
                                                });

                                                return sessionsWithTotal.slice().reverse().map((session, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '12px 16px',
                                                        background: 'rgba(0, 0, 0, 0.3)',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--glass-border)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                color: 'white'
                                                            }}>
                                                                {sessionsWithTotal.length - index}
                                                            </span>
                                                            <div>
                                                                <div style={{
                                                                    fontWeight: 600,
                                                                    fontSize: '0.9rem',
                                                                    color: 'var(--aurora-teal)',
                                                                    fontFamily: 'monospace'
                                                                }}>
                                                                    +{formatTimerTime(session.duration || 0)}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-muted)'
                                                                }}>
                                                                    {new Date(session.pausedAt).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-muted)'
                                                        }}>
                                                            Cumulative: {formatTimerTime(session.cumulativeTotal)}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                        {/* Total Time Summary */}
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1), rgba(139, 92, 246, 0.1))',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                Total Time Invested
                                            </span>
                                            <span style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: 'var(--aurora-teal)'
                                            }}>
                                                {formatTimerTime(quest.timer.pauseHistory.reduce((sum, s) => sum + (s.duration || 0), 0))}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {quest.analysisStatus === 'pending' && (
                                    <div style={{
                                        padding: '16px 20px',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px dashed rgba(139, 92, 246, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                border: '2px solid var(--aurora-purple)',
                                                borderTopColor: 'transparent',
                                                animation: 'spin 1s linear infinite'
                                            }} />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                AI Analysis in progress... The difficulty and XP reward will be updated shortly.
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleRetryAnalysis}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(139, 92, 246, 0.2)',
                                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--aurora-purple)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            🔄 Retry
                                        </button>
                                    </div>
                                )}

                                {quest.llmAnalysis?.reasoning && quest.analysisStatus !== 'pending' && (
                                    <div
                                        onMouseEnter={() => setHoveredBlock('ai-task')}
                                        onMouseLeave={() => setHoveredBlock(null)}
                                        style={{
                                            padding: '16px 20px',
                                            background: 'rgba(139, 92, 246, 0.08)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: hoveredBlock === 'ai-task' ? `2px solid ${type.color}` : '1px solid rgba(139, 92, 246, 0.2)',
                                            display: 'flex',
                                            gap: '14px',
                                            alignItems: 'flex-start',
                                            marginBottom: '24px',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredBlock === 'ai-task' ? 'translateY(-2px)' : 'translateY(0)',
                                            boxShadow: hoveredBlock === 'ai-task' ? `0 8px 25px ${type.color}15` : 'none',
                                            cursor: 'default'
                                        }}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🤖</div>
                                        <div><div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--aurora-purple)' }}>AI Analysis</div><p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{quest.llmAnalysis.reasoning}</p></div>
                                    </div>
                                )}
                                {isDsaQuest && quest.dsa && (
                                    <div
                                        onMouseEnter={() => setHoveredBlock('dsa-details')}
                                        onMouseLeave={() => setHoveredBlock(null)}
                                        style={{
                                            background: 'var(--glass-bg)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--glass-border)',
                                            padding: '24px',
                                            marginBottom: '24px',
                                            transition: 'all 0.3s ease',
                                            transform: hoveredBlock === 'dsa-details' ? 'translateY(-2px)' : 'translateY(0)',
                                            boxShadow: hoveredBlock === 'dsa-details' ? `0 8px 25px ${type.color}15` : 'none',
                                            cursor: 'default'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>💻</span>
                                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Problem Details</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Platform:</span> <span style={{ fontWeight: 600, textTransform: 'capitalize', marginLeft: '8px' }}>{quest.dsa.platform}</span></div>
                                            {quest.dsa.topics?.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div
                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                                        onClick={() => setShowTopics(!showTopics)}
                                                    >
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Topics:</span>
                                                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{showTopics ? '👁️' : '👁️‍🗨️'}</span>
                                                    </div>
                                                    {showTopics && (
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                            {quest.dsa.topics.map((t, i) => <span key={i} style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--aurora-blue)' }}>{t}</span>)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {quest.dsa.problemUrl && <a href={quest.dsa.problemUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>🔗 Open Problem on {quest.dsa.platform}</a>}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}></div>
                                {quest.status === 'active' && (
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                        <button
                                            onClick={handleDelete}
                                            style={{
                                                padding: '14px 24px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.border = '2px solid var(--error)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.2)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >🗑️ Abandon</button>
                                        <button
                                            onClick={handleComplete}
                                            disabled={completing}
                                            style={{
                                                padding: '14px 48px',
                                                background: 'linear-gradient(135deg, var(--success), #34d399)',
                                                border: '2px solid transparent',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                cursor: completing ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 35px rgba(16, 185, 129, 0.5)';
                                                e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
                                                e.currentTarget.style.border = '2px solid transparent';
                                            }}
                                        >
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
