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


IMPORTANT RULES:
- The 'complexity' string MUST be consistent with LeetCode's classification.
- The 'xpReward' number should reflect the true cognitive load, even if it differs from the typical range for that label.
- DO NOT reveal solution approaches or hints in the reasoning.

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale relative to global coding standards:
- 1.0-3.0 (Beginner): Basic syntax, loops, arrays (e.g. LeetCode Easy, CF <1000)
- 3.1-5.0 (Intermediate): HashMaps, simple recursion, greedy (e.g. LeetCode Medium, CF 1200)
- 5.1-7.0 (Advanced): DP, Graphs, Trees, Backtracking (e.g. LeetCode Hard, CF 1600)
- 7.1-9.0 (Expert): Segment Trees, Flow, Complex Math (e.g. CF 2000+)
- 9.1-10.0 (Grandmaster): Research/World Finals level (e.g. CF 2600+)

Respond in JSON format:
{
  "complexity": "easy|medium|hard",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 7.5>,
  "reasoning": "Brief complexity analysis"
}`;
}
