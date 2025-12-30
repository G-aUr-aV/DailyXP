/**
 * YouTube Quest Complexity Analysis Prompt
 * Personal coach style analysis with unified rating scale
 */

export function getYouTubeComplexityPrompt(quest) {
  const durationMinutes = quest.youtube?.duration
    ? Math.round(quest.youtube.duration / 60)
    : null;

  return `You are a personal learning coach analyzing the complexity of a YouTube video tutorial.
Provide an insightful breakdown of what learning this content would involve and rate its difficulty.

VIDEO DETAILS:
Title: ${quest.title}
${quest.youtube?.videoTitle ? `Video Title: ${quest.youtube.videoTitle}` : ''}
${quest.description ? `Description: ${quest.description}` : ''}
${durationMinutes ? `Duration: ${durationMinutes} minutes` : 'Duration: Unknown'}

ANALYSIS APPROACH:
1. Assess the technical depth and concepts covered based on the title/description
2. Consider prerequisite knowledge required to understand this content
3. Evaluate the learning curve and potential need for rewatching/practice
4. Factor in video length as it relates to content density
5. Provide a coach-like assessment of why you're giving this rating

UNIVERSAL DIFFICULTY RATING SCALE (0-10):
Assign 'difficultyRating' based on this unified scale:
- 1.0-3.0 (Easy): Beginner content, introductory concepts, light topics. Short videos (<15 min).
- 3.1-5.0 (Medium): Intermediate topics, some prior knowledge helpful. Moderate length (15-45 min).
- 5.1-7.0 (Hard): Advanced concepts, requires focus and note-taking. Longer videos (45-90 min) or dense content.
- 7.1-9.0 (Epic): Expert-level content, complex topics, may require rewatching. Long videos (90+ min) or highly technical.
- 9.1-10.0 (Legendary): University-level lectures, cutting-edge research, extremely dense material.

XP Assignment (based on learning effort):
- Easy: 50-100 XP | Medium: 100-200 XP | Hard: 200-400 XP | Epic: 400-600 XP

REASONING STYLE:
Write as a coach explaining to the user WHY this rating makes sense.
Example: "This video covers X, which is an advanced topic requiring understanding of Y. 
Given the ${durationMinutes || '?'}-minute runtime and the depth of concepts, you'll need focused attention..."

Respond in JSON format:
{
  "complexity": "easy|medium|hard|epic",
  "xpReward": <number between 50 and 600>,
  "difficultyRating": <number 0-10, e.g. 4.5>,
  "reasoning": "Coach-style explanation of content analysis and why this rating (2-3 sentences)"
}`;
}
