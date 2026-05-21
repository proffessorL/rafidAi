'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Bot, Send, BookOpen, MessageSquare, List, Sparkles, Clipboard, ClipboardCheck, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Topic {
  id: string
  title: string
  description: string
  category: string
  content: string
  progress: number // completion percentage 0-100
  started: boolean
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: 'arrays',
    title: 'Arrays & Linked Lists',
    description: 'Linear data structures for sequential data storage',
    category: 'Data Structures',
    content: `# Arrays & Linked Lists

## Arrays
An **array** is a collection of elements stored at contiguous memory locations. It provides **O(1)** random access by index.

\`\`\`
Index:   0    1    2    3    4
Value: [42] [17] [89] [33] [56]
\`\`\`

### Key Operations
| Operation | Time Complexity |
|-----------|----------------|
| Access    | O(1)           |
| Search    | O(n)           |
| Insertion | O(n)           |
| Deletion  | O(n)           |

## Linked Lists
A **linked list** is a linear data structure where elements are stored in nodes. Each node contains data and a pointer to the next node.

### Types of Linked Lists
1. **Singly Linked List** — Each node points to the next node
2. **Doubly Linked List** — Nodes have pointers to both next and previous
3. **Circular Linked List** — Last node points back to the first

### When to Use What?
- Use **arrays** when you need fast random access and know the size ahead of time
- Use **linked lists** when you need frequent insertions/deletions at arbitrary positions`,
    progress: 85,
    started: true,
  },
  {
    id: 'trees',
    title: 'Trees & BST',
    description: 'Hierarchical data structures for efficient searching',
    category: 'Data Structures',
    content: `# Trees & Binary Search Trees

## What is a Tree?
A **tree** is a hierarchical data structure consisting of nodes connected by edges. It has a root node and subtrees of children.

## Binary Search Tree (BST)
A BST maintains the property:
- **Left subtree** values < node value
- **Right subtree** values > node value

\`\`\`
        50
       /  \\
      30    70
     / \\   / \\
   20  40 60  80
\`\`\`

### BST Operations
- **Search**: O(log n) average, O(n) worst
- **Insert**: O(log n) average
- **Delete**: O(log n) average
- **Traversal**: In-order, Pre-order, Post-order

### Tree Traversal
- **In-order** (Left → Root → Right): Gives sorted output in BST
- **Pre-order** (Root → Left → Right): Used for copying trees
- **Post-order** (Left → Right → Root): Used for deletion`,
    progress: 60,
    started: true,
  },
  {
    id: 'sorting',
    title: 'Sorting Algorithms',
    description: 'Comparison and non-comparison based sorting techniques',
    category: 'Algorithms',
    content: `# Sorting Algorithms

## Comparison-Based Sorting

### Bubble Sort — O(n²)
Repeatedly swaps adjacent elements if they're in the wrong order. Simple but inefficient for large datasets.

### Merge Sort — O(n log n)
Divide-and-conquer approach:
1. Divide the array in half
2. Recursively sort each half
3. Merge the sorted halves

### Quick Sort — O(n log n) avg
Picks a pivot, partitions elements around it, then recursively sorts partitions.

### Heap Sort — O(n log n)
Builds a max-heap, then repeatedly extracts the maximum element.

## Comparison Summary
| Algorithm | Best    | Average | Worst   | Space  |
|-----------|---------|---------|---------|--------|
| Bubble    | O(n)    | O(n²)   | O(n²)   | O(1)   |
| Merge     | O(n lg n)| O(n lg n)| O(n lg n)| O(n) |
| Quick     | O(n lg n)| O(n lg n)| O(n²)   | O(log n)|
| Heap      | O(n lg n)| O(n lg n)| O(n lg n)| O(1)   |`,
    progress: 40,
    started: true,
  },
  {
    id: 'graph',
    title: 'Graphs & Graph Traversal',
    description: 'Network structures and path-finding algorithms',
    category: 'Data Structures',
    content: `# Graphs & Graph Traversal

## What is a Graph?
A **graph** G = (V, E) consists of vertices (nodes) and edges connecting them.

### Types
- **Directed** vs **Undirected**
- **Weighted** vs **Unweighted**
- **Cyclic** vs **Acyclic**

### Representations
1. **Adjacency Matrix** — 2D array, O(V²) space
2. **Adjacency List** — Array of lists, O(V + E) space

## Traversal Algorithms

### BFS (Breadth-First Search)
Uses a **queue**. Explores all neighbors at current depth before moving deeper.

### DFS (Depth-First Search)
Uses a **stack** (or recursion). Explores as deep as possible before backtracking.

### Shortest Path
- **Dijkstra's** — Single source, non-negative weights, O((V + E) log V)
- **Bellman-Ford** — Handles negative weights, O(VE)`,
    progress: 20,
    started: true,
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    description: 'Optimization through overlapping subproblems',
    category: 'Algorithms',
    content: `# Dynamic Programming

## Core Idea
Dynamic Programming (DP) solves complex problems by breaking them into **overlapping subproblems** and storing results to avoid redundant computation.

## Two Approaches
1. **Top-Down (Memoization)** — Recursive with caching
2. **Bottom-Up (Tabulation)** — Iterative, fill table from base cases

## Classic Problems

### Fibonacci Sequence
\`\`\`
fib(n) = fib(n-1) + fib(n-2)
Base: fib(0) = 0, fib(1) = 1
\`\`\`
Without DP: O(2^n) | With DP: O(n)`,
    progress: 0,
    started: false,
  },
  {
    id: 'hashing',
    title: 'Hash Tables & Hashing',
    description: 'Key-value storage with near-constant time operations',
    category: 'Data Structures',
    content: `# Hash Tables & Hashing

## What is a Hash Table?
A hash table maps **keys** to **values** using a hash function for near O(1) average lookup.

## Collision Resolution
1. **Chaining** — Each bucket holds a linked list
2. **Open Addressing** — Probe for next available slot

## Time Complexity
| Operation | Average | Worst |
|-----------|---------|-------|
| Search    | O(1)    | O(n)  |
| Insert    | O(1)    | O(n)  |
| Delete    | O(1)    | O(n)  |`,
    progress: 0,
    started: false,
  },
  {
    id: 'recursion',
    title: 'Recursion & Backtracking',
    description: 'Problem-solving through self-referential function calls',
    category: 'Algorithms',
    content: `# Recursion & Backtracking

## Recursion
A function that calls itself to solve smaller instances of the same problem.

### Classic Examples
- **Factorial**: n! = n × (n-1)!
- **Tower of Hanoi**: Move n disks using 3 pegs
- **Tree Traversal**: Visit children recursively

## Backtracking
A systematic way to explore all possible solutions by **building candidates incrementally** and abandoning partial solutions.

### Problems
- N-Queens, Sudoku Solver, Subset generation, Permutations`,
    progress: 0,
    started: false,
  },
  {
    id: 'complexity',
    title: 'Big-O Complexity',
    description: 'Analyzing algorithm efficiency and scalability',
    category: 'Fundamentals',
    content: `# Big-O Notation & Complexity Analysis

## Common Complexities (Fastest → Slowest)
\`\`\`
O(1)       — Constant
O(log n)   — Logarithmic
O(n)       — Linear
O(n log n) — Linearithmic
O(n²)      — Quadratic
O(2^n)     — Exponential
\`\`\`

## Analysis Rules
1. **Drop constants**: O(2n) = O(n)
2. **Drop lower-order terms**: O(n² + n) = O(n²)
3. **Different inputs → different variables**: Two arrays → O(a + b)`,
    progress: 0,
    started: false,
  },
]

const SUGGESTED_QUESTIONS = [
  'Explain this topic simply',
  'Give me a practice problem',
  'How does this relate to real life?',
  'What should I study next?',
]

const MOCK_AI_RESPONSES: string[] = [
  `Great question! Let me break this down in simple terms.

**Key Concept**: Think of it like organizing a bookshelf. Each book has its place, and the way you organize determines how fast you can find what you need.

\`\`\`
1. Start with the fundamentals
2. Practice with small examples
3. Build up to complex problems
\`\`\`

> **Tip**: The best way to understand this is by writing code yourself. Start with 5-10 small problems.

**Next Steps**: Try implementing this from scratch without looking at any reference code. That's how you build real understanding!`,

  `Here's a practice problem for you:

## Problem: Implement from Scratch

**Difficulty**: Medium

**Description**: Build a working implementation without using built-in libraries. Focus on edge cases.

### Requirements:
- Handle empty input gracefully
- O(n log n) time complexity
- O(1) extra space (if possible)

### Starter Template:
\`\`\`python
def solve(data):
    # Your implementation here
    pass
\`\`\`

### Test Cases:
1. Empty array → return empty
2. Single element → return as-is
3. Already sorted → verify correctness
4. Reverse sorted → verify correctness
5. Duplicates → handle properly

**Hint**: Think about the divide-and-conquer approach. Break the problem in half, solve each part, then combine.`,

  `Absolutely! This concept shows up everywhere in the real world:

## Real-World Applications

### Everyday Life
- **Contact lists** on your phone use trees for fast lookup
- **Auto-complete** uses tries (a special tree structure)
- **GPS navigation** uses graph algorithms (Dijkstra's)

### Technology
- **Databases** use B-trees for indexing — that's why queries are fast
- **Version control** (Git) uses a directed acyclic graph (DAG)
- **Social networks** use graphs for friend recommendations
- **Web browsers** use hash tables for caching

The takeaway: every time you learn a data structure, you're learning a tool used by millions of systems worldwide!`,

  `Based on your current topic, here's my recommended study path:

## Learning Roadmap

### Current: *{topic}*
You're here! Make sure you can:
- Explain it to a friend
- Solve 3+ practice problems
- Identify when to use vs when not to

### Next Up: Hash Tables
Why? They're the most commonly asked topic in interviews. Master collision handling.

### Then: Graphs & BFS/DFS
Why? Graphs model real-world relationships. Essential for system design.

### After That: Dynamic Programming
Why? It's the hardest topic for most people. Start early.

> **Advice**: Spend 70% of your time solving problems, 30% on theory. Learning by doing is 3x more effective than passive reading!`,
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AITutor() {
  // State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '👋 Welcome to **RESNOR AI Tutor**! I\'m here to help you learn Computer Science concepts.\n\nSelect a topic from the left panel to get started, or ask me anything about Data Structures & Algorithms.',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you help me understand arrays and linked lists?',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '3',
      role: 'assistant',
      content:
        'Of course! **Arrays and Linked Lists** are the most fundamental data structures.\n\n**Arrays** store elements in contiguous memory — think of seats in a movie theater. Each seat has a number, and you can jump directly to any seat.\n\n**Linked Lists** are like a treasure hunt — each node has data AND a clue (pointer) to where the next item is.\n\n> **Key difference**: Arrays give O(1) access by index, but linked lists give O(1) insertion at the front.\n\nWould you like me to dive deeper into either one?',
      timestamp: new Date(Date.now() - 30000),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mobileTab, setMobileTab] = useState<'viewer' | 'chat'>('chat')
  const [topicSearch, setTopicSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSendMessage = (text?: string) => {
    const content = text || inputValue.trim()
    if (!content || isTyping) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response after delay
    setTimeout(() => {
      const topicName = selectedTopic
        ? TOPICS.find((t) => t.id === selectedTopic)?.title
        : 'this topic'

      const responseIndex = SUGGESTED_QUESTIONS.findIndex((q) =>
        content.toLowerCase().includes(q.toLowerCase().split(' ')[0].toLowerCase())
      )
      const responseContent =
        responseIndex >= 0
          ? MOCK_AI_RESPONSES[responseIndex].replace('{topic}', topicName || 'current topic')
          : `That's a great question about **${topicName || 'this topic'}**!

Here's my explanation:

### Key Points
1. **Understanding the basics** is crucial — make sure you grasp the core concept first
2. **Practice regularly** — try at least 2-3 problems per day
3. **Connect concepts** — notice how different topics relate to each other

> "The only way to learn a new programming language is by writing programs in it." — Dennis Ritchie

\`\`\`
// Example code snippet
function example(input) {
  // Step 1: Handle base case
  if (input.length === 0) return null

  // Step 2: Process
  const result = process(input)

  // Step 3: Return
  return result
}
\`\`\`

Would you like me to go deeper into any specific aspect? You can also try the **suggested questions** below!`

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback for clipboard API failure
    }
  }, [])

  const activeTopic = TOPICS.find((t) => t.id === selectedTopic)

  // Filter topics based on search
  const filteredTopics = topicSearch.trim()
    ? TOPICS.filter(
        (t) =>
          t.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
          t.category.toLowerCase().includes(topicSearch.toLowerCase()) ||
          t.description.toLowerCase().includes(topicSearch.toLowerCase())
      )
    : TOPICS

  // ── Typing Indicator (Shimmer) ──────────────────────────────────────────

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bot className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted space-y-2">
        {/* Shimmer lines */}
        <div className="flex gap-1.5">
          {[0.9, 0.7, 0.5].map((width, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-muted-foreground/15"
              style={{ width: `${width * 3}rem` }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {[0.6, 0.85, 0.4].map((width, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-muted-foreground/15"
              style={{ width: `${width * 3}rem` }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2 + 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {[0.75, 0.45].map((width, i) => (
            <motion.div
              key={i}
              className="h-3 rounded-full bg-muted-foreground/15"
              style={{ width: `${width * 3}rem` }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2 + 0.6,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )

  // ── Course Viewer (Left Panel) ──────────────────────────────────────────

  const CourseViewer = () => (
    <div className="flex h-full flex-col">
      {/* Topic List */}
      {!selectedTopic ? (
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            <div className="mb-4 flex items-center gap-2 px-1">
              <BookOpen className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Course Topics</h2>
              <Badge variant="secondary" className="ml-auto">
                {TOPICS.length} topics
              </Badge>
            </div>

            {/* Topic Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Separator className="mb-4" />
            {filteredTopics.map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTopic(topic.id)}
                className="group w-full rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {/* Status dot */}
                      <span className={`size-2 shrink-0 rounded-full ${topic.started ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <h3 className="font-medium leading-tight group-hover:text-primary truncate">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2 pl-4">
                      {topic.description}
                    </p>
                    {/* Progress indicator */}
                    {topic.started && (
                      <div className="mt-2 pl-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0">
                          {topic.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {topic.category}
                  </Badge>
                </div>
              </motion.button>
            ))}
            {filteredTopics.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="mx-auto size-8 mb-2 opacity-40" />
                <p className="text-sm">No topics found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <>
          {/* Topic Content */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTopic(null)}
              className="text-muted-foreground"
            >
              ← Back
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h2 className="truncate text-sm font-semibold">{activeTopic?.title}</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="prose prose-neutral max-w-none p-4 dark:prose-invert [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_ul]:mb-3 [&_ol]:text-sm [&_ol]:mb-3 [&_li]:mb-1 [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:text-sm [&_table]:w-full [&_th]:border-b [&_th]:py-2 [&_th]:px-3 [&_th]:text-left [&_th]:font-medium [&_td]:border-b [&_td]:py-2 [&_td]:px-3 [&_td]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-4 [&_hr]:border-border">
              {activeTopic && <ReactMarkdown>{activeTopic.content}</ReactMarkdown>}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )

  // ── Chat Interface (Right Panel) ────────────────────────────────────────

  const ChatInterface = () => (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">AI Tutor</h2>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Thinking...
              </span>
            ) : (
              'Online • Ready to help'
            )}
          </p>
        </div>
        {activeTopic && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {activeTopic.title}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`group flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
                onMouseEnter={() => msg.role === 'assistant' && setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div className="relative max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-neutral max-w-none dark:prose-invert [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:text-sm [&_li]:mb-1 [&_code]:bg-background/50 [&_code]:rounded [&_code]:px-1 [&_code]:text-xs [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-xs [&_strong]:font-semibold">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className={`mt-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Copy button for assistant messages */}
                  {msg.role === 'assistant' && (
                    <AnimatePresence>
                      {(hoveredMessageId === msg.id || copiedId === msg.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-2 right-2"
                        >
                          {copiedId === msg.id ? (
                            <div className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-white text-xs shadow-sm">
                              <ClipboardCheck className="size-3" />
                              Copied!
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="flex items-center gap-1 rounded-md bg-background border px-2 py-1 text-muted-foreground text-xs shadow-sm hover:text-foreground transition-colors"
                            >
                              <Clipboard className="size-3" />
                              Copy
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                    RA
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {!isTyping && (
        <div className="border-t px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Suggested Questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeTopic
                ? `Ask about ${activeTopic.title}...`
                : 'Ask me anything about CS...'
            }
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Desktop: Split screen */}
      <div className="hidden md:flex h-full divide-x">
        {/* Left: Course Viewer */}
        <div className="w-[40%] min-w-[320px]">
          <CourseViewer />
        </div>
        {/* Right: Chat */}
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>

      {/* Mobile: Tabbed view */}
      <div className="flex flex-1 flex-col md:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as 'viewer' | 'chat')}
          className="flex flex-1 flex-col"
        >
          <div className="border-b px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="viewer" className="flex-1 gap-1.5">
                <BookOpen className="size-3.5" />
                Course Viewer
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 gap-1.5">
                <MessageSquare className="size-3.5" />
                AI Chat
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="viewer" className="flex-1 overflow-hidden">
            <CourseViewer />
          </TabsContent>
          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <ChatInterface />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
