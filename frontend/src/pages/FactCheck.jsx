import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { factCheckApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LeaningBadge, TimeAgo, PageLoader, Spinner } from '../components/common/UI'
import { CheckCircle, XCircle, AlertTriangle, FileCheck, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FactCheck() {
  const { isFactChecker } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ verdict: 'APPROVED', evidence: '', confidence: 0.9, reviewNotes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadUnverified() }, [])

  const loadUnverified = async () => {
    setLoading(true)
    try {
      const res = await factCheckApi.getUnverified()
      setArticles(res.data.data || [])
    } catch {
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    if (!form.evidence.trim()) { toast.error('Evidence is required'); return }
    setSubmitting(true)
    try {
      await factCheckApi.submit(selected.id, {
        verdict: form.verdict,
        evidence: form.evidence,
        confidence: parseFloat(form.confidence),
        reviewNotes: form.reviewNotes,
      })
      toast.success(`Fact check submitted — ${form.verdict}`)
      setArticles(prev => prev.filter(a => a.id !== selected.id))
      setSelected(null)
      setForm({ verdict: 'APPROVED', evidence: '', confidence: 0.9, reviewNotes: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isFactChecker) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <FileCheck size={48} className="text-navy-300 mx-auto mb-4" />
      <h2 className="font-serif text-xl font-bold text-navy-900 mb-2">Fact Checkers Only</h2>
      <p className="text-navy-500 text-sm">Only users with the Fact Checker house can access this section.</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-verified-600 rounded flex items-center justify-center">
          <FileCheck size={16} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Fact Check Queue</h1>
          <p className="text-xs text-navy-500">{articles.length} article{articles.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Article list */}
          <div className="space-y-3">
            {articles.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-serif text-lg text-navy-700">Queue is clear!</p>
                <p className="text-sm text-navy-400 mt-1">All articles have been reviewed.</p>
              </div>
            ) : articles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelected(article)}
                className={`w-full text-left card p-4 hover:shadow-md transition-all cursor-pointer border-2 ${selected?.id === article.id ? 'border-verified-500 bg-blue-50' : 'border-transparent hover:border-navy-200'}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-navy-600">{article.author?.user?.name}</span>
                  {article.author?.user?.politicalLeaning && <LeaningBadge leaning={article.author.user.politicalLeaning} />}
                  {article.author?.verified && <span className="inline-flex items-center gap-0.5 text-verified-600 text-xs"><Shield size={10} />Verified</span>}
                  <TimeAgo date={article.createdAt} />
                </div>
                <h3 className="font-serif font-semibold text-navy-900 text-sm line-clamp-2">{article.title}</h3>
                <p className="text-xs text-navy-500 mt-1 line-clamp-2">{article.content?.slice(0, 120)}…</p>
                {article.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {article.tags.slice(0, 4).map(t => <span key={t.name} className="text-xs px-1.5 py-0.5 bg-parchment rounded text-navy-500">#{t.name}</span>)}
                  </div>
                )}
                {article.factChecks?.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600">
                    {article.factChecks.length} existing fact check{article.factChecks.length > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Fact check form */}
          <div className="lg:sticky lg:top-24 h-fit">
            {!selected ? (
              <div className="card p-10 text-center text-navy-400">
                <FileCheck size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select an article from the queue to begin your fact check</p>
              </div>
            ) : (
              <div className="card p-5">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="font-serif font-bold text-navy-900 text-base mb-1 line-clamp-2">{selected.title}</h3>
                  <Link to={`/article/${selected.id}`} target="_blank" className="text-xs text-verified-600 hover:underline">
                    Read full article ↗
                  </Link>
                </div>

                <div className="max-h-48 overflow-y-auto mb-4 text-sm text-navy-700 leading-relaxed border border-gray-200 rounded p-3 bg-amber-50">
                  {selected.content?.slice(0, 800)}{selected.content?.length > 800 ? '…' : ''}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Verdict */}
                  <div>
                    <label className="label">Verdict</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'APPROVED', label: 'Approve', icon: <CheckCircle size={14} />, cls: 'border-green-400 bg-green-50 text-green-700' },
                        { value: 'FLAGGED',  label: 'Flag',    icon: <AlertTriangle size={14} />, cls: 'border-amber-400 bg-amber-50 text-amber-700' },
                        { value: 'REJECTED', label: 'Reject',  icon: <XCircle size={14} />, cls: 'border-red-400 bg-red-50 text-red-700' },
                      ].map(v => (
                        <button key={v.value} type="button" onClick={() => setForm(p => ({...p, verdict: v.value}))}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded border-2 text-sm font-medium transition-all ${form.verdict === v.value ? v.cls : 'border-navy-200 text-navy-500 hover:border-navy-400'}`}>
                          {v.icon}{v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evidence */}
                  <div>
                    <label className="label">Evidence & Sources <span className="text-red-500">*</span></label>
                    <textarea
                      value={form.evidence}
                      onChange={e => setForm(p => ({...p, evidence: e.target.value}))}
                      className="input resize-none"
                      rows={4}
                      placeholder="Cite your sources. What evidence supports or contradicts the claims in this article? Include URLs where possible."
                      required
                    />
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="label">Confidence — {Math.round(form.confidence * 100)}%</label>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={form.confidence}
                      onChange={e => setForm(p => ({...p, confidence: e.target.value}))}
                      className="w-full accent-navy-900"
                    />
                    <div className="flex justify-between text-xs text-navy-400 mt-1">
                      <span>Uncertain</span><span>Certain</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Review Notes (optional)</label>
                    <textarea
                      value={form.reviewNotes}
                      onChange={e => setForm(p => ({...p, reviewNotes: e.target.value}))}
                      className="input resize-none"
                      rows={2}
                      placeholder="Additional notes for the journalist or other reviewers…"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setSelected(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
                    <button type="submit" disabled={submitting} className={`flex-1 justify-center gap-2 inline-flex items-center px-5 py-2.5 rounded text-sm font-medium transition-colors ${form.verdict === 'APPROVED' ? 'bg-green-600 hover:bg-green-700 text-white' : form.verdict === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                      {submitting ? <Spinner size="sm" /> : form.verdict === 'APPROVED' ? <CheckCircle size={15} /> : form.verdict === 'REJECTED' ? <XCircle size={15} /> : <AlertTriangle size={15} />}
                      {submitting ? 'Submitting…' : `Submit ${form.verdict}`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
