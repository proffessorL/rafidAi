import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, User, Sparkles, Brain, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { currentStudent, subjects } from '../db';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
  routineUpdate?: boolean;
}

const CONTEXT_SUMMARY = `Student: ${currentStudent.name}, ${currentStudent.course} Sem ${currentStudent.semester}.
Stress: ${currentStudent.stressScore}/100 (Moderate). Streak: ${currentStudent.streakDays} days.
Progress: ${currentStudent.completedTopics}/${currentStudent.totalTopics} topics (${Math.round((currentStudent.completedTopics/currentStudent.totalTopics)*100)}%).
Subjects: ${subjects.map(s => `${s.name} (${s.avgScore}% avg, ${s.pendingTopics.length} pending topics)`).join(', ')}.
Weak areas: Algorithms-DP (38%), OS-Memory (48%), Physics-CrossProduct (45%), Math-Fourier (44%), DBMS-3NF (42%).
Next exam: Physics on Jan 28 (${Math.ceil((new Date('2024-01-28').getTime() - new Date().getTime())/(1000*60*60*24))} days away).
Weekly hours: ${currentStudent.hoursThisWeek}h of ${currentStudent.weeklyGoalHours}h goal.`;

const buildSystemPrompt = () => `You are RESNOR, an empathetic AI academic well-being companion for a university student. You have access to their real data:

${CONTEXT_SUMMARY}

Your personality:
- Warm, encouraging, and never preachy
- Give specific, actionable advice tied to THEIR data (mention subject names, scores, topics)
- When stress/overwhelm is mentioned: acknowledge, then offer a concrete small step
- When asking about routines/schedule: suggest specific times and subjects from their data
- When they mention a specific subject: reference their actual score and pending topics
- Identify topics they should study vs. can skim (low score = must study, high score = quick review is enough)
- Keep responses concise (2-4 sentences), conversational
- Occasionally suggest the breathing exercise or micro-goal if stress seems high
- End responses with a brief follow-up question OR a specific suggestion

Rules:
- NEVER make up data not in the context
- Always tie advice back to their specific subjects and scores
- If asked "what topics should I study", prioritize by: (1) upcoming exam + weak = critical, (2) weak only = important, (3) pending + strong = review only
- Format study priorities like: "Critical: X (Y% avg, exam soon) | Important: A (B% avg) | Light review: C (strong area)"`;

export const ChatCheckIn: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hey ${currentStudent.name}! 👋 I've been looking at your week — you're on a ${currentStudent.streakDays}-day streak, which is great! Your stress is sitting at ${currentStudent.stressScore}/100 (moderate). Physics exam is in 8 days and Algorithms DP is your biggest gap at 38% avg. How are you feeling today?`,
      timestamp: 'Now',
      suggestions: ['I\'m feeling overwhelmed', 'What should I study first?', 'Help me build a routine', 'I need a break strategy'],
    }
  ]);

  const [conversationHistory, setConversationHistory] = useState<{role: 'user'|'assistant', content: string}[]>([]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isChatOpen, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...conversationHistory, { role: 'user' as const, content: text }];
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setConversationHistory(newHistory);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: newHistory,
        })
      });
      const data = await response.json();
      const aiText = data.content?.[0]?.text || "I'm here for you! Could you tell me more about what's on your mind?";

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: getSuggestions(text),
      };
      setMessages(prev => [...prev, aiMsg]);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiText }]);
    } catch {
      const fallback = getFallback(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    }
    setIsTyping(false);
  };

  const getSuggestions = (input: string): string[] | undefined => {
    const lower = input.toLowerCase();
    if (lower.includes('routine') || lower.includes('schedule')) return ['Show me today\'s plan', 'What are my priority topics?', 'I need more breaks'];
    if (lower.includes('stress') || lower.includes('overwhelm')) return ['Start with a 2-min breathing exercise', 'Show me my easiest topic today', 'Set a tiny micro-goal'];
    if (lower.includes('study') || lower.includes('topic')) return ['Which subject first?', 'How many hours do I need?', 'What can I skip?'];
    return undefined;
  };

  const getFallback = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('tired'))
      return `Totally understandable! With Physics in 8 days and DP at 38%, the pressure is real. Try this: spend just 25 minutes today on Cross Product practice problems — small wins build momentum. Want me to break down the rest of the week into manageable chunks?`;
    if (lower.includes('routine') || lower.includes('schedule') || lower.includes('plan'))
      return `Based on your data, I'd start Monday-Tuesday with Algorithms DP (critical — 38%), Wednesday-Thursday with Physics revision (exam Jan 28), and Friday for Math Fourier (44% avg). I've updated the Routine section with a full detailed plan. Does this intensity feel right?`;
    if (lower.includes('what') && (lower.includes('study') || lower.includes('topic') || lower.includes('first')))
      return `Priority breakdown for you: **Critical** — Physics Cross Product (45%, exam Jan 28) & Algo DP (38%). **Important** — Math Fourier (44%) & OS Memory Paging (48%). **Light review** — DBMS (78%, strong area). Tackle critical ones in your peak-energy morning hours!`;
    return `I hear you! Your ${currentStudent.streakDays}-day streak shows real commitment. With ${currentStudent.completedTopics}/${currentStudent.totalTopics} topics done, you're making progress. What's the one thing on your mind right now — I can give you a specific action step.`;
  };

  const handleSend = (e: React.FormEvent) => { e.preventDefault(); sendMessage(inputMessage); };

  return (
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Brain size={22} style={{ color: 'var(--teal)' }} />
          <h2 style={{ fontSize: '1.8rem' }}>Your AI Academic Companion</h2>
          <span className="badge badge-teal"><Sparkles size={10} /> Powered by Claude AI</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Knows your subjects, scores, and stress. Ask anything about your studies, routine, or wellbeing.
        </p>

        {/* Preview */}
        <div className="glass-teal" style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>🌱</div>
            <div style={{ background: 'rgba(0,200,150,0.08)', padding: '1rem 1.25rem', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-teal)', flex: 1 }}>
              <p style={{ color: 'var(--teal-deep)', margin: 0, fontStyle: 'italic' }}>
                "{messages[0].text}"
              </p>
            </div>
          </div>

          {/* Quick feature highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <BookOpen size={14} />, text: 'Topic priorities', color: 'var(--violet)' },
              { icon: <Calendar size={14} />, text: 'Routine advice', color: 'var(--teal)' },
              { icon: <TrendingUp size={14} />, text: 'Progress insights', color: 'var(--sky)' },
              { icon: <Brain size={14} />, text: 'Stress support', color: 'var(--rose)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: f.color }}>{f.icon}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setIsChatOpen(true)} style={{ gap: '0.6rem' }}>
              <MessageCircle size={18} /> Open Companion Chat
            </button>
          </div>
        </div>

        {/* Chat Modal */}
        {isChatOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,53,0.5)', zIndex: 100, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ width: '100%', maxWidth: '820px', height: '85vh', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
              {/* Header */}
              <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--teal) 0%, #00a07a 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🌱</div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>RESNOR AI</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontFamily: 'var(--font-heading)' }}>Knows your full academic profile • Always here for you</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-base)' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                      {msg.sender === 'ai' ? (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🌱</div>
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(15,31,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={16} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      )}
                      <div style={{ padding: '0.85rem 1.1rem', borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0', background: msg.sender === 'user' ? 'var(--navy)' : '#fff', color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)', border: msg.sender === 'ai' ? '1px solid var(--border)' : 'none', boxShadow: 'var(--shadow-sm)' }}>
                        <p style={{ margin: 0, lineHeight: 1.55, fontSize: '0.9rem' }}>{msg.text}</p>
                        <span style={{ fontSize: '0.68rem', opacity: 0.5, marginTop: '0.35rem', display: 'block', fontFamily: 'var(--font-mono)' }}>{msg.timestamp}</span>
                      </div>
                    </div>
                    {msg.suggestions && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '2.5rem' }}>
                        {msg.suggestions.map((s, i) => (
                          <button key={i} onClick={() => sendMessage(s)} style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'white', border: '1px solid var(--border-teal)', color: 'var(--teal-deep)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', alignSelf: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🌱</div>
                    <div style={{ padding: '0.85rem 1.1rem', background: '#fff', borderRadius: '16px 16px 16px 0', border: '1px solid var(--border)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal)', animation: `bounce-dot 1.4s ${i * 0.2}s infinite ease-in-out` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#fff', borderTop: '1px solid var(--border)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input type="text" className="input" placeholder="Ask about topics to study, your routine, or how you're feeling..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem', borderRadius: '10px' }} disabled={!inputMessage.trim() || isTyping}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
