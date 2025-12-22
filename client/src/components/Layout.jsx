import { Outlet, NavLink } from 'react-router-dom'

function Layout() {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="nav-logo">
                    <span>DailyXP</span>
                </div>

                <nav>
                    <ul className="nav-menu">
                        <li>
                            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">🏠</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/quests" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">📜</span>
                                <span>Quest Log</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/quests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">✨</span>
                                <span>New Quest</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/achievements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">🏆</span>
                                <span>Achievements</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div style={{
                    marginTop: 'auto',
                    padding: 'var(--space-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: 'var(--space-lg)'
                }}>
                    <p style={{
                        background: 'linear-gradient(135deg, var(--aurora-teal) 0%, var(--aurora-purple) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 600
                    }}>
                        Level Up Your Learning ✦
                    </p>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
