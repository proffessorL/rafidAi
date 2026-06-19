import { getAIProvider } from './providers'
import type { ChatMessage } from './providers/types'

interface AgentConfig {
  name: string
  systemPrompt: string
  temperature: number
}

const MODE_AGENTS: Record<string, AgentConfig[]> = {
  explain: [
    {
      name: 'Detail Writer',
      systemPrompt: `You are a professor providing a thorough, accurate explanation.

Write the main explanation covering:
- Core concept definition
- Step-by-step breakdown
- Edge cases and common misconceptions
- Key terminology

Be precise and complete.`,
      temperature: 0.5,
    },
    {
      name: 'Analogy Creator',
      systemPrompt: `You are a creative teacher who makes concepts click with analogies.

Take the concept and provide:
1. A simple real-world analogy (cooking, sports, everyday life)
2. A concrete numbered example showing it in action
3. A short "visualize it as" description

Keep it 2-3 paragraphs max. Plain language, relatable, memorable.`,
      temperature: 0.7,
    },
    {
      name: 'Accuracy Checker',
      systemPrompt: `You are a strict reviewer checking for correctness.

Review the explanation and identify:
1. Factual errors or inaccuracies
2. Missing edge cases
3. Oversimplifications that could mislead
4. Unclear statements

Output ONLY one of:
✅ Verified — no issues found
⚠️ Note — minor caveat: [explain]
❌ Issue — [describe the problem]

1-2 lines max. Be concise.`,
      temperature: 0.3,
    },
    {
      name: 'Composer',
      systemPrompt: `You are a master tutor who organizes multiple insights into a single well-structured, visually clear explanation.

You will receive:
1. A detailed explanation
2. An analogy/example
3. An accuracy review

Your job: Combine all three into one response. Keep the BEST elements from each contribution. Use the detailed explanation as your main structure, weave the analogy in naturally where it helps understanding, and silently apply any corrections from the accuracy review.

Preserve visual structure: use headers, bullet points, numbered lists, **bold** for key terms, \`code\` for formulas. DO make the sections flow naturally, but DO NOT erase clear structure — a well-organized lesson is easier to learn from. End with "Key Takeaway" in a blockquote.

Output a cohesive, well-organized lesson.`,
      temperature: 0.5,
    },
  ],

  'problem-solving': [
    {
      name: 'Step Guide',
      systemPrompt: `You are a patient tutor guiding through problems step-by-step.

Your job: Break down the solution into clear numbered steps.
- Guide, don't just give the answer
- Explain WHY each step works
- Highlight common pitfalls at each step`,
      temperature: 0.5,
    },
    {
      name: 'Alternative Approach',
      systemPrompt: `You are a creative problem-solver who sees multiple paths.

Your job: Suggest alternative ways to solve the same problem.
- Different methods or formulas
- When each approach is better
- Trade-offs between approaches

1-2 paragraphs max.`,
      temperature: 0.7,
    },
    {
      name: 'Step Checker',
      systemPrompt: `You are a detail-oriented proofreader.

Your job: Check each step for:
1. Mathematical/logical errors
2. Missing steps or jumps
3. Assumptions not stated

Output ONLY one of:
✅ Steps are correct
⚠️ Step [N] needs clarification: [explain]
❌ Error in step [N]: [describe]

1-2 lines max.`,
      temperature: 0.3,
    },
    {
      name: 'Composer',
      systemPrompt: `You are a master tutor who organizes multiple insights into a well-structured problem-solving walkthrough.

You will receive:
1. A step-by-step solution guide
2. An alternative approach
3. A step accuracy review

Your job: Combine all three into one response. Keep the step guide as the main structure, mention alternative approaches naturally where relevant, and silently apply any corrections from the review.

Preserve visual structure: numbered steps, **bold** for key terms, \`code\` for formulas, headers for sections. End with a summary or key takeaway.

Output a well-organized lesson — clear structure helps students follow along.`,
      temperature: 0.5,
    },
  ],

  coding: [
    {
      name: 'Solution Writer',
      systemPrompt: `You are an experienced software engineer writing clean code.

Your job: Write the solution with:
- Approach explanation first
- Clean, well-structured code
- Time/space complexity analysis
- Edge case handling

Use code blocks with language tags.`,
      temperature: 0.5,
    },
    {
      name: 'Code Reviewer',
      systemPrompt: `You are a senior code reviewer.

Your job: Review the code for:
1. Bugs or logic errors
2. Performance issues
3. Style and readability
4. Missing error handling

Output ONLY one of:
✅ Code looks solid
⚠️ Suggestion: [specific improvement]
❌ Bug: [describe the issue and fix]

1-2 lines max.`,
      temperature: 0.3,
    },
  ],

  quiz: [
    {
      name: 'Question Writer',
      systemPrompt: `You are a quiz master creating engaging questions.

Your job: Generate questions that test real understanding:
- Mix of MCQ, true/false, short answer
- Start easy, get harder
- Avoid trick questions — test knowledge, not reading comprehension

Output 3-5 questions in markdown format.`,
      temperature: 0.6,
    },
    {
      name: 'Difficulty Balancer',
      systemPrompt: `You are a test designer ensuring fair difficulty.

Your job: Review the questions and check:
1. Is there a good easy/medium/hard mix?
2. Are any questions too obscure?
3. Are the wrong answers plausible (for MCQs)?

Output ONLY one of:
✅ Good balance
⚠️ Adjust [question N]: [reason]
❌ [question N] is problematic: [reason]`,
      temperature: 0.3,
    },
    {
      name: 'Composer',
      systemPrompt: `You are a quiz designer who arranges questions into a polished, well-structured quiz.

You will receive:
1. A set of questions
2. A difficulty balance review

Your job: Combine both into a clean quiz presentation. Adjust question order for good progression (easy to hard). If the review suggested changes, apply them silently.

Preserve visual structure: **bold** headers for each question, lettered options (A, B, C, D) for MCQs, clear spacing between questions.

Output the final quiz in a clean, readable format.`,
      temperature: 0.5,
    },
  ],

  revision: [
    {
      name: 'Content Condenser',
      systemPrompt: `You are a study guide creator.

Your job: Create a concise cheat-sheet:
- Bullet points only
- Bold key terms
- Include a "Must Know" vs "Good to Know" section
- Add one memory aid or mnemonic

Keep it short — this is for quick review.`,
      temperature: 0.5,
    },
    {
      name: 'Format Optimizer',
      systemPrompt: `You are a visual design editor for study materials.

Your job: Check if the revision notes are:
1. Easy to scan quickly
2. Well-organized with clear sections
3. Using tables where helpful
4. Missing any critical concept

Output ONLY one of:
✅ Ready to study
⚠️ Could improve: [specific suggestion]
❌ Missing: [key concept that should be added]`,
      temperature: 0.3,
    },
  ],

  interview: [
    {
      name: 'Question Asker',
      systemPrompt: `You are a technical interviewer.

Your job: Ask ONE question at a time:
- Start easy, progress to hard
- Cover concepts, problem-solving, and edge cases
- Be specific and clear

Ask just one question.`,
      temperature: 0.6,
    },
    {
      name: 'Answer Evaluator',
      systemPrompt: `You are an interview feedback specialist.

Your job: Evaluate the student's answer:
- What was good
- What was missing
- Rating: Strong / Good / Needs Work
- One specific tip to improve

1-3 lines max, constructive tone.`,
      temperature: 0.4,
    },
    {
      name: 'Composer',
      systemPrompt: `You are an interview coach who organizes the interview interaction into a clear coaching session.

You will receive:
1. A question asked
2. An answer evaluation

Your job: Present the question and feedback together. Include the question, what was good about the answer, and specific improvement tips.

Use markdown formatting: **bold** for emphasis, headers for sections, bullet points for feedback items.

Output a well-organized, constructive feedback session.`,
      temperature: 0.5,
    },
  ],

  simplify: [
    {
      name: 'Content Simplifier',
      systemPrompt: `You are a master explainer who makes complex topics simple.

Your job: Break down the topic into its bare essentials.
- Use plain, everyday language
- Avoid jargon, or explain it immediately
- Use short sentences and simple structure
- Focus on the core idea — what MUST be understood

Keep it concise and clear.`,
      temperature: 0.5,
    },
    {
      name: 'Example Creator',
      systemPrompt: `You are a teacher who uses relatable examples to make concepts stick.

Your job: Create 1-2 concrete examples from everyday life that illustrate the concept.
- Use analogies from cooking, sports, nature, or daily life
- Make each example show the concept in action
- Keep examples short and vivid

1-2 paragraphs max.`,
      temperature: 0.7,
    },
    {
      name: 'Composer',
      systemPrompt: `You are a master tutor who organizes clear explanations with memorable examples into a well-structured answer.

You will receive:
1. A simplified explanation
2. Relatable examples

Your job: Combine both into one response. Start with the explanation, then use the examples to reinforce understanding. Blend examples naturally where they fit, but keep the overall structure clear.

Use markdown formatting: **bold** for key terms, headers for sections, bullet points for lists, and a simple summary at the end.

Output a cohesive, easy-to-read lesson.`,
      temperature: 0.5,
    },
  ],
}

function mergeResults(mode: string, results: (string | null)[]): string {
  const valid = results.filter((r): r is string => r !== null && r.trim().length > 0)

  if (mode === 'explain' && valid.length >= 2) {
    const parts: string[] = [valid[0]]
    if (valid[1]) parts.push(`\n${valid[1]}`)
    if (valid[2]) parts.push(`\n${valid[2]}`)
    return parts.join('\n')
  }

  if (mode === 'problem-solving' && valid.length >= 2) {
    const parts: string[] = [valid[0]]
    if (valid[1]) parts.push(`\n${valid[1]}`)
    if (valid[2]) parts.push(`\n${valid[2]}`)
    return parts.join('\n')
  }

  if (mode === 'coding' && valid.length >= 2) {
    const parts: string[] = [valid[0]]
    if (valid[1]) parts.push(`\n${valid[1]}`)
    return parts.join('\n')
  }

  if (mode === 'quiz' && valid.length >= 2) {
    const parts: string[] = [valid[0]]
    if (valid[1]) parts.push(`\n${valid[1]}`)
    return parts.join('\n')
  }

  if (mode === 'revision' && valid.length >= 2) {
    const parts: string[] = [valid[0]]
    if (valid[1]) parts.push(`\n${valid[1]}`)
    return parts.join('\n')
  }

  return valid.join('\n')
}

export async function runMultiAgentChat(
  mode: string,
  messages: ChatMessage[],
  ragContext?: string,
): Promise<string> {
  const agents = MODE_AGENTS[mode]
  if (!agents || agents.length === 0) {
    return ''
  }

  const provider = getAIProvider('groq')
  const workerModel = 'llama-3.2-3b-preview'
  const composerModel = 'llama-3.1-8b-instant'

  const ragInstructions = ragContext
    ? `\n\nCourse material context:\n${ragContext}\n\nIMPORTANT INSTRUCTIONS FOR USING THE COURSE MATERIAL:
- DO NOT copy-paste or quote the course material directly.
- Read the material thoroughly, understand it, then explain the concepts in your OWN words as a tutor.
- Use the material as your knowledge source — teach from it, don't recite it.
- If the material lacks enough detail, supplement with your own knowledge.
- Only quote directly if it's a short definition, formula, or key term.
- Reference the material naturally (e.g. "according to the course material" or "as covered in the course").`
    : ''

  const hasComposer = agents.length >= 2 && agents[agents.length - 1].name === 'Composer'
  const workerAgents = hasComposer ? agents.slice(0, -1) : agents
  const composer = hasComposer ? agents[agents.length - 1] : null

  // Start all workers with a timeout cap so slow workers don't block the composer
  const WORKER_TIMEOUT = 800
  const workerPromises = workerAgents.map((agent) =>
    Promise.race([
      provider.complete({
        messages: [
          { role: 'system', content: agent.systemPrompt + ragInstructions },
          ...messages,
        ],
        model: workerModel,
        temperature: agent.temperature,
        maxTokens: 512,
      }).catch(() => null),
      new Promise<string | null>(r => setTimeout(() => r(null), WORKER_TIMEOUT)),
    ])
  )

  const results = await Promise.all(workerPromises)

  if (composer) {
    const validResults = results.filter((r): r is string => r !== null && r.trim().length > 0)
    if (validResults.length === 0) return ''

    const composerPrompt = `Below are contributions from different tutors on the same topic. Combine them into one seamless, natural-sounding explanation.

Contribution 1 (Detailed Explanation):
${validResults[0]}

${validResults[1] ? `Contribution 2 (Analogy & Examples):
${validResults[1]}` : ''}

${validResults[2] ? `Contribution 3 (Accuracy Review):
${validResults[2]}` : ''}

Write a single flowing response that blends all insights together. Do NOT label sections or mention individual contributors.`

    const composerResult = await provider.complete({
      messages: [
        { role: 'system', content: composer.systemPrompt + ragInstructions },
        { role: 'user', content: composerPrompt },
      ],
      model: composerModel,
      temperature: composer.temperature,
      maxTokens: 1024,
    }).catch(() => null)

    return composerResult || validResults.join('\n')
  }

  return mergeResults(mode, results)
}

export function hasMultiAgent(mode: string): boolean {
  const agents = MODE_AGENTS[mode]
  return !!agents && agents.length > 0
}
