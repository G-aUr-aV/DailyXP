/**
 * YouTube Quest Complexity Analysis Prompt
 */

export function getYouTubeComplexityPrompt(quest) {
    const daysRemaining = quest.deadline
        ? Math.ceil((new Date(quest.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    return `Analyze the complexity of this YouTube tutorial:
Title: ${quest.title}
${quest.youtube?.videoTitle ? `Video Title: ${quest.youtube.videoTitle}` : ''}
${quest.description ? `Description: ${quest.description}` : ''}
Duration: ${quest.youtube?.duration ? `${Math.round(quest.youtube.duration / 60)} minutes` : 'Unknown'}
${daysRemaining !== null ? `Time to complete: ${daysRemaining} days remaining` : ''}

Based on the content AND time pressure, determine the learning complexity. Consider:
- Technical depth required
- Prerequisites needed
- Video duration vs time available
- Concept difficulty
- Time pressure (less time = higher effective difficulty)

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
}
