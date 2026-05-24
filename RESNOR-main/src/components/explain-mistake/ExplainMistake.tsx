"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Brain,
  BookOpen,
  Lightbulb,
  Link2,
  AlertTriangle,
  BarChart3,
  Target,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppStore } from '@/stores/app'

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: number;
  text: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  mistakeType?: string;
}

interface QuizAttempt {
  id: string;
  label: string;
  date: string;
  score: number;
  questions: QuizQuestion[];
}

interface AIExplanation {
  rootCause: string;
  conceptBreakdown: string;
  correctiveExplanation: string;
  relatedTopics: string[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const quizAttempts: QuizAttempt[] = [
  {
    id: "attempt-1",
    label: "Intro to Python — Dec 20, 2024",
    date: "2024-12-20",
    score: 60,
    questions: [
      {
        id: 1,
        text: "What is the output of `type(3.14)` in Python?",
        studentAnswer: "<class 'int'>",
        correctAnswer: "<class 'float'>",
        isCorrect: false,
        mistakeType: "Type confusion",
      },
      {
        id: 2,
        text: "Which keyword is used to define a function in Python?",
        studentAnswer: "function",
        correctAnswer: "def",
        isCorrect: false,
        mistakeType: "Syntax mix-up",
      },
      {
        id: 3,
        text: "What does `len([1, 2, 3, 4])` return?",
        studentAnswer: "4",
        correctAnswer: "4",
        isCorrect: true,
      },
      {
        id: 4,
        text: "Which of the following is a mutable data type in Python?",
        studentAnswer: "tuple",
        correctAnswer: "list",
        isCorrect: false,
        mistakeType: "Mutability concept",
      },
      {
        id: 5,
        text: "What is the result of `2 ** 3`?",
        studentAnswer: "8",
        correctAnswer: "8",
        isCorrect: true,
      },
    ],
  },
  {
    id: "attempt-2",
    label: "Control Flow — Dec 18, 2024",
    date: "2024-12-18",
    score: 40,
    questions: [
      {
        id: 1,
        text: "What is the output of: `x = 5; print(x if x > 3 else 0)`?",
        studentAnswer: "0",
        correctAnswer: "5",
        isCorrect: false,
        mistakeType: "Conditional logic",
      },
      {
        id: 2,
        text: "How many times will `for i in range(5): print(i)` execute?",
        studentAnswer: "4",
        correctAnswer: "5",
        isCorrect: false,
        mistakeType: "Off-by-one error",
      },
      {
        id: 3,
        text: "What keyword is used to skip to the next iteration of a loop?",
        studentAnswer: "break",
        correctAnswer: "continue",
        isCorrect: false,
        mistakeType: "Keyword confusion",
      },
      {
        id: 4,
        text: "What does `while True:` do?",
        studentAnswer: "Creates an infinite loop",
        correctAnswer: "Creates an infinite loop",
        isCorrect: true,
      },
      {
        id: 5,
        text: "Which statement correctly checks if `x` is equal to 10?",
        studentAnswer: "x = 10",
        correctAnswer: "x == 10",
        isCorrect: false,
        mistakeType: "Assignment vs comparison",
      },
    ],
  },
  {
    id: "attempt-3",
    label: "Functions & Scope — Dec 15, 2024",
    date: "2024-12-15",
    score: 80,
    questions: [
      {
        id: 1,
        text: "What does the `return` keyword do in a function?",
        studentAnswer: "Sends a value back to the caller",
        correctAnswer: "Sends a value back to the caller",
        isCorrect: true,
      },
      {
        id: 2,
        text: "What is a default parameter?",
        studentAnswer: "A parameter with a pre-set value used when no argument is provided",
        correctAnswer: "A parameter with a pre-set value used when no argument is provided",
        isCorrect: true,
      },
      {
        id: 3,
        text: "Can a function return multiple values in Python?",
        studentAnswer: "No, only one value",
        correctAnswer: "Yes, as a tuple",
        isCorrect: false,
        mistakeType: "Return types",
      },
      {
        id: 4,
        text: "What is a local variable?",
        studentAnswer: "A variable defined inside a function, accessible only within that function",
        correctAnswer: "A variable defined inside a function, accessible only within that function",
        isCorrect: true,
      },
      {
        id: 5,
        text: "What is the output of: `def f(a, b=2): return a + b; print(f(3))`?",
        studentAnswer: "3",
        correctAnswer: "5",
        isCorrect: false,
        mistakeType: "Default arguments",
      },
    ],
  },
  {
    id: "attempt-4",
    label: "Lists & Loops — Dec 10, 2024",
    date: "2024-12-10",
    score: 40,
    questions: [
      {
        id: 1,
        text: "What is the index of the last element in a list of length 5?",
        studentAnswer: "5",
        correctAnswer: "4",
        isCorrect: false,
        mistakeType: "Zero-indexing",
      },
      {
        id: 2,
        text: "What does `my_list.append(10)` return?",
        studentAnswer: "The updated list",
        correctAnswer: "None (modifies list in place)",
        isCorrect: false,
        mistakeType: "In-place mutation",
      },
      {
        id: 3,
        text: "How do you access the third element of `arr`?",
        studentAnswer: "arr[3]",
        correctAnswer: "arr[2]",
        isCorrect: false,
        mistakeType: "Zero-indexing",
      },
      {
        id: 4,
        text: "What does `list comprehension` mean?",
        studentAnswer: "A concise way to create lists using expressions",
        correctAnswer: "A concise way to create lists using expressions",
        isCorrect: true,
      },
      {
        id: 5,
        text: "What is the result of `[1,2,3] + [4,5]`?",
        studentAnswer: "5",
        correctAnswer: "[1, 2, 3, 4, 5]",
        isCorrect: false,
        mistakeType: "Operator overloading",
      },
    ],
  },
];

const mockExplanations: Record<string, AIExplanation> = {
  "1-1": {
    rootCause:
      "You likely confused integer and float types. In Python, any number with a decimal point (like 3.14) is automatically classified as a float, not an integer. Integers are whole numbers without decimals.",
    conceptBreakdown:
      "Python has several built-in numeric types:\n- **int**: Whole numbers (e.g., 3, -7, 42)\n- **float**: Numbers with decimal points (e.g., 3.14, -0.5, 2.0)\n- **complex**: Numbers with real and imaginary parts (e.g., 1+2j)\n\nThe `type()` function returns the type of any Python object. The decimal point is the key indicator — even `2.0` is a float.",
    correctiveExplanation:
      "The correct answer is `<class 'float'>` because 3.14 has a decimal point. Remember: if a number has a decimal point in Python, it's always a float. Only whole numbers without decimals are ints.",
    relatedTopics: ["Python Data Types", "Type Conversion", "Numbers in Python"],
  },
  "1-2": {
    rootCause:
      "You likely mixed up Python syntax with JavaScript or another language. In JavaScript, `function` is used to define functions, but Python uses the `def` keyword.",
    conceptBreakdown:
      "Python function definition syntax:\n```python\ndef function_name(parameters):\n    \"\"\"Docstring\"\"\"\n    # function body\n    return value\n```\n\nKey elements:\n- `def` keyword (required)\n- Function name (follows variable naming rules)\n- Parentheses for parameters\n- Colon `:` to start the function body\n- Indented body block",
    correctiveExplanation:
      "In Python, the keyword is `def`, short for \"define.\" The syntax is: `def my_function():` followed by an indented block. This is unique to Python — most other languages use different keywords like `function`, `func`, or `fn`.",
    relatedTopics: ["Python Functions", "Python vs JavaScript Syntax", "Function Parameters"],
  },
  "1-4": {
    rootCause:
      "You confused tuples with lists regarding mutability. Both are sequence types in Python, but they differ fundamentally in whether their contents can be changed after creation.",
    conceptBreakdown:
      "**Mutable vs Immutable in Python:**\n\nMutable (can be changed):\n- `list` — `[1, 2, 3]`\n- `dict` — `{'a': 1}`\n- `set` — `{1, 2, 3}`\n\nImmutable (cannot be changed):\n- `tuple` — `(1, 2, 3)`\n- `str` — `\"hello\"`\n- `frozenset` — `frozenset({1, 2})`\n\nMutable objects can be modified in place (e.g., `my_list[0] = 99`). Immutable objects cannot — trying to modify them creates a new object.",
    correctiveExplanation:
      "Lists are mutable — you can add, remove, or change elements after creation. Tuples are immutable — once created, their contents cannot be changed. The correct answer is `list`.",
    relatedTopics: ["Python Mutability", "Lists vs Tuples", "Immutable Types"],
  },
  "2-1": {
    rootCause:
      "You likely misread the conditional expression. The ternary operator `x if condition else y` returns `x` when the condition is true, and `y` when it's false. Since `x = 5` and `5 > 3` is true, it returns 5.",
    conceptBreakdown:
      "Python's ternary (conditional) expression:\n```python\nvalue_if_true if condition else value_if_false\n```\n\nFlow:\n1. Evaluate the condition\n2. If True → return value_if_true\n3. If False → return value_if_false\n\nThis is equivalent to:\n```python\nif condition:\n    result = value_if_true\nelse:\n    result = value_if_false\n```",
    correctiveExplanation:
      "Since `x = 5` and `x > 3` evaluates to `True`, the expression returns the first value, which is `5`. The `else 0` part would only be used if the condition were false.",
    relatedTopics: ["Conditional Expressions", "Ternary Operators", "Boolean Logic"],
  },
  "2-2": {
    rootCause:
      "You made a classic off-by-one error. `range(5)` generates the sequence 0, 1, 2, 3, 4 — that's five values, not four. Remember that `range(n)` starts at 0 and goes up to (but doesn't include) n.",
    conceptBreakdown:
      "`range(stop)` generates integers from 0 to stop-1:\n- `range(5)` → 0, 1, 2, 3, 4 (5 values)\n- `range(3)` → 0, 1, 2 (3 values)\n\n`range(start, stop)` generates from start to stop-1:\n- `range(2, 5)` → 2, 3, 4\n\n`range(start, stop, step)`:\n- `range(0, 10, 2)` → 0, 2, 4, 6, 8",
    correctiveExplanation:
      "`range(5)` produces the numbers 0 through 4 inclusive, which is exactly 5 values. The loop runs once for each value, so `print(i)` executes 5 times. Always remember: `range(n)` yields `n` values.",
    relatedTopics: ["range() Function", "Loop Iteration", "Off-by-One Errors"],
  },
  "2-3": {
    rootCause:
      "You confused `break` and `continue`. `break` exits the loop entirely, while `continue` skips the rest of the current iteration and moves to the next one.",
    conceptBreakdown:
      "**Loop Control Keywords:**\n\n`break` — Exits the loop immediately:\n```python\nfor i in range(10):\n    if i == 5:\n        break  # loop ends here\n    print(i)  # prints 0-4\n```\n\n`continue` — Skips to next iteration:\n```python\nfor i in range(5):\n    if i == 2:\n        continue  # skip this iteration\n    print(i)  # prints 0,1,3,4\n```\n\n`pass` — Does nothing (placeholder).",
    correctiveExplanation:
      "The `continue` keyword skips the remaining code in the current loop iteration and proceeds to the next iteration. `break` stops the loop entirely. The correct answer is `continue`.",
    relatedTopics: ["Loop Control", "break vs continue", "Loop Patterns"],
  },
  "2-5": {
    rootCause:
      "You confused the assignment operator `=` with the equality comparison operator `==`. This is one of the most common mistakes for beginners, especially those coming from math where `=` means equality.",
    conceptBreakdown:
      "**Assignment vs Comparison:**\n\n`=` — Assignment operator:\n- `x = 10` assigns the value 10 to x\n- Used in variable assignments, function parameters\n\n`==` — Equality comparison:\n- `x == 10` checks if x equals 10 (returns True/False)\n- Used in if statements, while conditions\n\n`===` does not exist in Python (it's from JavaScript).\n\nAlso: `is` checks identity (same object in memory).",
    correctiveExplanation:
      "Use `==` to check equality in Python. The single `=` is for assignment only. So `if x == 10:` is the correct way to check if x equals 10 in a conditional statement.",
    relatedTopics: ["Comparison Operators", "Assignment vs Equality", "Python Operators"],
  },
  "3-3": {
    rootCause:
      "You thought Python functions can only return one value. In fact, Python allows returning multiple values as a tuple, which can be unpacked into separate variables.",
    conceptBreakdown:
      "**Multiple Return Values in Python:**\n\nPython functions can return multiple values packed as a tuple:\n```python\ndef min_max(numbers):\n    return min(numbers), max(numbers)\n\n# Unpacking\nlo, hi = min_max([3, 1, 4, 1, 5])\n# lo = 1, hi = 5\n```\n\nYou can return any number of values separated by commas. Python automatically packs them into a tuple.",
    correctiveExplanation:
      "Python functions CAN return multiple values. When you write `return a, b`, Python automatically packs them into a tuple `(a, b)`. The caller can unpack them with `x, y = function()`. This is a powerful Python feature not available in many other languages.",
    relatedTopics: ["Tuples", "Return Values", "Unpacking"],
  },
  "3-5": {
    rootCause:
      "You forgot that default parameter values are used when an argument isn't provided. Since only one argument (3) was passed, `b` uses its default value of 2, making the result 3 + 2 = 5.",
    conceptBreakdown:
      "**Default Parameters:**\n\n```python\ndef f(a, b=2):\n    return a + b\n\nf(3)     # a=3, b=2 (default) → 5\nf(3, 10) # a=3, b=10 (override) → 13\n```\n\nRules:\n- Default parameters must come after non-default ones\n- The default is used only when the argument is omitted\n- You can override defaults by passing a value explicitly",
    correctiveExplanation:
      "When calling `f(3)`, the parameter `a` gets the value 3, and `b` uses its default value of 2. So the function returns `3 + 2 = 5`, not `3`. If you wanted 3, you'd need to call `f(3, 0)` or change the default to 0.",
    relatedTopics: ["Default Parameters", "Function Arguments", "Keyword Arguments"],
  },
  "4-1": {
    rootCause:
      "Classic zero-indexing error. Python lists start at index 0, so the last element of a 5-element list is at index 4, not 5.",
    conceptBreakdown:
      "**Python Zero-Indexing:**\n\nFor a list `arr = [10, 20, 30, 40, 50]` (length 5):\n- Index 0 → 10 (first)\n- Index 1 → 20\n- Index 2 → 30\n- Index 3 → 40\n- Index 4 → 50 (last)\n\nNegative indices:\n- Index -1 → 50 (last)\n- Index -2 → 40\n\nLength is always `len(arr)`, last index is always `len(arr) - 1`.",
    correctiveExplanation:
      "In Python, list indexing starts at 0, not 1. So for a list of length 5, the indices are 0, 1, 2, 3, 4. The last element is at index `len(list) - 1` = 4. Using index 5 would cause an IndexError.",
    relatedTopics: ["List Indexing", "Zero-Based Indexing", "Negative Indices"],
  },
  "4-2": {
    rootCause:
      "You assumed `append()` returns the modified list, like method chaining in JavaScript. In Python, `append()` modifies the list in place and returns `None`.",
    conceptBreakdown:
      "**In-Place vs Returning Methods:**\n\nMethods that modify in place return `None`:\n- `list.append(x)` → returns `None`\n- `list.sort()` → returns `None`\n- `list.reverse()` → returns `None`\n\nMethods that return new values:\n- `sorted(list)` → returns new sorted list\n- `list + [x]` → returns new list\n- `list.copy()` → returns new list\n\nThis design prevents confusion about whether you're modifying the original or creating a new object.",
    correctiveExplanation:
      "`my_list.append(10)` adds 10 to the list and returns `None`. The list is modified in place. If you write `x = my_list.append(10)`, `x` will be `None`, not the list. This is a deliberate Python design choice.",
    relatedTopics: ["List Methods", "In-Place Operations", "Method Return Values"],
  },
  "4-3": {
    rootCause:
      "Another zero-indexing mistake. The third element is at index 2 (0-based), not index 3 (which would be the fourth element).",
    conceptBreakdown:
      "**Accessing List Elements:**\n\n```python\narr = ['a', 'b', 'c', 'd', 'e']\narr[0]  # 'a' (1st element)\narr[1]  # 'b' (2nd element)\narr[2]  # 'c' (3rd element)\narr[3]  # 'd' (4th element)\narr[4]  # 'e' (5th element)\n```\n\nRule of thumb: to get the Nth element, use index N-1.",
    correctiveExplanation:
      "Since Python uses zero-based indexing, the third element is at index 2. `arr[3]` would give you the fourth element. Always subtract 1 from the position number to get the correct index.",
    relatedTopics: ["List Indexing", "Zero-Based Indexing", "Element Access"],
  },
  "4-5": {
    rootCause:
      "You treated the `+` operator on lists like the `+` operator on numbers. With lists, `+` concatenates them into a new list rather than performing arithmetic addition.",
    conceptBreakdown:
      "**List Concatenation:**\n\nThe `+` operator on lists concatenates them:\n```python\n[1, 2, 3] + [4, 5]  # [1, 2, 3, 4, 5]\n['a'] + ['b']       # ['a', 'b']\n```\n\nOther list operations:\n- `*` repeats: `[0] * 3` → `[0, 0, 0]`\n- `len()`: `len([1,2,3])` → `3`\n- `in`: `3 in [1,2,3]` → `True`\n\nPython uses operator overloading — the same operator can behave differently for different types.",
    correctiveExplanation:
      "The `+` operator concatenates two lists into a single new list. `[1, 2, 3] + [4, 5]` produces `[1, 2, 3, 4, 5]`. It does NOT perform arithmetic addition. This is called operator overloading.",
    relatedTopics: ["List Operations", "Operator Overloading", "List Concatenation"],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMistakeType(attemptId: string, questionId: number): string {
  const attempt = quizAttempts.find((a) => a.id === attemptId);
  if (!attempt) return "Unknown";
  const q = attempt.questions.find((q) => q.id === questionId);
  return q?.mistakeType ?? "Unknown";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExplainMistake() {
  const reviewData = useAppStore((s) => s.reviewAttemptData)
  const clearReviewData = useAppStore((s) => s.setReviewAttemptData)
  const attempts = useMemo(() => {
    if (reviewData) {
      // Convert store data to match the component's mock schema
      return [{
        id: reviewData.id,
        label: reviewData.label,
        date: reviewData.date,
        score: reviewData.score,
        questions: reviewData.questions,
      }]
    }
    return quizAttempts
  }, [reviewData])

  const [selectedAttemptId, setSelectedAttemptId] = useState(attempts[0]?.id ?? '');
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<Record<string, AIExplanation>>({});

  // When review data is present, auto-set the attempt
  useEffect(() => {
    if (reviewData) {
      setSelectedAttemptId(reviewData.id)
    }
  }, [reviewData])

  // Auto-select attempt from dashboard review click
  useEffect(() => {
    const { preselectedQuizTitle, setPreselectedQuizTitle } = useAppStore.getState()
    if (preselectedQuizTitle) {
      const match = attempts.find(a =>
        a.label.toLowerCase().includes(preselectedQuizTitle.toLowerCase())
      )
      if (match) setSelectedAttemptId(match.id)
      setPreselectedQuizTitle(null)
    }
  }, [attempts])

  const selectedAttempt = useMemo(
    () => attempts.find((a) => a.id === selectedAttemptId) ?? attempts[0],
    [selectedAttemptId, attempts]
  );

  const wrongQuestions = useMemo(
    () => selectedAttempt?.questions.filter((q) => !q.isCorrect) ?? [],
    [selectedAttempt]
  );

  const correctCount = useMemo(
    () => selectedAttempt?.questions.filter((q) => q.isCorrect).length ?? 0,
    [selectedAttempt]
  );

  const accuracy = useMemo(
    () => selectedAttempt ? Math.round((correctCount / selectedAttempt.questions.length) * 100) : 0,
    [correctCount, selectedAttempt]
  );

  const mostCommonMistake = useMemo(() => {
    const counts: Record<string, number> = {};
    wrongQuestions.forEach((q) => {
      const t = q.mistakeType ?? "Unknown";
      counts[t] = (counts[t] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "None";
  }, [wrongQuestions]);

  // Auto-fetch AI explanations for all wrong questions
  useEffect(() => {
    wrongQuestions.forEach((q) => {
      const key = explanationKey(q.id)
      if (explanations[key]) return
      setLoadingExplanations((prev) => new Set(prev).add(key))
      fetch('/api/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.text,
          studentAnswer: q.studentAnswer,
          correctAnswer: q.correctAnswer,
          mistakeType: q.mistakeType || null,
        }),
      })
        .then(r => r.json())
        .then(data => {
          setExplanations(prev => ({ ...prev, [key]: data }))
        })
          .catch(() => {
            setExplanations(prev => ({
              ...prev,
              [key]: {
                rootCause: `You answered "${q.studentAnswer}" but the correct answer is "${q.correctAnswer}".`,
                conceptBreakdown: 'Review this concept and try similar questions.',
                correctiveExplanation: `The correct answer is "${q.correctAnswer}". Practice to reinforce.`,
                relatedTopics: [],
              },
            }))
          })
        .finally(() => {
          setLoadingExplanations((prev) => { const next = new Set(prev); next.delete(key); return next })
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttemptId])

  const handleAccordionToggle = useCallback((value: string) => {
    const key = value;
    if (explanations[key]) return;
    setLoadingExplanations((prev) => new Set(prev).add(key));

    // Find the question for this key
    const lastDash = key.lastIndexOf('-')
    const qId = parseInt(key.slice(lastDash + 1))
    const attemptId = key.slice(0, lastDash)
    const attempt = attempts.find(a => a.id === attemptId)
    const question = attempt?.questions.find(q => q.id === qId)
    if (!question) {
      setLoadingExplanations((prev) => { const next = new Set(prev); next.delete(key); return next })
      return
    }

    fetch('/api/explain-mistake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.text,
        studentAnswer: question.studentAnswer,
        correctAnswer: question.correctAnswer,
        mistakeType: question.mistakeType || null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        setExplanations(prev => ({ ...prev, [key]: data }))
      })
      .catch(() => {
        setExplanations(prev => ({
          ...prev,
          [key]: {
            rootCause: `You answered "${question.studentAnswer}" but the correct answer is "${question.correctAnswer}".`,
            conceptBreakdown: 'Review this concept and try similar questions.',
            correctiveExplanation: `The correct answer is "${question.correctAnswer}". Practice to reinforce.`,
            relatedTopics: [],
          },
        }))
      })
      .finally(() => {
        setLoadingExplanations((prev) => { const next = new Set(prev); next.delete(key); return next })
      })
  }, [explanations]);

  const explanationKey = (questionId: number) => `${selectedAttempt.id}-${questionId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explain My Mistake</h1>
        <p className="text-muted-foreground">
          Review your quiz attempts and understand where things went wrong — auto-deploy test.
        </p>
      </div>

      {/* Attempt Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {attempts.length > 1 && (
            <>
              <label htmlFor="attempt-select" className="text-sm font-medium whitespace-nowrap">
                Select Attempt:
              </label>
              <Select value={selectedAttemptId} onValueChange={(v) => {
                setSelectedAttemptId(v);
                setExplanations({});
                setLoadingExplanations(new Set());
              }}>
                <SelectTrigger id="attempt-select" className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attempts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.score}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {attempts.length === 1 && selectedAttempt && (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedAttempt.label}</h2>
              <Badge variant="secondary">{selectedAttempt.date}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <XCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wrong Answers</p>
              <p className="text-xl font-bold">{wrongQuestions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-xl font-bold">{accuracy}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Most Common Mistake</p>
              <p className="text-sm font-bold">{mostCommonMistake}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-xl font-bold">{selectedAttempt.score}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Review Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Question Review</h2>
        <ScrollArea className="h-auto max-h-[600px]">
          <div className="space-y-3 pr-4">
            {selectedAttempt.questions.map((question) => (
              <Card key={question.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        question.isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {question.id}
                    </div>
                    <p className="text-sm leading-relaxed pt-0.5">{question.text}</p>
                  </div>

                  <Separator />

                  {/* Answers */}
                  {question.isCorrect ? (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span className="text-sm">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">Correct!</span>{" "}
                        <span className="text-emerald-600 dark:text-emerald-500">{question.correctAnswer}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-rose-500">Your Answer</p>
                          <p className="text-sm text-rose-600 dark:text-rose-400">{question.studentAnswer}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-emerald-600">Correct Answer</p>
                          <p className="text-sm text-emerald-700 dark:text-emerald-400">{question.correctAnswer}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mistake type badge */}
                  {!question.isCorrect && question.mistakeType && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                    >
                      {question.mistakeType}
                    </Badge>
                  )}
                </CardContent>

                {/* AI Explanation Accordion for incorrect answers */}
                {!question.isCorrect && (
                  <div className="border-t">
                    <Accordion
                      type="single"
                      collapsible
                      onValueChange={(val) => {
                        if (val) handleAccordionToggle(explanationKey(question.id));
                      }}
                    >
                      <AccordionItem value={explanationKey(question.id)} className="border-b-0">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Brain className="size-4 text-amber-600" />
                            <span className="text-sm font-medium">AI Explanation</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {loadingExplanations.has(explanationKey(question.id)) ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[140px]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                              </div>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[160px]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                              </div>
                              <div className="flex gap-2">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-32 rounded-full" />
                                <Skeleton className="h-6 w-28 rounded-full" />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(() => {
                                const expl = explanations[explanationKey(question.id)];
                                if (!expl) return <p className="text-sm text-muted-foreground">No explanation available.</p>;
                                return (
                                  <>
                                    {/* Root-Cause Analysis */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-rose-100 dark:bg-rose-950/50">
                                          <AlertTriangle className="size-3.5 text-rose-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Root-Cause Analysis</h4>
                                      </div>
                                      <p className="pl-8 text-sm leading-relaxed text-muted-foreground">
                                        {expl.rootCause}
                                      </p>
                                    </div>

                                    {/* Concept Breakdown */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-950/50">
                                          <BookOpen className="size-3.5 text-emerald-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Concept Breakdown</h4>
                                      </div>
                                      <p className="pl-8 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                        {expl.conceptBreakdown}
                                      </p>
                                    </div>

                                    {/* Corrective Explanation */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-amber-100 dark:bg-amber-950/50">
                                          <Lightbulb className="size-3.5 text-amber-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Corrective Explanation</h4>
                                      </div>
                                      <p className="pl-8 text-sm leading-relaxed text-muted-foreground">
                                        {expl.correctiveExplanation}
                                      </p>
                                    </div>

                                    {/* Related Topics */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
                                          <Link2 className="size-3.5 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Related Topics</h4>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pl-8">
                                        {expl.relatedTopics.map((topic) => (
                                          <Badge
                                            key={topic}
                                            variant="outline"
                                            className="cursor-pointer transition-colors hover:bg-muted"
                                          >
                                            {topic}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
