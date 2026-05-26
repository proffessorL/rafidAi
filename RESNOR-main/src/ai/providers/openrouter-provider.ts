import { BaseAIProvider } from './base-provider'
import type { CompletionParams, StreamChunk, AIProviderType, ProviderStatus } from './types'

interface OpenRouterChoice {
  delta?: { content?: string }
  message?: { content?: string }
  finish_reason?: string
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[]
}

export class OpenRouterProvider extends BaseAIProvider {
  readonly name: AIProviderType = 'openrouter'
  readonly supportsStreaming = true

  constructor(config: { apiKey?: string; model?: string; enabled?: boolean } = {}) {
    super({
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: config.model || 'deepseek/deepseek-chat:free',
      enabled: config.enabled,
    })
  }

  async complete(params: CompletionParams): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: params.model || this.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter error ${res.status}: ${err}`)
    }

    const data = (await res.json()) as OpenRouterResponse
    return data.choices[0]?.message?.content || ''
  }

  async *streamComplete(params: CompletionParams): AsyncGenerator<StreamChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: params.model || this.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenRouter stream error: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      yield { content: '', done: true }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const jsonStr = trimmed.slice(6)
          if (jsonStr === '[DONE]') {
            yield { content: '', done: true }
            return
          }
          try {
            const parsed = JSON.parse(jsonStr) as OpenRouterResponse
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) yield { content }
          } catch {
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: '', done: true }
  }

  async checkStatus(): Promise<ProviderStatus> {
    const start = Date.now()
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      })
      const available = res.ok
      return {
        name: 'openrouter',
        available,
        model: this.model,
        latencyMs: available ? Date.now() - start : undefined,
      }
    } catch {
      return { name: 'openrouter', available: false, model: this.model }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey || ''}`,
      'HTTP-Referer': 'http://localhost:3000',
    }
  }
}
