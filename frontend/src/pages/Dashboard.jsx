import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articleApi, analyticsApi, journalistApi, rewardApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, CredibilityScore, PageLoader, TimeAgo } from '../components/common/UI'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PenSquare, Eye, MessageSquare, Users, DollarSign, FileText, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [profile, setProfile] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [articlesRes, profileRes] = await Promise.all([
        articleApi.getDashboard(),
        journalistApi.getMyProfile().catch(() => null),
      ])
      setArticles(articlesRes.data || [])
      setProfile(profileRes?.data || null)

      const [analyticsRes, earningsRes] = await Promise.allSettled([
        analyticsApi.getMyAnalytics(),
        rewardApi.getEarnings(),
      ])
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data)
      if (earningsRes.status === 'fulfilled') setEarnings(earningsRes.value.data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  const stats = analytics?.overview || {}
  const statCards = [
    { label: 'Total Views',   value: stats.totalViews ?? 0,                icon: <Eye size={18} />,      color: 'text-verified-600' },
    { label: 'Articles',      value: stats.totalArticles ?? 0,              icon: <FileText size={18} />, color: 'text-navy-600' },
    { label: 'Subscribers',   value: stats.totalSubscribers ?? 0,           icon: <Users size={18} />,    color: 'text-green-600' },
    { label: 'Net Earnings',  value: `₹${(stats.totalEarnings ?? 0).toFixed(0)}`, icon: <DollarSign size={18} />, color: 'text-amber-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">My Dashboard</h1>
          <p className="text-navy-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link to="/write" className="btn-primary gap-2">
          <PenSquare size={15} />Write Article
        </Link>
      </div>

      {/* Pending approval banner */}
      {profile && !profile.verified && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Application Pending Approval</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your journalist application is under admin review. You can write articles now but they won't be published until you're approved.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 mb-6">
        {['overview', 'articles', 'earnings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="card p-4">
                <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                  {s.icon}
                  <span className="text-xs font-semibold uppercase tracking-wide text-navy-400">{s.label}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-navy-900">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Credibility + chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Credibility */}
            <div className="card p-5 flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-4">Credibility Score</h3>
              <CredibilityScore score={profile?.credibilityScore ?? 0} size="lg" />
              <p className="text-xs text-navy-500 mt-3">
                {(profile?.credibilityScore ?? 0) >= 75 ? '🏆 Highly Trusted' :
                 (profile?.credibilityScore ?? 0) >= 50 ? '✅ Trusted' :
                 (profile?.credibilityScore ?? 0) >= 25 ? '📈 Emerging' : '⏳ Building Trust'}
              </p>
              <Link to="/leaderboard" className="mt-3 text-xs text-verified-600 hover:underline">
                View Leaderboard →
              </Link>
            </div>

            {/* Views chart */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-4">Views — Last 30 Days</h3>
              {analytics?.viewsOverTime?.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={analytics.viewsOverTime}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} width={28} />
                    <Tooltip formatter={v => [v, 'Views']} />
                    <Line type="monotone" dataKey="views" stroke="#1a9de8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-36 flex items-center justify-center text-sm text-navy-400">
                  Views will appear here once your articles get traffic
                </div>
              )}
            </div>
          </div>

          {/* Top articles */}
          {analytics?.topArticles?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-4">Top Performing Articles</h3>
              <div className="space-y-3">
                {analytics.topArticles.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold font-mono text-navy-300 w-6 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link to={`/article/${a.id}`}
                        className="text-sm font-semibold text-navy-800 hover:text-verified-600 transition-colors line-clamp-1">
                        {a.title}
                      </Link>
                      <div className="flex gap-3 text-xs text-navy-400 mt-0.5">
                        <span><Eye size={11} className="inline mr-0.5" />{a._count?.views ?? 0} views</span>
                        <span><MessageSquare size={11} className="inline mr-0.5" />{a._count?.comments ?? 0} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ARTICLES ── */}
      {tab === 'articles' && (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText size={40} className="text-navy-300 mx-auto mb-3" />
              <p className="text-navy-600 font-serif text-lg mb-4">No articles yet</p>
              <Link to="/write" className="btn-primary">Write Your First Article</Link>
            </div>
          ) : articles.map(article => (
            <div key={article.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={article.status} />
                    <TimeAgo date={article.createdAt} />
                  </div>
                  <Link to={`/article/${article.id}`}
                    className="font-serif font-semibold text-navy-900 hover:text-verified-600 transition-colors line-clamp-2">
                    {article.title}
                  </Link>
                  {article.tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {article.tags.map(t => (
                        <span key={t.name} className="text-xs px-2 py-0.5 bg-parchment text-navy-500 rounded">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-navy-400 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />{article._count?.views ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />{article._count?.comments ?? 0}
                  </span>
                  {['DRAFT', 'CORRECTED'].includes(article.status) && (
                    <Link to={`/write?edit=${article.id}`} className="btn-ghost text-xs py-1.5 px-3">
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EARNINGS ── */}
      {tab === 'earnings' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center">
              <p className="text-xs text-navy-500 uppercase tracking-wide mb-1 font-semibold">Net Earnings</p>
              <p className="text-3xl font-bold font-mono text-navy-900">₹{(earnings?.netEarnings ?? 0).toFixed(2)}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-xs text-navy-500 uppercase tracking-wide mb-1 font-semibold">Total Tips Received</p>
              <p className="text-3xl font-bold font-mono text-green-600">₹{(stats.totalTipAmount ?? 0).toFixed(2)}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-xs text-navy-500 uppercase tracking-wide mb-1 font-semibold">Transactions</p>
              <p className="text-3xl font-bold font-mono text-navy-900">{earnings?.pagination?.total ?? 0}</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-base font-bold text-navy-900 mb-4">Transaction History</h3>
            {earnings?.data?.length > 0 ? (
              <div className="space-y-1">
                {earnings.data.map(entry => (
                  <div key={entry.id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        entry.type === 'TIP'        ? 'bg-green-100 text-green-700' :
                        entry.type === 'COMMISSION' ? 'bg-red-50 text-red-600' :
                                                      'bg-navy-100 text-navy-600'
                      }`}>
                        {entry.type}
                      </span>
                      <TimeAgo date={entry.createdAt} />
                    </div>
                    <span className={`font-mono font-bold text-sm ${
                      entry.amount >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {entry.amount >= 0 ? '+' : ''}₹{Math.abs(entry.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-navy-400 text-center py-8">
                No transactions yet. Earnings appear when readers tip your articles.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
