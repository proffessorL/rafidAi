import { NextResponse } from 'next/server'
import { setActiveProvider, detectBestProvider, getAIProviderConfig } from '@/ai/config'
import { resetProviderCache, checkAllProviders, getAIProvider } from '@/ai/providers/index'
import type { AIProviderType } from '@/ai/providers/types'

export async function GET() {
  const config = getAIProviderConfig()
  const { statuses, active, healthy } = await checkAllProviders()

  return NextResponse.json({
    activeProvider: active,
    healthy,
    providers: config.providers,
    statuses,
  })
}

export async function POST(request: Request) {
  try {
    const { provider, model } = await request.json()

    if (provider) {
      const validProviders: AIProviderType[] = ['ollama', 'groq', 'openrouter', 'huggingface']
      if (!validProviders.includes(provider)) {
        return NextResponse.json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` }, { status: 400 })
      }

      setActiveProvider(provider as AIProviderType)
      resetProviderCache()
    }

    if (model && provider) {
      const prov = getAIProvider()
      prov.setModel(model)
    }

    const { statuses, active, healthy } = await checkAllProviders()

    return NextResponse.json({
      success: true,
      activeProvider: active,
      healthy,
      message: `Switched to ${active} provider`,
      statuses,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to switch provider' }, { status: 500 })
  }
}

export async function PUT() {
  const best = detectBestProvider()
  setActiveProvider(best)
  resetProviderCache()
  const { statuses, active, healthy } = await checkAllProviders()

  return NextResponse.json({
    success: true,
    activeProvider: active,
    healthy,
    message: `Auto-detected and switched to ${active}`,
    statuses,
  })
}
