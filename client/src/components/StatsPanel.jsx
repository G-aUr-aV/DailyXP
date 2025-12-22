function StatsPanel({ stats }) {
    if (!stats) return null;

    const xpProgress = stats.xpToNextLevel > 0
        ? Math.round((stats.currentLevelXP / stats.xpToNextLevel) * 100)
        : 0;

    return (
        <div className="stats-panel">
            <div className="level-display">
                <div className="level-badge">
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
                        style={{ width: `${xpProgress}%` }}
                    ></div>
                </div>
                <div className="xp-text">
                    <span>{stats.currentLevelXP.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP</span>
                    <span style={{
                        background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-purple))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Next: Level {stats.level + 1}
                    </span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-value">
                        {stats.streak > 0 && <span className="streak-fire">🔥</span>}
                        {stats.streak}
                    </div>
                    <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.questsCompleted}</div>
                    <div className="stat-label">Quests Done</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.weekly?.progress || 0}%</div>
                    <div className="stat-label">Weekly Goal</div>
                </div>
            </div>
        </div>
    );
}

export default StatsPanel;
