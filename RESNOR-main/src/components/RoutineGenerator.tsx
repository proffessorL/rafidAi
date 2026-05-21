import React, { useState } from 'react';
import { Calendar, Sparkles, RefreshCw, Clock, Zap, Coffee, Moon, Dumbbell, BookOpen, RotateCcw, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { getAIRoutine, subjects } from '../db';
import type { DayRoutine, RoutineBlock } from '../db';

type Mode = 'focused' | 'balanced' | 'gentle';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  study: { icon: <BookOpen size={14} />, color: 'var(--violet)', bg: 'var(--violet-light)', label: 'Study' },
  review: { icon: <RotateCcw size={14} />, color: 'var(--sky)', bg: 'var(--sky-light)', label: 'Review' },
  break: { icon: <Coffee size={14} />, color: 'var(--amber)', bg: 'var(--amber-light)', label: 'Break' },
  exercise: { icon: <Dumbbell size={14} />, color: 'var(--teal)', bg: 'var(--teal-light)', label: 'Exercise' },
  sleep: { icon: <Moon size={14} />, color: 'var(--navy)', bg: 'rgba(15,31,53,0.07)', label: 'Sleep' },
  meal: { icon: <Coffee size={14} />, color: 'var(--amber)', bg: 'var(--amber-light)', label: 'Meal' },
};

const modeConfig: Record<Mode, { label: string; desc: string; icon: React.ReactNode; tip: string }> = {
  focused: {
    label: 'Focused', desc: 'Intense study sessions targeting weak areas',
    icon: <Zap size={16} />,
    tip: 'Best when exams are within 2 weeks. Prioritizes weak areas & high-impact revision.'
  },
  balanced: {
    label: 'Balanced', desc: 'Steady progress with adequate rest',
    icon: <Brain size={16} />,
    tip: 'Ideal for regular study weeks. Mix of deep work and lighter review sessions.'
  },
  gentle: {
    label: 'Gentle', desc: 'Light review with plenty of recovery time',
    icon: <RefreshCw size={16} />,
    tip: 'For high-stress days or post-exam recovery. Keeps momentum without burnout.'
  }
};

const BlockCard: React.FC<{ block: RoutineBlock; isExpanded: boolean; onToggle: () => void }> = ({ block, isExpanded, onToggle }) => {
  const cfg = typeConfig[block.type] || typeConfig.break;
  const isStudy = block.type === 'study' || block.type === 'review';
  const isUrgent = block.note?.startsWith('⚠') || block.note?.startsWith('🚨');

  return (
    <div
      onClick={isStudy || block.note ? onToggle : undefined}
      style={{
        padding: '0.85rem 1rem',
        background: isExpanded ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${isUrgent ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
        cursor: isStudy || block.note ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isExpanded ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ padding: '0.35rem', background: cfg.bg, borderRadius: '8px', color: cfg.color, flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.82rem', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{block.time} · {block.duration}</p>
        </div>
        {(isStudy || block.note) && (
          <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </div>
      {isExpanded && block.note && (
        <div style={{ marginTop: '0.65rem', padding: '0.6rem 0.75rem', background: isUrgent ? 'var(--amber-light)' : 'var(--teal-pale)', borderRadius: '8px', borderLeft: `3px solid ${isUrgent ? 'var(--amber)' : 'var(--teal)'}` }}>
          <p style={{ fontSize: '0.78rem', color: isUrgent ? 'var(--amber)' : 'var(--teal-deep)', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 500 }}>{block.note}</p>
        </div>
      )}
    </div>
  );
};

const DayCard: React.FC<{ day: DayRoutine; isToday: boolean; isSelected: boolean; onClick: () => void }> = ({ day, isToday, isSelected, onClick }) => {
  const energyColor = day.energyLevel === 'high' ? 'var(--teal)' : day.energyLevel === 'medium' ? 'var(--amber)' : 'var(--rose)';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '1rem',
        background: isSelected ? 'rgba(0,200,150,0.08)' : 'rgba(255,255,255,0.6)',
        border: `1.5px solid ${isSelected ? 'var(--teal)' : isToday ? 'rgba(0,200,150,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'center',
      }}
    >
      {isToday && <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>TODAY</div>}
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--teal)' : 'var(--text-primary)', margin: 0 }}>{day.shortDay}</p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.2rem 0', fontFamily: 'var(--font-mono)' }}>{day.date}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: energyColor }} />
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: energyColor }}>{day.totalStudyHours}h</span>
      </div>
    </div>
  );
};

export const RoutineGenerator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('focused');
  const [isGenerating, setIsGenerating] = useState(false);
  const [routine, setRoutine] = useState<DayRoutine[]>(() => getAIRoutine('focused'));
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const todayIdx = 0; // Monday in our mock data

  const handleGenerate = (newMode: Mode) => {
    setMode(newMode);
    setIsGenerating(true);
    setExpandedBlocks(new Set());
    setTimeout(() => {
      setRoutine(getAIRoutine(newMode));
      setIsGenerating(false);
    }, 1400);
  };

  const toggleBlock = (key: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectedDay = routine[selectedDayIdx];
  return (
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Calendar size={22} style={{ color: 'var(--teal)' }} />
              <h2 style={{ fontSize: '1.8rem' }}>Your AI Study Routine</h2>
              <span className="badge badge-teal"><Sparkles size={10} /> AI Generated</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.95rem' }}>
              Built from your syllabus gaps, exam dates, and stress levels. Click any block to see why it's scheduled.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="glass" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Intensity:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(Object.entries(modeConfig) as [Mode, typeof modeConfig[Mode]][]).map(([m, cfg]) => (
              <button
                key={m}
                onClick={() => handleGenerate(m)}
                disabled={isGenerating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  border: mode === m ? '1.5px solid var(--teal)' : '1.5px solid var(--border)',
                  background: mode === m ? 'var(--teal-light)' : 'transparent',
                  color: mode === m ? 'var(--teal-deep)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', background: 'var(--teal-pale)', borderRadius: '8px', border: '1px solid var(--border-teal)', maxWidth: '350px' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--teal-deep)', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 500 }}>💡 {modeConfig[mode].tip}</p>
          </div>
        </div>

        {isGenerating ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={32} style={{ color: 'var(--teal)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--teal)', margin: 0 }}>AI is analyzing your syllabus & building your routine...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Day Selector + Detail */}
            <div>
              {/* Day Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {routine.map((day, i) => (
                  <DayCard key={i} day={day} isToday={i === todayIdx} isSelected={i === selectedDayIdx} onClick={() => setSelectedDayIdx(i)} />
                ))}
              </div>

              {/* Selected Day Detail */}
              {selectedDay && (
                <div className="glass" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', margin: 0 }}>{selectedDay.day}</h3>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedDay.date}</span>
                        {selectedDayIdx === todayIdx && <span className="badge badge-teal">Today</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {selectedDay.totalStudyHours}h study planned
                        </span>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-heading)', color: selectedDay.energyLevel === 'high' ? 'var(--teal)' : selectedDay.energyLevel === 'medium' ? 'var(--amber)' : 'var(--rose)' }}>
                          ● {selectedDay.energyLevel.charAt(0).toUpperCase() + selectedDay.energyLevel.slice(1)} energy day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Motivation tip */}
                  <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, var(--teal-light), rgba(14,165,233,0.08))', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--teal)', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: 500, color: 'var(--teal-deep)', margin: 0 }}>🎯 {selectedDay.motivationTip}</p>
                  </div>

                  {/* Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedDay.blocks.map((block, i) => (
                      <BlockCard
                        key={i}
                        block={block}
                        isExpanded={expandedBlocks.has(`${selectedDayIdx}-${i}`)}
                        onToggle={() => toggleBlock(`${selectedDayIdx}-${i}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Weekly Summary & Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={15} style={{ color: 'var(--teal)' }} /> Weekly Summary
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {routine.map((day, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', opacity: i === selectedDayIdx ? 1 : 0.7, cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => setSelectedDayIdx(i)}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.78rem', color: i === selectedDayIdx ? 'var(--teal)' : 'var(--text-secondary)', width: '32px' }}>{day.shortDay}</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(15,31,53,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (day.totalStudyHours / 7) * 100)}%`, height: '100%', background: i === selectedDayIdx ? 'var(--teal)' : 'rgba(0,200,150,0.3)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>{day.totalStudyHours}h</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                    Total planned: <strong style={{ color: 'var(--text-primary)' }}>{routine.reduce((s, d) => s + d.totalStudyHours, 0).toFixed(1)}h</strong>
                  </p>
                </div>
              </div>

              <div className="glass" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Brain size={15} style={{ color: 'var(--violet)' }} /> AI Recommendations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { text: 'Physics exam Monday — schedule 2+ revision sessions this week', color: 'var(--rose)', urgent: true },
                    { text: 'Dynamic Programming has 38% avg — dedicate weekend deep work sessions', color: 'var(--amber)', urgent: true },
                    { text: 'Sleep before 10:30 PM to consolidate memory from today\'s study', color: 'var(--teal)', urgent: false },
                    { text: 'Take a 20-min walk daily to reduce cortisol and boost focus', color: 'var(--sky)', urgent: false },
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tip.color, marginTop: '6px', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.8rem', color: tip.urgent ? 'var(--text-primary)' : 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: tip.urgent ? 600 : 400 }}>{tip.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', marginBottom: '1rem' }}>📚 Pending Topics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {subjects.flatMap(s => s.pendingTopics.slice(0,1).map(t => ({
                    subject: s.name, topic: t, color: s.color
                  }))).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                      <p style={{ fontSize: '0.78rem', margin: 0, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                        <span style={{ color: item.color, fontWeight: 600 }}>{item.subject}:</span> {item.topic}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
