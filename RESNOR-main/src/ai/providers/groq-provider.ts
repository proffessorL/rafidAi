import { BaseAIProvider } from './base-provider'
import type { CompletionParams, StreamChunk, AIProviderType, ProviderStatus } from './types'
import Groq from 'groq-sdk'

export class GroqProvider extends BaseAIProvider {
  readonly name: AIProviderType = 'groq'
  readonly supportsStreaming = true
  private client: Groq

  constructor(config: { apiKey?: string; model?: string; enabled?: boolean } = {}) {
    super({
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      model: config.model || 'llama-3.1-8b-instant',
      enabled: config.enabled,
    })
    this.client = new Groq({ apiKey: this.apiKey || '' })
  }

  async complete(params: CompletionParams): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: params.model || this.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
      stream: false,
    })
    return completion.choices[0]?.message?.content || ''
  }

  async *streamComplete(params: CompletionParams): AsyncGenerator<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: params.model || this.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        yield { content }
      }
    }

    yield { content: '', done: true }
  }

  async checkStatus(): Promise<ProviderStatus> {
    const start = Date.now()
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      })
      const available = !!completion.choices[0]?.message?.content
      return {
        name: 'groq',
        available,
        model: this.model,
        latencyMs: available ? Date.now() - start : undefined,
      }
    } catch {
      return { name: 'groq', available: false, model: this.model }
    }
  }
}
