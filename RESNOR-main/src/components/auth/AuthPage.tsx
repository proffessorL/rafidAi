'use client'

import { useState, useSyncExternalStore, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore, type AuthUser } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/theme-provider'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  BookOpen,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  BarChart3,
  Brain,
  Trophy,
  Sun,
  Moon,
} from 'lucide-react'

// --- Password Strength Meter ---
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = getStrength(password)
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
  ]

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < strength ? colors[Math.min(strength - 1, 4)] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-[11px] font-medium',
        strength <= 1 ? 'text-rose-500' : strength <= 2 ? 'text-amber-500' : 'text-emerald-500',
      )}>
        {labels[Math.min(strength - 1, 4)] || 'Too short'}
      </p>
    </div>
  )
}

// --- Feature Card for Left Panel ---
function FeatureHighlight({ icon: Icon, title, desc, delay }: {
  icon: React.ElementType
  title: string
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex items-start gap-3"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <p className="text-xs text-white/60 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </motion.div>
  )
}

// --- Role Selection Card ---
function RoleCard({
  role,
  selected,
  onClick,
}: {
  role: 'student' | 'teacher'
  selected: boolean
  onClick: () => void
}) {
  const isStudent = role === 'student'
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative flex-1 p-4 rounded-xl border-2 transition-all duration-300 text-left',
        selected
          ? isStudent
            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
            : 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
          : 'border-border hover:border-muted-foreground/30 bg-card',
      )}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: isStudent ? '#10b981' : '#f59e0b' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
        isStudent
          ? selected ? 'bg-emerald-500/20' : 'bg-muted'
          : selected ? 'bg-amber-500/20' : 'bg-muted',
      )}>
        {isStudent ? (
          <BookOpen className={cn('w-5 h-5', selected ? 'text-emerald-500' : 'text-muted-foreground')} />
        ) : (
          <Users className={cn('w-5 h-5', selected ? 'text-amber-500' : 'text-muted-foreground')} />
        )}
      </div>
      <p className="text-sm font-semibold">{isStudent ? 'Student' : 'Teacher'}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
        {isStudent
          ? 'Access courses, quizzes, AI tutor, and track your progress'
          : 'Manage classes, monitor students, and create interventions'}
      </p>
    </motion.button>
  )
}

// --- Main Auth Page ---
export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [studentId, setStudentId] = useState('')
  const [institution, setInstitution] = useState('')

  const { setAuth, hydrate } = useAuthStore()
  const { setCurrentUser, setActivePage } = useAppStore()
  const { theme, setTheme } = useTheme()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleLogin = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      const authUser: AuthUser = data.user
      setAuth(authUser, data.token)
      setCurrentUser({
        id: authUser.id,
        name: authUser.name || 'User',
        email: authUser.email,
        role: authUser.role as 'student' | 'teacher',
        avatar: authUser.avatar,
      })
      // Redirect teachers to their dashboard
      if (authUser.role === 'teacher') {
        setActivePage('teacher')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, password, setAuth, setCurrentUser, setActivePage])

  const handleRegister = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!termsAccepted) {
      setError('Please accept the terms and conditions')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          studentId: role === 'student' ? studentId : undefined,
          institution,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }
      const authUser: AuthUser = data.user
      setAuth(authUser, data.token)
      setCurrentUser({
        id: authUser.id,
        name: authUser.name || 'User',
        email: authUser.email,
        role: authUser.role as 'student' | 'teacher',
        avatar: authUser.avatar,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [name, email, password, confirmPassword, role, studentId, institution, termsAccepted, setAuth, setCurrentUser])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 flex-col items-center justify-between p-8 xl:p-12">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -25, 0],
              y: [0, 30, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
            className="absolute bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 15, 0],
              y: [0, 15, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/3 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl"
          />
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">RESNOR</h1>
            <p className="text-xs text-white/60 font-medium">AI-Powered EdTech Platform</p>
          </div>
        </div>

        {/* Center - Feature Highlights */}
        <div className="relative z-10 space-y-6 max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight">
              Unlock Your{' '}
              <span className="text-emerald-200">Full Potential</span>
            </h2>
            <p className="text-sm text-white/60 mt-3 leading-relaxed">
              AI-driven personalized learning paths, real-time analytics, and collaborative tools designed for modern education.
            </p>
          </motion.div>

          <div className="space-y-4">
            <FeatureHighlight
              icon={Brain}
              title="AI-Powered Tutoring"
              desc="Get instant help with an intelligent tutor that adapts to your learning style"
              delay={0.3}
            />
            <FeatureHighlight
              icon={BarChart3}
              title="Growth Analytics"
              desc="Track your progress with predictive CGPA and engagement insights"
              delay={0.5}
            />
            <FeatureHighlight
              icon={Trophy}
              title="Gamified Learning"
              desc="Earn badges, maintain streaks, and compete on leaderboards"
              delay={0.7}
            />
          </div>
        </div>

        {/* Bottom - Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="relative z-10 flex items-center gap-8"
        >
          {[
            { value: '10K+', label: 'Students' },
            { value: '500+', label: 'Courses' },
            { value: '95%', label: 'Satisfaction' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-8 right-8 z-10 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12 py-8 relative overflow-y-auto">
        {/* Mobile branding */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              RESNOR
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">AI-Powered EdTech</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-600" />}
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mode Toggle Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'login'
                ? 'Sign in to continue your learning journey'
                : 'Join thousands of students and teachers on RESNOR'}
            </p>
          </div>

          {/* Login/Register Toggle Tabs */}
          <div className="relative flex bg-muted/60 rounded-xl p-1 mb-6">
            <motion.div
              className="absolute inset-y-1 rounded-lg bg-background shadow-sm"
              animate={{
                left: mode === 'login' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={cn(
                'relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                mode === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={cn(
                'relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                mode === 'register' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {/* Role Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2.5 block">I am a...</Label>
                  <div className="flex gap-3">
                    <RoleCard role="student" selected={role === 'student'} onClick={() => setRole('student')} />
                    <RoleCard role="teacher" selected={role === 'teacher'} onClick={() => setRole('teacher')} />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full h-11 text-sm font-semibold shadow-lg shadow-emerald-500/20',
                    'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
                    'text-white transition-all duration-200',
                    'disabled:opacity-70 disabled:cursor-not-allowed',
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                {/* Demo Credentials */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-semibold text-foreground">Demo Accounts</p>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('rafiq@diu.edu.bd')
                        setPassword('demo123')
                        setRole('student')
                      }}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg bg-card hover:bg-accent transition-colors text-xs group"
                    >
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">Student:</span> rafiq@diu.edu.bd
                      </span>
                      <span className="text-[10px] text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to fill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('dr.khan@diu.edu.bd')
                        setPassword('demo123')
                        setRole('teacher')
                      }}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg bg-card hover:bg-accent transition-colors text-xs group"
                    >
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">Teacher:</span> dr.khan@diu.edu.bd
                      </span>
                      <span className="text-[10px] text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to fill</span>
                    </button>
                  </div>
                </div>

                {/* Switch to Register */}
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError('') }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Create one
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {/* Role Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2.5 block">I am joining as a...</Label>
                  <div className="flex gap-3">
                    <RoleCard role="student" selected={role === 'student'} onClick={() => setRole('student')} />
                    <RoleCard role="teacher" selected={role === 'teacher'} onClick={() => setRole('teacher')} />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11"
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        'pl-10 pr-10 h-11',
                        confirmPassword && confirmPassword !== password && 'border-rose-500 focus-visible:ring-rose-500',
                        confirmPassword && confirmPassword === password && 'border-emerald-500 focus-visible:ring-emerald-500',
                      )}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] text-emerald-500 font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </motion.p>
                  )}
                </div>

                {/* Conditional Fields */}
                <AnimatePresence mode="wait">
                  {role === 'student' && (
                    <motion.div
                      key="student-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reg-student-id" className="text-sm font-medium">Student ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-student-id"
                            type="text"
                            placeholder="e.g. CSE-331"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {role === 'teacher' && (
                    <motion.div
                      key="teacher-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reg-institution" className="text-sm font-medium">Department / Institution <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reg-institution"
                            type="text"
                            placeholder="e.g. Department of CSE"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed">
                    I agree to the{' '}
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                      Privacy Policy
                    </button>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className={cn(
                    'w-full h-11 text-sm font-semibold shadow-lg shadow-emerald-500/20',
                    'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
                    'text-white transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                {/* Switch to Login */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError('') }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-xs text-muted-foreground">
              &copy; 2024 RESNOR. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
