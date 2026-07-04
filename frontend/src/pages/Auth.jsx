import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { quizQuestionsApi } from '../services/api'
import { Eye, EyeOff } from 'lucide-react'
import { Spinner } from '../components/common/UI'
import toast from 'react-hot-toast'

const DEFAULT_QUESTIONS = [
  "Government should prioritize equality of outcomes over individual liberty.",
  "Free markets generally produce better outcomes than government regulation.",
  "Immigration benefits the country more than it harms it.",
  "Climate change requires immediate and significant government intervention.",
  "Individual rights should take precedence over collective welfare.",
  "Traditional institutions and values are important for social stability.",
]

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-navy-900 rounded-lg items-center justify-center mb-4">
            <span className="text-white font-serif font-bold text-xl">P</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Sign In</h1>
          <p className="text-navy-500 text-sm mt-1">Continue to The Public Post</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2">
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-navy-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-verified-600 font-semibold hover:underline">Join The Public Post</Link>
        </p>
      </div>
    </div>
  )
}

export function Register() {
  const { completeRegistration } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS)
  const [form, setForm] = useState({
    name: '', email: '', password: '', house: '',
    quizAnswers: [3, 3, 3, 3, 3, 3],
  })

  useEffect(() => {
    quizQuestionsApi.getPublic()
      .then(res => {
        const qs = res.data
        if (Array.isArray(qs) && qs.length === 6) {
          setQuestions(qs.map(q => q.text))
        }
      })
      .catch(() => {}) // fallback to defaults
      .finally(() => setQuestionsLoading(false))
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.house) { toast.error('Please select a house'); return }
    setLoading(true)
    try {
      await completeRegistration({
        name: form.name, email: form.email, password: form.password,
        house: form.house, quizAnswers: form.quizAnswers,
      })
      toast.success('Welcome to The Public Post!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-navy-900 rounded-lg items-center justify-center mb-4">
            <span className="text-white font-serif font-bold text-xl">P</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Join The Public Post</h1>
          <p className="text-navy-500 text-sm mt-1">Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-navy-900' : 'bg-navy-200'}`} />
          ))}
        </div>

        <div className="card p-6">
          {/* Step 1 — Account Details */}
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-navy-900 mb-1">Create Your Account</h2>
              <p className="text-xs text-navy-500 mb-4">Your identity is verified to ensure editorial accountability.</p>
              <div>
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className="input" placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} className="input" placeholder="At least 6 characters" required minLength={6} />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">Continue →</button>
            </form>
          )}

          {/* Step 2 — Political Perspective Quiz */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-navy-900">Political Perspective Quiz</h2>
                <p className="text-xs text-navy-500 mt-1">Rate each statement 1 (strongly disagree) to 5 (strongly agree). This helps readers understand your editorial perspective — it's shown as a label, not a judgment.</p>
              </div>

              {questionsLoading ? (
                <div className="flex items-center justify-center py-8"><Spinner /></div>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-navy-800 font-medium mb-3">{i+1}. {q}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-navy-400 w-20 text-right">Disagree</span>
                      <div className="flex gap-2 flex-1 justify-center">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} type="button"
                            onClick={() => setForm(p => { const a=[...p.quizAnswers]; a[i]=v; return {...p,quizAnswers:a} })}
                            className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${form.quizAnswers[i]===v ? 'bg-navy-900 text-white scale-110' : 'bg-navy-100 text-navy-600 hover:bg-navy-200'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-navy-400 w-20">Agree</span>
                    </div>
                  </div>
                ))
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 justify-center">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 justify-center">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Choose House */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-navy-900">Choose Your House</h2>
                <p className="text-xs text-navy-500 mt-1">Your house determines your role. You can apply to change it later.</p>
              </div>

              {[
                {
                  value: 'CITIZEN',
                  title: 'Citizen',
                  desc: 'Read, comment, tip journalists, and shape the conversation.',
                  detail: 'Perfect for readers who care about verified journalism.',
                },
                {
                  value: 'JOURNALIST',
                  title: 'Journalist',
                  desc: 'Apply to publish articles, build your credibility score, earn from readers.',
                  detail: 'Requires admin verification of your identity and credentials.',
                },
                {
                  value: 'FACT_CHECKER',
                  title: 'Fact Checker',
                  desc: 'Review articles for accuracy, submit verdicts, uphold the truth.',
                  detail: 'You help maintain the integrity of the platform.',
                },
              ].map(h => (
                <label key={h.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${form.house===h.value ? 'border-navy-900 bg-navy-50' : 'border-gray-200 hover:border-navy-400'}`}>
                  <input type="radio" name="house" value={h.value} checked={form.house===h.value} onChange={e=>setForm(p=>({...p,house:e.target.value}))} className="mt-1" />
                  <div>
                    <div className="font-semibold text-navy-900 text-sm">{h.title}</div>
                    <div className="text-xs text-navy-600 mt-0.5">{h.desc}</div>
                    <div className="text-xs text-navy-400 mt-1 italic">{h.detail}</div>
                  </div>
                </label>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost flex-1 justify-center">← Back</button>
                <button type="submit" disabled={loading || !form.house} className="btn-primary flex-1 justify-center gap-2">
                  {loading ? <Spinner size="sm" /> : null}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-navy-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-verified-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
