/**
 * CSES Problem Complexity Analysis Prompt
 */

export function getCSESComplexityPrompt(quest) {
  const dsa = quest.dsa || {};

  return `Analyze the complexity of this CSES problem.

Problem Title: ${dsa.platformTitle || quest.title}
${dsa.topics && dsa.topics.length > 0 ? `Category: ${dsa.topics.join(', ')}` : ''}
${dsa.platformDescription || quest.description ? `Problem Description: ${(dsa.platformDescription || quest.description).slice(0, 1000)}` : ''}

CSES CONTEXT:
- CSES is a competitive programming platform with well-structured, high-quality problems
- CSES problems are generally HARDER than typical LeetCode problems
- They often require optimized implementations and careful edge-case handling

UNIVERSAL DIFFICULTY RATING SCALE (0-10) FOR CSES:
Assign 'difficultyRating' based on CSES section and problem complexity:
- 1.0-3.0 (Beginner): Introductory problems, basic I/O
- 3.1-5.0 (Intermediate): Sorting, Searching basics, implementation
- 5.1-7.0 (Advanced): Dynamic Programming, Range Queries, Strings, Graphs
- 7.1-9.0 (Expert): Tree algorithms, Advanced graphs, Mathematics
- 9.1-10.0 (Grandmaster): Advanced techniques, Geometry, research-level

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
  "difficultyRating": <number 0-10, e.g. 6.5>,
  "reasoning": "<short friendly assessment, NO HINTS AT ALL>"
}`;
}
