/**
 * Codeforces Problem Complexity Analysis Prompt
 * Uses exact rating for more accurate analysis
 */

export function getCodeforcesComplexityPrompt(quest) {
  const dsa = quest.dsa || {};

  const hasRating = dsa.rating != null;

  return `Analyze the complexity of this Codeforces problem.

Problem Title: ${dsa.platformTitle || quest.title}
${hasRating ? `Codeforces Rating: ${dsa.rating}` : '⚠️ Codeforces Rating: Could not be fetched (blocked by Cloudflare). Use your own understanding based on the problem description and topics below.'}
${dsa.topics && dsa.topics.length > 0 ? `Problem Tags: ${dsa.topics.join(', ')}` : ''}
${dsa.platformDescription || quest.description ? `Problem Description: ${(dsa.platformDescription || quest.description).slice(0, 1000)}` : ''}

RATING GUIDELINES (use for reference):
- Rating 800-1200: Generally Easy problems
- Rating 1200-1600: Medium difficulty
- Rating 1600-2100: Hard problems
- Rating 2100+: Epic/Competition level

ANALYSIS INSTRUCTIONS:
${hasRating ? '1. Use the Codeforces rating as a strong indicator of difficulty' : '1. Since rating is unavailable, analyze the problem description and topics to estimate difficulty'}
2. Analyze topics to understand problem domain
3. Consider both algorithmic and implementation complexity
${!hasRating ? '4. If problem description is also unavailable, make a conservative Medium estimate' : ''}

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
${hasRating ? 'Assign \'difficultyRating\' based on Codeforces rating:' : 'Assign \'difficultyRating\' based on your analysis of description and topics:'}
- 1.0-3.0 (Beginner): Rating < 1000. Basic implementation.
- 3.1-5.0 (Intermediate): Rating 1000-1400.
- 5.1-7.0 (Advanced): Rating 1400-1900.
- 7.1-9.0 (Expert): Rating 1900-2400.
- 9.1-10.0 (Grandmaster): Rating 2400+.

XP Assignment:
- Easy: 50-100 XP | Medium: 100-200 XP | Hard: 200-400 XP | Epic: 400-600 XP

===========================================
⚠️ CRITICAL NO-SPOILER RULES - MUST FOLLOW ⚠️
===========================================
You MUST NOT reveal ANY of the following in your reasoning:
❌ Algorithm names (DP, BFS, DFS, greedy, binary search, etc.)
❌ Data structure names (tree, graph, stack, queue, trie, etc.)
❌ Technique names (memoization, two pointers, sliding window, etc.)
❌ Problem category hints (string-handling, recursion, backtracking, etc.)
❌ ANY words that hint at how to solve the problem
❌ Problem content or what it asks the user to do

✅ ONLY describe the difficulty LEVEL using vague terms like:
"Challenging", "Tricky", "Straightforward", "Tough", "A good workout"

REASONING FORMAT:
- Write 1 SHORT sentence (under 15 words)
- Sound friendly and encouraging
- GOOD examples: "A challenging one - buckle up!" | "This will make you think!" | "Great for sharpening your skills!"
- BAD examples (NEVER do this): "Tests your DP skills" | "String manipulation challenge" | "Graph traversal problem"

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 8.2>,
  "reasoning": "<short friendly assessment, NO HINTS AT ALL>"
}`;
}
