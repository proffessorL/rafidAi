import { NextResponse } from 'next/server'
import { ragService } from '@/ai/rag/rag-service'
import { vectorStore } from '@/ai/vector-store/vector-store'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null
    const source = formData.get('source') as string || 'unknown'

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const content = buffer.toString('utf-8')
      const chunkCount = await ragService.indexDocument(content, file.name || source)

      return NextResponse.json({
        success: true,
        message: `Indexed "${file.name}" (${chunkCount} chunks)`,
        chunks: chunkCount,
        source: file.name,
      })
    }

    if (text) {
      const chunkCount = await ragService.indexDocument(text, source)
      return NextResponse.json({
        success: true,
        message: `Indexed document (${chunkCount} chunks)`,
        chunks: chunkCount,
        source,
      })
    }

    return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to index document' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (query) {
    const chunks = await ragService.retrieveRelevantChunks(query, 5)
    return NextResponse.json({ results: chunks, count: chunks.length })
  }

  const stats = await vectorStore.getStats()
  return NextResponse.json(stats)
}

export async function DELETE(request: Request) {
  try {
    const { source } = await request.json()
    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }

    await vectorStore.deleteSource(source)
    return NextResponse.json({ success: true, message: `Deleted all chunks from "${source}"` })
  } catch {
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}
