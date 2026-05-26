interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class ResponseCache {
  private store: Map<string, CacheEntry<string>>
  private defaultTTL: number

  constructor(defaultTTLMs: number = 60_000) {
    this.store = new Map()
    this.defaultTTL = defaultTTLMs
  }

  private makeKey(messages: { role: string; content: string }[], model: string): string {
    const last = messages.slice(-4)
    const content = last.map((m) => `${m.role}:${m.content}`).join('|')
    const hash = this.simpleHash(`${model}:${content}`)
    return hash
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  get(messages: { role: string; content: string }[], model: string): string | null {
    const key = this.makeKey(messages, model)
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(messages: { role: string; content: string }[], model: string, response: string, ttlMs?: number): void {
    const key = this.makeKey(messages, model)
    this.store.set(key, {
      value: response,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
    })
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

export const responseCache = new ResponseCache(120_000)
