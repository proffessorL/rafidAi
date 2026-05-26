import { BaseAIProvider } from './base-provider'
import { OllamaProvider } from './ollama-provider'
import { GroqProvider } from './groq-provider'
import { OpenRouterProvider } from './openrouter-provider'
import { HuggingFaceProvider } from './huggingface-provider'
import { getActiveProviderConfig, getProviderConfigs } from '../config'
import type { AIProviderType, ProviderStatus } from './types'

type ProviderConstructor = new (...args: any[]) => BaseAIProvider

const PROVIDER_MAP: Record<AIProviderType, ProviderConstructor> = {
  ollama: OllamaProvider,
  groq: GroqProvider,
  openrouter: OpenRouterProvider,
  huggingface: HuggingFaceProvider,
}

let _instance: BaseAIProvider | null = null
let _cachedStatus: { statuses: ProviderStatus[]; active: AIProviderType; timestamp: number } | null = null
const STATUS_CACHE_TTL = 30_000

export function getAIProvider(forceType?: AIProviderType): BaseAIProvider {
  if (_instance && !forceType) return _instance

  const config = getActiveProviderConfig()
  const type: AIProviderType = forceType || config.activeProvider

  if (type && PROVIDER_MAP[type]) {
    const Constructor = PROVIDER_MAP[type]
    const providerConfig = getProviderConfigs()[type]
    _instance = new Constructor({
      apiKey: providerConfig?.apiKey,
      baseUrl: providerConfig?.baseUrl,
      model: providerConfig?.model,
      enabled: providerConfig?.enabled,
    })
    return _instance
  }

  _instance = new OllamaProvider({ enabled: true })
  return _instance
}

export async function checkAllProviders(): Promise<{
  statuses: ProviderStatus[]
  active: AIProviderType
  healthy: boolean
}> {
  const now = Date.now()
  if (_cachedStatus && now - _cachedStatus.timestamp < STATUS_CACHE_TTL) {
    return {
      statuses: _cachedStatus.statuses,
      active: _cachedStatus.active,
      healthy: _cachedStatus.statuses.some((s) => s.available),
    }
  }

  const config = getActiveProviderConfig()
  const configs = getProviderConfigs()
  const entries = Object.entries(PROVIDER_MAP) as [AIProviderType, ProviderConstructor][]
  const configurable: [AIProviderType, ProviderConstructor][] = entries.filter(
    ([type]) => configs[type]?.enabled !== false
  )

  const results = await Promise.allSettled(
    configurable.map(async ([type, Constructor]) => {
      const provider = new Constructor({
        apiKey: configs[type]?.apiKey || configs[type]?.apiKey,
        baseUrl: configs[type]?.baseUrl,
        model: configs[type]?.model,
        enabled: true,
      })
      return provider.checkStatus()
    })
  )

  const statuses: ProviderStatus[] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return {
      name: configurable[i][0],
      available: false,
      model: '',
    }
  })

  const active = config.activeProvider
  const activeStatus = statuses.find((s) => s.name === active)
  const healthy = activeStatus?.available ?? false

  _cachedStatus = { statuses, active, timestamp: now }

  return { statuses, active, healthy }
}

export function resetProviderCache(): void {
  _instance = null
  _cachedStatus = null
}

export function setProvider(type: AIProviderType): void {
  resetProviderCache()
  _instance = getAIProvider(type)
}
