import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const MISTAKE_TYPES = [
  'CONCEPT_MISUNDERSTANDING', 'FALSE_ASSUMPTION', 'FORMULA_MISUSE',
  'ALGEBRAIC_ERROR', 'CALCULATION_FLOW_EXCEPTION', 'LOGIC_ERROR',
  'SEQUENTIAL_REASONING_FAILURE', 'SYNTAX_ERROR', 'EXECUTION_FLOW_DISCONNECT',
  'MISINTERPRETATION', 'CARELESS_MISTAKE', 'KNOWLEDGE_GAP',
  'GUESS_BASED', 'SUPERFICIALLY_MEMORIZED',
] as const

function getFullOptionText(answer: any, key: string): string {
  const map: Record<string, string | undefined> = {
    A: answer.question.optionA,
    B: answer.question.optionB,
    C: answer.question.optionC,
    D: answer.question.optionD,
  }
  return map[key] || key
}

function parseAIResponse(content: string): Record<string, any> | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  let raw = jsonMatch[0]
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/,\s*([\]}])/g, '$1')
  try {
    const parsed = JSON.parse(raw)
    if (!MISTAKE_TYPES.includes(parsed.mistakeType)) {
      parsed.mistakeType = 'KNOWLEDGE_GAP'
    }
    return parsed
  } catch {
    let repaired = raw
    const openCurlies = (repaired.match(/\{/g) || []).length
    const closeCurlies = (repaired.match(/\}/g) || []).length
    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/\]/g) || []).length
    const openQuotes = (repaired.match(/"/g) || []).length
    if (openQuotes % 2 !== 0) repaired += '"'
    repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
    repaired += '}'.repeat(Math.max(0, openCurlies - closeCurlies))
    try {
      const parsed = JSON.parse(repaired)
      if (!MISTAKE_TYPES.includes(parsed.mistakeType)) {
        parsed.mistakeType = 'KNOWLEDGE_GAP'
      }
      return parsed
    } catch {
      return null
    }
  }
}

async function generateExplanation(answer: any, selectedText: string, correctText: string): Promise<Record<string, any>> {
  const systemPrompt = `You are a cognitive diagnosis engine. Analyze the mistake below and return ONLY valid JSON.

Question: "${answer.question.question}"
Options: A) ${answer.question.optionA}  B) ${answer.question.optionB}  C) ${answer.question.optionC}  D) ${answer.question.optionD}
The student chose "${answer.selectedKey}: ${selectedText}" but the correct answer is "${answer.question.correctKey}: ${correctText}".

RULES:
- Every field must be uniquely generated for this question. No generic phrases.
- Reference the exact wrong/right option text.
- Be specific — pinpoint one logical step that failed.

Return JSON:
{
  "mistakeSummary": "1-2 sentences pinning the exact logical flaw.",
  "conceptLabel": "3-8 word concept name, e.g. 'Newton's First Law'.",
  "rootCauseAnalysis": "2-3 sentences reconstructing why the student picked '${selectedText}'.",
  "reasoningBreakdown": "2-4 sentences tracing the wrong path to '${selectedText}' vs '${correctText}'.",
  "quickFix": "One sentence: 'You [wrong move]. Instead, [correct approach].'",
  "correctConceptExplanation": "2-3 sentence explanation of the correct concept.",
  "simplifiedAnalogy": "One real-world analogy, 1-2 sentences.",
  "stepByStepCorrection": "Numbered walkthrough (2-4 steps) to the correct answer.",
  "preventionTips": "1-2 sentences. 'When you see [keyword], don't [wrong reflex]. Instead [checklist].'",
  "errorCategory": "3-8 word cognitive error label, e.g. 'Confuses speed with velocity'.",
  "relatedTopics": ["2-4 topic strings to review"],
  "mistakeType": "One of: ${MISTAKE_TYPES.join(', ')}",
  "remediationExercises": [{"prompt": "one practice question testing the same concept", "options": {...}, "correctKey": "...", "explanation": "..."}],
  "knowledgeNode": {"id": "concept-${answer.questionId}", "label": "Core topic name", "type": "concept", "status": "failed", "strength": 0.3},
  "knowledgeEdges": [{"source": "concept-${answer.questionId}", "target": "related-concept-id", "type": "requires", "strength": 0.8}]
}`

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!groq.apiKey) throw new Error('No API key')

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Diagnose this mistake with detailed, non-generic analysis.' },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      })

      const content = completion.choices[0]?.message?.content || ''
      const parsed = parseAIResponse(content)
      if (parsed) return parsed
      console.error('Raw content (first 1500 chars):', content.substring(0, 1500))
      throw new Error('Failed to parse AI JSON response')
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || (error?.error?.error?.code === 'rate_limit_exceeded')
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = attempt * 5000
        console.error(`Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms...`)
        await new Promise(r => setTimeout(r, waitMs))
        continue
      }
      console.error('AI generation failed:', error)
      throw error
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attempt_id')
    const questionId = searchParams.get('question_id')

    if (!attemptId) {
      return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
    }

    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        quiz: { select: { id: true, title: true } },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const wrongAnswers = attempt.answers.filter(a => !a.isCorrect)

    // Check cache — reuse existing explanations if available
    const cachedExplanations = await db.mistakeExplanation.findMany({
      where: { attemptId: attempt.id },
    })
    const cacheMap = new Map(cachedExplanations.map(e => [e.questionId, e]))

    const explanations: any[] = []
    for (const answer of wrongAnswers) {
      const selectedText = getFullOptionText(answer, answer.selectedKey)
      const correctText = getFullOptionText(answer, answer.question.correctKey)

      // Skip AI if we have a valid cached explanation (must have real content)
      const cached = cacheMap.get(answer.questionId)
      if (cached && !cached.mistakeSummary.startsWith('Pending') && cached.rootCauseAnalysis) {
        explanations.push({
          questionId: answer.questionId,
          selectedKey: answer.selectedKey,
          selectedText,
          correctKey: answer.question.correctKey,
          correctText,
          mistakeType: cached.mistakeType,
          mistakeSummary: cached.mistakeSummary,
          rootCauseAnalysis: cached.rootCauseAnalysis,
          correctConceptExplanation: cached.correctConcept,
          simplifiedAnalogy: cached.simplifiedAnalogy,
          stepByStepCorrection: cached.stepByStepCorrection,
          preventionTips: cached.preventionTips,
          errorCategory: cached.errorCategory,
          conceptLabel: cached.conceptLabel,
          cached: true,
        })
        continue
      }

      // Lazy load: no AI unless question_id matches this question
      if (!questionId || String(answer.questionId) !== String(questionId)) {
        explanations.push({
          questionId: answer.questionId,
          selectedKey: answer.selectedKey,
          selectedText,
          correctKey: answer.question.correctKey,
          correctText,
          pending: true,
        })
        continue
      }

      let aiData: Record<string, any>
      try {
        aiData = await generateExplanation(answer, selectedText, correctText)
      } catch (e) {
        console.error('AI generation failed for question', answer.questionId, ':', e)
        const fallbackLabel = (() => {
          const qText = answer.question?.question || ''
          const match = qText.match(/(?:about|of|is|the)\s(.+?)(?:\?|$)/i)
          return match
            ? match[1].trim().substring(0, 60)
            : qText.replace(/^(What|Which|How|Why|When|Where|Who|Is|Are|Does|Do|Can)\s/i, '').replace(/[?!].*$/, '').trim().substring(0, 60)
        })()
        try {
          await db.mistakeExplanation.create({
            data: {
              studentId: attempt.studentId,
              attemptId: attempt.id,
              questionId: answer.questionId?.toString(),
              mistakeType: 'KNOWLEDGE_GAP',
              correctnessLevel: 'INCORRECT',
              mistakeSummary: 'Pending AI analysis — rate limited. Retry to generate.',
              errorCategory: null,
              conceptLabel: fallbackLabel,
            },
          })
        } catch { /* non-critical */ }
        explanations.push({
          questionId: answer.questionId,
          selectedKey: answer.selectedKey,
          selectedText,
          correctKey: answer.question.correctKey,
          correctText,
          mistakeType: 'KNOWLEDGE_GAP',
          mistakeSummary: 'Pending AI analysis — rate limited. Retry to generate.',
          fallback: true,
        })
        continue
      }

      const toString = (v: any) => Array.isArray(v) ? v.join('\n') : String(v || '')

      try {
        const conceptLabel = aiData.knowledgeNode?.label
          || aiData.errorCategory
          || aiData.conceptLabel
          || (() => {
              const qText = answer.question?.question || ''
              const match = qText.match(/(?:about|of|is|the)\s(.+?)(?:\?|$)/i)
              return match
                ? match[1].trim().substring(0, 60)
                : qText.replace(/^(What|Which|How|Why|When|Where|Who|Is|Are|Does|Do|Can)\s/i, '').replace(/[?!].*$/, '').trim().substring(0, 60)
            })()

        // Remove any stale Pending record so we don't get duplicates
        await db.mistakeExplanation.deleteMany({
          where: { attemptId: attempt.id, questionId: answer.questionId?.toString() },
        })

        await db.mistakeExplanation.create({
          data: {
            studentId: attempt.studentId,
            attemptId: attempt.id,
            questionId: answer.questionId?.toString(),
            mistakeType: aiData.mistakeType || 'KNOWLEDGE_GAP',
            correctnessLevel: 'INCORRECT',
            mistakeSummary: toString(aiData.mistakeSummary),
            rootCauseAnalysis: toString(aiData.rootCauseAnalysis),
            correctConcept: toString(aiData.correctConceptExplanation),
            simplifiedAnalogy: toString(aiData.simplifiedAnalogy),
            stepByStepCorrection: toString(aiData.stepByStepCorrection),
            preventionTips: toString(aiData.preventionTips),
            errorCategory: aiData.errorCategory || null,
            conceptLabel,
          },
        })
      } catch (dbError) {
        console.error('Failed to save MistakeExplanation:', dbError)
      }

      if (aiData.mistakeType) {
        const groupKey = aiData.errorCategory || `${answer.questionId}`
        try {
          const existing = await db.misconceptionLog.findUnique({
            where: {
              studentId_conceptNodeId: {
                studentId: attempt.studentId,
                conceptNodeId: groupKey,
              },
            },
          })
          if (existing) {
            await db.misconceptionLog.update({
              where: { id: existing.id },
              data: {
                frequencyCounter: { increment: 1 },
                lastTriggeredAt: new Date(),
                recoveryStatus: existing.recoveryStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : existing.recoveryStatus,
              },
            })
          } else {
            await db.misconceptionLog.create({
              data: {
                studentId: attempt.studentId,
                conceptNodeId: groupKey,
                mistakeType: aiData.mistakeType,
                patternDescription: aiData.errorCategory || aiData.mistakeSummary?.substring(0, 200) || '',
                recoveryStatus: 'IN_PROGRESS',
              },
            })
          }
        } catch {
          // Non-critical
        }
      }

      explanations.push({
        questionId: answer.questionId,
        selectedKey: answer.selectedKey,
        selectedText,
        correctKey: answer.question.correctKey,
        correctText,
        ...aiData,
      })
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        completedAt: attempt.completedAt,
        quizTitle: attempt.quiz?.title,
      },
      questions: attempt.answers.map(a => ({
        questionId: a.questionId,
        question: a.question.question,
        optionA: a.question.optionA,
        optionB: a.question.optionB,
        optionC: a.question.optionC,
        optionD: a.question.optionD,
        correctKey: a.question.correctKey,
        selectedKey: a.selectedKey,
        isCorrect: a.isCorrect,
        mistakeType: explanations.find(e => e.questionId === a.questionId)?.mistakeType || null,
      })),
      explanations,
    })
  } catch (error) {
    console.error('Explain mistake error:', error)
    return NextResponse.json({ error: 'Failed to analyze mistakes' }, { status: 500 })
  }
}
