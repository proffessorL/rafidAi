"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Brain, Clock, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  timeLimit: number;
  topic: { name: string };
  questions: any[];
  _count: { attempts: number };
}

interface FormState {
  title: string;
  topic: string;
  difficulty: string;
  timeLimit: string;
  questions: QuizQuestion[];
}

const DIFFICULTIES = ["easy", "medium", "hard"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const difficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90 border-transparent">Easy</Badge>;
    case "medium":
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90 border-transparent">Medium</Badge>;
    case "hard":
      return <Badge className="bg-rose-600 text-white hover:bg-rose-600/90 border-transparent">Hard</Badge>;
    default:
      return <Badge variant="outline">{difficulty}</Badge>;
  }
};

function emptyQuestion(): QuizQuestion {
  return {
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    explanation: "",
  };
}

export default function QuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    topic: "",
    difficulty: "medium",
    timeLimit: "10",
    questions: [emptyQuestion()],
  });

  const fetchQuizzes = useCallback(() => {
    setLoading(true);
    fetch("/api/teacher/quizzes")
      .then((r) => r.json())
      .then((res) => {
        if (!res.error) setQuizzes(res.quizzes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleFormChange = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleQuestionChange = useCallback(
    (index: number, field: keyof QuizQuestion, value: string) => {
      setForm((prev) => {
        const questions = [...prev.questions];
        if (field === "options") return prev;
        (questions[index] as any)[field] = value;
        return { ...prev, questions };
      });
    },
    []
  );

  const handleOptionChange = useCallback(
    (qIndex: number, oIndex: number, value: string) => {
      setForm((prev) => {
        const questions = [...prev.questions];
        questions[qIndex] = {
          ...questions[qIndex],
          options: questions[qIndex].options.map((opt, i) =>
            i === oIndex ? value : opt
          ),
        };
        return { ...prev, questions };
      });
    },
    []
  );

  const addQuestion = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setForm((prev) => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFeedback(null);
      try {
        const body = {
          title: form.title,
          topicId: form.topic,
          difficulty: form.difficulty,
          timeLimit: parseInt(form.timeLimit, 10) * 60,
          teacherId: 'teacher_001',
          questions: form.questions.map((q) => ({
            question: q.questionText,
            optionA: q.options[0] || '',
            optionB: q.options[1] || '',
            optionC: q.options[2] || '',
            optionD: q.options[3] || '',
            correctKey: q.correctAnswer,
            explanation: q.explanation,
          })),
        };
        const res = await fetch("/api/teacher/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.error) {
          setFeedback({ type: 'success', text: `Quiz "${form.title}" created successfully!` });
          setForm({
            title: "",
            topic: "",
            difficulty: "medium",
            timeLimit: "10",
            questions: [emptyQuestion()],
          });
          setShowForm(false);
          fetchQuizzes();
        } else {
          setFeedback({ type: 'error', text: data.error || 'Failed to create quiz' });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: 'Network error. Please try again.' });
      }
      setSubmitting(false);
    },
    [form, fetchQuizzes]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Manager</h1>
          <p className="text-muted-foreground">
            Create, view, and manage quizzes for your students.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          {showForm ? (
            <>Cancel</>
          ) : (
            <>
              <Plus className="size-4" />
              New Quiz
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="size-4 text-emerald-500" />
              Create New Quiz
            </CardTitle>
            <CardDescription>
              Fill in the details and add questions to build your quiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Quiz title..."
                    value={form.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Input
                    placeholder="e.g. Algebra, Biology..."
                    value={form.topic}
                    onChange={(e) => handleFormChange("topic", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => handleFormChange("difficulty", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Time Limit (minutes)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="10"
                    value={form.timeLimit}
                    onChange={(e) =>
                      handleFormChange("timeLimit", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Questions ({form.questions.length})
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="gap-1"
                  >
                    <Plus className="size-3.5" />
                    Add Question
                  </Button>
                </div>

                {form.questions.map((q, qIndex) => (
                  <Card key={qIndex} className="border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">
                          Question {qIndex + 1}
                        </span>
                        {form.questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 w-7 p-0"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      <Textarea
                        placeholder="Enter your question..."
                        value={q.questionText}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "questionText",
                            e.target.value
                          )
                        }
                        required
                        className="min-h-[60px]"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        {OPTION_LABELS.map((label, oIndex) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0">
                              {label}
                            </span>
                            <Input
                              placeholder={`Option ${label}`}
                              value={q.options[oIndex] || ""}
                              onChange={(e) =>
                                handleOptionChange(
                                  qIndex,
                                  oIndex,
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Correct Answer
                          </label>
                          <Select
                            value={q.correctAnswer}
                            onValueChange={(v) =>
                              handleQuestionChange(
                                qIndex,
                                "correctAnswer",
                                v
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPTION_LABELS.map((label) => (
                                <SelectItem key={label} value={label}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Explanation (shown after answering)
                        </label>
                        <Textarea
                          placeholder="Explain why this answer is correct..."
                          value={q.explanation}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "explanation",
                              e.target.value
                            )
                          }
                          className="min-h-[50px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="gap-1.5 w-full sm:w-auto"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Brain className="size-4" />
                )}
                {submitting ? "Creating..." : "Create Quiz"}
              </Button>

              {feedback && (
                <div
                  className={cn(
                    'rounded-lg px-4 py-2.5 text-sm',
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  )}
                >
                  {feedback.text}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No quizzes yet
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Click &quot;New Quiz&quot; to create your first quiz.
              </p>
            </CardContent>
          </Card>
        )}

        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">
                  {quiz.title}
                </CardTitle>
                {difficultyBadge(quiz.difficulty)}
              </div>
              <CardDescription className="line-clamp-1">
                {quiz.topic?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Brain className="size-3.5" />
                  {quiz.questions?.length ?? 0} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {quiz.timeLimit} min
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="size-3.5" />
                  {quiz._count?.attempts ?? 0} attempts
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
