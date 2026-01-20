import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import QuestLog from './pages/QuestLog'
import CreateQuest from './pages/CreateQuest'
import QuestDetail from './pages/QuestDetail'
import Achievements from './pages/Achievements'
import GearCollection from './pages/GearCollection'
import Rituals from './pages/Rituals'
import RitualDetail from './pages/RitualDetail'

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
                    <Route path="rituals" element={<Rituals />} />
                    <Route path="rituals/:id" element={<RitualDetail />} />
                    <Route path="armory" element={<GearCollection />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App

