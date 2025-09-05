/*
 * @Author: Allen Bei
 * @Date: 2025-04-11 14:38:29
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 11:08:59
 * @FilePath: /AnotherMe-AI_Companion_Journal/ai/prompt/scenario/interaction.ts
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
const taskPrompt = `As a journaling analysis assistant:

① Process Entry:
- Detect input language
- Generate a 1st-person summary (mention any key events, situations, or decisions)
- Translate the summary to English for emotion analysis

② Classify Content:
- content_type: You must strictly choose ONE from the following types. Do NOT create new or custom types:
  - life_log (daily life events or routines)
  - reflection (emotional, relational, or existential reflection)
  - journal (work, study, or project tracking)
  - thought (ideas or insights)
  - note (excerpts or learning notes)
  - other (unclear or uncategorized)
- is_reflective: true / false

③ Cognitive Insight Focus (optional)
- Only include if is_reflective = true
- adopt a warm, introspective, and poetic tone,feel like an inner voice gently.
- insight_path:
  A compressed cognitive chain illustrating how a specific behavior links to a hidden psychological driver and leads to an unintended consequence.  
  Format it as a linear arrow chain like:  
  "Switching modes by cooking → Ritual to restore control → Building a cognitive safe zone on the edge of chaos"
- analogy
  A surreal, metaphorical sentence that links the user’s behavior and its paradox to an unexpected image.  
  It should evoke a ‘wow’ moment or ironic clarity.  
  For example:  
  "While the deadline bangs on your door, I'm forging a shield against anxiety with a spatula."  


④ Extract Metadata:
- title: 1 sentence summary of the entry
- tags: 3–6 relevant emotional or topical tags
- icon: base emoji representing theme or emotion (no modifiers)
- key_quotes: extract 1–6 key sentences or quotes that reflect their emotional state, deep questions, inner conflicts, or personal goals.
  Only include quotes that are meaningful and representative. Do not rephrase the original sentence.
  For each quote,label it as one of:
  - emotion(felt experience or reaction)
  - question(self-inquiry or help-seeking)
  - insecurity(fear, self-doubt, low self-worth)
  - goal(desire,wish,intention)
  - insight (personal truth or realization)
`;

const outputFormatPrompt =
  `### Output Format
Output example:
{
  "language": "{{detected}}", // e.g., "en", "zh",
  "content_type": "note", // one of: life_log, reflection, journal, thought, note, other
  "title": "1 sentence summary of the entry",
  "summary": "1–5 sentence first-person emotional or reflective summary (mention specific events if relevant)",
  "summary_en": "Translated English version of the summary",
  "tags": ["emotion", "keyword", "topic", ...], // 2-4 items
  "is_reflective": true | false,
  "key_quotes": [
    { "quote": "...", "type": "..." },
    ...
  ]
  "icon": "a single base Emoji (no gender or skin tone modifiers) that best represents the emotional or thematic core" // e.g., "🔥", "🌞", "😄", "❤️",
  "insight_path":'[Concrete Act] → [Hidden Mechanism] → [Unintended Consequence]',
  "analogy": "[Surreal Analogy Linking Behavior & Paradox]",
}`
const jsonBonusPrompt = `Failing to return valid JSON will break the system. Output only STRICT JSON.`
const languageBonusPrompt = `All values in the returned JSON **must** be in the language specified by "language" ({{detected}}). If "language": "zh", then all values (titles, summaries, tags etc.) must be in Chinese. Do not mix languages in the JSON.`


// With reflection classification & track questions
export const entrySummarizerPrompt = `
${taskPrompt}
${outputFormatPrompt}
${jsonBonusPrompt}
${languageBonusPrompt}
`.trim();


// /ai/prompt/scenario/interaction/guideQuestion
export const guideQuestionPrompt = `
Based on the user's writing, generate 1 open-ended question that encourage deeper thinking and self-reflection.
Keep the question natural and gentle.
`;
