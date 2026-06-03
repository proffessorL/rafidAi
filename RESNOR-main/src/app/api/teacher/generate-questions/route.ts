import { NextResponse } from 'next/server'
import { getAIProvider } from '@/ai/providers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topicMetrics, avgQuizScore, avgCompletionRate } = body

    const topicsDetail = (topicMetrics || []).map((t: any) =>
      `- ${t.topicName}: ${t.completed} completed, ${t.inProgress} in progress, ${t.pending} pending (course: ${t.courseName})`
    ).join('\n')

    const provider = getAIProvider('groq')

    const prompt = `Class topic performance:
${topicsDetail}

Overall class quiz average: ${avgQuizScore}%
Overall completion rate: ${avgCompletionRate}%

Analyse this data like a sharp teaching analyst who notices what most teachers miss. Give 4-6 non-obvious insights — things like hidden patterns, unexpected bright spots, early warning signals, or counterintuitive trends. Avoid stating the obvious (e.g. don't just say "Topic X has low completion"). Instead, connect the dots: which topic looks fine but might be a trap, which subject has silent disengagement, where do students seem to give up midway, etc.

Return each insight as a bullet point starting with "-". Keep each line short and punchy. No markdown, no headers.`

    const content = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a sharp teaching analyst who spots patterns most teachers overlook. Return exactly 4-6 bullet points, each starting with "-". Be direct, specific, and insightful.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    return NextResponse.json({ analysis: content || 'Unable to generate analysis.' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate topic analysis' }, { status: 500 })
  }
}
