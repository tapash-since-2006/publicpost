import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { articleApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Save, Send, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WriteArticle() {
  const { user, isJournalist } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [media, setMedia] = useState([])

  useEffect(() => {
    if (!isJournalist) { toast.error('Only verified journalists can write'); navigate('/'); return }
    if (editId) loadArticle()
  }, [editId])

  const loadArticle = async () => {
    try {
      const res = await articleApi.getById(editId)
      const a = res.data
      setForm({ title: a.title, content: a.content })
      setTags(a.tags?.map(t => t.name) || [])
    } catch { toast.error('Could not load article') }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 6) { setTags(prev => [...prev, t]); setTagInput('') }
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }

  const buildFormData = (submit) => {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('content', form.content)
    fd.append('submit', String(submit))
    tags.forEach(t => fd.append('tags[]', t))
    media.forEach(f => fd.append('media', f))
    return fd
  }

  const handleSave = async (submit) => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.content.trim()) { toast.error('Content is required'); return }
    setLoading(true)
    try {
      if (editId) {
        await articleApi.update(editId, buildFormData(submit))
      } else {
        const res = await articleApi.create(buildFormData(submit))
        if (submit) { toast.success('Article submitted for review!'); navigate('/dashboard') }
        else { toast.success('Draft saved'); navigate(`/write?edit=${res.data.article.id}`) }
        return
      }
      toast.success(submit ? 'Article submitted for review!' : 'Draft saved')
      if (submit) navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">{editId ? 'Edit Article' : 'Write New Article'}</h1>
          <p className="text-sm text-navy-500 mt-0.5">Articles are AI fact-checked before publishing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={loading} className="btn-ghost gap-2">
            <Save size={15} />Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={loading} className="btn-primary gap-2">
            <Send size={15} />{loading ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="label">Headline</label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({...p, title: e.target.value}))}
            className="w-full px-3 py-3 border border-gray-300 rounded text-lg font-serif font-bold text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-verified-500 bg-white"
            placeholder="Write a compelling, accurate headline…"
          />
        </div>

        {/* Content */}
        <div>
          <label className="label">Article Body</label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({...p, content: e.target.value}))}
            className="input resize-none font-sans leading-relaxed text-base"
            rows={20}
            placeholder="Write your article here. Be accurate, cite sources, and provide evidence for your claims.

Your article will undergo AI fact-checking before a human reviewer sees it. Articles with clear sourcing and evidence receive higher credibility scores."
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-navy-400">Minimum 100 words recommended</span>
            <span className="text-xs text-navy-400">{form.content.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="label">Topics & Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
                #{t}
                <button onClick={() => removeTag(t)} className="text-navy-400 hover:text-red-500 ml-1">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input flex-1"
              placeholder="Add a topic (e.g. economy, climate, politics)"
              maxLength={30}
            />
            <button onClick={addTag} className="btn-ghost gap-1 px-3">
              <Plus size={15} />Add
            </button>
          </div>
          <p className="text-xs text-navy-400 mt-1">Up to 6 tags. Tags help readers find your article and enable side-by-side comparisons.</p>
        </div>

        {/* Guidelines */}
        <div className="bg-parchment rounded-lg p-4 border border-gray-200">
          <h4 className="text-xs font-bold uppercase tracking-widest text-navy-600 mb-2">Editorial Guidelines</h4>
          <ul className="space-y-1 text-xs text-navy-600">
            <li>✓ Cite your sources clearly within the article</li>
            <li>✓ Distinguish between fact and opinion</li>
            <li>✓ Be accurate — disputed articles reduce your credibility score</li>
            <li>✓ Add tags to enable opposing-view comparisons</li>
            <li>✗ Do not publish unverified claims or misinformation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
