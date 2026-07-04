import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { notificationApi, credibilityApi, articleApi, journalistApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import {
  CredibilityScore, LeaningBadge, TimeAgo,
  PageLoader, EmptyState, Spinner
} from '../components/common/UI'
import ArticleCard from '../components/article/ArticleCard'
import {
  Bell, Trophy, Search as SearchIcon, Shield,
  CheckCircle, PenSquare, Clock, FileText, User
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Notifications Page ───────────────────────────────────────────────────────
export function Notifications() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const [loading, setLoading] = useState(false)

  const handleMarkAll = async () => {
    setLoading(true)
    try { await markAllRead() }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const iconMap = {
    ARTICLE_PUBLISHED:    '📰',
    ARTICLE_VERIFIED:     '✅',
    ARTICLE_DISPUTED:     '❌',
    ARTICLE_REJECTED:     '🚫',
    FACT_CHECK_SUBMITTED: '🔍',
    TIP_RECEIVED:         '💰',
    SUBSCRIPTION_NEW:     '🔔',
    MODERATION_ACTION:    '⚠️',
    JOURNALIST_APPROVED:  '🎉',
    JOURNALIST_REJECTED:  '❌',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-navy-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={loading} className="btn-ghost text-sm gap-2">
            {loading ? <Spinner size="sm" /> : <CheckCircle size={15} />}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={40} />}
          title="No notifications yet"
          description="When articles are verified, tips received, or actions taken on your content, they'll appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead([n.id])}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-parchment ${
                !n.read ? 'border-l-4 border-l-verified-500' : ''
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">
                {iconMap[n.type] || '📢'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-navy-900' : 'text-navy-700'}`}>
                  {n.message}
                </p>
                <TimeAgo date={n.createdAt} />
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-verified-500 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Leaderboard Page ─────────────────────────────────────────────────────────
export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    credibilityApi.getLeaderboard()
      .then(res => setLeaderboard(res.data || []))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-3">
          <Trophy size={28} className="text-amber-600" />
        </div>
        <h1 className="font-serif text-3xl font-black text-navy-900">Credibility Leaderboard</h1>
        <p className="text-navy-500 text-sm mt-2 max-w-md mx-auto">
          Journalists ranked by verified accuracy, reader trust, and editorial integrity.
          Scores update in real time as articles are fact-checked.
        </p>
      </div>

      {loading ? <PageLoader /> : leaderboard.length === 0 ? (
        <EmptyState
          icon={<Trophy size={40} />}
          title="No verified journalists yet"
          description="Be the first to apply and build your credibility score."
          action={<Link to="/apply-journalist" className="btn-primary">Apply as Journalist</Link>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {leaderboard.map((journalist, i) => (
              <Link
                key={journalist.id}
                to={`/journalist/${journalist.id}`}
                className="card p-5 flex items-center gap-5 hover:shadow-md transition-shadow group"
              >
                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{medals[i]}</span>
                  ) : (
                    <span className="text-lg font-bold font-mono text-navy-300">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold flex-shrink-0">
                  {journalist.user?.name?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy-900 group-hover:text-verified-600 transition-colors">
                      {journalist.user?.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-verified-600 text-xs">
                      <Shield size={11} className="fill-verified-100" />Verified
                    </span>
                  </div>
                  {journalist.user?.politicalLeaning && (
                    <div className="mt-1">
                      <LeaningBadge leaning={journalist.user.politicalLeaning} />
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <CredibilityScore score={journalist.credibilityScore} size="md" />
                  <div className="hidden sm:block">
                    <div className="text-xs text-navy-400 uppercase tracking-wide">Score</div>
                    <div className="text-sm font-bold font-mono text-navy-900">
                      {journalist.credibilityScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Scoring guide */}
          <div className="mt-8 card p-5 bg-parchment">
            <h3 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">
              How Credibility is Calculated
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-navy-600">
              {[
                { delta: '+5',  text: 'Article verified by fact-checker' },
                { delta: '+3',  text: 'Article approved by admin' },
                { delta: '−5',  text: 'Article rejected by admin' },
                { delta: '−10', text: 'Article disputed by fact-checker' },
                { delta: '−15', text: 'Article taken down by moderation' },
                { delta: '−5',  text: 'Official warning issued' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <span className={`font-mono font-bold w-8 text-right ${item.delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {item.delta}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Search Page ──────────────────────────────────────────────────────────────
export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(q)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (q) { setQuery(q); doSearch(q, 1) }
  }, [q])

  const doSearch = async (searchQ, p = 1) => {
    if (!searchQ.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await articleApi.search(searchQ.trim(), p)
      setArticles(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
      setPage(p)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      doSearch(query.trim(), 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-2xl font-bold text-navy-900 mb-6">Search Articles</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input pl-9"
            placeholder="Search by title, content, or topic…"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {/* Results count */}
      {q && !loading && (
        <p className="text-sm text-navy-500 mb-4">
          {total} result{total !== 1 ? 's' : ''} for <span className="font-semibold">"{q}"</span>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : articles.length === 0 && searched ? (
        <EmptyState
          icon={<SearchIcon size={40} />}
          title="No results found"
          description={`No articles match "${q}". Try different keywords or browse the latest feed.`}
          action={<Link to="/" className="btn-secondary">Browse Feed</Link>}
        />
      ) : (
        <div className="space-y-5">
          {articles.map(article => <ArticleCard key={article.id} article={article} />)}
        </div>
      )}
    </div>
  )
}

// ─── User Profile Page ────────────────────────────────────────────────────────
export function Profile() {
  const { user, isJournalist } = useAuth()
  const navigate = useNavigate()
  const [journalistProfile, setJournalistProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.house === 'JOURNALIST' || isJournalist) {
      setProfileLoading(true)
      journalistApi.getMyProfile()
        .then(res => setJournalistProfile(res.data))
        .catch(() => {})
        .finally(() => setProfileLoading(false))
    }
  }, [user])

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-2xl font-bold text-navy-900 mb-6">My Profile</h1>

      {/* User card */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-navy-900 truncate">{user.name}</h2>
            <p className="text-navy-500 text-sm">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-navy-100 text-navy-700 rounded font-semibold uppercase tracking-wide">
                {user.house}
              </span>
              {user.role === 'ADMIN' && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-parchment rounded-lg p-3">
            <p className="text-xs text-navy-400 mb-1 uppercase tracking-wide font-semibold">Political Leaning</p>
            <LeaningBadge leaning={user.politicalLeaning || 'CENTER'} />
          </div>
          <div className="bg-parchment rounded-lg p-3">
            <p className="text-xs text-navy-400 mb-1 uppercase tracking-wide font-semibold">Role</p>
            <p className="font-semibold text-navy-900 text-sm capitalize">{user.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Journalist status card */}
      {user.house === 'JOURNALIST' && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
            <PenSquare size={16} />Journalist Status
          </h3>
          {profileLoading ? (
            <div className="flex items-center gap-2 text-sm text-navy-500"><Spinner size="sm" />Loading…</div>
          ) : journalistProfile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-600">Verification</span>
                {journalistProfile.verified ? (
                  <span className="badge-verified"><CheckCircle size={11} />Verified</span>
                ) : (
                  <span className="badge-pending"><Clock size={11} />Pending Admin Review</span>
                )}
              </div>
              {journalistProfile.verified && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-navy-600">Credibility Score</span>
                    <CredibilityScore score={journalistProfile.credibilityScore} size="sm" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link to="/write" className="btn-primary flex-1 justify-center gap-2 text-sm py-2">
                      <PenSquare size={14} />Write Article
                    </Link>
                    <Link to="/dashboard" className="btn-secondary flex-1 justify-center text-sm py-2">
                      Dashboard
                    </Link>
                  </div>
                </>
              )}
              {!journalistProfile.verified && (
                <p className="text-xs text-navy-500 bg-amber-50 border border-amber-200 rounded p-2">
                  Your application is being reviewed. You'll receive a notification once a decision is made.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-navy-600 mb-3">
                You haven't applied for journalist verification yet.
              </p>
              <Link to="/apply-journalist" className="btn-primary gap-2 text-sm">
                <Shield size={14} />Apply for Verification
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Fact checker info */}
      {user.house === 'FACT_CHECKER' && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif text-base font-bold text-navy-900 mb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-verified-600" />Fact Checker Status
          </h3>
          <p className="text-sm text-navy-600 mb-3">
            You have access to the fact-check queue. Review articles and submit your verdict.
          </p>
          <Link to="/factcheck" className="btn-primary gap-2 text-sm">
            <CheckCircle size={14} />Go to Fact Check Queue
          </Link>
        </div>
      )}

      {/* Apply as journalist — for Citizens */}
      {user.house === 'CITIZEN' && (
        <div className="card p-5 bg-parchment">
          <h3 className="font-serif text-base font-bold text-navy-900 mb-2">Want to Write?</h3>
          <p className="text-sm text-navy-600 mb-3">
            Apply to become a verified journalist and start publishing on The Public Post.
          </p>
          <Link to="/apply-journalist" className="btn-secondary text-sm gap-2">
            <PenSquare size={14} />Apply as Journalist
          </Link>
        </div>
      )}
    </div>
  )
}
