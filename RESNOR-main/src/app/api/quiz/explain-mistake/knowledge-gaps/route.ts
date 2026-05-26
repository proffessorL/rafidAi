import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questionText, studentAnswer, correctAnswer, rootCauseAnalysis, reasoningBreakdown, quickFix, correctConceptExplanation, simplifiedAnalogy, stepByStepCorrection, preventionTips } = body

    if (!rootCauseAnalysis && !correctConceptExplanation) {
      return NextResponse.json({ gaps: [] })
    }

    const systemPrompt = `You are a knowledge gap analyzer. Given a student's mistake analysis, produce 3-5 concise bullet points that summarize the key knowledge gaps.

Each bullet must:
- Be a single clear sentence (10-25 words)
- Start with a label like "Root cause:", "Core concept:", "Prevention:", "Key step:", or "Analogy:"
- Be specific and reference the actual question/concept
- Not use generic phrases

Return ONLY valid JSON:
{ "gaps": ["bullet 1", "bullet 2", ...] }`

    const userPrompt = [
      questionText && `Question: "${questionText}"`,
      studentAnswer && `Student answered: "${studentAnswer}"`,
      correctAnswer && `Correct answer: "${correctAnswer}"`,
      `Root cause analysis: "${rootCauseAnalysis || ''}"`,
      `Reasoning breakdown: "${reasoningBreakdown || ''}"`,
      `Quick fix: "${quickFix || ''}"`,
      `Correct concept: "${correctConceptExplanation || ''}"`,
      `Analogy: "${simplifiedAnalogy || ''}"`,
      `Step-by-step: "${stepByStepCorrection || ''}"`,
      `Prevention tips: "${preventionTips || ''}"`,
    ].filter(Boolean).join('\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ gaps: [] })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 5) : [] })
  } catch (error) {
    console.error('Knowledge gaps generation failed:', error)
    return NextResponse.json({ gaps: [] })
  }
}
