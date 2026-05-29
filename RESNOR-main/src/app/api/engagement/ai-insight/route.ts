import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

interface FeatureInput {
  pageId: string
  label: string
  activeSeconds: number
  passiveSeconds: number
  totalSeconds: number
  activePercent: number
}

interface DailyTotalInput {
  date: string
  label: string
  total: number
  active: number
  passive: number
}

const FEATURE_SUGGESTIONS: Record<string, string> = {
  quiz: 'Open the quiz tab and answer 3 questions right now — type before checking.',
  tutor: 'Ask the AI tutor one specific question about what you are stuck on.',
  notes: 'Write a one-sentence summary of the last thing you read.',
  resources: 'Pick one page and extract 3 key points before moving on.',
  planner: 'Schedule your next 25-minute focused study block right now.',
  forum: 'Reply to one discussion with your own explanation in 2 minutes.',
  gamification: 'Complete one active challenge — click and participate.',
  'explain-mistake': 'Open your last mistake and rewrite the correct solution step by step.',
  leaderboard: 'Check where you rank and aim to pass the person above you.',
  wellbeing: 'Take a 2-minute breathing break between study sessions.',
}

function getFallbackInsight(features: FeatureInput[], todayActivePercent: number, todayTotal: number) {
  const worstFeature = features
    .filter((f) => f.totalSeconds >= 60)
    .sort((a, b) => a.activePercent - b.activePercent)[0]

  if (worstFeature && worstFeature.activePercent < 30) {
    const h = Math.floor(worstFeature.totalSeconds / 3600)
    const m = Math.round((worstFeature.totalSeconds % 3600) / 60)
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
    const suggestion = FEATURE_SUGGESTIONS[worstFeature.pageId] || 'Try interacting more with this feature.'
    return {
      type: 'warning' as const,
      message: `You spent ${timeStr} on ${worstFeature.label} with only ${worstFeature.activePercent}% active engagement. Most of your time there was passive scrolling.`,
      suggestion,
      feature: worstFeature.pageId,
    }
  }

  if (todayTotal > 0) {
    return {
      type: 'tip' as const,
      message: `Good mix today! ${todayActivePercent}% of your study time was active learning. Keep engaging deeply with each feature.`,
      suggestion: 'Try to maintain active engagement above 60% for the best learning outcomes.',
      feature: '',
    }
  }

  return {
    type: 'tip' as const,
    message: 'No activity recorded today. Start studying to see your screen time.',
    suggestion: 'Open a study feature like Quiz or Tutor to begin tracking.',
    feature: '',
  }
}

export async function POST(request: Request) {
  try {
    const { features, dailyTotals, todayActivePercent, todayTotal } = await request.json() as {
      features: FeatureInput[]
      dailyTotals: DailyTotalInput[]
      todayActivePercent: number
      todayTotal: number
    }

    if (!groq.apiKey) {
      const fallback = getFallbackInsight(features, todayActivePercent, todayTotal)
      return NextResponse.json(fallback)
    }

    const featureSummary = features
      .filter((f) => f.totalSeconds >= 30)
      .map((f) => `${f.label}: ${f.totalSeconds}s total, ${f.activePercent}% active`)
      .join('\n')

    const weekSummary = dailyTotals
      .map((d) => `${d.label}: ${d.total}s (${d.active} active, ${d.passive} passive)`)
      .join('\n')

    const worstFeature = features
      .filter((f) => f.totalSeconds >= 60)
      .sort((a, b) => a.activePercent - b.activePercent)[0]

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a direct, no-fluff study coach speaking to a student. Analyze their engagement data and give one sharp insight.

Return ONLY valid JSON (no markdown, no fences):
{"type":"warning"|"tip","message":"short insight (12-18 words)","suggestion":"actionable tip addressing the student directly as 'you' (max 12 words)","feature":"page_id or empty string"}

Rules:
- type "warning" when a feature has <30% active engagement
- message: reference the feature name and a specific number. Example: "You spent 8m on Resources with only 12% active — mostly skimming."
- suggestion: speak directly to the student using "you". Must be a concrete action for THAT specific feature. Example: "Open the quiz tab and answer 3 questions right now." or "Write one sentence summary after each paragraph in Notes."
- Never use phrases like "encourage users", "consider", "try to". Be commanding and direct.
- feature: the page_id of the worst feature
- Keep it tight. No fluff.`,
          },
          {
            role: 'user',
            content: `Today's overall: ${todayActivePercent}% active, ${todayTotal}s total.

Per-feature breakdown:
${featureSummary || 'No features with data yet'}

7-day trend:
${weekSummary || 'No weekly data'}

Worst feature: ${worstFeature ? `${worstFeature.label} (${worstFeature.activePercent}% active, ${worstFeature.totalSeconds}s)` : 'none'}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 256,
      })

      const content = completion.choices[0]?.message?.content || ''
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed.type && parsed.message) {
          return NextResponse.json({
            type: parsed.type,
            message: parsed.message,
            suggestion: parsed.suggestion || FEATURE_SUGGESTIONS[parsed.feature] || 'Take one small action to turn passive time into active learning.',
            feature: parsed.feature || '',
          })
        }
      }
    } catch (aiError) {
      console.error('Groq AI insight error:', aiError)
    }

    const fallback = getFallbackInsight(features, todayActivePercent, todayTotal)
    return NextResponse.json(fallback)
  } catch (error) {
    console.error('AI insight route error:', error)
    return NextResponse.json({ error: 'Failed to generate AI insight' }, { status: 500 })
  }
}
