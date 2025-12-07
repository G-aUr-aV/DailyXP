import dotenv from 'dotenv';
dotenv.config();

// Check if Gemini API key is available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL;
const USE_MOCK = !GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here';

// XP rewards by complexity
const XP_REWARDS = {
    easy: 50,
    medium: 100,
    hard: 200,
    epic: 500
};

/**
 * Test LLM connection status
 */
export async function testLLMConnection() {
    if (USE_MOCK) {
        return {
            status: 'mock',
            message: 'Running in mock mode. Set GEMINI_API_KEY for real analysis.',
            connected: false
        };
    }

    try {
        // Test Gemini connection
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say "connected" and nothing else.' }] }]
                })
            }
        );

        if (response.ok) {
            return { status: 'connected', message: 'Gemini API connected', connected: true };
        } else {
            return { status: 'error', message: 'Gemini API connection failed', connected: false };
        }
    } catch (error) {
        return { status: 'error', message: error.message, connected: false };
    }
}

/**
 * Analyze quest complexity using LLM (or mock)
 */
export async function analyzeQuestComplexity(quest) {
    if (USE_MOCK) {
        return mockComplexityAnalysis(quest);
    }

    try {
        let prompt = '';

        if (quest.type === 'youtube') {
            prompt = `Analyze the complexity of this YouTube tutorial:
Title: ${quest.title}
${quest.youtube?.videoTitle ? `Video Title: ${quest.youtube.videoTitle}` : ''}
${quest.description ? `Description: ${quest.description}` : ''}
Duration: ${quest.youtube?.duration ? `${Math.round(quest.youtube.duration / 60)} minutes` : 'Unknown'}

Based on the content, determine the learning complexity. Consider:
- Technical depth required
- Prerequisites needed
- Time investment
- Concept difficulty

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
        } else if (quest.type === 'dsa') {
            prompt = `Analyze the complexity of this DSA problem:
Title: ${quest.title}
Platform: ${quest.dsa?.platform || 'Unknown'}
${quest.dsa?.difficulty ? `Listed Difficulty: ${quest.dsa.difficulty}` : ''}
${quest.dsa?.topics ? `Topics: ${quest.dsa.topics.join(', ')}` : ''}
${quest.description ? `Description: ${quest.description}` : ''}

Based on typical DSA problem difficulty, determine complexity:
- Easy: Basic data structures, simple algorithms
- Medium: Moderate algorithms, some optimization
- Hard: Advanced algorithms, complex optimization
- Epic: Competition-level, multiple advanced concepts

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
        } else {
            prompt = `Analyze the complexity of this task:
Title: ${quest.title}
${quest.description ? `Description: ${quest.description}` : ''}

Determine the task complexity based on effort and time required:
- Easy: Quick task, < 30 minutes
- Medium: Moderate effort, 30 min - 2 hours
- Hard: Significant effort, 2-4 hours
- Epic: Major undertaking, > 4 hours

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            console.error('Gemini API error:', await response.text());
            return mockComplexityAnalysis(quest);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                complexity: result.complexity || 'medium',
                xpReward: XP_REWARDS[result.complexity] || XP_REWARDS.medium,
                reasoning: result.reasoning || 'Analyzed by AI'
            };
        }

        return mockComplexityAnalysis(quest);
    } catch (error) {
        console.error('LLM analysis error:', error);
        return mockComplexityAnalysis(quest);
    }
}

/**
 * Mock complexity analysis based on heuristics
 */
function mockComplexityAnalysis(quest) {
    let complexity = 'medium';
    let reasoning = '';

    if (quest.type === 'youtube') {
        const duration = quest.youtube?.duration || 0;
        if (duration < 600) { // < 10 min
            complexity = 'easy';
            reasoning = 'Short video, quick learning';
        } else if (duration < 1800) { // < 30 min
            complexity = 'medium';
            reasoning = 'Standard tutorial length';
        } else if (duration < 3600) { // < 1 hour
            complexity = 'hard';
            reasoning = 'Long-form content, deeper topic';
        } else {
            complexity = 'epic';
            reasoning = 'Extended tutorial, comprehensive coverage';
        }
    } else if (quest.type === 'dsa') {
        const diff = quest.dsa?.difficulty?.toLowerCase();
        if (diff === 'easy') {
            complexity = 'easy';
            reasoning = 'Basic problem';
        } else if (diff === 'medium') {
            complexity = 'medium';
            reasoning = 'Moderate challenge';
        } else if (diff === 'hard') {
            complexity = 'hard';
            reasoning = 'Advanced problem';
        } else {
            complexity = 'medium';
            reasoning = 'Standard difficulty';
        }
    } else {
        // General task - estimate based on description length
        const descLength = (quest.description || '').length;
        if (descLength < 50) {
            complexity = 'easy';
            reasoning = 'Simple task';
        } else if (descLength < 150) {
            complexity = 'medium';
            reasoning = 'Moderate complexity';
        } else {
            complexity = 'hard';
            reasoning = 'Detailed requirements';
        }
    }

    return {
        complexity,
        xpReward: XP_REWARDS[complexity],
        reasoning: `[Mock] ${reasoning}`
    };
}

/**
 * Generate daily email content with trainer persona
 */
export async function generateDailyEmail(stats, pendingQuests) {
    const statsInfo = `
- Level: ${stats.level}
- Total XP: ${stats.totalXP}
- Streak: ${stats.streak} days
- Quests completed: ${stats.questsCompleted}
`;

    const questsInfo = pendingQuests.length > 0
        ? pendingQuests.map(q => `- ${q.title} (${q.type}, ${q.complexity}, deadline: ${q.deadline?.toDateString()})`).join('\n')
        : '- No pending quests this week!';

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    if (USE_MOCK) {
        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    }

    try {
        const prompt = `You are a tough but encouraging personal fitness trainer, but for learning and productivity instead of physical fitness. Write a daily motivation email.

Context:
- Today is ${dayOfWeek}
- User's current stats:
${statsInfo}
- Pending quests for this week:
${questsInfo}

Write a short, punchy email (max 150 words) that:
1. Addresses them as "Champ" or similar
2. Comments on their progress (celebrate wins or push for improvement)
3. Highlights urgent deadlines if any
4. Ends with a motivational punch line

Keep the trainer persona consistent - be tough but supportive, like a coach who believes in them.

Respond in JSON format:
{
  "subject": "Email subject line",
  "body": "Email body in HTML format with some styling"
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            return mockDailyEmail(stats, pendingQuests, dayOfWeek);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    } catch (error) {
        console.error('Email generation error:', error);
        return mockDailyEmail(stats, pendingQuests, dayOfWeek);
    }
}

/**
 * Mock daily email generation
 */
function mockDailyEmail(stats, pendingQuests, dayOfWeek) {
    const activeCount = pendingQuests.length;
    const urgentCount = pendingQuests.filter(q => {
        const daysLeft = Math.ceil((q.deadline - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 2;
    }).length;

    let mood = 'encouraging';
    if (stats.streak >= 7) mood = 'celebrating';
    if (activeCount === 0) mood = 'relaxed';
    if (urgentCount > 0) mood = 'urgent';

    const greetings = {
        celebrating: "🔥 CHAMP! You're on FIRE!",
        encouraging: "Hey Champ! Rise and grind!",
        relaxed: "Hey there, Champion!",
        urgent: "⚠️ Listen up, Champ!"
    };

    const bodies = {
        celebrating: `Your ${stats.streak}-day streak is LEGENDARY! Level ${stats.level} with ${stats.totalXP} XP? That's what I'm talking about! Keep crushing it - you've got ${activeCount} quests lined up. Let's make it another perfect day!`,
        encouraging: `Level ${stats.level}, ${stats.totalXP} XP, and ${activeCount} quests to conquer. You know what to do. Every completed quest is a step closer to greatness. No excuses, no delays - just results!`,
        relaxed: `Cleared your quest log? Impressive! But don't get too comfortable - champions always look for the next challenge. Time to add some new quests and keep that momentum going!`,
        urgent: `We've got ${urgentCount} quest(s) with deadlines breathing down your neck! Time to lock in and get these DONE. You're Level ${stats.level} - you've proven you can do this. Now PROVE IT AGAIN!`
    };

    return {
        subject: `${greetings[mood]} Your ${dayOfWeek} Quest Briefing`,
        body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 30px; border-radius: 15px;">
        <h1 style="color: #ffd700; margin-bottom: 20px;">${greetings[mood]}</h1>
        <p style="font-size: 16px; line-height: 1.6;">${bodies[mood]}</p>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
          <strong style="color: #00d4ff;">📊 Your Stats</strong><br>
          Level ${stats.level} | ${stats.totalXP} XP | 🔥 ${stats.streak} day streak
        </div>
        <p style="color: #888; font-size: 14px; margin-top: 20px;">
          "Champions don't wait for motivation. They create it." - Your Coach
        </p>
      </div>
    `
    };
}

export default {
    analyzeQuestComplexity,
    generateDailyEmail,
    testLLMConnection
};
