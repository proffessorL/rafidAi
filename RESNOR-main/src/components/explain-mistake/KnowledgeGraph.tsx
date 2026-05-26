'use client'

import { useEffect, useRef, useState } from 'react'
import type { KnowledgeGraphNode, KnowledgeGraphEdge } from './types'

const statusColors: Record<string, string> = {
  mastered: '#22c55e',
  weak: '#f59e0b',
  failed: '#ef4444',
  untouched: '#6b7280',
}

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
}

export default function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [dimensions, setDimensions] = useState({ w: 400, h: 300 })

  useEffect(() => {
    if (!nodes.length) return
    const w = dimensions.w
    const h = dimensions.h
    const center = { x: w / 2, y: h / 2 }
    const pos: Record<string, { x: number; y: number }> = {}

    nodes.forEach((node, i) => {
      if (i === 0) {
        pos[node.id] = { ...center }
      } else {
        const angle = ((i - 1) / (nodes.length - 1)) * Math.PI * 2 - Math.PI / 2
        const radius = Math.min(w, h) * 0.3 + Math.random() * 20
        pos[node.id] = {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        }
      }
    })

    setPositions(pos)
  }, [dimensions, nodes])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ w: Math.round(width), h: Math.round(height) })
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!nodes.length) {
    return null
  }

  if (Object.keys(positions).length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading knowledge graph...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[120px]">
      <div className="absolute top-1 left-1 z-10 flex gap-1.5 flex-wrap">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
          {edges.map((edge, i) => {
            const sourcePos = positions[edge.source]
            const targetPos = positions[edge.target]
            if (!sourcePos || !targetPos) return null
            return (
              <line
                key={`edge-${i}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={edge.type === 'requires' ? '#6366f1' : '#8b5cf6'}
                strokeWidth={edge.strength * 2.5}
                strokeOpacity={0.3 + edge.strength * 0.4}
                className="transition-all duration-500"
              />
            )
          })}

          {nodes.map((node) => {
            const pos = positions[node.id]
            if (!pos) return null
            const isActive = activeNode === node.id
            return (
              <g
                key={node.id}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 28 : 22}
                  fill={`${statusColors[node.status]}20`}
                  stroke={statusColors[node.status]}
                  strokeWidth={isActive ? 3 : 2}
                  className="transition-all duration-300"
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={9}
                  className="pointer-events-none"
                >
                  {node.label.length > 12 ? node.label.slice(0, 11) + '\u2026' : node.label}
                </text>
              </g>
            )
          })}
        </svg>
    </div>
  )
}
