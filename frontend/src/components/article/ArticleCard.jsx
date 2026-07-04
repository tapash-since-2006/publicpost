import { Link } from 'react-router-dom'
import { Eye, MessageSquare, Heart, CheckCircle, Clock, Shield } from 'lucide-react'
import { StatusBadge, LeaningBadge, CredibilityScore, TimeAgo } from '../common/UI'

export default function ArticleCard({ article, compact = false }) {
  if (!article) return null
  const { id, title, content, status, author, tags, createdAt, _count } = article
  const journalist = author?.user
  const credScore = author?.credibilityScore ?? 0
  const snippet = content?.replace(/<[^>]+>/g, '').slice(0, 160)

  return (
    <article className={`card hover:shadow-md transition-shadow duration-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Journalist info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm flex-shrink-0">
          {journalist?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/journalist/${author?.id}`} className="text-sm font-semibold text-navy-800 hover:text-verified-600 transition-colors">
              {journalist?.name}
            </Link>
            {author?.verified && (
              <span className="inline-flex items-center gap-0.5 text-verified-600 text-xs">
                <Shield size={11} className="fill-verified-100" />
                <span className="font-medium">Verified</span>
              </span>
            )}
            {journalist?.politicalLeaning && <LeaningBadge leaning={journalist.politicalLeaning} />}
          </div>
          <TimeAgo date={createdAt} />
        </div>
        <CredibilityScore score={credScore} size="sm" />
      </div>

      <div className="divider-editorial mb-3" />

      {/* Title */}
      <Link to={`/article/${id}`}>
        <h2 className={`font-serif font-bold text-navy-900 hover:text-verified-700 transition-colors leading-snug mb-2 ${compact ? 'text-base' : 'text-xl'}`}>
          {title}
        </h2>
      </Link>

      {/* Snippet */}
      {!compact && snippet && (
        <p className="text-sm text-navy-600 leading-relaxed mb-3 line-clamp-3">{snippet}…</p>
      )}

      {/* Tags */}
      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 4).map(tag => (
            <Link key={tag.name} to={`/search?q=${tag.name}`} className="text-xs px-2 py-0.5 bg-parchment text-navy-600 rounded hover:bg-navy-100 transition-colors font-medium">
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusBadge status={status} />
        <div className="flex items-center gap-4 text-xs text-navy-400">
          {_count?.views !== undefined && (
            <span className="flex items-center gap-1"><Eye size={12} />{_count.views}</span>
          )}
          {_count?.comments !== undefined && (
            <span className="flex items-center gap-1"><MessageSquare size={12} />{_count.comments}</span>
          )}
          {_count?.tips !== undefined && (
            <span className="flex items-center gap-1"><Heart size={12} />{_count.tips}</span>
          )}
        </div>
      </div>
    </article>
  )
}
