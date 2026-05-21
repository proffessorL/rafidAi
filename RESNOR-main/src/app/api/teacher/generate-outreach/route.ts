import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { student_name, student_email, quiz_average, engagement_score, days_since_active, tone } = await request.json()

    const zai = await ZAI.create()

    const toneInstruction = tone === 'formal'
      ? 'Use formal academic language'
      : tone === 'encouraging'
        ? 'Be enthusiastic and motivating'
        : 'Be warm, supportive, and understanding'

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are a university teacher writing a supportive outreach message to a struggling student. ${toneInstruction}.

Student details:
- Name: ${student_name}
- Email: ${student_email}
- Quiz Average: ${quiz_average}%
- Engagement Score: ${engagement_score}/100
- Days Since Last Active: ${days_since_active}

Write a concise, caring message (3-4 paragraphs max) that:
1. Expresses concern in a non-judgmental way
2. Highlights specific areas of concern based on their data
3. Offers concrete support (office hours, study groups, resources)
4. Ends with an encouraging note

Return ONLY the message text, no JSON or formatting markers.`,
        },
        {
          role: 'user',
          content: 'Generate the outreach message.',
        },
      ],
      thinking: { type: 'disabled' },
    })

    const message = completion.choices[0]?.message?.content || 'Unable to generate message.'

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Generate outreach error:', error)
    return NextResponse.json({ error: 'Failed to generate outreach message' }, { status: 500 })
  }
}
