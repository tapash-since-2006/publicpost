import { CheckCircle, Clock, XCircle, AlertTriangle, FileText, Shield } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    PUBLISHED:    { cls: 'badge-verified', icon: <CheckCircle size={11} />, label: 'Verified' },
    UNDER_REVIEW: { cls: 'badge-pending',  icon: <Clock size={11} />,       label: 'Under Review' },
    DRAFT:        { cls: 'badge-draft',    icon: <FileText size={11} />,    label: 'Draft' },
    REJECTED:     { cls: 'badge-disputed', icon: <XCircle size={11} />,     label: 'Rejected' },
    CORRECTED:    { cls: 'badge-pending',  icon: <AlertTriangle size={11} />,label: 'Needs Correction' },
  }
  const s = map[status] || { cls: 'badge-draft', icon: null, label: status }
  return <span className={s.cls}>{s.icon}{s.label}</span>
}

// ─── Credibility Score ────────────────────────────────────────────────────────
export const CredibilityScore = ({ score, size = 'md' }) => {
  const getColor = (s) => {
    if (s >= 75) return 'text-green-600 border-green-400'
    if (s >= 50) return 'text-verified-600 border-verified-400'
    if (s >= 25) return 'text-amber-600 border-amber-400'
    return 'text-red-600 border-red-400'
  }
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  return (
    <div className={`score-ring ${getColor(score)} ${sizes[size]}`}>
      <span className="font-bold font-mono">{Math.round(score)}</span>
    </div>
  )
}

// ─── Leaning Badge ────────────────────────────────────────────────────────────
export const LeaningBadge = ({ leaning }) => {
  const map = {
    LEFT:          { cls: 'bg-blue-100 text-blue-700',    label: 'Left' },
    CENTER_LEFT:   { cls: 'bg-sky-100 text-sky-700',      label: 'Center-Left' },
    CENTER:        { cls: 'bg-gray-100 text-gray-700',    label: 'Center' },
    CENTER_RIGHT:  { cls: 'bg-orange-100 text-orange-700',label: 'Center-Right' },
    RIGHT:         { cls: 'bg-red-100 text-red-700',      label: 'Right' },
  }
  const l = map[leaning] || { cls: 'bg-gray-100 text-gray-600', label: leaning }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${l.cls}`}>{l.label}</span>
}

// ─── Fact Check Verdict ───────────────────────────────────────────────────────
export const VerdictBadge = ({ status }) => {
  const map = {
    APPROVED: { cls: 'badge-verified', icon: <CheckCircle size={11} />, label: 'Approved' },
    REJECTED: { cls: 'badge-disputed', icon: <XCircle size={11} />,     label: 'Disputed' },
    FLAGGED:  { cls: 'badge-pending',  icon: <AlertTriangle size={11} />,label: 'Flagged' },
  }
  const v = map[status] || { cls: 'badge-draft', icon: null, label: status }
  return <span className={v.cls}>{v.icon}{v.label}</span>
}

// ─── Time ─────────────────────────────────────────────────────────────────────
export const TimeAgo = ({ date }) => {
  if (!date) return null
  return (
    <time dateTime={date} title={format(new Date(date), 'PPpp')} className="text-navy-400 text-xs">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </time>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={`${s[size]} border-2 border-navy-200 border-t-navy-900 rounded-full animate-spin`} />
  )
}

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-3 text-sm text-navy-500">Loading...</p>
    </div>
  </div>
)

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-16">
    {icon && <div className="flex justify-center mb-4 text-navy-300">{icon}</div>}
    <h3 className="font-serif text-lg font-semibold text-navy-700 mb-2">{title}</h3>
    {description && <p className="text-sm text-navy-500 max-w-sm mx-auto mb-6">{description}</p>}
    {action}
  </div>
)

// ─── Verified Shield ──────────────────────────────────────────────────────────
export const VerifiedShield = ({ verified }) => {
  if (!verified) return null
  return (
    <span title="Verified Journalist" className="inline-flex items-center gap-1 text-verified-600">
      <Shield size={13} className="fill-verified-100" />
      <span className="text-xs font-medium">Verified</span>
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">← Prev</button>
      <span className="text-sm text-navy-600">Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">Next →</button>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="font-serif text-xl font-bold text-navy-900">{title}</h2>
      {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
)

// ─── Alert ───────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', message }) => {
  const map = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  }
  return (
    <div className={`px-4 py-3 rounded border text-sm ${map[type]}`}>{message}</div>
  )
}
