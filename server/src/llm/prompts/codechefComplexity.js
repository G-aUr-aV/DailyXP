/**
 * CodeChef Problem Complexity Analysis Prompt
 */

export function getCodeChefComplexityPrompt(quest) {
    const dsa = quest.dsa || {};

    return `Analyze the complexity of this CodeChef problem.

Problem Title: ${dsa.platformTitle || quest.title}
${dsa.rating ? `CodeChef Rating: ${dsa.rating}` : ''}
${dsa.difficulty ? `Listed Difficulty: ${dsa.difficulty}` : ''}
${dsa.topics && dsa.topics.length > 0 ? `Problem Tags: ${dsa.topics.join(', ')}` : ''}
${dsa.platformDescription || quest.description ? `Problem Description: ${(dsa.platformDescription || quest.description).slice(0, 1000)}` : ''}

CODECHEF CONTEXT:
- CodeChef is a competitive programming platform from India
- Difficulty ratings range from ~800 (beginner) to 3000+ (expert)
- Problems are categorized: Beginner, Easy, Medium, Hard, Challenge

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on CodeChef rating:
- 1.0-3.0 (Beginner): Rating < 1000. School/Beginner level.
- 3.1-5.0 (Intermediate): Rating 1000-1400. Easy to Medium.
- 5.1-7.0 (Advanced): Rating 1400-1800. Medium to Hard.
- 7.1-9.0 (Expert): Rating 1800-2400. Hard to Challenge.
- 9.1-10.0 (Grandmaster): Rating 2400+. Elite level.

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
