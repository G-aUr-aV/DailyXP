/**
 * General Task Complexity Analysis Prompt
 */

export function getTaskComplexityPrompt(quest) {
  const daysRemaining = quest.deadline
    ? Math.ceil((new Date(quest.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return `Analyze the complexity of this task:
Title: ${quest.title}
${quest.description ? `Description: ${quest.description}` : ''}
${daysRemaining !== null ? `Time to complete: ${daysRemaining} days remaining` : ''}

Determine the task complexity based on effort, time required, AND time pressure:
- Easy: Quick task, < 30 minutes, ample time available
- Medium: Moderate effort, 30 min - 2 hours
- Hard: Significant effort, 2-4 hours, or tight deadline
- Epic: Major undertaking, > 4 hours, or very tight deadline

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "reasoning": "Brief explanation (max 100 chars)"
}`;
}
