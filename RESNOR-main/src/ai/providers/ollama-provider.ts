import { BaseAIProvider } from './base-provider'
import type { CompletionParams, StreamChunk, AIProviderType, ProviderStatus } from './types'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
}

export class OllamaProvider extends BaseAIProvider {
  readonly name: AIProviderType = 'ollama'
  readonly supportsStreaming = true

  constructor(config: { baseUrl?: string; model?: string; enabled?: boolean } = {}) {
    super({
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama3.2',
      enabled: config.enabled,
    })
  }

  async complete(params: CompletionParams): Promise<string> {
    const url = `${this.baseUrl}/api/generate`
    const prompt = params.messages.map((m) => `${m.role}: ${m.content}`).join('\n')

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model || this.model,
        prompt,
        stream: false,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens ?? 2048,
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as OllamaGenerateResponse
    return data.response
  }

  async *streamComplete(params: CompletionParams): AsyncGenerator<StreamChunk> {
    const url = `${this.baseUrl}/api/generate`
    const prompt = params.messages.map((m) => `${m.role}: ${m.content}`).join('\n')

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model || this.model,
        prompt,
        stream: true,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens ?? 2048,
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama stream error: ${res.status}`)
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
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line) as OllamaGenerateResponse
            if (parsed.response) {
              yield { content: parsed.response }
            }
            if (parsed.done) {
              yield { content: '', done: true }
              return
            }
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
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      const available = res.ok
      return {
        name: 'ollama',
        available,
        model: this.model,
        latencyMs: available ? Date.now() - start : undefined,
      }
    } catch {
      return { name: 'ollama', available: false, model: this.model }
    }
  }
}
