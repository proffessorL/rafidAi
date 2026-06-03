"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, BookOpen, FolderOpen, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  title: string;
  contentType: string;
  contentUrl: string;
  estimatedTime: string;
}

interface Topic {
  name: string;
  materials: Material[];
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  topics: { name: string; materials: Material[] }[];
  _count: { enrollments: number };
}

const emptyMaterial = (): Material => ({
  title: "",
  contentType: "document",
  contentUrl: "",
  estimatedTime: "",
});

const emptyTopic = (): Topic => ({
  name: "",
  materials: [emptyMaterial()],
});

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<Topic[]>([emptyTopic()]);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const addTopic = useCallback(() => {
    setTopics((prev) => [...prev, emptyTopic()]);
  }, []);

  const removeTopic = useCallback((index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTopic = useCallback(
    (index: number, field: keyof Topic, value: string) => {
      setTopics((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const addMaterial = useCallback((topicIndex: number) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === topicIndex ? { ...t, materials: [...t.materials, emptyMaterial()] } : t
      )
    );
  }, []);

  const removeMaterial = useCallback((topicIndex: number, materialIndex: number) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === topicIndex
          ? { ...t, materials: t.materials.filter((_, mi) => mi !== materialIndex) }
          : t
      )
    );
  }, []);

  const updateMaterial = useCallback(
    (topicIndex: number, materialIndex: number, field: keyof Material, value: string) => {
      setTopics((prev) =>
        prev.map((t, i) =>
          i === topicIndex
            ? {
                ...t,
                materials: t.materials.map((m, mi) =>
                  mi === materialIndex ? { ...m, [field]: value } : m
                ),
              }
            : t
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const payload = {
          name,
          code,
          description,
          teacherId: "teacher_001",
          topics: topics.map((t) => ({
            name: t.name,
            materials: t.materials.map((m) => ({
              title: m.title,
              contentType: m.contentType,
              contentUrl: m.contentUrl,
              estimatedTime: Number(m.estimatedTime),
            })),
          })),
        };
        const res = await fetch("/api/teacher/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create course");
        setName("");
        setCode("");
        setDescription("");
        setTopics([emptyTopic()]);
        await fetchCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create course");
      } finally {
        setSubmitting(false);
      }
    },
    [name, code, description, topics, fetchCourses]
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Manager</h1>
        <p className="text-muted-foreground">
          Create and manage your courses, topics, and learning materials.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Create Course Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Create New Course
          </CardTitle>
          <CardDescription>
            Fill in the course details and add topics with materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Course Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g. Introduction to Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Course Code
                </label>
                <Input
                  id="code"
                  placeholder="e.g. CS101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of the course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* ── Topics Builder ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Topics &amp; Materials</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTopic}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Add Topic
                </Button>
              </div>

              {topics.map((topic, ti) => (
                <Card key={ti} className="border-dashed">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Topic {ti + 1}</span>
                    </div>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(ti)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Topic Name</label>
                      <Input
                        placeholder="e.g. Variables & Data Types"
                        value={topic.name}
                        onChange={(e) => updateTopic(ti, "name", e.target.value)}
                        required
                      />
                    </div>

                    {/* Materials */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Materials</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addMaterial(ti)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Plus className="size-3" />
                          Add Material
                        </Button>
                      </div>

                      {topic.materials.map((material, mi) => (
                        <div
                          key={mi}
                          className="rounded-lg border bg-muted/30 p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="size-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                Material {mi + 1}
                              </span>
                            </div>
                            {topic.materials.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(ti, mi)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Title</label>
                              <Input
                                placeholder="e.g. Variables Explained"
                                value={material.title}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "title", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Content Type</label>
                              <Select
                                value={material.contentType}
                                onValueChange={(v) =>
                                  updateMaterial(ti, mi, "contentType", v)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="document">Document</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="slide">Slide</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">Content URL</label>
                              <Input
                                placeholder="https://..."
                                value={material.contentUrl}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "contentUrl", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-muted-foreground">
                                Est. Time (min)
                              </label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={material.estimatedTime}
                                onChange={(e) =>
                                  updateMaterial(ti, mi, "estimatedTime", e.target.value)
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {submitting ? "Creating..." : "Create Course"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Existing Courses ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Existing Courses
          </CardTitle>
          <CardDescription>
            {courses.length} course{courses.length !== 1 && "s"} total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No courses yet. Create one above.
            </p>
          )}
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{course.name}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                    {course.code}
                  </span>
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{course.topics?.length ?? 0} topics</span>
                  <span>{course._count?.enrollments ?? 0} enrolled</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
