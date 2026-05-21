import React from 'react';
import { Zap, BookOpen, TrendingUp } from 'lucide-react';
import { currentStudent, subjects } from '../db';

export const Hero: React.FC = () => {
  const overallProgress = Math.round((currentStudent.completedTopics / currentStudent.totalTopics) * 100);
  const avgScore = Math.round(subjects.reduce((s,sub) => s + sub.avgScore, 0) / subjects.length);

  return (
    <section className="section" style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span className="badge badge-teal"><Zap size={10} /> AI-Powered</span>
              <span className="badge badge-navy">Semester {currentStudent.semester}</span>
              <span className="badge badge-sky">🔥 {currentStudent.streakDays} day streak</span>
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.1 }}>
              Good morning,<br />
              <span style={{ color: 'var(--teal)' }}>{currentStudent.name}</span> 👋
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '520px', fontStyle: 'italic' }}>
              Your AI companion is monitoring your wellbeing and learning patterns to keep you balanced and performing your best.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '260px' }}>
            <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Overall Progress</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--teal)' }}>{overallProgress}%</span>
                <div style={{ flex: 1 }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg, var(--teal), #00e5b0)' }} />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'var(--font-heading)' }}>{currentStudent.completedTopics}/{currentStudent.totalTopics} topics</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                <BookOpen size={18} style={{ color: 'var(--violet)', marginBottom: '0.35rem' }} />
                <p style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--violet)' }}>{avgScore}%</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</p>
              </div>
              <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                <TrendingUp size={18} style={{ color: 'var(--amber)', marginBottom: '0.35rem' }} />
                <p style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--amber)' }}>{currentStudent.hoursThisWeek}h</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' }}>This Week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
