import React, { useState, useEffect } from 'react';
import { Wind, PenTool, Target, Check, X, Heart, Smile } from 'lucide-react';

const JOURNAL_PROMPTS = [
  "What is one small thing you learned today?",
  "Why did you start this academic journey?",
  "What's a challenge you overcame recently?",
  "Write down one thing you are proud of.",
  "If stress was a shape, what would it look like? Now dissolve it.",
  "List 3 things that went well this week, however small.",
];

export const StressRelief: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'breathe' | 'journal' | 'affirmations' | null>(null);
  const [goal, setGoal] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breatheCount, setBreatheCount] = useState(4);
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [journalText, setJournalText] = useState('');
  const promptIdx = Math.floor(Math.random() * JOURNAL_PROMPTS.length);

  const AFFIRMATIONS = [
    "You are more capable than you realize. Progress over perfection.",
    "Every topic you struggle with today is a topic you'll master tomorrow.",
    "Your hard work now is building your future. Keep going.",
    "Stress is just evidence that you care. Channel it.",
    "You've overcome challenges before. You'll overcome this one too.",
    "Small consistent steps beat intense short bursts. Stay consistent.",
  ];

  useEffect(() => {
    if (activeModal !== 'breathe') return;
    let phase: 'in' | 'hold' | 'out' = 'in';
    let count = 4;
    setBreathePhase('in'); setBreatheCount(4);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        if (phase === 'in') { phase = 'hold'; count = 7; }
        else if (phase === 'hold') { phase = 'out'; count = 8; }
        else { phase = 'in'; count = 4; }
        setBreathePhase(phase);
      }
      setBreatheCount(count);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeModal]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) { setGoals(prev => [...prev, goal.trim()]); setGoal(''); }
  };

  const phaseLabel = breathePhase === 'in' ? 'Breathe In' : breathePhase === 'hold' ? 'Hold' : 'Breathe Out';
  const phaseColor = breathePhase === 'in' ? 'var(--teal)' : breathePhase === 'hold' ? 'var(--violet)' : 'var(--sky)';

  return (
    <section className="section" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Heart size={22} style={{ color: 'var(--rose)' }} />
          <h2 style={{ fontSize: '1.8rem' }}>Take a Moment</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '2rem', fontSize: '0.95rem' }}>Stress relief tools designed for students. Short, effective, evidence-backed.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {/* Breathing */}
          <div className="glass" onClick={() => setActiveModal('breathe')} style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s ease', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Wind size={28} style={{ color: 'var(--teal)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>4-7-8 Breathing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>A proven technique to reduce anxiety in under 2 minutes.</p>
            <button className="btn btn-outline" style={{ marginTop: '1.25rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>Start Exercise</button>
          </div>

          {/* Journal */}
          <div className="glass" onClick={() => setActiveModal('journal')} style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s ease', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--violet-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <PenTool size={28} style={{ color: 'var(--violet)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Reflective Journal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>A guided prompt to clear your mind and regain focus.</p>
            <button className="btn btn-outline" style={{ marginTop: '1.25rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderColor: 'var(--violet)', color: 'var(--violet)' }}>Open Journal</button>
          </div>

          {/* Affirmations */}
          <div className="glass" onClick={() => setActiveModal('affirmations')} style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s ease', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Smile size={28} style={{ color: 'var(--amber)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Daily Affirmations</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Student-specific affirmations to reframe your mindset.</p>
            <button className="btn btn-outline" style={{ marginTop: '1.25rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderColor: 'var(--amber)', color: 'var(--amber)' }}>View Affirmations</button>
          </div>

          {/* Micro Goals */}
          <div className="glass" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={22} style={{ color: 'var(--rose)' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', margin: 0 }}>Today's Micro-Goals</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Small wins build momentum</p>
              </div>
            </div>
            {goals.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', background: 'var(--teal-light)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <Check size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--teal-deep)', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>{g}</span>
              </div>
            ))}
            <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="input" placeholder="e.g. Solve 2 DP problems..." value={goal} onChange={e => setGoal(e.target.value)} style={{ flex: 1, fontSize: '0.88rem' }} />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 0.85rem', fontSize: '0.85rem' }}><Check size={16} /></button>
            </form>
          </div>
        </div>

        {/* Modals */}
        {activeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,53,0.45)', zIndex: 100, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div className="glass" style={{ padding: '3rem', position: 'relative', width: '90%', maxWidth: '520px', textAlign: 'center', background: 'white' }}>
              <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(15,31,53,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                <X size={18} />
              </button>

              {activeModal === 'breathe' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', margin: 0 }}>4-7-8 Breathing Technique</h3>
                  <div style={{
                    width: '160px', height: '160px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${phaseColor}20, ${phaseColor}08)`,
                    border: `3px solid ${phaseColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    animation: breathePhase === 'in' ? 'breatheCircle 4s ease-in-out infinite' : breathePhase === 'out' ? 'breatheCircle 8s ease-in-out infinite reverse' : 'none',
                    transition: 'border-color 0.5s ease, background 0.5s ease',
                  }}>
                    <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: phaseColor, lineHeight: 1 }}>{breatheCount}</span>
                    <span style={{ fontSize: '0.7rem', color: phaseColor, fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>{phaseLabel}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '320px', margin: 0 }}>
                    Inhale for 4 seconds → Hold for 7 → Exhale for 8. Repeat 3-4 cycles for maximum calm.
                  </p>
                </div>
              )}

              {activeModal === 'journal' && (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>✍️ Reflective Journal</h3>
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--violet-light)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--violet)', marginBottom: '1.25rem' }}>
                    <p style={{ fontStyle: 'italic', color: 'var(--violet)', margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>"{JOURNAL_PROMPTS[promptIdx]}"</p>
                  </div>
                  <textarea className="input" style={{ minHeight: '140px', resize: 'none', marginBottom: '1rem' }} placeholder="Write your thoughts freely... This is just for you." value={journalText} onChange={e => setJournalText(e.target.value)} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>Your thoughts are private and not stored anywhere.</p>
                </div>
              )}

              {activeModal === 'affirmations' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', margin: 0 }}>💫 Your Daily Affirmation</h3>
                  <div style={{ padding: '2rem', background: 'var(--amber-light)', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.2)', width: '100%' }}>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontSize: '1.15rem', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-body)' }}>
                      "{AFFIRMATIONS[affirmIdx]}"
                    </p>
                  </div>
                  <button className="btn btn-ghost" onClick={() => setAffirmIdx(i => (i + 1) % AFFIRMATIONS.length)} style={{ fontSize: '0.88rem' }}>
                    Next Affirmation →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
