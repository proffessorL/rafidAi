import React from 'react';
import { TrendingUp, BookOpen, Zap, Target, Award, Clock } from 'lucide-react';
import { currentStudent, subjects, weeklyActivity, getMotivationMessage } from '../db';

export const ProgressBanner: React.FC = () => {
  const overallProgress = Math.round((currentStudent.completedTopics / currentStudent.totalTopics) * 100);
  const totalWeekMinutes = weeklyActivity.reduce((s, d) => s + d.studyMinutes, 0);
  const totalWeekHours = (totalWeekMinutes / 60).toFixed(1);
  const weekGoalPct = Math.min(100, Math.round((currentStudent.hoursThisWeek / currentStudent.weeklyGoalHours) * 100));
  const motivationMsg = getMotivationMessage(currentStudent);

  const maxMinutes = Math.max(...weeklyActivity.map(d => d.studyMinutes));

  return (
    <section style={{ padding: '0 0 3rem 0' }}>
      <div className="container">
        {/* Motivation Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--teal) 0%, #00a07a 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2.5rem',
          marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          boxShadow: '0 12px 40px rgba(0,200,150,0.25)'
        }}>
          <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-body)', fontStyle: 'italic', color: '#fff', margin: 0, lineHeight: 1.4 }}>
            {motivationMsg}
          </p>
          <Award size={36} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Topics Completed', value: `${currentStudent.completedTopics}/${currentStudent.totalTopics}`, icon: <BookOpen size={20} />, color: 'var(--teal)', pct: overallProgress },
            { label: 'Weekly Goal', value: `${currentStudent.hoursThisWeek}h / ${currentStudent.weeklyGoalHours}h`, icon: <Target size={20} />, color: 'var(--violet)', pct: weekGoalPct },
            { label: 'Study Hours (Week)', value: `${totalWeekHours}h`, icon: <Clock size={20} />, color: 'var(--sky)', pct: null },
            { label: 'Current Streak', value: `${currentStudent.streakDays} days`, icon: <Zap size={20} />, color: 'var(--amber)', pct: null },
            { label: 'Quizzes This Week', value: `${weeklyActivity.reduce((s,d)=>s+d.quizzesAttempted,0)}`, icon: <TrendingUp size={20} />, color: 'var(--rose)', pct: null },
          ].map((stat, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{stat.label}</p>
                <div style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</div>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
              {stat.pct !== null && (
                <div className="progress-track" style={{ marginTop: '0.75rem' }}>
                  <div className="progress-fill" style={{ width: `${stat.pct}%`, background: stat.color }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subject Progress */}
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--teal)' }} /> Subject Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {subjects.map(sub => {
              const pct = Math.round((sub.completedTopics / sub.totalTopics) * 100);
              return (
                <div key={sub.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem' }}>{sub.icon}</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>{sub.name}</span>
                      {sub.nextExam && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Exam {sub.nextExam}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub.completedTopics}/{sub.totalTopics} topics</span>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: sub.color }}>{sub.avgScore}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: sub.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="glass" style={{ padding: '2rem', marginTop: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>📅 This Week's Activity</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', height: '100px' }}>
            {weeklyActivity.map((day, i) => {
              const h = maxMinutes > 0 ? (day.studyMinutes / maxMinutes) * 100 : 0;
              const isToday = i === 2;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '100%', height: `${Math.max(h, 6)}px`, background: isToday ? 'var(--teal)' : 'rgba(0,200,150,0.2)', borderRadius: '6px 6px 0 0', transition: 'height 0.8s ease', position: 'relative' }}>
                    {isToday && <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)' }} />}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: isToday ? 'var(--teal)' : 'var(--text-muted)' }}>{day.shortDay}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
