import { embeddingService } from '../embeddings/embedding-service'
import type { DocumentChunk } from '../providers/types'
import { db } from '@/lib/db'

export class VectorStore {
  async addChunks(newChunks: DocumentChunk[]): Promise<void> {
    const toEmbed = newChunks.filter((c) => !c.embedding)
    if (toEmbed.length > 0) {
      const texts = toEmbed.map((c) => c.text)
      const results = await embeddingService.embedBatch(texts)
      for (let i = 0; i < toEmbed.length; i++) {
        toEmbed[i].embedding = results[i].vector
      }
    }

    for (const chunk of newChunks) {
      if (chunk.embedding) {
        await db.$queryRawUnsafe(
          `INSERT INTO "DocumentChunk" (id, source, text, metadata, embedding)
           VALUES ($1, $2, $3, $4::jsonb, $5::vector)
           ON CONFLICT (id) DO NOTHING`,
          chunk.id,
          chunk.metadata.source,
          chunk.text,
          JSON.stringify(chunk.metadata),
          `[${chunk.embedding.join(',')}]`
        )
      } else {
        await db.documentChunk.create({
          data: {
            id: chunk.id,
            source: chunk.metadata.source,
            text: chunk.text,
            metadata: chunk.metadata as object,
          },
        })
      }
    }
  }

  async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    const queryVec = await embeddingService.embed(query)

    const rows = await db.$queryRawUnsafe<
      Array<{
        id: string
        source: string
        text: string
        metadata: unknown
      }>
    >(
      `SELECT id, source, text, metadata
       FROM "DocumentChunk"
       WHERE embedding IS NOT NULL
       ORDER BY embedding <-> $1::vector
       LIMIT $2`,
      `[${queryVec.join(',')}]`,
      topK
    )

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : (row.metadata as DocumentChunk['metadata']),
    }))
  }

  async deleteSource(source: string): Promise<void> {
    await db.documentChunk.deleteMany({ where: { source } })
  }

  async getStats(): Promise<{ totalChunks: number; sources: string[] }> {
    const [totalChunks, sourceRows] = await Promise.all([
      db.documentChunk.count(),
      db.documentChunk.findMany({
        select: { source: true },
        distinct: ['source'],
      }),
    ])
    return { totalChunks, sources: sourceRows.map((s) => s.source) }
  }
}

export const vectorStore = new VectorStore()
