'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Upload,
  FileText,
  Play,
  ExternalLink,
  StickyNote,
  Bookmark,
  BookmarkCheck,
  Download,
  Star,
  StarHalf,
  Calendar,
  HardDrive,
  User,
  FolderOpen,
  Video,
  Link2,
  Library,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResourceType = 'Document' | 'Video' | 'Link' | 'Note';

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  subject: string;
  description: string;
  author: string;
  date: string;
  fileSize: string;
  downloads: number;
  rating: number;
  isBookmarked: boolean;
  relatedIds: string[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_RESOURCES: Resource[] = [
  // 5 Documents
  {
    id: 'res-001',
    title: 'Binary Search Trees - Complete Guide',
    type: 'Document',
    subject: 'Data Structures',
    description:
      'A comprehensive guide to binary search trees covering insertion, deletion, traversal algorithms (in-order, pre-order, post-order), balancing techniques including AVL trees and Red-Black trees, and time complexity analysis for all operations.',
    author: 'Prof. Karim',
    date: '2025-03-15',
    fileSize: '2.4 MB',
    downloads: 342,
    rating: 4.8,
    isBookmarked: true,
    relatedIds: ['res-002', 'res-005'],
  },
  {
    id: 'res-002',
    title: 'Graph Theory Fundamentals',
    type: 'Document',
    subject: 'Algorithms',
    description:
      'Fundamental concepts of graph theory including adjacency matrices, adjacency lists, BFS, DFS, shortest path algorithms (Dijkstra, Bellman-Ford), minimum spanning trees (Kruskal, Prim), and topological sorting.',
    author: 'Prof. Rahman',
    date: '2025-03-10',
    fileSize: '3.1 MB',
    downloads: 289,
    rating: 4.5,
    isBookmarked: true,
    relatedIds: ['res-001', 'res-006'],
  },
  {
    id: 'res-003',
    title: 'Normalization & Database Design',
    type: 'Document',
    subject: 'Databases',
    description:
      'Detailed notes on database normalization forms from 1NF through BCNF and 4NF. Includes entity-relationship diagrams, functional dependency theory, decomposition algorithms, and real-world case studies.',
    author: 'Prof. Haque',
    date: '2025-02-28',
    fileSize: '1.8 MB',
    downloads: 198,
    rating: 4.3,
    isBookmarked: false,
    relatedIds: ['res-011'],
  },
  {
    id: 'res-004',
    title: 'TCP/IP Protocol Stack',
    type: 'Document',
    subject: 'Networks',
    description:
      'In-depth coverage of the TCP/IP protocol stack including physical layer, data link layer, network layer (IP, ICMP, ARP), transport layer (TCP, UDP), and application layer protocols (HTTP, FTP, DNS, SMTP).',
    author: 'Prof. Islam',
    date: '2025-02-20',
    fileSize: '4.2 MB',
    downloads: 156,
    rating: 4.6,
    isBookmarked: true,
    relatedIds: ['res-015'],
  },
  {
    id: 'res-005',
    title: 'Dynamic Programming Patterns',
    type: 'Document',
    subject: 'Algorithms',
    description:
      'A curated collection of dynamic programming problem patterns including knapsack variants, longest common subsequence, matrix chain multiplication, optimal binary search trees, and memoization vs tabulation approaches.',
    author: 'Prof. Karim',
    date: '2025-03-01',
    fileSize: '2.7 MB',
    downloads: 412,
    rating: 4.9,
    isBookmarked: true,
    relatedIds: ['res-001', 'res-002'],
  },
  // 4 Videos
  {
    id: 'res-006',
    title: 'BFS & DFS Visualized',
    type: 'Video',
    subject: 'Data Structures',
    description:
      'Step-by-step visual walkthrough of breadth-first search and depth-first search algorithms on various graph structures. Includes time and space complexity analysis, implementation in Python, and practice problems.',
    author: 'TA Nusrat',
    date: '2025-03-12',
    fileSize: '128 MB',
    downloads: 567,
    rating: 4.7,
    isBookmarked: true,
    relatedIds: ['res-002', 'res-001'],
  },
  {
    id: 'res-007',
    title: 'OS Process Scheduling Explained',
    type: 'Video',
    subject: 'OS',
    description:
      'Clear explanation of operating system process scheduling algorithms including FCFS, SJF, Round Robin, Priority Scheduling, and Multilevel Queue scheduling with Gantt chart visualizations and comparison tables.',
    author: 'Prof. Chowdhury',
    date: '2025-02-25',
    fileSize: '95 MB',
    downloads: 234,
    rating: 4.4,
    isBookmarked: false,
    relatedIds: ['res-013'],
  },
  {
    id: 'res-008',
    title: 'React Hooks Deep Dive',
    type: 'Video',
    subject: 'Web Dev',
    description:
      'Deep dive into React hooks including useState, useEffect, useRef, useMemo, useCallback, useContext, and custom hooks. Covers common pitfalls, performance optimization patterns, and testing strategies.',
    author: 'Prof. Begum',
    date: '2025-03-08',
    fileSize: '156 MB',
    downloads: 389,
    rating: 4.6,
    isBookmarked: true,
    relatedIds: ['res-009', 'res-012'],
  },
  {
    id: 'res-009',
    title: 'REST API Design Principles',
    type: 'Video',
    subject: 'Web Dev',
    description:
      'Comprehensive guide to RESTful API design covering resource naming conventions, HTTP methods, status codes, authentication, versioning, pagination, rate limiting, and HATEOAS principles with practical examples.',
    author: 'Prof. Begum',
    date: '2025-02-15',
    fileSize: '112 MB',
    downloads: 276,
    rating: 4.3,
    isBookmarked: false,
    relatedIds: ['res-008', 'res-012'],
  },
  // 4 Links
  {
    id: 'res-010',
    title: 'GeeksforGeeks DSA Practice',
    type: 'Link',
    subject: 'Algorithms',
    description:
      'Curated list of 200+ data structures and algorithms problems organized by topic and difficulty level from GeeksforGeeks. Includes editorial solutions, discussion forums, and company-wise tagged problems for interview preparation.',
    author: 'Community',
    date: '2025-03-14',
    fileSize: '-',
    downloads: 0,
    rating: 4.5,
    isBookmarked: true,
    relatedIds: ['res-005', 'res-002'],
  },
  {
    id: 'res-011',
    title: 'SQLZoo Interactive Exercises',
    type: 'Link',
    subject: 'Databases',
    description:
      'Interactive SQL learning platform with hands-on exercises covering SELECT queries, JOINs, subqueries, window functions, and aggregation. Progressive difficulty from beginner to advanced with instant feedback.',
    author: 'Community',
    date: '2025-01-20',
    fileSize: '-',
    downloads: 0,
    rating: 4.2,
    isBookmarked: false,
    relatedIds: ['res-003'],
  },
  {
    id: 'res-012',
    title: 'MDN Web Docs - JavaScript Reference',
    type: 'Link',
    subject: 'Web Dev',
    description:
      'Official Mozilla Developer Network JavaScript reference with comprehensive documentation on all built-in objects, methods, properties, and modern ES6+ features. Essential resource for any web developer.',
    author: 'Mozilla',
    date: '2025-03-05',
    fileSize: '-',
    downloads: 0,
    rating: 4.8,
    isBookmarked: false,
    relatedIds: ['res-008', 'res-009'],
  },
  {
    id: 'res-013',
    title: 'OSTEP - Operating Systems Textbook',
    type: 'Link',
    subject: 'OS',
    description:
      'Online version of "Operating Systems: Three Easy Pieces" by Remzi and Andrea Arpaci-Dusseau. Covers virtualization, concurrency, and persistence with clear explanations, illustrations, and homework assignments.',
    author: 'Arpaci-Dusseau',
    date: '2024-12-10',
    fileSize: '-',
    downloads: 0,
    rating: 4.9,
    isBookmarked: true,
    relatedIds: ['res-007'],
  },
  // 3 Notes
  {
    id: 'res-014',
    title: 'Sorting Algorithms Cheat Sheet',
    type: 'Note',
    subject: 'Algorithms',
    description:
      'Quick reference cheat sheet for sorting algorithms including Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort, and Radix Sort with time/space complexity, stability, and pseudocode.',
    author: 'Rafi Ahmed',
    date: '2025-03-11',
    fileSize: '450 KB',
    downloads: 178,
    rating: 4.4,
    isBookmarked: false,
    relatedIds: ['res-005', 'res-002'],
  },
  {
    id: 'res-015',
    title: 'OSI Model vs TCP/IP Quick Notes',
    type: 'Note',
    subject: 'Networks',
    description:
      "Concise comparison notes between OSI and TCP/IP models. Covers each layer's responsibilities, protocols, data units, and key differences. Includes a memorization framework and exam tips.",
    author: 'Tanvir Hasan',
    date: '2025-02-18',
    fileSize: '320 KB',
    downloads: 145,
    rating: 4.1,
    isBookmarked: false,
    relatedIds: ['res-004'],
  },
  {
    id: 'res-016',
    title: 'CSS Grid & Flexbox Notes',
    type: 'Note',
    subject: 'Web Dev',
    description:
      'Personal study notes on CSS Grid and Flexbox layout systems. Covers grid template areas, auto-fill vs auto-fit, flex-grow/shrink/basis, alignment properties, and responsive design patterns.',
    author: 'Farhana Islam',
    date: '2025-03-02',
    fileSize: '280 KB',
    downloads: 201,
    rating: 4.3,
    isBookmarked: false,
    relatedIds: ['res-008', 'res-012'],
  },
];

const SUBJECTS = [
  'All',
  'Data Structures',
  'Algorithms',
  'Web Dev',
  'Databases',
  'OS',
  'Networks',
];

const TYPE_FILTERS: ('All' | ResourceType)[] = [
  'All',
  'Document',
  'Video',
  'Link',
  'Note',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
] as const;

// ─── Type Config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ResourceType,
  {
    icon: typeof FileText;
    border: string;
    badge: string;
    bg: string;
    iconColor: string;
  }
> = {
  Document: {
    icon: FileText,
    border: 'border-t-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    iconColor: 'text-emerald-500',
  },
  Video: {
    icon: Play,
    border: 'border-t-teal-500',
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    bg: 'bg-teal-500/5',
    iconColor: 'text-teal-500',
  },
  Link: {
    icon: ExternalLink,
    border: 'border-t-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    bg: 'bg-amber-500/5',
    iconColor: 'text-amber-500',
  },
  Note: {
    icon: StickyNote,
    border: 'border-t-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    bg: 'bg-rose-500/5',
    iconColor: 'text-rose-500',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;
        return (
          <span key={star} className="relative inline-flex">
            <Star
              className={cn(
                starSize,
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/30'
              )}
            />
            {halfFilled && (
              <span className="absolute inset-0 overflow-hidden w-[50%]">
                <Star
                  className={cn(starSize, 'fill-amber-400 text-amber-400')}
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatsOverview({ resources }: { resources: Resource[] }) {
  const totalResources = resources.length;
  const totalDocuments = resources.filter((r) => r.type === 'Document').length;
  const totalVideos = resources.filter((r) => r.type === 'Video').length;
  const totalBookmarked = resources.filter((r) => r.isBookmarked).length;

  const stats = [
    {
      label: 'Total Resources',
      value: totalResources,
      icon: Library,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Documents',
      value: totalDocuments,
      icon: FileText,
      color: 'text-teal-500 bg-teal-500/10',
    },
    {
      label: 'Videos',
      value: totalVideos,
      icon: Video,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Bookmarked',
      value: totalBookmarked,
      icon: BookmarkCheck,
      color: 'text-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="py-4">
            <CardContent className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  stat.color
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function ResourceCard({
  resource,
  onOpenDetail,
  onToggleBookmark,
}: {
  resource: Resource;
  onOpenDetail: (resource: Resource) => void;
  onToggleBookmark: (resourceId: string) => void;
}) {
  const typeConf = TYPE_CONFIG[resource.type];
  const TypeIcon = typeConf.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden border-t-4 cursor-pointer',
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
          typeConf.border
        )}
        onClick={() => onOpenDetail(resource)}
      >
        {/* Icon Area */}
        <div className={cn('relative flex items-center justify-center py-6', typeConf.bg)}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-muted/20" />
          <div
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm',
              typeConf.iconColor
            )}
          >
            <TypeIcon className="h-7 w-7" />
          </div>
          {/* Bookmark Toggle */}
          <motion.button
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(resource.id);
            }}
            whileTap={{ scale: 0.85 }}
            animate={
              resource.isBookmarked
                ? { scale: [1, 1.3, 0.9, 1.15, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            {resource.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-emerald-500 fill-emerald-500" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.button>
          {/* Type Badge */}
          <Badge
            variant="outline"
            className={cn('absolute top-3 left-3 text-[10px] font-semibold', typeConf.badge)}
          >
            {resource.type}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {resource.title}
          </h3>

          {/* Subject */}
          <Badge variant="secondary" className="text-[10px]">
            <FolderOpen className="h-3 w-3 mr-1" />
            {resource.subject}
          </Badge>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {resource.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">{resource.author}</span>
          </div>

          {/* Meta Row */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              {resource.type !== 'Link' && (
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span className="tabular-nums">{resource.downloads}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(resource.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <RatingStars rating={resource.rating} />
            <span className="text-xs font-semibold tabular-nums">{resource.rating}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceDetailSheet({
  resource,
  open,
  onOpenChange,
  onToggleBookmark,
  allResources,
}: {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleBookmark: (resourceId: string) => void;
  allResources: Resource[];
}) {
  if (!resource) return null;

  const typeConf = TYPE_CONFIG[resource.type];
  const TypeIcon = typeConf.icon;
  const relatedResources = allResources.filter((r) =>
    resource.relatedIds.includes(r.id)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Header Gradient */}
          <div className="relative">
            <div
              className={cn(
                'h-40 flex items-center justify-center',
                typeConf.bg
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  'h-16 w-16 rounded-2xl bg-background shadow-md flex items-center justify-center',
                  typeConf.iconColor
                )}
              >
                <TypeIcon className="h-8 w-8" />
              </div>
            </div>
            <SheetHeader className="absolute bottom-0 left-0 right-0 px-6 pb-2 pt-10 bg-gradient-to-t from-background via-background/80 to-transparent">
              <SheetTitle className="text-xl font-bold">{resource.title}</SheetTitle>
              <SheetDescription>{resource.subject} &mdash; by {resource.author}</SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Meta Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('text-xs', typeConf.badge)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {resource.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FolderOpen className="h-3 w-3 mr-1" />
                {resource.subject}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(resource.date)}
              </Badge>
              {resource.fileSize !== '-' && (
                <Badge variant="outline" className="text-xs">
                  <HardDrive className="h-3 w-3 mr-1" />
                  {resource.fileSize}
                </Badge>
              )}
              {resource.type !== 'Link' && (
                <Badge variant="outline" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  {resource.downloads} downloads
                </Badge>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingStars rating={resource.rating} size="lg" />
              <span className="text-lg font-bold tabular-nums">{resource.rating}</span>
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resource.description}
              </p>
            </div>

            <Separator />

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Author</p>
                <p className="text-sm font-medium">{resource.author}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{resource.type}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Date Added</p>
                <p className="text-sm font-medium">{formatDate(resource.date)}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">File Size</p>
                <p className="text-sm font-medium">{resource.fileSize}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {resource.type !== 'Link' && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant={resource.isBookmarked ? 'secondary' : 'outline'}
                className={cn(
                  'flex-1',
                  resource.isBookmarked &&
                    'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                )}
                onClick={() => onToggleBookmark(resource.id)}
              >
                {resource.isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2 fill-emerald-500" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Bookmark
                  </>
                )}
              </Button>
            </div>

            {/* Related Resources */}
            {relatedResources.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Related Resources</h4>
                  <div className="space-y-2">
                    {relatedResources.map((related) => {
                      const rConf = TYPE_CONFIG[related.type];
                      const RIcon = rConf.icon;
                      return (
                        <div
                          key={related.id}
                          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => onOpenChange(false)}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              rConf.iconColor,
                              rConf.bg
                            )}
                          >
                            <RIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{related.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {related.type} &middot; {related.subject} &middot; ★ {related.rating}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="pb-6" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('Document');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, subject, description }),
      })
    } catch {}
    setSubmitting(false);
    onOpenChange(false);
    setTitle('');
    setType('Document');
    setSubject('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
          <DialogDescription>
            Share a resource with the community. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              placeholder="e.g. Introduction to Graph Theory"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as ResourceType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Link">Link</SelectItem>
                  <SelectItem value="Note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter((s) => s !== 'All')
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-desc">Description</Label>
            <Textarea
              id="res-desc"
              placeholder="Briefly describe the resource..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {submitting ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyResourcesState({ searchQuery, showBookmarkedOnly }: { searchQuery: string; showBookmarkedOnly: boolean }) {
  if (showBookmarkedOnly) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No bookmarks yet</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Start exploring resources and bookmark the ones you find useful. They&apos;ll appear here for quick access.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No resources found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {searchQuery
          ? `No resources match "${searchQuery}". Try a different search term or adjust your filters.`
          : 'No resources match your current filters. Try removing some constraints.'}
      </p>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | ResourceType>('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch real resources from API and merge with mock data
  useEffect(() => {
    fetch('/api/resources')
      .then(r => r.json())
      .then(res => {
        if (res.error || !res.resources?.length) return
        const apiResources: Resource[] = res.resources.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type as ResourceType,
          subject: r.subject || 'General',
          description: r.description || '',
          author: r.authorName || 'Unknown',
          date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          fileSize: r.fileSize || '—',
          downloads: r.downloads || 0,
          rating: r.rating || 0,
          isBookmarked: false,
          relatedIds: [],
        }))
        setResources(prev => {
          const merged = [...apiResources]
          for (const mock of MOCK_RESOURCES) {
            if (!apiResources.find(a => a.id === mock.id)) {
              merged.push(mock)
            }
          }
          return merged
        })
      })
      .catch(() => {}) // fallback to mock data
  }, [])

  const filteredResources = useMemo(() => {
    let result = [...resources];

    // Bookmark filter
    if (showBookmarkedOnly) {
      result = result.filter((r) => r.isBookmarked);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query) ||
          r.subject.toLowerCase().includes(query) ||
          r.author.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter((r) => r.type === selectedType);
    }

    // Subject filter
    if (selectedSubject !== 'All') {
      result = result.filter((r) => r.subject === selectedSubject);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'popular':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [resources, searchQuery, selectedType, selectedSubject, sortBy, showBookmarkedOnly]);

  const totalBookmarked = useMemo(
    () => resources.filter((r) => r.isBookmarked).length,
    [resources]
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'All' ||
    selectedSubject !== 'All' ||
    showBookmarkedOnly;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedSubject('All');
    setShowBookmarkedOnly(false);
  }, []);

  const handleOpenDetail = useCallback((resource: Resource) => {
    setDetailResource(resource);
    setSheetOpen(true);
  }, []);

  const handleToggleBookmark = useCallback((resourceId: string) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r
      )
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="h-6 w-6 text-emerald-500" />
            Resource Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredResources.length} of {resources.length} resources
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          </DialogTrigger>
        </Dialog>
      </motion.div>

      {/* Stats Overview */}
      <StatsOverview resources={resources} />

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources by title, subject, author, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {TYPE_FILTERS.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs',
                selectedType === type
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : ''
              )}
              onClick={() => setSelectedType(type)}
            >
              {type === 'Document' && <FileText className="h-3 w-3 mr-1" />}
              {type === 'Video' && <Play className="h-3 w-3 mr-1" />}
              {type === 'Link' && <ExternalLink className="h-3 w-3 mr-1" />}
              {type === 'Note' && <StickyNote className="h-3 w-3 mr-1" />}
              {type}
            </Button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {/* Bookmark Toggle */}
            <Button
              variant={showBookmarkedOnly ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs',
                showBookmarkedOnly
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : ''
              )}
              onClick={() => setShowBookmarkedOnly((prev) => !prev)}
            >
              {showBookmarkedOnly ? (
                <BookmarkCheck className="h-3 w-3 mr-1" />
              ) : (
                <Bookmark className="h-3 w-3 mr-1" />
              )}
              Bookmarked
              {totalBookmarked > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]"
                >
                  {totalBookmarked}
                </Badge>
              )}
            </Button>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger size="sm" className="w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs rounded-full px-3',
                selectedSubject === subject
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : ''
              )}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </Button>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </motion.div>

      {/* Resource Grid */}
      <AnimatePresence mode="popLayout">
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.04,
                  layout: { duration: 0.3 },
                }}
              >
                <ResourceCard
                  resource={resource}
                  onOpenDetail={handleOpenDetail}
                  onToggleBookmark={handleToggleBookmark}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyResourcesState
            searchQuery={searchQuery}
            showBookmarkedOnly={showBookmarkedOnly}
          />
        )}
      </AnimatePresence>

      {/* Resource Detail Sheet */}
      <ResourceDetailSheet
        resource={detailResource}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onToggleBookmark={handleToggleBookmark}
        allResources={resources}
      />

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} subjects={SUBJECTS} />
    </div>
  );
}
