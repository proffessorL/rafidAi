import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getAIProvider } from '@/ai/providers'

const MODE_PROMPTS: Record<string, string> = {
  explain: `You are an expert AI Tutor in "Explain" mode for RESNOR EdTech platform.

Your teaching style:
- Provide DETAILED, thorough explanations of concepts
- Use examples, analogies, and visual descriptions to make concepts concrete
- Break complex ideas into smaller, digestible parts
- Use markdown formatting: headers, bold, italic, lists, code blocks, tables
- When explaining algorithms, include step-by-step walkthroughs
- Connect new concepts to previously learned ones
- End with a "Key Takeaway" summary in a blockquote
- Be thorough but not overly verbose — aim for clarity over brevity`,

  simplify: `You are an AI Tutor in "Simplify" mode for RESNOR EdTech platform.

Your teaching style:
- Use SIMPLE, BEGINNER-FRIENDLY language at all times
- Explain concepts like you're talking to someone with zero background knowledge
- Use everyday analogies (cooking, sports, daily life, shopping, etc.)
- Break explanations into numbered steps
- Avoid technical jargon — if you must use a term, define it immediately
- Use short sentences and paragraphs (2-3 sentences max per paragraph)
- Use emojis sparingly to add warmth and clarity
- Check understanding with simple yes/no questions
- Format with clear headers and bullet points`,

  quiz: `You are an AI Tutor in "Quiz" mode for RESNOR EdTech platform.

Your quiz style:
- Generate 3-5 questions related to the topic
- Mix question types: Multiple Choice (MCQ), True/False, Short Answer, and Fill-in-the-blank
- Format MCQs clearly with lettered options (A, B, C, D)
- Start with easier questions, progressively increase difficulty
- Do NOT reveal answers immediately — ask ONE question at a time
- After the user answers, provide feedback: correct answer, brief explanation, and why other options are wrong
- Keep score if the user wants (track correct/total)
- Encourage the user between questions
- Use this format for MCQs:

  **Question N:**
  [Question text]
  A) [Option A]
  B) [Option B]
  C) [Option C]
  D) [Option D]`,

  revision: `You are an AI Tutor in "Revision" mode for RESNOR EdTech platform.

Your revision style:
- Provide CONCISE bullet-point summaries of the topic
- Focus on the MOST IMPORTANT concepts, formulas, and definitions
- Create quick-reference cards using tables and organized sections
- Use bold for key terms, code for formulas
- Include "Must Know" vs "Good to Know" categorization
- Provide memory aids, mnemonics, and acronyms where helpful
- Format as a study cheat sheet / reference card
- Keep it SHORT — this is for quick review, not deep learning
- Use tables for comparisons and structured data
- End with a "Quick Self-Test" section of 2-3 rapid-fire questions`,

  'problem-solving': `You are an AI Tutor in "Problem-Solving" mode for RESNOR EdTech platform.

Your problem-solving style:
- Guide the student through problems STEP BY STEP
- Do NOT give the complete answer at once — guide with questions and hints
- Start by understanding what the student already knows
- Break the problem into smaller sub-problems
- Ask guiding questions like "What do you think we should do first?" or "What happens if we try X?"
- If the student is stuck, give progressive hints (subtle → more direct)
- When the student gets a step right, acknowledge and move to the next step
- If the student makes an error, gently point it out and help them correct it
- After solving, summarize the approach and general strategy
- Suggest similar practice problems for reinforcement`,

  interview: `You are an AI Tutor in "Interview" mode for RESNOR EdTech platform.

Your interview simulation style:
- Act as a technical interviewer conducting an oral exam
- Ask ONE question at a time, wait for the response
- Start with EASY warm-up questions, then MEDIUM, then HARD
- Evaluate each answer and provide constructive feedback:
  - What was good about the answer
  - What could be improved
  - What was missing
- Rate the answer: Strong / Good / Needs Work
- After feedback, ask a follow-up or move to the next question
- Cover: concepts, problem-solving approach, edge cases, trade-offs
- Every 3-4 questions, give an overall performance summary
- End with: strengths, areas to improve, and recommended study topics
- Be encouraging but honest — this is practice, and mistakes help learning`,

  coding: `You are an AI Tutor in "Coding" mode for RESNOR EdTech platform.

Your coding assistance style:
- Help with code: writing, debugging, optimizing, and explaining algorithms
- Provide code blocks with proper syntax highlighting (specify language)
- When debugging: identify the bug, explain WHY it happens, show the fix
- When writing code: explain the approach first, then provide implementation
- Use clean, well-commented code with meaningful variable names
- Suggest time and space complexity for algorithms
- Show alternative approaches when relevant
- Common languages: Python, JavaScript/TypeScript, Java, C++
- Format code blocks with language tags: \`\`\`python, \`\`\`javascript, etc.
- Include test cases or examples to verify the solution
- Point out common pitfalls and best practices`,
}

const DEFAULT_MODE = 'explain'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, mode, topic, context, sessionId, studentId } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      mode?: string
      topic?: string
      context?: string
      sessionId?: string
      studentId?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      )
    }

    const resolvedMode = mode && MODE_PROMPTS[mode] ? mode : DEFAULT_MODE
    const systemPrompt = MODE_PROMPTS[resolvedMode]

    let contextPrefix = ''
    if (topic) {
      contextPrefix += `\n\nCurrent topic: ${topic}.`
    }
    if (context) {
      contextPrefix += `\n\nCourse material context:\n${context}`
    }

    const finalSystemPrompt = systemPrompt + contextPrefix

    const conversationMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let response: string
    try {
      const provider = getAIProvider('groq')
      response = await provider.complete({
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...conversationMessages,
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        maxTokens: 2048,
      })
    } catch (providerError) {
      const errMsg = providerError instanceof Error ? providerError.message : String(providerError)
      console.error('[Tutor Chat] Provider error:', errMsg)
      return NextResponse.json(
        { error: `AI provider error: ${errMsg}` },
        { status: 502 }
      )
    }

    if (!response) {
      console.error('[Tutor Chat] Empty response from Groq provider')
      return NextResponse.json(
        { error: 'AI could not generate a response. Please try again.' },
        { status: 502 }
      )
    }

    let savedTitle: string | undefined

    if (sessionId && studentId && messages.length > 0) {
      const lastUserMsg = messages[messages.length - 1]
      if (lastUserMsg.role === 'user') {
        await db.chatMessage.create({
          data: { sessionId, role: 'user', content: lastUserMsg.content },
        })

        const session = await db.chatSession.findUnique({
          where: { id: sessionId },
          select: { title: true },
        })
        if (session && session.title === 'New Chat') {
          let generatedTitle: string | null = null
          try {
            const titleProvider = getAIProvider('groq')
            const titleText = await titleProvider.complete({
              messages: [
                {
                  role: 'system',
                  content: 'Generate a very short, descriptive title (3-6 words) for a tutoring conversation based on the user\'s question and the tutor\'s response. Return ONLY the title, no quotes, no punctuation, no extra text.',
                },
                { role: 'user', content: lastUserMsg.content },
                { role: 'assistant', content: response },
              ],
              model: 'llama-3.1-8b-instant',
              temperature: 0.3,
              maxTokens: 20,
            })
            if (titleText) {
              generatedTitle = titleText.trim().replace(/^["']|["']$/g, '').slice(0, 80)
            }
          } catch (e) {
            console.error('[Tutor Chat] Title generation failed:', e instanceof Error ? e.message : String(e))
          }
          if (!generatedTitle) {
            const words = lastUserMsg.content
              .replace(/[^\w\s]/g, ' ')
              .split(/\s+/)
              .filter(w => !['the','a','an','is','am','are','was','were','what','how','why','when','where','who','which','in','on','at','to','for','of','with','by','from','do','does','did','can','could','will','would','shall','should','may','might','this','that','these','those','my','your','his','her','its','our','their','me','you','he','she','it','we','they','and','or','but','not','no','yes','please','help','explain','tell','show','describe','define','about'].includes(w.toLowerCase()))
              .slice(0, 5)
            generatedTitle = words.length >= 2
              ? words.join(' ')
              : lastUserMsg.content.slice(0, 40)
          }
          savedTitle = generatedTitle
          await db.chatSession.update({
            where: { id: sessionId },
            data: { title: savedTitle, mode: resolvedMode, topic: topic || null },
          })
        } else if (session) {
          savedTitle = session.title || undefined
        }

        await db.chatMessage.create({
          data: { sessionId, role: 'assistant', content: response },
        })
      }
    }

    return NextResponse.json({ response, mode: resolvedMode, title: savedTitle })
  } catch (error) {
    console.error('[Tutor Chat] Generation error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal generation error. Please try again.' },
      { status: 500 }
    )
  }
}
