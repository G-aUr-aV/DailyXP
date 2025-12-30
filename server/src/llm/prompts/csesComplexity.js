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
- CSES (Code Submission Evaluation System) is a Finnish competitive programming platform
- Problems are well-structured and educational
- Earlier sections (Sorting, Searching) are typically easier
- Later sections (Graph, Tree, Advanced) are harder

ANALYSIS INSTRUCTIONS:
1. Analyze based on problem title and category
2. Consider the algorithmic concepts involved
3. CSES problems are generally well-calibrated in difficulty

IMPORTANT RULES:
- Only analyze complexity level - DO NOT reveal solution approaches
- DO NOT mention specific algorithms or data structures to use
- Focus purely on difficulty assessment

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale relative to global coding standards:
- 1.0-3.0 (Beginner): Basic syntax, sorting (Into, Sorting & Searching start)
- 3.1-5.0 (Intermediate): DP basics, Range Queries (Standard CSES)
- 5.1-7.0 (Advanced): Trees, Graphs, Strings (Harder CSES sections)
- 7.1-9.0 (Expert): Advanced Math, Geometry, Advanced Technique (Competitive)
- 9.1-10.0 (Grandmaster): Research level difficulty

XP Assignment (flexible values):
- Easy: 50-100 XP | Medium: 100-200 XP | Hard: 200-400 XP | Epic: 400-600 XP

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
  "difficultyRating": <number 0-10, e.g. 6.5>,
  "reasoning": "<short friendly assessment, no spoilers>"
}`;
}
