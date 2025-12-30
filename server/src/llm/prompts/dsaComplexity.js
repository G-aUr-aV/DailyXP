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

IMPORTANT RULES:
- Only analyze complexity level - DO NOT reveal solution approaches
- DO NOT mention specific algorithms or data structures to use
- Focus purely on difficulty assessment

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale. ALL platforms must align to this:
- 1.0-3.0 (Beginner): Basic array/string manipulation, simple logic.
- 3.1-5.0 (Intermediate): HashMaps, sorting, 2-pointers, simple recursion.
- 5.1-7.0 (Advanced): Trees, Graphs, DP, Backtracking, Tries.
- 7.1-9.0 (Expert): Segment Trees, Network Flows, Advanced DP/Math.
- 9.1-10.0 (Grandmaster): Competitive programming elite level (IOI/ICPC hard).

XP Assignment (flexible values):
- Easy: 50-100 XP | Medium: 100-200 XP | Hard: 200-400 XP | Epic: 400-600 XP

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 5.5>,
  "reasoning": "Brief analysis"
}`;
}
