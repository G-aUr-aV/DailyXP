import { useState, useEffect } from 'react';
import { statsAPI, gearAPI } from '../services/api';
import confetti from 'canvas-confetti';

function StatsPanel({ stats, onLevelUp }) {
    const [levelingUp, setLevelingUp] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [gearData, setGearData] = useState(null);
    const [showBonusTooltip, setShowBonusTooltip] = useState(false);

    // Fetch gear data for XP bonus
    useEffect(() => {
        gearAPI.get()
            .then(data => setGearData(data))
            .catch(console.error);
    }, []);

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
                                {levelingUp ? (
                                    <><span className="ascend-spinner"></span> Ascending...</>
                                ) : (
                                    <><span className="ascend-icon">✦</span> Ascend</>
                                )}
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
                            {stats.weekly?.current || 0} / {stats.weekly?.target || 7500}
                        </div>
                        <div className="stat-label">Weekly Progress</div>
                    </div>
                    {/* XP Bonus from Gear */}
                    <div
                        className="stat-item animate-float"
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onMouseEnter={() => setShowBonusTooltip(true)}
                        onMouseLeave={() => setShowBonusTooltip(false)}
                    >
                        <div className="stat-value" style={{
                            color: gearData?.xpBonusPercent > 0 ? '#2ECC71' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}>
                            {gearData?.xpBonusPercent > 0 ? (
                                <>+{gearData.xpBonusPercent}%</>
                            ) : (
                                <>0%</>
                            )}
                            <span style={{
                                fontSize: '0.75rem',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                cursor: 'help'
                            }}>ⓘ</span>
                        </div>
                        <div className="stat-label">XP Bonus</div>

                        {/* Tooltip */}
                        {showBonusTooltip && gearData && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '10px',
                                padding: 'var(--space-md)',
                                background: 'rgba(20, 20, 30, 0.98)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                minWidth: '280px',
                                zIndex: 100,
                                fontSize: '0.85rem'
                            }}>
                                {/* Arrow */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    left: '50%',
                                    transform: 'translateX(-50%) rotate(45deg)',
                                    width: '12px',
                                    height: '12px',
                                    background: 'rgba(20, 20, 30, 0.98)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderTop: 'none',
                                    borderLeft: 'none'
                                }} />

                                <div style={{
                                    fontWeight: 700,
                                    marginBottom: '10px',
                                    color: '#FFD700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    ⚔️ XP Bonus Breakdown
                                </div>

                                {/* Equipped Set Section */}
                                <div style={{
                                    padding: '8px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        🏰 Armory (Equipped Set)
                                    </div>
                                    {gearData.equippedSet ? (() => {
                                        const bonuses = {
                                            common: 3, uncommon: 5, rare: 8,
                                            epic: 12, legendary: 18, mythic: 25
                                        };
                                        const colors = {
                                            common: '#8B8B8B', uncommon: '#2ECC71', rare: '#3498DB',
                                            epic: '#9B59B6', legendary: '#F39C12', mythic: '#E74C3C'
                                        };
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: colors[gearData.equippedSet], fontWeight: 600, textTransform: 'capitalize' }}>
                                                    ⚔️ {gearData.equippedSet} Set
                                                </span>
                                                <span style={{ color: '#2ECC71', fontWeight: 700 }}>+{bonuses[gearData.equippedSet]}%</span>
                                            </div>
                                        );
                                    })() : (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            No set equipped - Visit Armory to equip one!
                                        </div>
                                    )}

                                    {gearData.levelMultiplier > 1 && gearData.equippedSet && (
                                        <div style={{
                                            marginTop: '6px',
                                            paddingTop: '6px',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.8rem'
                                        }}>
                                            <span style={{ color: '#3498DB' }}>🎮 Level {gearData.userLevel} Multiplier</span>
                                            <span style={{ color: '#3498DB', fontWeight: 600 }}>×{gearData.levelMultiplier}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Early Completion Bonus Section */}
                                <div style={{
                                    padding: '8px',
                                    background: 'rgba(46, 204, 113, 0.1)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(46, 204, 113, 0.2)',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        ⏰ Early Completion Bonus
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#2ECC71', fontSize: '0.8rem' }}>
                                            Complete quests before deadline
                                        </span>
                                        <span style={{ color: '#2ECC71', fontWeight: 700 }}>+10%</span>
                                    </div>
                                </div>

                                {/* Total */}
                                <div style={{
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: 700
                                }}>
                                    <span style={{ color: 'var(--text-primary)' }}>Current Gear Bonus</span>
                                    <span style={{ color: '#2ECC71', fontSize: '1.1rem' }}>+{gearData.xpBonusPercent}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default StatsPanel;
