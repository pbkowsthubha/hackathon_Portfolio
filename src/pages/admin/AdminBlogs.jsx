import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastContainer from '../../components/dashboard/ToastContainer'
import { useToast } from '../../hooks/useToast'
import './AdminPages.css'

export default function AdminBlogs() {
  const { toasts, showToast } = useToast(3500)
  const [articles, setArticles] = useState(() => adminService.getAllCreatorBlogPosts())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [moderating, setModerating] = useState(null) // { article, action: 'unpublish' | 'restore' }
  const [reason, setReason] = useState('')
  const [modalError, setModalError] = useState('')

  const reload = () => {
    setArticles(adminService.getAllCreatorBlogPosts())
  }

  const handleOpenModeration = (article, action) => {
    setModerating({ article, action })
    setReason('')
    setModalError('')
  }

  const handleConfirm = (e) => {
    e.preventDefault()
    if (!moderating) return
    if (!reason.trim()) {
      setModalError('A moderation reason is required.')
      return
    }
    try {
      const { article, action } = moderating
      if (action === 'unpublish') {
        adminService.moderateUnpublishBlogPost(article.authorUsername, article.id, reason)
        showToast(`Article "${article.title}" unpublished.`)
      } else {
        adminService.moderateRestoreBlogPost(article.authorUsername, article.id, reason)
        showToast(`Article "${article.title}" restored to published.`)
      }
      setModerating(null)
      reload()
    } catch (err) {
      setModalError(err.message || 'Blog moderation failed.')
    }
  }

  const filtered = articles.filter((a) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && a.status === 'published') ||
      (statusFilter === 'DRAFT' && a.status !== 'published')
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.authorUsername.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <ToastContainer toasts={toasts} />

        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">BLOG MODERATION</span>
            <h1 className="admin-page-title">Creator Articles ({articles.length})</h1>
            <p className="admin-page-desc">
              Review creator blog posts and unpublish or restore publication without deleting article content.
            </p>
          </div>
          <button type="button" className="btn-adm-secondary" onClick={reload}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-controls-bar">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by article title, author username, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search blog articles"
          />

          <div className="admin-filter-tabs">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-tab-btn ${statusFilter === tab ? 'admin-tab-btn--active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-box">No blog articles match your filter.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Article Title</th>
                  <th>Author</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={`${a.authorUsername}-${a.id}`}>
                    <td><strong>{a.title}</strong></td>
                    <td className="mono">@{a.authorUsername}</td>
                    <td className="mono">/{a.slug}</td>
                    <td>
                      <span
                        className={`admin-pill ${
                          a.status === 'published' ? 'admin-pill--published' : 'admin-pill--draft'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="mono">
                      {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {a.status === 'published' && a.portfolioPublished && (
                          <Link
                            to={`/p/${a.authorUsername}/blog/${a.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-adm-sm"
                          >
                            Open ↗
                          </Link>
                        )}
                        {a.status === 'published' ? (
                          <button
                            type="button"
                            className="btn-adm-danger"
                            onClick={() => handleOpenModeration(a, 'unpublish')}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-adm-primary"
                            onClick={() => handleOpenModeration(a, 'restore')}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {moderating && (
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="blog-mod-title">
            <form onSubmit={handleConfirm} className="admin-modal-dialog">
              <span className="admin-kicker">
                {moderating.action === 'unpublish' ? 'CONFIRM UNPUBLISH' : 'CONFIRM RESTORATION'}
              </span>
              <h2 id="blog-mod-title" className="admin-modal-title">
                {moderating.action === 'unpublish'
                  ? `Unpublish "${moderating.article.title}"?`
                  : `Restore "${moderating.article.title}"?`}
              </h2>
              <p className="admin-page-desc">
                {moderating.action === 'unpublish'
                  ? 'The article will be reverted to Draft status. Full article content remains intact.'
                  : 'The article will be restored to Published status.'}
              </p>

              {modalError && <div className="auth-error-banner" role="alert">{modalError}</div>}

              <div className="form-group">
                <label htmlFor="blog-mod-reason" className="form-label">Moderation Reason *</label>
                <input
                  id="blog-mod-reason"
                  type="text"
                  className="form-input"
                  placeholder="Enter reason for audit log..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn-adm-secondary" onClick={() => setModerating(null)}>Cancel</button>
                <button
                  type="submit"
                  className={moderating.action === 'unpublish' ? 'btn-adm-danger' : 'btn-adm-primary'}
                >
                  {moderating.action === 'unpublish' ? 'Confirm Unpublish' : 'Confirm Restore'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
