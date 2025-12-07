/**
 * DSA Problem Complexity Analysis Prompt
 */

export function getDSAComplexityPrompt(quest) {
  const daysRemaining = quest.deadline
    ? Math.ceil((new Date(quest.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return `Analyze the complexity of this DSA problem:
Title: ${quest.title}
Platform: ${quest.dsa?.platform || 'Unknown'}
${quest.dsa?.difficulty ? `Listed Difficulty: ${quest.dsa.difficulty}` : ''}
${quest.dsa?.topics ? `Topics: ${quest.dsa.topics.join(', ')}` : ''}
${quest.description ? `Description: ${quest.description}` : ''}
${daysRemaining !== null ? `Time to complete: ${daysRemaining} days remaining` : ''}

Based on typical DSA problem difficulty AND time pressure, determine complexity:
- Easy: Basic data structures, simple algorithms, ample time
- Medium: Moderate algorithms, some optimization needed
- Hard: Advanced algorithms, complex optimization, tight deadline
- Epic: Competition-level, multiple advanced concepts, very tight deadline

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
}
