/**
 * Generic DSA Problem Complexity Analysis Prompt
 * For platforms other than LeetCode, Codeforces, CSES
 */

export function getDSAComplexityPrompt(quest) {
  const dsa = quest.dsa || {};

  return `Analyze the complexity of this DSA coding problem.

Problem Title: ${quest.title}
Platform: ${dsa.platform || 'Unknown'}
${dsa.difficulty ? `Listed Difficulty: ${dsa.difficulty} (use as hint, not absolute truth)` : ''}
${dsa.topics && dsa.topics.length > 0 ? `Topics/Tags: ${dsa.topics.join(', ')}` : ''}
${quest.description ? `Problem Description: ${quest.description}` : ''}

ANALYSIS INSTRUCTIONS:
1. Analyze the problem based on available information
2. Use any listed difficulty as a reference, not definitive
3. Consider the concepts required based on topics

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale:
- 1.0-3.0 (Beginner): Basic array/string manipulation, simple logic.
- 3.1-5.0 (Intermediate): Standard problems.
- 5.1-7.0 (Advanced): Challenging standard problems.
- 7.1-9.0 (Expert): Very difficult problems.
- 9.1-10.0 (Grandmaster): Elite competitive programming level.

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
  "difficultyRating": <number 0-10, e.g. 5.5>,
  "reasoning": "<short friendly assessment, NO HINTS AT ALL>"
}`;
}
