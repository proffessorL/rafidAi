'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Lock, Heart, Search,
  Plus, Trash2, Sparkles, Clock,
  Smile, Meh, Frown, Sun, Moon,
  CalendarDays, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth'

interface JournalEntry {
  id: string
  title: string
  content: string
  emotionTag: string
  createdAt: string
}

const emotionTags = [
  { key: 'happy', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'grateful', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'neutral', icon: Meh, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { key: 'stressed', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { key: 'anxious', icon: Moon, color: 'text-violet-500', bg: 'bg-violet-500/10' },
]

export default function JournalSystem() {
  const user = useAuthStore((s) => s.user)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [emotionTag, setEmotionTag] = useState('neutral')
  const [search, setSearch] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch(`/api/wellbeing/journal?student_id=${user?.id || 'stu_001'}`)
        if (res.ok) {
          const data = await res.json()
          setEntries(data.entries || [])
        }
      } catch {}
    }
    fetchEntries()
  }, [user?.id])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    try {
      const res = await fetch('/api/wellbeing/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || 'stu_001',
          title: title.trim(),
          content: content.trim(),
          emotion_tag: emotionTag,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setEntries((prev) => [data.entry, ...prev])
      }
    } catch {}

    setTitle('')
    setContent('')
    setEmotionTag('neutral')
    setShowNew(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/wellbeing/journal?id=${id}`, { method: 'DELETE' })
      setEntries((prev) => prev.filter((e) => e.id !== id))
      if (selectedEntry?.id === id) setSelectedEntry(null)
    } catch {}
  }

  const filteredEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
  )

  const getEmotionMeta = (key: string) =>
    emotionTags.find((t) => t.key === key) || emotionTags[2]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Private Journal</h1>
          <p className="text-sm text-muted-foreground">Your secure space for reflection</p>
        </div>
        <Button
          onClick={() => setShowNew(!showNew)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Entry
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-muted/50 border">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">{entries.length} entries</span>
        </div>
        <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-muted/50 border">
          <Lock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Encrypted</span>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Input
                  placeholder="Entry title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Write your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[160px] resize-none"
                />
                <div className="flex items-center gap-2">
                  {emotionTags.map((em) => {
                    const Icon = em.icon
                    const isSelected = emotionTag === em.key
                    return (
                      <button
                        key={em.key}
                        onClick={() => setEmotionTag(em.key)}
                        className={`p-2 rounded-lg border transition-all ${
                          isSelected ? `${em.bg} ${em.color} border-current` : 'border-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                  <Button
                    onClick={handleSave}
                    disabled={!title.trim() || !content.trim()}
                    className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Save Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search journal entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredEntries.map((entry, i) => {
          const em = getEmotionMeta(entry.emotionTag)
          const EmIcon = em.icon
          return (
            <motion.button
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedEntry(entry)}
              className="text-left group relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-md hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${em.bg}`}>
                    <EmIcon className={`w-3.5 h-3.5 ${em.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-medium text-sm mb-1 line-clamp-1">{entry.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3">{entry.content}</p>
            </motion.button>
          )
        })}
        {filteredEntries.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No journal entries yet</p>
            <p className="text-xs">Start writing to track your thoughts and emotions</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedEntry.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedEntry.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${getEmotionMeta(selectedEntry.emotionTag).bg}`}>
                  {(() => {
                    const EmIcon = getEmotionMeta(selectedEntry.emotionTag).icon
                    return <EmIcon className={`w-4 h-4 ${getEmotionMeta(selectedEntry.emotionTag).color}`} />
                  })()}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedEntry.content}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDelete(selectedEntry.id)}
                className="w-full text-rose-500 hover:text-rose-600 border-rose-500/20 hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Entry
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
