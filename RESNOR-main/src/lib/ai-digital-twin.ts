import { getAIProvider } from '@/ai/providers'

export type AIGeneratedProfile = {
  learningProfileType: string
  strongestHabit: string
  biggestOpportunity: string
  weakTopics: string[]
}

const framings = [
  'academic analyst who cuts through the noise',
  'friendly coach who keeps it real',
  'senior student who has been through it',
  'straight-talking data scientist',
  'learning strategist',
]

const summaryTones = [
  'encouraging but honest — like a good running coach',
  'direct and factual — no fluff',
  'warm and supportive — like a mentor who cares',
  'casual and relatable — like a smart friend explaining things',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function generateProfileLabels(
  metrics: Array<{ key: string; value: string | number }>,
  topMisconceptions: string[],
  topVisitedTopics: string[],
  recentQuizScores: number[]
): Promise<AIGeneratedProfile | null> {
  try {
    const provider = getAIProvider('groq')
    const metricsStr = metrics.map((m) => `- ${m.key}: ${m.value}`).join('\n')
    const framing = pick(framings)

    const prompt = `You're a ${framing}. A student's behavioral data is below. Study it, then describe them in a few JSON fields.

Data:
${metricsStr}
${topMisconceptions.length > 0 ? `\nMisconceptions: ${topMisconceptions.join(', ')}` : ''}
${topVisitedTopics.length > 0 ? `\nTopics they've worked on: ${topVisitedTopics.join(', ')}` : ''}
${recentQuizScores.length > 0 ? `\nRecent quiz scores: ${recentQuizScores.join(', ')}` : ''}

Return JSON with:
- "learningProfileType": short label (2-4 words) that captures their learning personality
- "strongestHabit": one specific thing they're doing well
- "biggestOpportunity": the single most impactful change they could make, referencing something in their data
- "weakTopics": array of 1-3 topic names they should focus on

Stick to what the data says. No fluff. Return only the JSON object.`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You read student data and output a short JSON profile. No extra text.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 512,
    })

    if (!response) return null

    const jsonStart = response.indexOf('{')
    const jsonEnd = response.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return null

    const parsed = JSON.parse(response.slice(jsonStart, jsonEnd + 1)) as AIGeneratedProfile
    if (!parsed.learningProfileType || typeof parsed.learningProfileType !== 'string') return null
    if (!parsed.strongestHabit || typeof parsed.strongestHabit !== 'string') return null
    if (!parsed.biggestOpportunity || typeof parsed.biggestOpportunity !== 'string') return null
    if (!Array.isArray(parsed.weakTopics)) parsed.weakTopics = []
    return parsed
  } catch (error) {
    console.error('AI profile labels error:', error)
    return null
  }
}

export async function generateProfileSummary(profileData: {
  learningProfileType: string
  strongestHabit: string
  biggestOpportunity: string
  studyConsistency: number
  revisionFrequency: number
  engagementLevel: number
  weakTopics: string[]
  quizAttemptCount: number
  sessionCount: number
  dataSufficiency: string
}): Promise<string | null> {
  try {
    const provider = getAIProvider('groq')
    const tone = pick(summaryTones)

    const prompt = `Talk to this student like a ${tone}. Here's their profile from real data:

- Profile type: ${profileData.learningProfileType}
- Strongest habit: ${profileData.strongestHabit}
- Biggest growth area: ${profileData.biggestOpportunity}
- Consistency: ${profileData.studyConsistency}% | Revision frequency: ${profileData.revisionFrequency}% | Engagement: ${profileData.engagementLevel}%
- Weak topics: ${profileData.weakTopics.length > 0 ? profileData.weakTopics.join(', ') : 'None'}
- ${profileData.quizAttemptCount} quizzes taken, ${profileData.sessionCount} focus sessions
- Data confidence: ${profileData.dataSufficiency}

Write a short message (2-3 paragraphs) that:
- Acknowledges what's working (point to the numbers)
- Explains what the profile type means in practice
- Gives 1-2 suggestions tied to their actual weak spot
- Sounds like you actually looked at their data, not like a form letter

No markdown. Max 250 words.`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You write short, personal, data-grounded messages to students. No clichés.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 512,
    })

    return response || null
  } catch (error) {
    console.error('AI profile summary error:', error)
    return null
  }
}

export async function enhanceInsight(insight: {
  category: string
  rawText: string
  supportingData: Record<string, unknown>
}): Promise<string | null> {
  try {
    const provider = getAIProvider('groq')
    const dataStr = Object.entries(insight.supportingData)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n')

    const prompt = `Here's a raw insight about a student's learning pattern:

Category: ${insight.category}
Insight: "${insight.rawText}"
Supporting data:
${dataStr || 'No extra data'}

Rewrite this so it sounds less like a computer readout and more like a real observation. Add one reason why this pattern exists based on the numbers. Suggest one concrete thing they could try. Keep it to 3 sentences. Plain text.`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You take raw data-driven observations and make them sound human. Never add numbers that arent in the input.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 256,
    })

    return response || null
  } catch (error) {
    console.error('AI insight enhancement error:', error)
    return null
  }
}

export async function generateSimulationReasoning(data: {
  scenarioLabel: string
  impacts: { area: string; effect: string }[]
  quizCount: number
  sessionCount: number
  avgQuizScore: number | null
  activeDays: number
  weakTopics: string[]
  dataPoints: number
}): Promise<string | null> {
  try {
    const provider = getAIProvider('groq')
    const impactsStr = data.impacts.map(i => `- ${i.area}: ${i.effect}`).join('\n')

    const prompt = `A student's data is below. Write a short paragraph explaining what would happen if they tried "${data.scenarioLabel}" and why it matters for them specifically. Connect your explanation to their actual numbers — don't sound like a generic textbook.

Their current stats:
- ${data.quizCount} quizzes taken (avg ${data.avgQuizScore !== null ? data.avgQuizScore + '%' : 'N/A'})
- ${data.sessionCount} focus sessions
- ${data.activeDays} active study days in last 30
- Weak areas: ${data.weakTopics.length > 0 ? data.weakTopics.join(', ') : 'None'}
- Total data analyzed: ${data.dataPoints} records

Predicted effects of this scenario:
${impactsStr}

Write 3-6 sentences. Be direct and grounded in the numbers. No markdown.`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You explain likely outcomes based on real student data. Never exaggerate or fabricate.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 512,
    })

    return response || null
  } catch (error) {
    console.error('AI simulation reasoning error:', error)
    return null
  }
}

export async function analyzeJournalTone(
  journals: Array<{ content: string; emotionTag?: string | null }>
): Promise<number | null> {
  if (journals.length === 0) return null
  try {
    const provider = getAIProvider('groq')
    const entriesStr = journals
      .slice(0, 10)
      .map((j) => `[${j.emotionTag || 'none'}] ${j.content.slice(0, 300)}`)
      .join('\n---\n')

    const prompt = `Read these journal entries and rate the emotional tone from 0 to 100.

0 = deeply distressed, hopeless
100 = very positive, emotionally healthy

Consider the language, energy, self-talk, and any stress or gratitude signals.

Entries:
${entriesStr}

Only reply with a single integer between 0 and 100.`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You rate emotional tone from journal text. Only output a number.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      maxTokens: 16,
    })

    if (!response) return null
    const num = parseInt(response.trim(), 10)
    if (isNaN(num) || num < 0 || num > 100) return null
    return num
  } catch (error) {
    console.error('AI journal analysis error:', error)
    return null
  }
}
