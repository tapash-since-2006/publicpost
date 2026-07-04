import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { journalistApi, subscriptionApi, credibilityApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ArticleCard from '../components/article/ArticleCard'
import { CredibilityScore, LeaningBadge, PageLoader, TimeAgo } from '../components/common/UI'
import { Shield, Users, TrendingUp, Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JournalistProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [credHistory, setCredHistory] = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => { loadProfile() }, [id])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profileRes, credRes] = await Promise.all([
        journalistApi.getProfile(id),
        credibilityApi.getHistory(id).catch(() => ({ data: { data: [] } })),
      ])
      setProfile(profileRes.data)
      setCredHistory(credRes.data.data || [])
    } catch {
      toast.error('Journalist not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) { toast.error('Sign in to subscribe'); return }
    setSubLoading(true)
    try {
      if (subscribed) {
        await subscriptionApi.unsubscribe(id)
        setSubscribed(false)
        toast.success('Unsubscribed')
      } else {
        await subscriptionApi.subscribe(id)
        setSubscribed(true)
        toast.success('Subscribed! You\'ll get notified of new articles.')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally {
      setSubLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (!profile) return null

  const journalist = profile.user
  const score = profile.credibilityScore ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-3xl flex-shrink-0">
            {journalist?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="font-serif text-2xl font-bold text-navy-900">{journalist?.name}</h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 text-verified-600 text-sm font-medium">
                      <Shield size={14} className="fill-verified-100" />Verified Journalist
                    </span>
                  )}
                </div>
                {journalist?.politicalLeaning && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-navy-500">Political Leaning:</span>
                    <LeaningBadge leaning={journalist.politicalLeaning} />
                  </div>
                )}
                <p className="text-sm text-navy-500">
                  Member since <TimeAgo date={journalist?.createdAt} />
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <CredibilityScore score={score} size="lg" />
                  <p className="text-xs text-navy-400 mt-1">credibility</p>
                </div>
                {user && user.id !== journalist?.id && (
                  <button onClick={handleSubscribe} disabled={subLoading} className={subscribed ? 'btn-secondary gap-2' : 'btn-primary gap-2'}>
                    {subscribed ? <><BellOff size={15} />Unsubscribe</> : <><Bell size={15} />Subscribe</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Credibility history */}
        {credHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-3">Recent Credibility Changes</h3>
            <div className="space-y-1.5">
              {credHistory.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between text-xs">
                  <span className="text-navy-600">{log.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold ${log.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.delta >= 0 ? '+' : ''}{log.delta}
                    </span>
                    <span className="text-navy-400 font-mono">→ {log.newScore}</span>
                    <TimeAgo date={log.createdAt} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Articles */}
      <div>
        <h2 className="font-serif text-xl font-bold text-navy-900 mb-4">
          Published Articles ({profile.articles?.length || 0})
        </h2>
        {profile.articles?.length > 0 ? (
          <div className="space-y-5">
            {profile.articles.map(article => (
              <ArticleCard key={article.id} article={{ ...article, author: profile }} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center text-navy-500">
            No published articles yet.
          </div>
        )}
      </div>
    </div>
  )
}
