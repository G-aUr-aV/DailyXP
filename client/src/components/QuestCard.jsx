import { useState } from 'react';
import { Link } from 'react-router-dom';
import Wave from 'react-wavify';
import { formatRelativeTime, formatFullDate, getDaysRemaining } from '../utils/dateUtils';
import { formatDuration, getProgressPercent } from '../utils/timeFormatters';
import { QUEST_TYPE_CONFIG, QUEST_COMPLEXITY_CONFIG } from '../utils/constants';

function QuestCard({ quest, onComplete }) {
    const [isHovered, setIsHovered] = useState(false);

    // Compute derived values
    const daysRemaining = getDaysRemaining(quest.deadline);
    const isUrgent = daysRemaining !== null && daysRemaining <= 2 && daysRemaining >= 0;
    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    const typeConfig = QUEST_TYPE_CONFIG[quest.type] || QUEST_TYPE_CONFIG.task;
    const complexityConfig = QUEST_COMPLEXITY_CONFIG[quest.complexity] || QUEST_COMPLEXITY_CONFIG.medium;

    // Get wave color based on quest type
    const getWaveColor = () => {
        switch (quest.type) {
            case 'youtube': return 'rgba(255, 123, 84, 0.15)';
            case 'dsa': return 'rgba(139, 92, 246, 0.15)';
            case 'task': return 'rgba(59, 130, 246, 0.15)';
            default: return 'rgba(0, 255, 204, 0.12)';
        }
    };

    const getDeadlineStyle = () => {
        if (isOverdue) return { color: 'var(--error)', fontWeight: 600 };
        if (isUrgent) return { color: 'var(--warning)', fontWeight: 600 };
        return { color: 'var(--text-muted)' };
    };

    const getDeadlineText = () => {
        if (isOverdue) return `⚠️ ${Math.abs(daysRemaining)}d overdue`;
        if (daysRemaining === 0) return '⏰ Due today';
        return `📅 ${daysRemaining}d left`;
    };

    const videoProgress = quest.youtube?.duration
        ? getProgressPercent(quest.youtube.currentTime, quest.youtube.duration)
        : 0;

    return (
        <div
            className="card quest-card"
            data-type={quest.type}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Realistic Wave Animation */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: isHovered ? '60%' : '0%',
                    transition: 'height 1.5s ease-out',
                    overflow: 'hidden',
                    zIndex: 0
                }}
            >
                <Wave
                    fill={getWaveColor()}
                    paused={false}
                    style={{
                        display: 'flex',
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: '100%'
                    }}
                    options={{
                        height: 15,
                        amplitude: isHovered ? 20 : 5,
                        speed: 0.2,
                        points: 4
                    }}
                />
            </div>

            {/* Spilled Badge */}
            {quest.spillCount > 0 && (
                <span className="quest-spilled">Spilled ×{quest.spillCount}</span>
            )}

            {/* Header */}
            <div className="quest-header">
                <Link to={`/quests/${quest._id}`} style={{ textDecoration: 'none' }}>
                    <h4 className="quest-title">{quest.title}</h4>
                </Link>
                <div className="quest-xp">{quest.xpReward} XP</div>
            </div>

            {/* Description */}
            {quest.description && (
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginTop: 'var(--space-sm)',
                    lineHeight: 1.5
                }}>
                    {quest.description.slice(0, 100)}
                    {quest.description.length > 100 ? '...' : ''}
                </p>
            )}

            {/* Meta Badges */}
            <div className="quest-meta">
                <span className={`quest-badge badge-${quest.type}`}>
                    {typeConfig.icon} {quest.type}
                </span>
                <span className={`quest-badge badge-${quest.complexity || 'medium'}`}>
                    {quest.complexity}
                </span>
            </div>

            {/* Timestamps Row - Popup details on hover */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="custom-tooltip-container">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        🆕 {formatRelativeTime(quest.createdAt)}
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
                {daysRemaining !== null && (
                    <div className="custom-tooltip-container">
                        <span style={{
                            ...getDeadlineStyle(),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                        }}>
                            {getDeadlineText()}
                        </span>
                        <div className="custom-tooltip" style={{ right: 0, left: 'auto', transform: 'translateY(8px) scale(0.95)' }}>
                            <span className="tooltip-label" style={{ color: isOverdue ? 'var(--error)' : isUrgent ? 'var(--warning)' : 'var(--aurora-teal)' }}>
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
                )}
            </div>

            {/* Timer Indicator */}
            {quest.timer?.enabled && (
                <TimerIndicator timer={quest.timer} />
            )}

            {/* Video Progress Bar */}
            {quest.type === 'youtube' && videoProgress > 0 && (
                <div className="video-progress-bar" style={{ marginTop: 'var(--space-lg)', height: '6px' }}>
                    <div
                        className="video-progress-fill"
                        style={{ width: `${videoProgress}%` }}
                    />
                </div>
            )}

            {/* Action Buttons */}
            {quest.status === 'active' && (
                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)' }}>
                    <Link to={`/quests/${quest._id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        {quest.type === 'youtube' ? '▶️ Continue' : '👁️ View'}
                    </Link>
                    <button
                        className="btn btn-success"
                        onClick={() => onComplete?.(quest._id)}
                        style={{ flex: 1 }}
                    >
                        ✓ Complete
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Timer Indicator sub-component
 */
function TimerIndicator({ timer }) {
    const isRunning = timer.isRunning;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'var(--space-sm)',
            padding: '8px 12px',
            background: isRunning
                ? 'linear-gradient(135deg, rgba(0, 255, 204, 0.15), rgba(139, 92, 246, 0.1))'
                : 'rgba(139, 92, 246, 0.08)',
            borderRadius: 'var(--radius-md)',
            border: isRunning
                ? '1px solid rgba(0, 255, 204, 0.4)'
                : '1px solid rgba(139, 92, 246, 0.2)',
            isolation: 'isolate',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
        }}>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isRunning ? 'var(--aurora-teal)' : '#f59e0b',
                boxShadow: isRunning ? '0 0 8px var(--aurora-teal)' : 'none',
                animation: isRunning ? 'pulse 1s ease-in-out infinite' : 'none'
            }} />
            <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: isRunning ? 'var(--aurora-teal)' : 'var(--aurora-purple)',
                transform: 'translateZ(0)',
                textShadow: 'none',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
            }}>
                ⏱️ {formatDuration(timer.currentTime || 0)}
            </span>
            <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginLeft: 'auto'
            }}>
                {isRunning ? '● Running' : '⏸ Paused'}
            </span>
        </div>
    );
}

export default QuestCard;
