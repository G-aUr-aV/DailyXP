/**
 * Codeforces Problem Complexity Analysis Prompt
 * Uses exact rating for more accurate analysis
 */

export function getCodeforcesComplexityPrompt(quest) {
  const dsa = quest.dsa || {};

  return `Analyze the complexity of this Codeforces problem.

Problem Title: ${dsa.platformTitle || quest.title}
${dsa.rating ? `Codeforces Rating: ${dsa.rating}` : ''}
${dsa.topics && dsa.topics.length > 0 ? `Problem Tags: ${dsa.topics.join(', ')}` : ''}
${dsa.platformDescription || quest.description ? `Problem Description: ${(dsa.platformDescription || quest.description).slice(0, 1000)}` : ''}

RATING GUIDELINES (use for reference):
- Rating 800-1200: Generally Easy problems
- Rating 1200-1600: Medium difficulty
- Rating 1600-2100: Hard problems
- Rating 2100+: Epic/Competition level

ANALYSIS INSTRUCTIONS:
1. Use the Codeforces rating as a strong indicator of difficulty
2. Analyze topics to understand problem domain
3. Consider both algorithmic and implementation complexity

IMPORTANT RULES:
- Only analyze complexity level - DO NOT reveal solution approaches
- DO NOT mention specific algorithms or data structures to use
- Focus purely on difficulty assessment

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale relative to global coding standards:
- 1.0-3.0 (Beginner): Rating < 1000. Basic implementation.
- 3.1-5.0 (Intermediate): Rating 1000-1400. Logic, greedy, simple math.
- 5.1-7.0 (Advanced): Rating 1400-1900. DP, standard graphs, data structures.
- 7.1-9.0 (Expert): Rating 1900-2400. Advanced algorithms, heavy optimization.
- 9.1-10.0 (Grandmaster): Rating 2400+. World class difficulty.

XP Assignment (based on complexity):
- Easy: 50-100 XP
- Medium: 100-200 XP
- Hard: 200-400 XP
- Epic: 400-600 XP

REASONING FORMAT (CRITICAL - FOLLOW EXACTLY):
- Write a SHORT, friendly assessment (1 sentence)
- Sound natural, like a helpful AI mentor
- Examples: "A solid medium-level challenge!" or "This one's on the easier side, great for practice!" or "Quite challenging - prepare for a workout!"
- DO NOT mention ANYTHING about the problem content, algorithms, or approach
- Just convey the difficulty vibe without spoilers

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 8.2>,
  "reasoning": "<short friendly assessment, no spoilers>"
}`;
}
