import { BaseAIProvider } from './base-provider'
import type { CompletionParams, StreamChunk, AIProviderType, ProviderStatus } from './types'

interface HuggingFaceResponse {
  generated_text: string
}

export class HuggingFaceProvider extends BaseAIProvider {
  readonly name: AIProviderType = 'huggingface'
  readonly supportsStreaming = false

  constructor(config: { apiKey?: string; model?: string; enabled?: boolean } = {}) {
    super({
      apiKey: config.apiKey || process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/models',
      model: config.model || 'mistralai/Mistral-7B-Instruct-v0.3',
      enabled: config.enabled,
    })
  }

  async complete(params: CompletionParams): Promise<string> {
    const prompt = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const systemMsg = params.messages.find((m) => m.role === 'system')
    const fullPrompt = systemMsg
      ? `System: ${systemMsg.content}\n\n${prompt}\nAssistant:`
      : `${prompt}\nAssistant:`

    const res = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey || ''}`,
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          temperature: params.temperature ?? 0.7,
          max_new_tokens: params.maxTokens ?? 1024,
          return_full_text: false,
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`HuggingFace error ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as HuggingFaceResponse[]
    return data[0]?.generated_text || ''
  }

  async *streamComplete(): AsyncGenerator<StreamChunk> {
    yield { content: 'HuggingFace Inference API does not support streaming.', done: true }
  }

  async checkStatus(): Promise<ProviderStatus> {
    const start = Date.now()
    try {
      const res = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${this.apiKey || ''}` },
        signal: AbortSignal.timeout(5000),
      })
      const available = res.ok || res.status === 503
      return {
        name: 'huggingface',
        available,
        model: this.model,
        latencyMs: available ? Date.now() - start : undefined,
      }
    } catch {
      return { name: 'huggingface', available: false, model: this.model }
    }
  }
}
