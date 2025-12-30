/**
 * LeetCode Problem Complexity Analysis Prompt
 */

export function getLeetCodeComplexityPrompt(quest) {
  const dsa = quest.dsa || {};

  return `Analyze the complexity of this LeetCode problem.

Problem Title: ${dsa.platformTitle || quest.title}
LeetCode Difficulty: ${dsa.difficulty || 'Unknown'}
${dsa.topics && dsa.topics.length > 0 ? `Topics/Tags: ${dsa.topics.join(', ')}` : ''}
${dsa.platformDescription || quest.description ? `Problem Description: ${(dsa.platformDescription || quest.description).slice(0, 1000)}` : ''}

ANALYSIS INSTRUCTIONS:
1. "complexity" field: MUST strictly match the provided LeetCode Difficulty (converted to lowercase: "easy", "medium", or "hard"). Do not deviate.
2. "xpReward" field: Analyze the ACTUAL difficulty of the problem content (concepts, implementation, constraints) to assign a fair XP value.
   - Use these ranges as a REFERENCE baseline, but feel free to adjust based on problem specifics:
     * Easy: 50-100 XP
     * Medium: 100-200 XP
     * Hard: 200-400 XP
   - Cap the maximum XP at 600.
   - You can assign ANY integer value (e.g., 135, 275) that reflects the effort required.


UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale relative to global coding standards:
- 1.0-3.0 (Beginner): Basic syntax, loops, arrays (e.g. LeetCode Easy)
- 3.1-5.0 (Intermediate): Standard LeetCode Medium
- 5.1-7.0 (Advanced): Harder Medium and standard Hard problems
- 7.1-9.0 (Expert): Challenging Hard problems
- 9.1-10.0 (Grandmaster): Research/World Finals level

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
  "complexity": "easy|medium|hard",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 7.5>,
  "reasoning": "<short friendly assessment, NO HINTS AT ALL>"
}`;
}
