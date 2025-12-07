# 🎮 DailyXP - Gamified Daily Task Tracker

A modern, gamified task tracker for YouTube tutorials, DSA problems, and daily tasks. Level up your learning with XP points, achievements, and AI-powered coaching!

![DailyXP](https://img.shields.io/badge/version-1.0.0-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green) ![MongoDB](https://img.shields.io/badge/mongodb-required-brightgreen)

## ✨ Features

- **📺 YouTube Tutorial Tracking** - Track video progress with exact timestamps, auto-resume
- **💻 DSA Problem Tracking** - Organize coding challenges from LeetCode, HackerRank, etc.
- **📋 Daily Task Management** - General tasks with deadlines
- **🎯 Weekly Dashboard** - Focus on current week's quests
- **⚡ XP & Leveling System** - Earn points for completing quests
- **🔥 Streak Tracking** - Maintain daily activity streaks
- **🏆 Achievements** - Unlock badges for milestones
- **📊 Weekly Spillage** - Incomplete quests roll over with tracking
- **🤖 AI Complexity Analysis** - Automatic XP assignment based on content
- **📧 Daily Coaching Emails** - LLM-powered personal trainer motivation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) Google Gemini API key for AI features

### Installation

```bash
# Clone and enter directory
cd DailyXP

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Configuration

1. Copy environment example:
```bash
cp server/.env.example server/.env
```

2. Update `server/.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/dailyxp
GEMINI_API_KEY=your-key-here  # Optional, mock mode if empty
```

### Running

**Development (both server and client):**
```bash
# From root directory
npm install
npm run dev
```

Or run separately:
```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client  
cd client && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 📁 Project Structure

```
DailyXP/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API client
│   │   └── styles/         # Gamified CSS theme
│   └── package.json
├── server/                 # Express + MongoDB backend
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # LLM, email services
│   │   └── utils/          # Helper functions
│   ├── .env
│   └── package.json
└── package.json            # Monorepo root
```

## 🎮 XP System

| Complexity | Base XP | With Early Bonus (+25%) |
|------------|---------|-------------------------|
| Easy       | 50      | 62                      |
| Medium     | 100     | 125                     |
| Hard       | 200     | 250                     |
| Epic       | 500     | 625                     |

**Streak Bonuses:** Maintain daily activity for bonus multipliers!

## 📡 API Endpoints

### Quests
- `GET /api/quests` - List quests (with filters)
- `GET /api/quests/dashboard` - Get dashboard data
- `POST /api/quests` - Create quest
- `PUT /api/quests/:id/complete` - Complete quest

### Video Progress
- `POST /api/video-progress/:questId` - Save progress
- `GET /api/video-progress/:questId` - Get history

### Stats
- `GET /api/stats` - Get user stats
- `POST /api/stats/check-achievements` - Check for new achievements

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, React Router
- **Backend:** Node.js, Express, MongoDB/Mongoose
- **AI:** Google Gemini (with mock fallback)
- **Styling:** Custom gamified CSS theme

## 📝 License

MIT
