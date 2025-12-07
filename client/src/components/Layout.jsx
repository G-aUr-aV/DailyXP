import { Outlet, NavLink } from 'react-router-dom'

function Layout() {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="nav-logo">
                    🎮 <span>DailyXP</span>
                </div>

                <nav>
                    <ul className="nav-menu">
                        <li>
                            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">🏠</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/quests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">📜</span>
                                <span>Quest Log</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/quests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">➕</span>
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

                <div style={{ marginTop: 'auto', padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <p>Level Up Your Learning 🚀</p>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
