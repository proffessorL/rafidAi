import { NextResponse } from 'next/server'
import { getAIProvider } from '@/ai/providers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, quizAverage, engagementScore, daysSinceActive, streak, status } = body

    const provider = getAIProvider('groq')

    const prompt = `Student risk profile:
- Name: ${name}
- Status: ${status}
- Quiz average: ${quizAverage}%
- Engagement score: ${engagementScore}/100
- Days since last active: ${daysSinceActive}
- Current streak: ${streak} days

Give 4 concise bullet points — each 12-18 words — on non-obvious risk signals. No extra words.`

    const content = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a perceptive academic advisor. Return exactly 4 bullet points, each 12-18 words, starting with "-".' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 250,
    })

    return NextResponse.json({ explanation: content || 'Unable to generate explanation.' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate risk explanation' }, { status: 500 })
  }
}
