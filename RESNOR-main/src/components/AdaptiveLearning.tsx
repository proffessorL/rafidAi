import React, { useState } from 'react';
import { BrainCircuit, BookOpen, PlayCircle, RefreshCw, AlertTriangle, CheckCircle, ArrowLeft, Beaker, Atom, Database, Clock, XCircle } from 'lucide-react';

type Topic = {
  id: string;
  subject: string;
  icon: React.ReactNode;
  subtopic: string;
  avgScore: number;
  studyContent: {
    intro: string;
    points: string[];
    formula?: string;
  };
  question: string;
  options: string[];
  correctOptionIndex: number;
};

const WEAK_AREAS: Topic[] = [
  {
    id: 'physics',
    subject: 'Physics',
    icon: <Atom size={24} className="text-amber" />,
    subtopic: 'Vectors - Cross Product',
    avgScore: 45,
    studyContent: {
      intro: "The cross product of two vectors results in a new vector that is perpendicular to both original vectors.",
      points: [
        "Magnitude is given by: |a × b| = |a| |b| sin(θ)",
        "Direction is strictly determined by the Right-Hand Rule.",
        "It is anti-commutative: a × b = -(b × a)",
        "The cross product of two parallel vectors is zero."
      ],
      formula: "A × B = (AyBz - AzBy)i - (AxBz - AzBx)j + (AxBy - AyBx)k"
    },
    question: "What is the direction of the cross product of two vectors A and B?",
    options: ["Parallel to A", "Parallel to B", "Perpendicular to both A and B", "In the plane of A and B"],
    correctOptionIndex: 2
  },
  {
    id: 'chemistry',
    subject: 'Chemistry',
    icon: <Beaker size={24} className="text-rose" />,
    subtopic: 'Organic Chemistry - Nomenclature',
    avgScore: 50,
    studyContent: {
      intro: "IUPAC nomenclature is the systematic method of naming organic chemical compounds.",
      points: [
        "Find the longest continuous carbon chain (parent chain).",
        "Identify and name substituents attached to this chain.",
        "Number the chain starting from the end closest to a substituent or high-priority functional group.",
        "Priority order: Carboxylic Acid > Aldehyde > Ketone > Alcohol > Amine."
      ]
    },
    question: "Which of the following functional groups has the highest priority in IUPAC naming?",
    options: ["Alcohol (-OH)", "Ketone (-C=O)", "Carboxylic Acid (-COOH)", "Amine (-NH2)"],
    correctOptionIndex: 2
  },
  {
    id: 'dbms',
    subject: 'Database Systems',
    icon: <Database size={24} className="text-mint" />,
    subtopic: '3rd Normal Form (3NF)',
    avgScore: 42,
    studyContent: {
      intro: "A relation is in Third Normal Form (3NF) if it is in 2NF and has no transitive partial dependencies.",
      points: [
        "Condition 1: The relation must already be in 2NF.",
        "Condition 2: Every non-prime attribute is non-transitively dependent on the primary key.",
        "Rule of thumb: Every non-key attribute must provide a fact about the key, the whole key, and nothing but the key."
      ]
    },
    question: "Which of the following conditions must be met for a relation to be in 3NF?",
    options: ["It must be in 2NF", "No transitive dependencies exist", "Both A and B", "Every non-prime attribute is fully functionally dependent"],
    correctOptionIndex: 2
  }
];

export const AdaptiveLearning: React.FC = () => {
  // Global States
  const [globalState, setGlobalState] = useState<'idle' | 'analyzing' | 'dashboard'>('idle');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Remediation Hub States
  const [quizState, setQuizState] = useState<'idle' | 'generating' | 'ready' | 'evaluating' | 'failed' | 'completed'>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [examScore, setExamScore] = useState<number>(0);

  const selectedTopic = WEAK_AREAS.find(t => t.id === selectedTopicId);

  const runGlobalAnalysis = () => {
    setGlobalState('analyzing');
    setTimeout(() => {
      setGlobalState('dashboard');
    }, 3000);
  };

  const openTopic = (id: string) => {
    const topic = WEAK_AREAS.find(t => t.id === id);
    if (topic) {
      setSelectedTopicId(id);
      setQuizState('idle');
      setSelectedAnswer(null);
    }
  };

  const backToDashboard = () => {
    setSelectedTopicId(null);
  };

  const startQuizGeneration = () => {
    setQuizState('generating');
    setTimeout(() => {
      setQuizState('ready');
      setSelectedAnswer(null);
    }, 2000);
  };

  const submitQuiz = () => {
    if (selectedAnswer === null) return;
    
    setQuizState('evaluating');
    setTimeout(() => {
      // Simulate grading: if they picked the correct mock answer, we simulate a passing score of 90%
      // If they picked wrong, we simulate a failing score of 40%
      if (selectedTopic && selectedAnswer === selectedTopic.correctOptionIndex) {
        setExamScore(90);
        setQuizState('completed');
      } else {
        setExamScore(40);
        setQuizState('failed');
      }
    }, 2500);
  };

  return (
    <section className="section container">
      <div className="flex items-center gap-4" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
        <BrainCircuit size={32} className="text-mint" />
        <h2 style={{ textAlign: 'center', margin: 0, fontSize: '2.5rem' }}>AI Adaptive Learning</h2>
      </div>
      <p style={{ textAlign: 'center', marginBottom: '3rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        The AI analyzes your entire database of academic records to identify patterns in your mistakes and dynamically builds a personalized improvement plan.
      </p>

      {/* STAGE 1: GLOBAL ANALYSIS / DASHBOARD */}
      {!selectedTopic && (
        <div className="bg-glass" style={{ padding: '3rem', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          
          {globalState === 'idle' && (
            <>
              <Database size={64} style={{ opacity: 0.2, marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Scan Your Academic Records</h3>
              <p style={{ opacity: 0.7, marginBottom: '2rem', maxWidth: '400px' }}>
                Initiate a deep scan of all your quizzes, assignments, and test scores to pinpoint your exact weak areas across all subjects.
              </p>
              <button className="btn btn-primary" onClick={runGlobalAnalysis} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                <RefreshCw size={24} /> Start Deep Analysis
              </button>
            </>
          )}

          {globalState === 'analyzing' && (
            <>
              <BrainCircuit size={64} className="text-mint" style={{ animation: 'float 2s infinite linear, pulse-glow 2s infinite', marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }} className="text-mint">Analyzing Database...</h3>
              <div className="mono-text" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8 }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>&gt; Scanning Physics records...</span>
                <span style={{ animation: 'pulse 1.5s infinite 0.5s' }}>&gt; Cross-referencing Chemistry quizzes...</span>
                <span style={{ animation: 'pulse 1.5s infinite 1s' }}>&gt; Identifying repeated error patterns...</span>
              </div>
            </>
          )}

          {globalState === 'dashboard' && (
            <div style={{ width: '100%' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'left' }}>Detected Weak Areas</h3>
              <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                {WEAK_AREAS.map((topic) => (
                  <div 
                    key={topic.id} 
                    className="bg-glass" 
                    style={{ flex: '1 1 300px', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid rgba(255, 184, 77, 0.2)' }}
                    onClick={() => openTopic(topic.id)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          {topic.icon}
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{topic.subject}</span>
                      </div>
                      <span className="mono-text text-amber">{topic.avgScore}% Avg</span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Struggling with:</p>
                    <p style={{ margin: 0, color: 'var(--amber-warning)', fontWeight: 500 }}>{topic.subtopic}</p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--mint-accent)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Start Remediation <PlayCircle size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: REMEDIATION HUB FOR SPECIFIC TOPIC */}
      {selectedTopic && (
        <div className="animate-fade-in">
          <button className="btn btn-ghost" onClick={backToDashboard} style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          {/* Alert Banner */}
          <div className="bg-glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: `4px solid var(--amber-warning)`, display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertTriangle className="text-amber" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--amber-warning)' }}>
                Targeting: {selectedTopic.subject} - {selectedTopic.subtopic}
              </h3>
              <p style={{ margin: 0, opacity: 0.9 }}>
                You've consistently scored around <strong>{selectedTopic.avgScore}%</strong> in this area. Please study the material below and take the quiz. You must score at least 80% to be considered prepared.
              </p>
            </div>
          </div>

          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            
            {/* Left Column: Study Material */}
            <div style={{ flex: '1 1 400px' }} className="flex flex-col gap-6">
              <div className="bg-glass" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
                  <BookOpen className="text-mint" size={24} />
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Study Material</h3>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    {selectedTopic.studyContent.intro}
                  </p>
                  
                  <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedTopic.studyContent.points.map((point, idx) => (
                      <li key={idx} style={{ opacity: 0.9 }}>{point}</li>
                    ))}
                  </ul>

                  {selectedTopic.studyContent.formula && (
                    <div className="mono-text" style={{ padding: '1rem', background: 'rgba(0,229,160,0.1)', borderLeft: '4px solid var(--mint-accent)', borderRadius: '4px' }}>
                      <strong>Formula:</strong> <br />
                      {selectedTopic.studyContent.formula}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: AI Quiz Generator */}
            <div style={{ flex: '1 1 400px' }}>
              <div className="bg-glass" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                  <div className="flex items-center gap-3">
                    <PlayCircle className="text-mint" size={24} />
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Quiz Exam</h3>
                  </div>
                  {(quizState === 'ready' || quizState === 'evaluating') && (
                    <div className="flex items-center gap-2 mono-text" style={{ color: 'var(--amber-warning)', fontSize: '0.9rem' }}>
                      <Clock size={16} /> 10:00 Mins Left
                    </div>
                  )}
                </div>
                
                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                  The AI will generate 10 targeted questions to test your preparation. You need to score <strong>80% or higher</strong> to conquer this topic.
                </p>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  {quizState === 'idle' && (
                    <div style={{ textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-6" style={{ marginBottom: '2rem' }}>
                        <div className="flex flex-col items-center">
                          <span style={{ fontSize: '2rem', fontWeight: 'bold' }} className="mono-text">10</span>
                          <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Questions</span>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div className="flex flex-col items-center">
                          <span style={{ fontSize: '2rem', fontWeight: 'bold' }} className="mono-text">10</span>
                          <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Minutes</span>
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={startQuizGeneration} style={{ width: '100%' }}>
                        Start Quiz Exam
                      </button>
                    </div>
                  )}

                  {quizState === 'generating' && (
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw size={32} className="text-mint" style={{ animation: 'float 2s infinite linear' }} />
                      <p className="mono-text text-mint">Generating 10 custom questions...</p>
                    </div>
                  )}

                  {quizState === 'ready' && (
                    <div style={{ width: '100%' }}>
                      <span className="mono-text" style={{ display: 'block', marginBottom: '1rem', color: 'var(--mint-accent)', fontSize: '0.9rem' }}>Question 1 of 10</span>
                      <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{selectedTopic.question}</p>
                      
                      <div className="flex flex-col gap-3" style={{ marginBottom: '2rem' }}>
                        {selectedTopic.options.map((opt, i) => (
                          <label 
                            key={i} 
                            className="flex items-center gap-3" 
                            style={{ 
                              padding: '1rem', 
                              background: selectedAnswer === i ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.05)', 
                              border: selectedAnswer === i ? '1px solid var(--mint-accent)' : '1px solid transparent',
                              borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                            }}
                          >
                            <input 
                              type="radio" 
                              name="quiz_opt" 
                              checked={selectedAnswer === i}
                              onChange={() => setSelectedAnswer(i)}
                              style={{ accentColor: 'var(--mint-accent)', width: '18px', height: '18px' }} 
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', opacity: selectedAnswer === null ? 0.5 : 1, cursor: selectedAnswer === null ? 'not-allowed' : 'pointer' }} 
                        onClick={submitQuiz}
                        disabled={selectedAnswer === null}
                      >
                        Submit Answers
                      </button>
                    </div>
                  )}

                  {quizState === 'evaluating' && (
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw size={32} className="text-amber" style={{ animation: 'float 2s infinite linear' }} />
                      <p className="mono-text text-amber">Grading your exam...</p>
                    </div>
                  )}

                  {quizState === 'failed' && (
                    <div className="flex flex-col items-center gap-4" style={{ textAlign: 'center' }}>
                      <XCircle size={48} className="text-rose" />
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--rose-stress)', margin: 0 }}>Exam Failed</h4>
                      <p style={{ opacity: 0.8 }}>
                        You scored <strong>{examScore}%</strong>. You need at least <strong>80%</strong> to be considered prepared.
                      </p>
                      <p style={{ color: 'var(--amber-warning)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Please read the Study Material carefully and try again.
                      </p>
                      <button className="btn btn-ghost" style={{ width: '100%' }} onClick={startQuizGeneration}>
                        <RefreshCw size={18} /> Retake Quiz Exam
                      </button>
                    </div>
                  )}

                  {quizState === 'completed' && (
                    <div className="flex flex-col items-center gap-4" style={{ textAlign: 'center' }}>
                      <CheckCircle size={48} className="text-mint" />
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--mint-accent)', margin: 0 }}>Topic Prepared!</h4>
                      <p style={{ opacity: 0.8 }}>
                        You scored <strong>{examScore}%</strong>! You have successfully mastered {selectedTopic.subtopic}.
                      </p>
                      <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={backToDashboard}>
                        Return to Dashboard
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
