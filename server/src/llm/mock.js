/**
 * Mock LLM Responses
 * Used when Gemini API is not available
 */

import { XP_REWARDS, COMPLEXITY_LEVELS } from './constants.js';

/**
 * Calculate time pressure factor based on days remaining
 * @param {Object} quest 
 * @returns {number} 0-2 levels to bump up complexity
 */
function getTimePressureBump(quest) {
    if (!quest.deadline) return 0;

    const daysRemaining = Math.ceil((new Date(quest.deadline) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 1) return 2;  // Very tight - bump up 2 levels
    if (daysRemaining <= 2) return 1;  // Tight - bump up 1 level
    if (daysRemaining <= 3) return 0;  // Moderate - no bump
    return 0;  // Plenty of time
}

/**
 * Bump complexity level by n steps
 */
function bumpComplexity(baseComplexity, bump) {
    const levels = ['easy', 'medium', 'hard', 'epic'];
    const currentIndex = levels.indexOf(baseComplexity);
    const newIndex = Math.min(currentIndex + bump, levels.length - 1);
    return levels[newIndex];
}

/**
 * Mock complexity analysis based on heuristics
 */
export function mockComplexityAnalysis(quest) {
    let baseComplexity = 'medium';
    let reasoning = '';

    if (quest.type === 'youtube') {
        const duration = quest.youtube?.duration || 0;
        if (duration < 600) { // < 10 min
            baseComplexity = 'easy';
            reasoning = 'Short video';
        } else if (duration < 1800) { // < 30 min
            baseComplexity = 'medium';
            reasoning = 'Standard length';
        } else if (duration < 3600) { // < 1 hour
            baseComplexity = 'hard';
            reasoning = 'Long tutorial';
        } else {
            baseComplexity = 'epic';
            reasoning = 'Extended content';
        }
    } else if (quest.type === 'dsa') {
        const diff = quest.dsa?.difficulty?.toLowerCase();
        if (diff === 'easy') {
            baseComplexity = 'easy';
            reasoning = 'Basic problem';
        } else if (diff === 'medium') {
            baseComplexity = 'medium';
            reasoning = 'Moderate challenge';
        } else if (diff === 'hard') {
            baseComplexity = 'hard';
            reasoning = 'Advanced problem';
        } else {
            baseComplexity = 'medium';
            reasoning = 'Standard difficulty';
        }
    } else {
        // General task - estimate based on description length
        const descLength = (quest.description || '').length;
        if (descLength < 50) {
            baseComplexity = 'easy';
            reasoning = 'Simple task';
        } else if (descLength < 150) {
            baseComplexity = 'medium';
            reasoning = 'Moderate task';
        } else {
            baseComplexity = 'hard';
            reasoning = 'Detailed task';
        }
    }

    // Apply time pressure bump
    const timeBump = getTimePressureBump(quest);
    const complexity = bumpComplexity(baseComplexity, timeBump);

    if (timeBump > 0) {
        reasoning += `, tight deadline (+${timeBump})`;
    }

    return {
        complexity,
        xpReward: XP_REWARDS[complexity],
        reasoning: `[Mock] ${reasoning}`
    };
}

/**
 * Mock daily email generation
 */
export function mockDailyEmail(stats, pendingQuests, dayOfWeek) {
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
