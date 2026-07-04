import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, moderationApi, quizQuestionsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PageLoader, TimeAgo, Spinner } from '../components/common/UI'
import {
  Shield, Users, FileText, CheckCircle, XCircle,
  AlertTriangle, Flag, Wrench, HelpCircle, Save, RotateCcw,
  TrendingUp, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPanel() {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingJournalists, setPendingJournalists] = useState([])
  const [pendingArticles, setPendingArticles] = useState([])
  const [flaggedArticles, setFlaggedArticles] = useState([])
  const [modLog, setModLog] = useState([])
  const [quizQuestions, setQuizQuestions] = useState([])
  const [editedQuestions, setEditedQuestions] = useState([])
  const [quizSaving, setQuizSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [takedownModal, setTakedownModal] = useState(null)
  const [takedownReason, setTakedownReason] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getPendingJournalists(),
        adminApi.getPendingArticles(),
        moderationApi.getFlagged(),
        moderationApi.getLog(),
        quizQuestionsApi.getAdmin(),
      ])

      if (results[0].status === 'fulfilled') setStats(results[0].value.data)
      else toast.error('Failed to load stats')

      if (results[1].status === 'fulfilled') setPendingJournalists(results[1].value.data || [])
      if (results[2].status === 'fulfilled') setPendingArticles(results[2].value.data || [])
      if (results[3].status === 'fulfilled') setFlaggedArticles(results[3].value.data?.data || [])
      if (results[4].status === 'fulfilled') setModLog(results[4].value.data?.data || [])
      if (results[5].status === 'fulfilled') {
        const qs = results[5].value.data || []
        setQuizQuestions(qs)
        setEditedQuestions(qs.map(q => q.text))
      }
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const approveJournalist = async (id) => {
    try {
      await adminApi.approveJournalist(id)
      setPendingJournalists(prev => prev.filter(j => j.id !== id))
      toast.success('Journalist approved! They can now publish articles.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve')
    }
  }

  const rejectJournalist = async (id) => {
    try {
      await adminApi.rejectJournalist(id)
      setPendingJournalists(prev => prev.filter(j => j.id !== id))
      toast.success('Application rejected')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject')
    }
  }

  const approveArticle = async (id) => {
    try {
      await adminApi.approveArticle(id)
      setPendingArticles(prev => prev.filter(a => a.id !== id))
      toast.success('Article approved and published!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve')
    }
  }

  const rejectArticle = async () => {
    if (!rejectModal) return
    try {
      await adminApi.rejectArticle(rejectModal, rejectReason)
      setPendingArticles(prev => prev.filter(a => a.id !== rejectModal))
      setRejectModal(null)
      setRejectReason('')
      toast.success('Article rejected')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject')
    }
  }

  const takeDown = async () => {
    if (!takedownModal || !takedownReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    try {
      await moderationApi.takeDown(takedownModal, takedownReason)
      setFlaggedArticles(prev => prev.filter(a => a.id !== takedownModal))
      setTakedownModal(null)
      setTakedownReason('')
      toast.success('Article taken down')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const restoreArticle = async (articleId) => {
    try {
      await moderationApi.restore(articleId, 'Restored by admin')
      setFlaggedArticles(prev => prev.filter(a => a.id !== articleId))
      toast.success('Article restored')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const saveQuizQuestions = async () => {
    const trimmed = editedQuestions.map(q => q.trim())
    if (trimmed.some(q => q.length < 10)) {
      toast.error('Each question must be at least 10 characters')
      return
    }
    setQuizSaving(true)
    try {
      const res = await quizQuestionsApi.update(trimmed)
      setQuizQuestions(res.data.questions || [])
      toast.success('Quiz questions updated! New registrations will see these.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setQuizSaving(false)
    }
  }

  const resetQuizToDefault = async () => {
    const defaults = [
      "Government should prioritize equality of outcomes over individual liberty.",
      "Free markets generally produce better outcomes than government regulation.",
      "Immigration benefits the country more than it harms it.",
      "Climate change requires immediate and significant government intervention.",
      "Individual rights should take precedence over collective welfare.",
      "Traditional institutions and values are important for social stability.",
    ]
    setEditedQuestions(defaults)
    toast.success('Reset to defaults — click Save to apply')
  }

  if (!isAdmin) return (
    <div className="p-12 text-center">
      <Shield size={40} className="text-navy-300 mx-auto mb-3" />
      <p className="text-navy-600 font-serif text-lg">Admin access required</p>
    </div>
  )

  if (loading) return <PageLoader />

  const tabs = [
    { key: 'overview',    label: 'Overview',    badge: null },
    { key: 'journalists', label: 'Journalists', badge: pendingJournalists.length },
    { key: 'articles',    label: 'Articles',    badge: pendingArticles.length },
    { key: 'moderation',  label: 'Moderation',  badge: flaggedArticles.length },
    { key: 'quiz',        label: 'Quiz Config',  badge: null },
    { key: 'log',         label: 'Audit Log',    badge: null },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Admin Panel</h1>
          <p className="text-xs text-navy-500">Platform management and moderation</p>
        </div>
        <button onClick={loadAll} className="ml-auto btn-ghost text-xs gap-1.5">
          <RotateCcw size={13} />Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              tab === t.key ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-700'
            }`}>
            {t.label}
            {t.badge > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold min-w-[18px] text-center leading-none">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',          value: stats?.totalUsers ?? '—',          icon: <Users size={18} />,       color: 'text-navy-600' },
              { label: 'Verified Journalists', value: stats?.verifiedJournalists ?? '—', icon: <Shield size={18} />,      color: 'text-verified-600' },
              { label: 'Published Articles',   value: stats?.articles?.PUBLISHED ?? 0,   icon: <FileText size={18} />,    color: 'text-green-600' },
              { label: 'Total Fact Checks',    value: stats?.totalFactChecks ?? '—',     icon: <CheckCircle size={18} />, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                  {s.icon}
                  <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{s.label}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-navy-900">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Article breakdown */}
            <div className="card p-5">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-4">Article Status Breakdown</h3>
              {stats?.articles && Object.keys(stats.articles).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.articles).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-1">
                      <StatusBadge status={status} />
                      <span className="font-mono font-bold text-navy-900 text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400">No articles yet</p>
              )}
            </div>

            {/* Tips & Revenue */}
            <div className="card p-5">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-amber-500" />Tips & Revenue
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy-500">Total Tip Volume</span>
                  <span className="font-mono font-bold text-green-700 text-lg">₹{(stats?.totalTips?.amount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy-500">Number of Tips</span>
                  <span className="font-mono font-bold text-navy-900">{stats?.totalTips?.count ?? 0}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <span className="text-sm text-navy-500">Platform Commission (10%)</span>
                  <span className="font-mono font-bold text-navy-700">₹{((stats?.totalTips?.amount ?? 0) * 0.1).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending actions summary */}
          {(pendingJournalists.length > 0 || pendingArticles.length > 0 || flaggedArticles.length > 0) && (
            <div className="card p-5 border-l-4 border-l-amber-400 bg-amber-50">
              <h3 className="font-semibold text-amber-800 mb-3 text-sm">⚠ Action Required</h3>
              <div className="space-y-2 text-sm">
                {pendingJournalists.length > 0 && (
                  <button onClick={() => setTab('journalists')} className="flex items-center justify-between w-full text-left hover:text-amber-900">
                    <span className="text-amber-700">{pendingJournalists.length} journalist application{pendingJournalists.length > 1 ? 's' : ''} awaiting review</span>
                    <span className="text-amber-500">→</span>
                  </button>
                )}
                {pendingArticles.length > 0 && (
                  <button onClick={() => setTab('articles')} className="flex items-center justify-between w-full text-left hover:text-amber-900">
                    <span className="text-amber-700">{pendingArticles.length} article{pendingArticles.length > 1 ? 's' : ''} pending review</span>
                    <span className="text-amber-500">→</span>
                  </button>
                )}
                {flaggedArticles.length > 0 && (
                  <button onClick={() => setTab('moderation')} className="flex items-center justify-between w-full text-left hover:text-amber-900">
                    <span className="text-amber-700">{flaggedArticles.length} flagged article{flaggedArticles.length > 1 ? 's' : ''} need attention</span>
                    <span className="text-amber-500">→</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── JOURNALISTS ───────────────────────────────────────────────── */}
      {tab === 'journalists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-navy-500">{pendingJournalists.length} application{pendingJournalists.length !== 1 ? 's' : ''} pending</p>
          </div>
          {pendingJournalists.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
              <p className="text-navy-600 font-serif">No pending applications</p>
            </div>
          ) : pendingJournalists.map(j => (
            <div key={j.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg flex-shrink-0">
                    {j.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{j.user?.name}</p>
                    <p className="text-sm text-navy-500">{j.user?.email}</p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      House: <span className="font-medium">{j.user?.house}</span> · Applied <TimeAgo date={j.createdAt} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveJournalist(j.id)} className="btn-primary gap-1.5 py-2 text-xs">
                    <CheckCircle size={13} />Approve
                  </button>
                  <button onClick={() => rejectJournalist(j.id)} className="btn-ghost text-red-600 hover:bg-red-50 gap-1.5 py-2 text-xs border border-red-200">
                    <XCircle size={13} />Reject
                  </button>
                </div>
              </div>

              {j.documents?.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
                    Supporting Documents ({j.documents.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {j.documents.map(doc => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-parchment border border-gray-200 rounded-lg hover:bg-navy-50 text-navy-700 font-medium transition-colors">
                        <FileText size={11} />
                        {doc.type.replace(/_/g, ' ')} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-navy-400 italic">No supporting documents uploaded</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ARTICLES ──────────────────────────────────────────────────── */}
      {tab === 'articles' && (
        <div className="space-y-4">
          <p className="text-sm text-navy-500">{pendingArticles.length} article{pendingArticles.length !== 1 ? 's' : ''} awaiting review</p>
          {pendingArticles.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
              <p className="text-navy-600 font-serif">No articles pending review</p>
            </div>
          ) : pendingArticles.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
                      {a.author?.user?.name}
                    </span>
                    <StatusBadge status={a.status} />
                    <TimeAgo date={a.createdAt} />
                  </div>
                  <Link to={`/article/${a.id}`} target="_blank"
                    className="font-serif font-semibold text-navy-900 hover:text-verified-600 transition-colors line-clamp-2 block mb-2">
                    {a.title} ↗
                  </Link>
                  <p className="text-xs text-navy-500 line-clamp-3 leading-relaxed">
                    {a.content?.slice(0, 200)}…
                  </p>
                  {a.tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {a.tags.map(t => (
                        <span key={t.name} className="text-xs px-2 py-0.5 bg-parchment rounded text-navy-500">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.factChecks?.length > 0 && (
                    <p className="text-xs text-verified-600 mt-2 font-medium">
                      {a.factChecks.length} AI fact check{a.factChecks.length > 1 ? 's' : ''} run
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => approveArticle(a.id)} className="btn-primary gap-1.5 py-2 text-xs">
                    <CheckCircle size={13} />Approve
                  </button>
                  <button onClick={() => setRejectModal(a.id)} className="btn-ghost text-red-600 hover:bg-red-50 gap-1.5 py-2 text-xs border border-red-200">
                    <XCircle size={13} />Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODERATION ────────────────────────────────────────────────── */}
      {tab === 'moderation' && (
        <div className="space-y-4">
          <p className="text-sm text-navy-500">{flaggedArticles.length} article{flaggedArticles.length !== 1 ? 's' : ''} flagged by community</p>
          {flaggedArticles.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
              <p className="text-navy-600 font-serif">No flagged articles</p>
            </div>
          ) : flaggedArticles.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge-disputed">
                      <Flag size={11} />{a._count?.flags ?? a.flags?.length ?? 0} flag{(a._count?.flags ?? a.flags?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <StatusBadge status={a.status} />
                    <TimeAgo date={a.createdAt} />
                  </div>
                  <Link to={`/article/${a.id}`} target="_blank"
                    className="font-serif font-semibold text-navy-900 hover:text-verified-600 line-clamp-1 block mb-2">
                    {a.title} ↗
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {a.flags?.slice(0, 5).map(f => (
                      <span key={f.id} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-100 font-medium">
                        {f.reason.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => setTakedownModal(a.id)} className="btn-danger gap-1.5 py-2 text-xs">
                    <Wrench size={13} />Take Down
                  </button>
                  <button onClick={() => restoreArticle(a.id)} className="btn-ghost gap-1.5 py-2 text-xs text-green-600 hover:bg-green-50 border border-green-200">
                    <CheckCircle size={13} />Clear Flags
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── QUIZ CONFIG ───────────────────────────────────────────────── */}
      {tab === 'quiz' && (
        <div className="space-y-5">
          <div className="card p-5 bg-parchment border-amber-200">
            <div className="flex items-start gap-3">
              <HelpCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">About the Political Perspective Quiz</p>
                <p className="text-xs text-amber-700 mt-1">
                  These 6 questions are shown to every new user during registration. Their answers determine their political leaning label (Left, Center-Left, Center, Center-Right, Right), which is displayed on their articles. Exactly 6 questions required.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-base font-bold text-navy-900">Quiz Questions</h3>
              <div className="flex gap-2">
                <button onClick={resetQuizToDefault} className="btn-ghost text-xs gap-1.5">
                  <RotateCcw size={13} />Reset to Defaults
                </button>
                <button onClick={saveQuizQuestions} disabled={quizSaving} className="btn-primary text-xs gap-1.5">
                  {quizSaving ? <Spinner size="sm" /> : <Save size={13} />}
                  {quizSaving ? 'Saving…' : 'Save Questions'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {editedQuestions.map((q, i) => (
                <div key={i}>
                  <label className="label">Question {i + 1}</label>
                  <div className="relative">
                    <textarea
                      value={q}
                      onChange={e => {
                        const updated = [...editedQuestions]
                        updated[i] = e.target.value
                        setEditedQuestions(updated)
                      }}
                      className="input resize-none pr-12"
                      rows={2}
                      placeholder={`Question ${i + 1}…`}
                    />
                    <span className="absolute right-3 top-2 text-xs text-navy-300 font-mono">{i + 1}/6</span>
                  </div>
                  <p className="text-xs text-navy-400 mt-1">
                    Rated 1–5: 1 = Strongly Disagree, 5 = Strongly Agree
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-xs text-navy-500">
                <strong>Scoring:</strong> Total score 6–30 maps to leaning.
                6–9 = Left · 10–14 = Center-Left · 15–20 = Center · 21–25 = Center-Right · 26–30 = Right
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG ─────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="card p-5">
          <h3 className="font-serif text-base font-bold text-navy-900 mb-4">Moderation Audit Log</h3>
          {modLog.length === 0 ? (
            <p className="text-sm text-navy-500 text-center py-8">No moderation actions yet</p>
          ) : (
            <div className="space-y-1">
              {modLog.map(log => (
                <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                      log.action === 'TAKE_DOWN' ? 'bg-red-100 text-red-700' :
                      log.action === 'RESTORE'   ? 'bg-green-100 text-green-700' :
                                                   'bg-amber-100 text-amber-700'
                    }`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-navy-600 truncate">{log.reason || '—'}</span>
                  </div>
                  <TimeAgo date={log.createdAt} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REJECT ARTICLE MODAL ──────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">Reject Article</h3>
            <p className="text-xs text-navy-500 mb-4">The journalist will receive this reason via notification.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input resize-none mb-4"
              rows={3}
              placeholder="Reason for rejection (e.g. Unverified claims, missing sources…)"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={rejectArticle} className="btn-danger flex-1 justify-center">Reject Article</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAKEDOWN MODAL ────────────────────────────────────────────── */}
      {takedownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-1 flex items-center gap-2">
              <Wrench size={18} className="text-red-500" />Take Down Article
            </h3>
            <p className="text-xs text-navy-500 mb-4">
              Article will be removed. Journalist loses 15 credibility points and receives a notification.
            </p>
            <textarea
              value={takedownReason}
              onChange={e => setTakedownReason(e.target.value)}
              className="input resize-none mb-4"
              rows={3}
              placeholder="Reason for takedown (required)…"
            />
            <div className="flex gap-3">
              <button onClick={() => { setTakedownModal(null); setTakedownReason('') }} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={takeDown} disabled={!takedownReason.trim()} className="btn-danger flex-1 justify-center">Take Down</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
