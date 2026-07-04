import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { articleApi, commentApi, rewardApi, moderationApi, comparisonApi, factCheckApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LeaningBadge, CredibilityScore, TimeAgo, VerdictBadge, Spinner, PageLoader } from '../components/common/UI'
import { Shield, MessageSquare, Heart, Flag, GitCompare, ChevronDown, ChevronUp, Send, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ArticleDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [factChecks, setFactChecks] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [showFactChecks, setShowFactChecks] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('MISLEADING')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [submittingTip, setSubmittingTip] = useState(false)
  const [loadingComparison, setLoadingComparison] = useState(false)

  useEffect(() => {
    loadArticle()
  }, [id])

  const loadArticle = async () => {
    setLoading(true)
    try {
      const [articleRes, commentsRes, factCheckRes] = await Promise.all([
        articleApi.getById(id),
        commentApi.getComments(id),
        factCheckApi.getForArticle(id),
      ])
      setArticle(articleRes.data)
      setComments(commentsRes.data.data || [])
      setFactChecks(factCheckRes.data || [])
    } catch {
      toast.error('Article not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await commentApi.addComment(id, commentText)
      setComments(prev => [res.data.comment, ...prev])
      setCommentText('')
      toast.success('Comment posted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const handleTip = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to tip'); return }
    const amount = parseFloat(tipAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setSubmittingTip(true)
    try {
      await rewardApi.sendTip(id, amount)
      toast.success(`₹${amount} tip sent! 💰`)
      setTipAmount('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send tip')
    } finally {
      setSubmittingTip(false)
    }
  }

  const handleFlag = async () => {
    if (!user) { toast.error('Sign in to flag'); return }
    try {
      await moderationApi.flagArticle(id, flagReason)
      toast.success('Article flagged for review')
      setShowFlagModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to flag article')
    }
  }

  const loadComparison = async () => {
    if (comparison) { setShowComparison(!showComparison); return }
    setLoadingComparison(true)
    try {
      const res = await comparisonApi.getSideBySide(id)
      setComparison(res.data)
      setShowComparison(true)
    } catch {
      toast.error('Could not load comparison')
    } finally {
      setLoadingComparison(false)
    }
  }

  if (loading) return <PageLoader />
  if (!article) return null

  const journalist = article.author?.user
  const credScore = article.author?.credibilityScore ?? 0
  const approvedChecks = factChecks.filter(f => f.status === 'APPROVED').length
  const rejectedChecks = factChecks.filter(f => f.status === 'REJECTED').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Article */}
        <main className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge status={article.status} />
              {journalist?.politicalLeaning && <LeaningBadge leaning={journalist.politicalLeaning} />}
              {approvedChecks > 0 && (
                <span className="badge-verified">
                  <CheckCircle size={11} />{approvedChecks} fact check{approvedChecks > 1 ? 's' : ''} passed
                </span>
              )}
              {rejectedChecks > 0 && (
                <span className="badge-disputed">
                  <AlertTriangle size={11} />{rejectedChecks} disputed
                </span>
              )}
            </div>

            <h1 className="font-serif text-headline font-black text-navy-900 text-balance mb-4">
              {article.title}
            </h1>

            {/* Author row */}
            <div className="flex items-center gap-4 py-4 border-y border-gray-200">
              <Link to={`/journalist/${article.author?.id}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                  {journalist?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900 text-sm group-hover:text-verified-600 transition-colors">{journalist?.name}</span>
                    {article.author?.verified && (
                      <span className="inline-flex items-center gap-0.5 text-verified-600 text-xs">
                        <Shield size={11} className="fill-verified-100" />Verified
                      </span>
                    )}
                  </div>
                  <TimeAgo date={article.createdAt} />
                </div>
              </Link>
              <div className="ml-auto">
                <CredibilityScore score={credScore} size="md" />
                <div className="text-center text-xs text-navy-400 mt-1">credibility</div>
              </div>
            </div>

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map(tag => (
                  <Link key={tag.name} to={`/search?q=${tag.name}`} className="text-xs px-3 py-1 bg-parchment text-navy-600 rounded-full hover:bg-navy-100 transition-colors font-medium">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Media */}
          {article.media?.filter(m => m.type === 'IMAGE').map((m, i) => (
            <div key={i} className="mb-6 rounded-lg overflow-hidden border border-gray-200">
              <img src={m.url} alt="" className="w-full h-72 object-cover" />
            </div>
          ))}

          {/* Body */}
          <div className="article-body text-base leading-8 mb-8">
            {article.content?.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 py-4 border-y border-gray-200 mb-8 flex-wrap">
            <button onClick={loadComparison} disabled={loadingComparison} className="btn-ghost text-sm gap-2">
              {loadingComparison ? <Spinner size="sm" /> : <GitCompare size={16} />}
              Compare Perspectives
            </button>
            <button onClick={() => setShowFactChecks(!showFactChecks)} className="btn-ghost text-sm gap-2">
              <CheckCircle size={16} />
              Fact Checks ({factChecks.length})
            </button>
            {user && (
              <button onClick={() => setShowFlagModal(true)} className="btn-ghost text-sm gap-2 text-red-500 hover:bg-red-50">
                <Flag size={16} />Flag
              </button>
            )}
            {isAdmin && (
              <Link to={`/admin`} className="btn-ghost text-sm gap-2 text-amber-600">
                <Shield size={16} />Moderate
              </Link>
            )}
          </div>

          {/* Fact checks panel */}
          {showFactChecks && (
            <div className="mb-8 card p-5">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-verified-600" />
                Fact Check Results
              </h3>
              {factChecks.length === 0 ? (
                <p className="text-sm text-navy-500">No fact checks yet for this article.</p>
              ) : (
                <div className="space-y-3">
                  {factChecks.map(fc => (
                    <div key={fc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <VerdictBadge status={fc.status} />
                        {fc.confidence && (
                          <span className="text-xs text-navy-500">
                            {Math.round(fc.confidence * 100)}% confidence
                          </span>
                        )}
                        <TimeAgo date={fc.createdAt} />
                      </div>
                      {fc.result?.evidence && (
                        <p className="text-sm text-navy-700 italic">"{fc.result.evidence}"</p>
                      )}
                      {fc.reviewNotes && (
                        <p className="text-xs text-navy-500 mt-1">Notes: {fc.reviewNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Side-by-side comparison */}
          {showComparison && comparison && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base font-bold text-navy-900 flex items-center gap-2">
                  <GitCompare size={16} className="text-verified-600" />
                  Opposing Perspective
                </h3>
                <button onClick={() => setShowComparison(false)} className="btn-ghost p-1"><ChevronUp size={16} /></button>
              </div>
              {comparison.opposing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'This Article', data: comparison.original, overview: comparison.factOverview?.original },
                    { label: 'Opposing View', data: comparison.opposing, overview: comparison.factOverview?.opposing },
                  ].map(({ label, data, overview }) => (
                    <div key={label} className="card p-4 border-t-4 border-navy-900">
                      <div className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-2">{label}</div>
                      <LeaningBadge leaning={data.authorLeaning} />
                      <Link to={`/article/${data.id}`} className="block mt-2">
                        <h4 className="font-serif font-semibold text-sm text-navy-900 hover:text-verified-600 transition-colors line-clamp-3">{data.title}</h4>
                      </Link>
                      <p className="text-xs text-navy-500 mt-2 line-clamp-2">{data.content?.slice(0, 120)}…</p>
                      {overview && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4 text-xs text-navy-500">
                          <span className="text-green-600">✓ {overview.approved} approved</span>
                          <span className="text-red-500">✗ {overview.rejected} disputed</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-4 text-sm text-navy-500 text-center">
                  {comparison.message || 'No opposing article found yet.'}
                </div>
              )}
            </div>
          )}

          {/* Tip */}
          {user && article.author?.userId !== user.id && article.status === 'PUBLISHED' && (
            <div className="card p-5 mb-8 bg-parchment border-gray-200">
              <h3 className="font-serif text-base font-bold text-navy-900 mb-1">Support this journalist</h3>
              <p className="text-xs text-navy-500 mb-3">90% goes directly to the author. 10% sustains the platform.</p>
              <form onSubmit={handleTip} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">₹</span>
                  <input type="number" value={tipAmount} onChange={e => setTipAmount(e.target.value)} className="input pl-7" placeholder="50" min="1" step="1" />
                </div>
                <button type="submit" disabled={submittingTip} className="btn-primary gap-2">
                  <Heart size={15} />{submittingTip ? 'Sending…' : 'Tip'}
                </button>
              </form>
              <div className="flex gap-2 mt-2">
                {[50,100,250,500].map(a => (
                  <button key={a} type="button" onClick={() => setTipAmount(String(a))} className="text-xs px-2 py-1 bg-white border border-navy-200 rounded hover:bg-navy-50 text-navy-600 font-medium">
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
              <MessageSquare size={18} />Discussion ({comments.length})
            </h3>

            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="input resize-none" rows={3} placeholder="Share your perspective…" />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn-primary gap-2">
                    <Send size={14} />{submittingComment ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="card p-4 mb-6 text-center">
                <p className="text-sm text-navy-600">
                  <Link to="/login" className="text-verified-600 font-semibold">Sign in</Link> to join the discussion
                </p>
              </div>
            )}

            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm flex-shrink-0">
                    {comment.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-navy-800">{comment.user?.name}</span>
                      <TimeAgo date={comment.createdAt} />
                    </div>
                    <p className="text-sm text-navy-700 leading-relaxed">{comment.content}</p>
                    {(user?.id === comment.userId || isAdmin) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-400 hover:text-red-600 mt-1">Delete</button>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-navy-400 text-center py-6">No comments yet. Start the discussion.</p>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Journalist card */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-3">About the Journalist</h3>
            <Link to={`/journalist/${article.author?.id}`} className="flex items-center gap-3 group mb-4">
              <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg flex-shrink-0">
                {journalist?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-navy-900 text-sm group-hover:text-verified-600 transition-colors">{journalist?.name}</div>
                {article.author?.verified && (
                  <span className="inline-flex items-center gap-0.5 text-verified-600 text-xs">
                    <Shield size={11} className="fill-verified-100" />Verified Journalist
                  </span>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <CredibilityScore score={credScore} size="lg" />
              <div>
                <div className="text-xs text-navy-500">Credibility Score</div>
                <div className="text-xs font-medium text-navy-700 mt-0.5">
                  {credScore >= 75 ? 'Highly Trusted' : credScore >= 50 ? 'Trusted' : credScore >= 25 ? 'Emerging' : 'Under Review'}
                </div>
              </div>
            </div>
            {journalist?.politicalLeaning && (
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-navy-500">Political Leaning</span>
                <LeaningBadge leaning={journalist.politicalLeaning} />
              </div>
            )}
            <Link to={`/journalist/${article.author?.id}`} className="btn-secondary w-full justify-center text-xs py-2">
              View Profile
            </Link>
          </div>

          {/* Article stats */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-3">Article Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-500">Status</span>
                <StatusBadge status={article.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Fact Checks</span>
                <span className="font-medium text-navy-800">{factChecks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Comments</span>
                <span className="font-medium text-navy-800">{comments.length}</span>
              </div>
              {article._count?.views !== undefined && (
                <div className="flex justify-between">
                  <span className="text-navy-500">Views</span>
                  <span className="font-medium text-navy-800">{article._count.views}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Flag size={18} className="text-red-500" />Flag Article
            </h3>
            <p className="text-sm text-navy-600 mb-4">Why are you flagging this article?</p>
            <div className="space-y-2 mb-5">
              {['INCORRECT_FACT','MISLEADING','BIAS','HATE_SPEECH'].map(r => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${flagReason===r ? 'border-navy-900 bg-navy-50' : 'border-navy-200 hover:border-navy-400'}`}>
                  <input type="radio" name="flagReason" value={r} checked={flagReason===r} onChange={e=>setFlagReason(e.target.value)} />
                  <span className="text-sm text-navy-700 capitalize">{r.replace('_',' ').toLowerCase()}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFlagModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={handleFlag} className="btn-danger flex-1 justify-center">Submit Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
