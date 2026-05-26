import type { ChatMessage, CompletionParams, StreamChunk, AIProviderType, ProviderStatus } from './types'

export abstract class BaseAIProvider {
  abstract readonly name: AIProviderType
  abstract readonly supportsStreaming: boolean

  protected apiKey?: string
  protected baseUrl: string
  protected model: string
  protected enabled: boolean = true

  constructor(config: { apiKey?: string; baseUrl?: string; model?: string; enabled?: boolean }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || ''
    this.model = config.model || ''
    this.enabled = config.enabled !== false
  }

  setModel(model: string): void {
    this.model = model
  }

  isEnabled(): boolean {
    return this.enabled
  }

  abstract complete(params: CompletionParams): Promise<string>

  abstract streamComplete(params: CompletionParams): AsyncGenerator<StreamChunk>

  abstract checkStatus(): Promise<ProviderStatus>

  protected buildSystemMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages
  }

  protected handleStreamError(error: unknown): AsyncGenerator<StreamChunk> {
    return (async function* () {
      yield { content: '', done: true }
    })()
  }
}
