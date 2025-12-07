import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import QuestLog from './pages/QuestLog'
import CreateQuest from './pages/CreateQuest'
import QuestDetail from './pages/QuestDetail'
import Achievements from './pages/Achievements'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="quests" element={<QuestLog />} />
                    <Route path="quests/new" element={<CreateQuest />} />
                    <Route path="quests/:id" element={<QuestDetail />} />
                    <Route path="achievements" element={<Achievements />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
