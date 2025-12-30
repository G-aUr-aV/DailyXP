import { useState } from 'react';
import { statsAPI } from '../services/api';
import confetti from 'canvas-confetti';

function StatsPanel({ stats, onLevelUp }) {
    const [levelingUp, setLevelingUp] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    if (!stats) return null;

    const xpProgress = stats.xpToNextLevel > 0
        ? Math.round((stats.currentLevelXP / stats.xpToNextLevel) * 100)
        : 0;

    const canLevelUp = stats.currentLevelXP >= stats.xpToNextLevel;

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const handleLevelUp = async () => {
        try {
            setLevelingUp(true);
            const result = await statsAPI.levelUp();

            // Success!
            triggerConfetti();
            setShowCelebration(true);

            if (onLevelUp) onLevelUp(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLevelingUp(false);
        }
    };

    return (
        <>
            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="levelup-overlay">
                    <div className="levelup-content">
                        <div className="levelup-badge">🏆</div>
                        <div className="levelup-title">Level Up!</div>
                        <div className="levelup-subtitle">
                            You are now a Level {stats.level} Adventurer!
                        </div>
                        <button
                            className="levelup-close"
                            onClick={() => setShowCelebration(false)}
                        >
                            Continue Journey
                        </button>
                    </div>
                </div>
            )}

            <div className="stats-panel">
                <div className="level-display">
                    <div className="level-badge" style={{
                        position: 'relative',
                        animation: canLevelUp ? 'pulse 1.5s infinite' : 'none',
                        border: canLevelUp ? '2px solid var(--aurora-gold)' : '2px solid var(--aurora-purple)',
                        boxShadow: canLevelUp ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none'
                    }}>
                        {stats.level}
                    </div>
                    <div className="level-info">
                        <h3>Level {stats.level} Adventurer</h3>
                        <p>{stats.totalXP.toLocaleString()} Total XP Earned</p>
                    </div>
                </div>

                <div className="xp-bar-container">
                    <div className="xp-bar">
                        <div
                            className="xp-bar-fill"
                            style={{ width: `${Math.min(xpProgress, 100)}%` }}
                        ></div>
                    </div>
                    <div className="xp-text" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{stats.currentLevelXP.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP</span>

                        {canLevelUp ? (
                            <button
                                onClick={handleLevelUp}
                                disabled={levelingUp}
                                className="btn-levelup"
                            >
                                {levelingUp ? 'Ascending...' : '⬆️ LEVEL UP NOW!'}
                            </button>
                        ) : (
                            <span style={{
                                background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '0.9rem'
                            }}>
                                Next: Level {stats.level + 1}
                            </span>
                        )}
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-item animate-float">
                        <div className="stat-value">
                            {stats.streak > 0 && <span className="streak-fire">🔥</span>}
                            {stats.streak}
                        </div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-item animate-float-delayed">
                        <div className="stat-value">{stats.questsCompleted}</div>
                        <div className="stat-label">Quests Done</div>
                    </div>
                    <div className="stat-item animate-float-delayed-2">
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                            {stats.weekly?.current || 0} / {stats.weekly?.target || 2500}
                        </div>
                        <div className="stat-label">Weekly Progress</div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default StatsPanel;
