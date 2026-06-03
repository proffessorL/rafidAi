import { NextResponse } from 'next/server'
import { getAIProvider } from '@/ai/providers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { totalStudents, avgCompletionRate, avgQuizScore, activeStudents, scoreDistribution } = body
    const topRange = scoreDistribution?.find((s: any) => s.range === '80-100')
    const lowRange = scoreDistribution?.find((s: any) => s.range === '0-20')

    const provider = getAIProvider('groq')

    const prompt = `Class snapshot:
- ${totalStudents} total students, ${activeStudents} active this week
- Average quiz score: ${avgQuizScore}%
- Average material completion rate: ${avgCompletionRate}%
- Students scoring 80%+ on quizzes: ${topRange?.count ?? 0}
- Students scoring below 20%: ${lowRange?.count ?? 0}

Write a short paragraph summarizing the class's overall performance this week. Mention strengths, concerns, and one actionable suggestion. Do not use numbered lists, bullet points, or markdown.`

    const content = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a teaching assistant providing a brief weekly class summary. Keep it to 3-4 sentences, conversational and direct.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 300,
    })

    return NextResponse.json({ summary: content || 'Unable to generate summary.' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate class summary' }, { status: 500 })
  }
}
