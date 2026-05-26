import type { AIProviderType } from './providers/types'

export interface AIProviderConfiguration {
  activeProvider: AIProviderType
  providers: Record<AIProviderType, {
    apiKey?: string
    baseUrl?: string
    model?: string
    enabled: boolean
  }>
}

const DEFAULT_CONFIG: AIProviderConfiguration = {
  activeProvider: 'groq',
  providers: {
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      enabled: true,
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
      enabled: true,
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'deepseek/deepseek-chat:free',
      enabled: true,
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      enabled: true,
    },
  },
}

let _config: AIProviderConfiguration = { ...DEFAULT_CONFIG }

export function getAIProviderConfig(): AIProviderConfiguration {
  return { ..._config }
}

export function getActiveProviderConfig() {
  return {
    activeProvider: _config.activeProvider,
    ..._config.providers[_config.activeProvider],
  }
}

export function getProviderConfigs() {
  return { ..._config.providers }
}

export function updateProviderConfig(type: AIProviderType, overrides: Partial<AIProviderConfiguration['providers'][AIProviderType]>): void {
  if (_config.providers[type]) {
    _config.providers[type] = { ..._config.providers[type], ...overrides }
  }
}

export function setActiveProvider(type: AIProviderType): void {
  _config.activeProvider = type
}

export function detectBestProvider(): AIProviderType {
  const priority: AIProviderType[] = ['ollama', 'groq', 'openrouter', 'huggingface']

  for (const provider of priority) {
    const cfg = _config.providers[provider]
    if (!cfg.enabled) continue
    if (provider === 'ollama') return provider
    if (cfg.apiKey && cfg.apiKey.length > 0 && cfg.apiKey !== 'your_groq_api_key_here') {
      return provider
    }
  }

  return 'groq'
}

export { DEFAULT_CONFIG }
