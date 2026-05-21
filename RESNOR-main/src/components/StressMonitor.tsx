import React from 'react';
import { Clock, Book, Brain, TrendingDown, Zap } from 'lucide-react';
import { currentStudent } from '../db';

export const StressMonitor: React.FC = () => {
  const score = currentStudent.stressScore;
  const level = score >= 75 ? 'High' : score >= 50 ? 'Moderate' : 'Low';
  const color = score >= 75 ? 'var(--rose)' : score >= 50 ? 'var(--amber)' : 'var(--teal)';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="section" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
          <Brain size={22} style={{ color: 'var(--teal)' }} />
          <h2 style={{ fontSize: '1.8rem', textAlign: 'center' }}>How You're Doing Right Now</h2>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem', fontStyle: 'italic' }}>Monitored in real-time from your study patterns, quiz activity & engagement.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          {/* Gauge */}
          <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(15,31,53,0.08)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-in-out', strokeLinecap: 'round' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>/100</span>
              </div>
            </div>
            <h3 style={{ color, fontSize: '1.1rem', marginBottom: '0.4rem' }}>{level} Stress Detected</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {score >= 75 ? 'Consider taking a break today.' : score >= 50 ? 'Watch your pace this week.' : "You're in great shape!"}
            </p>
          </div>

          {/* Indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: <TrendingDown size={20} />, color: 'var(--rose)', bg: 'var(--rose-light)', title: 'Activity Drop Detected', desc: 'Study activity dropped 38% compared to last week. Consistent breaks are good, but re-engage gently.' },
              { icon: <Clock size={20} />, color: 'var(--amber)', bg: 'var(--amber-light)', title: 'Last Quiz: 5 Days Ago', desc: 'Frequent short quizzes help retention. Try a 5-minute quiz on any topic today.' },
              { icon: <Book size={20} />, color: 'var(--amber)', bg: 'var(--amber-light)', title: '3 Topics Untouched (2 weeks)', desc: 'Algorithms: DP, OS: Memory Paging, and Math: Fourier Series haven\'t been reviewed.' },
              { icon: <Zap size={20} />, color: 'var(--teal)', bg: 'var(--teal-light)', title: '4-Day Streak Active 🔥', desc: 'You\'ve studied every day for 4 consecutive days. Keep it going — consistency beats intensity!' },
            ].map((item, i) => (
              <div key={i} className="glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ padding: '0.6rem', background: item.bg, borderRadius: '10px', flexShrink: 0, color: item.color }}>{item.icon}</div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
