import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articleApi, subscriptionApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ArticleCard from '../components/article/ArticleCard'
import { PageLoader, EmptyState, Pagination } from '../components/common/UI'
import { Newspaper, TrendingUp, Users, Rss } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Home() {
  const { user, isJournalist } = useAuth()
  const [articles, setArticles] = useState([])
  const [feed, setFeed] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('latest')

  useEffect(() => {
    loadArticles()
  }, [page, tab])

  const loadArticles = async () => {
    setLoading(true)
    try {
      if (tab === 'feed' && user) {
        const res = await subscriptionApi.getFeed(page)
        setFeed(res.data.data || [])
        setPagination(res.data.pagination || {})
      } else {
        const res = await articleApi.getLatest(page, 10)
        setArticles(res.data.data || [])
        setPagination(res.data.pagination || {})
      }
    } catch {
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const displayed = tab === 'feed' ? feed : articles

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main feed */}
        <main className="lg:col-span-2">
          {/* Masthead */}
          <div className="mb-8 pb-6 border-b-2 border-navy-900">
            <h1 className="font-serif text-display font-black text-navy-900 leading-none mb-2">
              The Public Post
            </h1>
            <p className="text-navy-500 text-sm font-sans">
              Community-verified journalism. Every article carries a credibility score, political context, and fact-check status.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
            <button onClick={() => { setTab('latest'); setPage(1) }} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'latest' ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-700'}`}>
              Latest
            </button>
            {user && (
              <button onClick={() => { setTab('feed'); setPage(1) }} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === 'feed' ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-700'}`}>
                <Rss size={13} />My Feed
              </button>
            )}
          </div>

          {loading ? <PageLoader /> : displayed.length === 0 ? (
            <EmptyState
              icon={<Newspaper size={40} />}
              title={tab === 'feed' ? 'Your feed is empty' : 'No articles yet'}
              description={tab === 'feed' ? 'Subscribe to journalists to see their articles here.' : 'Be the first to publish on The Public Post.'}
              action={isJournalist && <Link to="/write" className="btn-primary">Write an Article</Link>}
            />
          ) : (
            <div className="space-y-6">
              {displayed.map((article, i) => (
                <div key={article.id}>
                  <ArticleCard article={article} />
                  {i === 2 && <div className="my-6 py-4 border-y border-gray-200 text-center">
                    <p className="text-xs text-navy-400 uppercase tracking-widest">Verified by the community</p>
                  </div>}
                </div>
              ))}
              <Pagination page={page} total={pagination.total || 0} limit={10} onPageChange={setPage} />
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* CTA for writers */}
          {!user && (
            <div className="card p-6 bg-navy-900 text-white">
              <h3 className="font-serif text-lg font-bold mb-2">Join the Community</h3>
              <p className="text-white/70 text-sm mb-4">Publish verified journalism. Build your credibility score. Earn directly from readers.</p>
              <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-navy-900 text-sm font-semibold rounded hover:bg-cream transition-colors w-full justify-center">
                Start Writing
              </Link>
            </div>
          )}

          {isJournalist && (
            <div className="card p-5">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/write" className="flex items-center gap-2 text-sm text-navy-700 hover:text-verified-600 font-medium py-1">
                  + Write New Article
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-navy-700 hover:text-verified-600 font-medium py-1">
                  → My Dashboard
                </Link>
                <Link to="/analytics" className="flex items-center gap-2 text-sm text-navy-700 hover:text-verified-600 font-medium py-1">
                  ↗ Analytics
                </Link>
              </div>
            </div>
          )}

          {/* About */}
          <div className="card p-5">
            <h3 className="font-serif text-base font-bold text-navy-900 mb-3">How It Works</h3>
            <div className="space-y-3">
              {[
                { icon: <Newspaper size={14} />, text: 'Journalists publish articles with full identity verification' },
                { icon: <TrendingUp size={14} />, text: 'Every article is AI + human fact-checked before publishing' },
                { icon: <Users size={14} />, text: 'Readers see opposing viewpoints side by side' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-navy-600">
                  <span className="text-verified-600 mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" className="mt-4 text-xs text-verified-600 font-medium hover:underline block">
              View Credibility Leaderboard →
            </Link>
          </div>

          {/* Credibility key */}
          <div className="card p-5">
            <h3 className="font-serif text-base font-bold text-navy-900 mb-3">Credibility Key</h3>
            <div className="space-y-2 text-xs">
              {[
                { range: '75–100', color: 'text-green-600', label: 'Highly Trusted' },
                { range: '50–74', color: 'text-verified-600', label: 'Trusted' },
                { range: '25–49', color: 'text-amber-600', label: 'Emerging' },
                { range: '0–24', color: 'text-red-600', label: 'Under Review' },
              ].map(item => (
                <div key={item.range} className="flex items-center justify-between">
                  <span className={`font-mono font-bold ${item.color}`}>{item.range}</span>
                  <span className="text-navy-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
