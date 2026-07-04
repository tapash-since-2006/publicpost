import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { journalistApi, uploadToCloudinaryDirect } from '../services/api'
import {
  Shield, Upload, X, CheckCircle, AlertCircle,
  FileText, Star, Clock, Loader
} from 'lucide-react'
import { Spinner } from '../components/common/UI'
import toast from 'react-hot-toast'

const DOC_TYPES = [
  { value: 'PRESS_ID',           label: 'Press ID' },
  { value: 'GOVERNMENT_ID',      label: 'Government ID' },
  { value: 'EMPLOYMENT_LETTER',  label: 'Employment Letter' },
  { value: 'PORTFOLIO',          label: 'Portfolio' },
  { value: 'OTHER',              label: 'Other' },
]

const MAX_FILE_SIZE_MB = 10

export default function ApplyJournalist() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')   // form | uploading | done
  const [files, setFiles] = useState([])     // [{ file, docType, status, url, error }]
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState([]) // per-file status

  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files || [])
    if (files.length + newFiles.length > 5) {
      toast.error('Maximum 5 documents allowed')
      return
    }
    const valid = newFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, docType: 'PRESS_ID' }))])
    e.target.value = ''
  }

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const updateDocType = (i, docType) => {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, docType } : f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStep('uploading')

    try {
      // Step 1: Create journalist profile
      await journalistApi.apply()

      // Step 2: Upload documents if any
      if (files.length > 0) {
        const progress = files.map(f => ({ name: f.file.name, status: 'pending', url: null, error: null }))
        setUploadProgress(progress)

        let uploadedDocs = []

        // Get Cloudinary signature for direct browser upload
        let sigData = null
        try {
          const sigRes = await journalistApi.getCloudinarySignature()
          sigData = sigRes.data
        } catch {
          // Signature fetch failed - will try backend upload instead
        }

        for (let i = 0; i < files.length; i++) {
          const { file, docType } = files[i]

          // Update status to uploading
          setUploadProgress(prev => prev.map((p, idx) =>
            idx === i ? { ...p, status: 'uploading' } : p
          ))

          try {
            let url = null
            let publicId = null

            if (sigData) {
              // Method 1: Direct browser → Cloudinary (works everywhere, no Docker issues)
              const result = await uploadToCloudinaryDirect(
                file,
                sigData.signature,
                sigData.timestamp,
                sigData.folder,
                sigData.cloudName,
                sigData.apiKey
              )
              url = result.secure_url
              publicId = result.public_id
            } else {
              // Method 2: Backend proxy upload (works when hosted, may timeout locally)
              const fd = new FormData()
              fd.append('documents', file)
              fd.append('docTypes[]', docType)
              await journalistApi.uploadDocumentsBackend(fd)
              // Backend handles saving — just mark as done
              setUploadProgress(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'done' } : p
              ))
              continue
            }

            uploadedDocs.push({ url, publicId: publicId || url, type: docType })

            setUploadProgress(prev => prev.map((p, idx) =>
              idx === i ? { ...p, status: 'done', url } : p
            ))

          } catch (err) {
            setUploadProgress(prev => prev.map((p, idx) =>
              idx === i ? { ...p, status: 'error', error: err.message } : p
            ))
            // Continue with other files even if one fails
          }
        }

        // Save all successfully uploaded doc URLs to backend
        if (uploadedDocs.length > 0) {
          try {
            await journalistApi.saveDocumentUrls(uploadedDocs)
          } catch (err) {
            toast.error('Documents uploaded but failed to save. Please contact support.')
          }
        }
      }

      setStep('done')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit'
      if (msg.includes('already submitted')) {
        toast.error('You already have a pending application')
        navigate('/profile')
      } else {
        toast.error(msg)
        setStep('form')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (step === 'done') {
    const successCount = uploadProgress.filter(p => p.status === 'done').length
    const errorCount   = uploadProgress.filter(p => p.status === 'error').length

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">Application Submitted!</h2>
        <p className="text-navy-500 text-sm mb-2">
          Your journalist application is now under admin review.
        </p>
        {uploadProgress.length > 0 && (
          <div className="mt-4 mb-4 text-sm">
            {successCount > 0 && (
              <p className="text-green-600">✅ {successCount} document{successCount > 1 ? 's' : ''} uploaded successfully</p>
            )}
            {errorCount > 0 && (
              <p className="text-amber-600">⚠ {errorCount} document{errorCount > 1 ? 's' : ''} failed to upload</p>
            )}
          </div>
        )}
        <p className="text-navy-400 text-xs mb-6">
          You'll receive a notification once a decision is made — typically within 1–3 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-secondary">Return to Feed</button>
          <button onClick={() => navigate('/profile')} className="btn-primary">View Profile</button>
        </div>
      </div>
    )
  }

  // ── Uploading screen ──────────────────────────────────────────────────────
  if (step === 'uploading' && uploadProgress.length > 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader size={28} className="text-navy-600 animate-spin" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">Uploading Documents…</h2>
          <p className="text-navy-500 text-sm mt-1">Please don't close this tab</p>
        </div>

        <div className="space-y-3">
          {uploadProgress.map((item, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                {item.status === 'pending'   && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                {item.status === 'uploading' && <Spinner size="sm" />}
                {item.status === 'done'      && <CheckCircle size={20} className="text-green-500" />}
                {item.status === 'error'     && <AlertCircle size={20} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-800 truncate">{item.name}</p>
                {item.status === 'uploading' && <p className="text-xs text-navy-400">Uploading to Cloudinary…</p>}
                {item.status === 'done'      && <p className="text-xs text-green-600">Uploaded successfully</p>}
                {item.status === 'error'     && <p className="text-xs text-red-500">{item.error || 'Upload failed'}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 bg-navy-900 rounded-full items-center justify-center mb-4">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Apply as Journalist</h1>
        <p className="text-navy-500 text-sm mt-2 max-w-md mx-auto">
          Join The Public Post as a verified journalist. Upload supporting documents to verify your credentials and speed up approval.
        </p>
      </div>

      {/* What you get */}
      <div className="card p-5 mb-5">
        <h3 className="font-serif text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
          <Star size={14} className="text-amber-500" />What you get as a verified journalist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { icon: '✍️', text: 'Publish articles on the platform' },
            { icon: '🔐', text: 'Verified journalist badge' },
            { icon: '📊', text: 'Personal credibility score' },
            { icon: '💰', text: 'Earn tips from readers (90% to you)' },
            { icon: '🔔', text: 'Build a subscriber base' },
            { icon: '📈', text: 'Analytics dashboard' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-navy-700">
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Document upload */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-bold text-navy-900">Supporting Documents</h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Upload up to 5 documents (optional but recommended).
                Files are uploaded directly to secure cloud storage.
              </p>
            </div>
            <span className="text-xs text-navy-400 font-medium">{files.length}/5</span>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-parchment rounded-lg border border-gray-200">
                  <FileText size={16} className="text-navy-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-800 truncate">{item.file.name}</p>
                    <p className="text-xs text-navy-400">{(item.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <select
                    value={item.docType}
                    onChange={e => updateDocType(i, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1.5 text-navy-700 bg-white flex-shrink-0"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-navy-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {files.length < 5 && (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors group">
              <Upload size={24} className="text-gray-400 group-hover:text-navy-500 mb-2 transition-colors" />
              <span className="text-sm font-medium text-navy-600">Click to add documents</span>
              <span className="text-xs text-navy-400 mt-1">PDF, JPG, PNG, DOCX — max {MAX_FILE_SIZE_MB}MB each</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={addFiles}
                className="hidden"
              />
            </label>
          )}

          {/* Upload method note */}
          <div className="mt-3 flex items-start gap-2 text-xs text-navy-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
            <AlertCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              Documents upload directly to Cloudinary from your browser — this works reliably on all platforms including local development.
            </span>
          </div>
        </div>

        {/* Review process */}
        <div className="card p-5">
          <h3 className="font-serif text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
            <Clock size={14} className="text-navy-500" />Review Process
          </h3>
          <div className="space-y-2.5">
            {[
              { step: '1', title: 'Submit', desc: 'Your application is queued for admin review' },
              { step: '2', title: 'Review', desc: 'Admin verifies your profile and documents' },
              { step: '3', title: 'Decision', desc: 'You receive a notification — usually within 1–3 days' },
              { step: '4', title: 'Publish', desc: 'If approved, start writing immediately' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.step}
                </span>
                <span>
                  <span className="font-semibold text-navy-800">{s.title} — </span>
                  <span className="text-navy-500">{s.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial standards */}
        <div className="card p-5 bg-parchment">
          <h3 className="font-serif text-sm font-bold text-navy-800 mb-2 flex items-center gap-2">
            <FileText size={13} />By applying you agree to
          </h3>
          <ul className="space-y-1 text-xs text-navy-600">
            <li>✓ Factual, evidence-based reporting</li>
            <li>✓ Clearly distinguish news from opinion</li>
            <li>✓ Accept fact-checking — disputes reduce your credibility score</li>
            <li>✓ Your political leaning will be shown on your articles for transparency</li>
            <li>✗ Misinformation or repeated violations result in suspension</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 justify-center gap-2"
          >
            {submitting ? <Spinner size="sm" /> : <Shield size={15} />}
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}
