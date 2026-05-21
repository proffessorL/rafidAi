"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  PenLine,
  X,
  Save,
  Trash2,
  Check,
  Tag,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// --- Types ---

type NoteCategory = "Data Structures" | "Algorithms" | "Web Dev" | "General";

interface StudyNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// --- Category Config ---

const CATEGORY_CONFIG: Record<
  NoteCategory,
  { color: string; dotClass: string; badgeClass: string; pillClass: string }
> = {
  "Data Structures": {
    color: "emerald",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    pillClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
  },
  Algorithms: {
    color: "teal",
    dotClass: "bg-teal-500",
    badgeClass:
      "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    pillClass:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800",
  },
  "Web Dev": {
    color: "amber",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    pillClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  },
  General: {
    color: "rose",
    dotClass: "bg-rose-500",
    badgeClass:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    pillClass:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
  },
};

const ALL_CATEGORIES: ("All" | NoteCategory)[] = [
  "All",
  "Data Structures",
  "Algorithms",
  "Web Dev",
  "General",
];

// --- Mock Data ---

const MOCK_NOTES: StudyNote[] = [
  {
    id: "n1",
    title: "Binary Search Trees - Core Concepts",
    content:
      "Binary Search Trees (BSTs) are a fundamental data structure where each node has at most two children. The left subtree contains only nodes with values less than the parent, and the right subtree contains only nodes with values greater than the parent.\n\nKey operations and their average time complexities:\n- Search: O(log n)\n- Insert: O(log n)\n- Delete: O(log n)\n\nIn the worst case (skewed tree), these degrade to O(n). Self-balancing variants like AVL trees and Red-Black trees guarantee O(log n) even in the worst case by maintaining balance through rotations during insertions and deletions.\n\nImportant traversal methods: In-order (sorted output), Pre-order (copy tree), Post-order (delete tree), Level-order (BFS).",
    category: "Data Structures",
    tags: ["BST", "trees", "interview-prep"],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "n2",
    title: "Hash Tables & Collision Resolution",
    content:
      "Hash tables provide O(1) average-case lookups by mapping keys to array indices through a hash function. The key challenge is handling collisions, which occur when two keys hash to the same index.\n\nCollision resolution strategies:\n1. Chaining - Each bucket holds a linked list. Simple to implement, degrades gracefully. Load factor can exceed 1.\n2. Open Addressing - Probes for next empty slot. Variants: Linear probing (simple), Quadratic probing (better clustering), Double hashing (best distribution).\n\nDynamic resizing is critical: when load factor exceeds a threshold (typically 0.7), double the array size and rehash all entries. This keeps the amortized cost of insertions at O(1). Hash functions should minimize clustering while being fast to compute.",
    category: "Data Structures",
    tags: ["hashing", "performance"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "n3",
    title: "Dynamic Programming Patterns",
    content:
      "Dynamic Programming (DP) solves problems by breaking them into overlapping subproblems and storing solutions to avoid redundant computation. The key is identifying optimal substructure and overlapping subproblems.\n\nCommon DP patterns:\n- Fibonacci-style: Bottom-up with two variables\n- 0/1 Knapsack: Choose include/exclude each item\n- Longest Common Subsequence: Compare characters and recurse\n- Minimum Path Sum: Grid traversal with accumulated costs\n- Unbounded Knapsack: Items can be reused\n\nMemoization (top-down) is often easier to reason about but may cause stack overflow for deep recursion. Tabulation (bottom-up) is more space-efficient and avoids recursion limits. Always start by defining the state and transition function before coding.",
    category: "Algorithms",
    tags: ["DP", "optimization", "patterns"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "n4",
    title: "Graph Algorithms: BFS & DFS",
    content:
      "Graph traversal is essential for many algorithmic problems. BFS explores level by level using a queue (good for shortest path in unweighted graphs), while DFS explores as deep as possible using a stack or recursion (good for cycle detection, topological sort).\n\nBFS time complexity: O(V + E) where V = vertices, E = edges. Uses more memory due to the queue.\nDFS time complexity: O(V + E). More memory-efficient for deep graphs with recursion.\n\nKey applications:\n- BFS: Shortest path, level-order traversal, connected components\n- DFS: Topological sort, strongly connected components, cycle detection\n- Both: Maze solving, network analysis, web crawling\n\nWeighted shortest path problems require Dijkstra's (O((V+E)log V)) or Bellman-Ford (O(VE), handles negative weights).",
    category: "Algorithms",
    tags: ["graphs", "BFS", "DFS"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "n5",
    title: "React Server Components Deep Dive",
    content:
      "React Server Components (RSC) represent a paradigm shift in React architecture. Unlike traditional client components, RSCs execute on the server and send rendered HTML to the client, reducing JavaScript bundle size significantly.\n\nKey benefits:\n- Zero client-side JS for server components\n- Direct backend resource access (database, file system)\n- Automatic code splitting for client components\n- Streaming HTML with Suspense boundaries\n\nRules: Server components cannot use hooks (useState, useEffect), event handlers, or browser APIs. Use 'use client' directive for components that need interactivity. Pass server data as props to client components.\n\nBest practice: Keep components as server components by default. Only add 'use client' when the component needs state, effects, or event handlers. This minimizes client-side JavaScript.",
    category: "Web Dev",
    tags: ["react", "nextjs", "architecture"],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "n6",
    title: "CSS Grid vs Flexbox - When to Use What",
    content:
      "Both CSS Grid and Flexbox are powerful layout systems, but they serve different purposes. Understanding when to use each is crucial for efficient layouts.\n\nFlexbox is one-dimensional (row OR column). Best for:\n- Navigation bars and toolbars\n- Centering a single item\n- Distributing space in one direction\n- Component-level layouts\n\nCSS Grid is two-dimensional (rows AND columns). Best for:\n- Page-level layouts\n- Complex grid structures (dashboard, gallery)\n- When you need precise placement of items\n- When items need to span multiple rows/columns\n\nPro tip: They compose well together. Use Grid for the overall page layout and Flexbox for content within grid cells. Grid's `auto-fill` and `minmax()` create responsive layouts without media queries.",
    category: "Web Dev",
    tags: ["css", "layout", "responsive"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    id: "n7",
    title: "Study Session Notes - Midterm Prep",
    content:
      "Spent 3 hours reviewing chapters 1-5 for the upcoming midterm. Key focus areas:\n\n1. Big-O notation - need to be able to derive time complexity for any algorithm. Practice with nested loops, recursive functions, and divide-and-conquer patterns.\n\n2. Sorting algorithms - understand the invariants and swap patterns for quicksort, mergesort, and heapsort. Know when each is preferred.\n\n3. Recursion - trace through recursive calls on paper. Practice converting recursive solutions to iterative ones.\n\nTopics I need to review more: Amortized analysis for dynamic arrays, B-tree operations, and graph algorithm proofs. Plan to spend another 2 hours tomorrow on these weak areas. The professor emphasized these will be heavily weighted on the exam.",
    category: "General",
    tags: ["exam", "study-plan"],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
  },
  {
    id: "n8",
    title: "Weekly Reflection & Goals",
    content:
      "Weekly reflection for the past study week. Overall productivity was good but could improve.\n\nWhat went well:\n- Completed all assigned readings on time\n- Scored 92% on the weekly quiz\n- Started the group project early\n\nAreas for improvement:\n- Procrastinated on the programming assignment until Thursday\n- Didn't review lecture notes within 24 hours\n- Skipped one study group session\n\nGoals for next week:\n1. Review notes the same day as lecture\n2. Start assignments on Monday, not Thursday\n3. Attend all study group sessions\n4. Spend 30 minutes daily on LeetCode practice\n5. Get at least 7 hours of sleep each night",
    category: "General",
    tags: ["reflection", "goals", "productivity"],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
  },
];

// --- Helpers ---

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Sub-components ---

function CategoryBadge({ category }: { category: NoteCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {category}
    </span>
  );
}

function NoteCard({
  note,
  isActive,
  onClick,
}: {
  note: StudyNote;
  isActive: boolean;
  onClick: () => void;
}) {
  const config = CATEGORY_CONFIG[note.category];
  const preview = truncate(note.content.replace(/\n/g, " "), 80);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer ${
        isActive
          ? "border-l-[3px] border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-t-transparent border-r-border border-b-border"
          : "border-border/60 hover:bg-muted/60 hover:border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-semibold leading-snug line-clamp-1 ${
            isActive ? "text-foreground" : "text-foreground"
          }`}
        >
          {note.title || "Untitled Note"}
        </h3>
        <span
          className={`shrink-0 h-2 w-2 rounded-full mt-1.5 ${config.dotClass}`}
        />
      </div>
      {preview && (
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {preview}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <CategoryBadge category={note.category} />
        <span className="text-[10px] text-muted-foreground/70">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </motion.button>
  );
}

function NotesListSidebar({
  notes,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onNewNote,
}: {
  notes: StudyNote[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: "All" | NoteCategory;
  onCategoryChange: (c: "All" | NoteCategory) => void;
  onNewNote: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">Study Notes</h2>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs shadow-sm"
            onClick={onNewNote}
          >
            <Plus className="h-3.5 w-3.5" />
            New Note
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="h-8 pl-8 text-xs bg-muted/40 border-border/60"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat;
            const isNoteCat = cat !== "All";
            const config = isNoteCat ? CATEGORY_CONFIG[cat as NoteCategory] : null;

            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border cursor-pointer ${
                  isActive
                    ? isNoteCat
                      ? `${config!.pillClass} border-current/20 shadow-sm`
                      : "bg-foreground text-background border-foreground"
                    : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
                }`}
              >
                {isNoteCat && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${config!.dotClass} ${
                      isActive ? "" : "opacity-50"
                    }`}
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <NoteCard
                  note={note}
                  isActive={note.id === selectedId}
                  onClick={() => onSelect(note.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function TagPill({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/50"
    >
      <Tag className="h-2.5 w-2.5" />
      {tag}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors cursor-pointer"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.span>
  );
}

function NoteEditor({
  note,
  onUpdate,
  onSave,
  onDelete,
  isNew,
}: {
  note: StudyNote;
  onUpdate: (updates: Partial<StudyNote>) => void;
  onSave: () => void;
  onDelete: () => void;
  isNew: boolean;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on new notes
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isNew]);

  const charCount = note.content.length;

  const handleSave = useCallback(() => {
    setSaveState("saving");
    onSave();
    setTimeout(() => setSaveState("saved"), 300);
    setTimeout(() => setSaveState("idle"), 2000);
  }, [onSave]);

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !note.tags.includes(tag)) {
      onUpdate({ tags: [...note.tags, tag] });
    }
    setTagInput("");
  }, [tagInput, note.tags, onUpdate]);

  const removeTag = useCallback(
    (tag: string) => {
      onUpdate({ tags: note.tags.filter((t) => t !== tag) });
    },
    [note.tags, onUpdate]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>
            {note.content.length} chars
          </span>
          <span className="mx-1">&middot;</span>
          <span>Updated {formatDate(note.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Category Selector */}
          <div className="flex items-center gap-1 mr-2">
            {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isActive = note.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onUpdate({ category: cat })}
                  className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all border cursor-pointer ${
                    isActive
                      ? `${config.pillClass} shadow-sm`
                      : "text-muted-foreground/50 border-transparent hover:text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`}
                  />
                  <span className="hidden lg:inline">{cat}</span>
                </button>
              );
            })}
            {/* Mobile category dropdown */}
            <select
              value={note.category}
              onChange={(e) =>
                onUpdate({ category: e.target.value as NoteCategory })
              }
              className="sm:hidden text-[11px] bg-muted rounded-md px-2 py-1 border border-border/60"
            >
              {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Delete Button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={showDeleteConfirm ? "destructive" : "ghost"}
              size="sm"
              className={`h-7 gap-1.5 text-xs ${
                showDeleteConfirm ? "" : "text-muted-foreground hover:text-rose-600"
              }`}
              onClick={handleDelete}
            >
              {showDeleteConfirm ? (
                <>
                  <Trash2 className="h-3 w-3" />
                  Confirm
                </>
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </motion.div>

          {/* Save Button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className={`h-7 gap-1.5 text-xs shadow-sm transition-all ${
                saveState === "saved"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              onClick={handleSave}
              disabled={saveState === "saving"}
            >
              <AnimatePresence mode="wait">
                {saveState === "saved" ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Saved!
                  </motion.span>
                ) : saveState === "saving" ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "linear",
                      }}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </motion.div>
                    Saving
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-5 space-y-4">
          {/* Title */}
          <input
            ref={titleRef}
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Untitled Note"
            className="w-full bg-transparent text-2xl font-bold tracking-tight placeholder:text-muted-foreground/40 outline-none border-none"
          />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <AnimatePresence>
                {note.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder={note.tags.length === 0 ? "Add tags..." : ""}
                className="flex-1 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/50 outline-none border-none"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Content Textarea */}
          <Textarea
            value={note.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Start writing your notes here..."
            className="min-h-[320px] resize-none border-none bg-transparent shadow-none text-sm leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-0 p-0"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60">
          {charCount} character{charCount !== 1 ? "s" : ""}
        </span>
        <CategoryBadge category={note.category} />
      </div>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-3 text-sm font-medium"
      >
        No notes found
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-1 text-xs text-muted-foreground max-w-[220px]"
      >
        Try adjusting your search terms or changing the category filter.
      </motion.p>
    </div>
  );
}

function EmptySelectState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <PenLine className="h-6 w-6 text-muted-foreground" />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-3 text-sm font-medium"
      >
        Select a note to start editing
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-1 text-xs text-muted-foreground max-w-[220px]"
      >
        Choose a note from the sidebar or create a new one to get started.
      </motion.p>
    </div>
  );
}

// --- Main Component ---

export default function StudyNotes() {
  const [notes, setNotes] = useState<StudyNote[]>(MOCK_NOTES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | NoteCategory>(
    "All"
  );
  const [mobileTab, setMobileTab] = useState("list");

  // Working copy for editing
  const [editBuffer, setEditBuffer] = useState<StudyNote | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Category filter
    if (categoryFilter !== "All") {
      result = result.filter((n) => n.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort by most recently updated
    result.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    return result;
  }, [notes, categoryFilter, searchQuery]);

  // Selected note (from edit buffer or notes)
  const activeNote = useMemo(() => {
    if (!selectedId) return null;
    if (editBuffer && editBuffer.id === selectedId) return editBuffer;
    return notes.find((n) => n.id === selectedId) ?? null;
  }, [selectedId, editBuffer, notes]);

  // Select a note
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setEditBuffer(null);
      setIsNewNote(false);
      // On mobile, switch to editor tab
      setMobileTab("editor");
    },
    []
  );

  // Create new note
  const handleNewNote = useCallback(() => {
    const newNote: StudyNote = {
      id: generateId(),
      title: "",
      content: "",
      category: categoryFilter !== "All" ? categoryFilter : "General",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
    setEditBuffer({ ...newNote });
    setIsNewNote(true);
    setMobileTab("editor");
  }, [categoryFilter]);

  // Update edit buffer
  const handleUpdate = useCallback((updates: Partial<StudyNote>) => {
    setEditBuffer((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates, updatedAt: new Date() };
    });
  }, []);

  // Save note
  const handleSave = useCallback(() => {
    if (!editBuffer || !selectedId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...editBuffer, updatedAt: new Date() } : n))
    );
    setEditBuffer(null);
    setIsNewNote(false);
  }, [editBuffer, selectedId]);

  // Delete note
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setNotes((prev) => prev.filter((n) => n.id !== selectedId));
    setSelectedId(null);
    setEditBuffer(null);
    setIsNewNote(false);
    setMobileTab("list");
  }, [selectedId]);

  // The note to render in editor
  const editorNote = activeNote ?? {
    id: "",
    title: "",
    content: "",
    category: "General" as NoteCategory,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="flex h-full min-h-[600px] rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full w-full">
        {/* Sidebar */}
        <div className="w-[35%] min-w-[280px] max-w-[380px] border-r flex flex-col bg-muted/20">
          <NotesListSidebar
            notes={filteredNotes}
            selectedId={selectedId}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            onNewNote={handleNewNote}
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-border/60" />

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedId && activeNote ? (
            <NoteEditor
              key={selectedId}
              note={editorNote}
              onUpdate={handleUpdate}
              onSave={handleSave}
              onDelete={handleDelete}
              isNew={isNewNote}
            />
          ) : (
            <EmptySelectState />
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col h-full md:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex h-full flex-col">
          <TabsList className="mx-4 mt-3 w-auto grid grid-cols-2">
            <TabsTrigger value="list" className="text-xs gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 mt-2 overflow-hidden">
            {filteredNotes.length === 0 ? (
              <EmptySearchState />
            ) : (
              <NotesListSidebar
                notes={filteredNotes}
                selectedId={selectedId}
                onSelect={handleSelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                onNewNote={handleNewNote}
              />
            )}
          </TabsContent>

          <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden">
            {selectedId && activeNote ? (
              <NoteEditor
                key={selectedId}
                note={editorNote}
                onUpdate={handleUpdate}
                onSave={handleSave}
                onDelete={handleDelete}
                isNew={isNewNote}
              />
            ) : (
              <EmptySelectState />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
