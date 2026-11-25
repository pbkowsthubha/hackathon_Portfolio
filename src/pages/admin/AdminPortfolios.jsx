import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastContainer from '../../components/dashboard/ToastContainer'
import { useToast } from '../../hooks/useToast'
import './AdminPages.css'

export default function AdminPortfolios() {
  const { toasts, showToast } = useToast(3500)
  const [portfolios, setPortfolios] = useState(() => adminService.getAllCreatorPortfolios())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [inspecting, setInspecting] = useState(null)
  const [moderating, setModerating] = useState(null) // { portfolio, action: 'unpublish' | 'restore' }
  const [reason, setReason] = useState('')
  const [modalError, setModalError] = useState('')

  const reload = () => {
    setPortfolios(adminService.getAllCreatorPortfolios())
  }

  const handleOpenModeration = (portfolio, action) => {
    setModerating({ portfolio, action })
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
      if (moderating.action === 'unpublish') {
        adminService.moderateUnpublishPortfolio(moderating.portfolio.username, reason)
        showToast(`Portfolio @${moderating.portfolio.username} unpublished.`)
      } else {
        adminService.moderateRestorePortfolio(moderating.portfolio.username, reason)
        showToast(`Portfolio @${moderating.portfolio.username} restored to published.`)
      }
      setModerating(null)
      reload()
    } catch (err) {
      setModalError(err.message || 'Portfolio moderation failed.')
    }
  }

  const filtered = portfolios.filter((p) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && p.publicationStatus === 'published') ||
      (statusFilter === 'DRAFT' && p.publicationStatus !== 'published')
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      p.username.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      p.themeName.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <ToastContainer toasts={toasts} />

        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">PORTFOLIO MODERATION</span>
            <h1 className="admin-page-title">Creator Portfolios ({portfolios.length})</h1>
            <p className="admin-page-desc">
              Review creator portfolios, inspect metadata, and unpublish or restore public visibility without deleting content.
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
            placeholder="Search by username, display name, or theme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search portfolios"
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
          <div className="admin-empty-box">No creator portfolios match your filter.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Theme</th>
                  <th>Projects</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.username}>
                    <td>
                      <strong>{p.displayName}</strong>
                      <div className="mono">@{p.username}</div>
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${
                          p.publicationStatus === 'published' ? 'admin-pill--published' : 'admin-pill--draft'
                        }`}
                      >
                        {p.publicationStatus}
                      </span>
                    </td>
                    <td>{p.themeName}</td>
                    <td className="mono">{p.projectsCount}</td>
                    <td className="mono">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="btn-adm-sm" onClick={() => setInspecting(p)}>
                          Inspect
                        </button>
                        {p.publicationStatus === 'published' && (
                          <Link
                            to={`/p/${p.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-adm-sm"
                          >
                            Open ↗
                          </Link>
                        )}
                        {p.publicationStatus === 'published' ? (
                          <button
                            type="button"
                            className="btn-adm-danger"
                            onClick={() => handleOpenModeration(p, 'unpublish')}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-adm-primary"
                            onClick={() => handleOpenModeration(p, 'restore')}
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

        {inspecting && (
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="port-insp-title">
            <div className="admin-modal-dialog">
              <span className="admin-kicker">PORTFOLIO INSPECTION</span>
              <h2 id="port-insp-title" className="admin-modal-title">{inspecting.displayName}</h2>
              <div className="admin-list-stack">
                <div className="admin-list-row"><span>Username</span><span className="mono">@{inspecting.username}</span></div>
                <div className="admin-list-row"><span>Status</span><span className="mono">{inspecting.publicationStatus}</span></div>
                <div className="admin-list-row"><span>Active Theme</span><span>{inspecting.themeName}</span></div>
                <div className="admin-list-row"><span>Projects / Skills / Blog</span><span className="mono">{inspecting.projectsCount} / {inspecting.skillsCount} / {inspecting.blogCount}</span></div>
                <div className="admin-list-row"><span>Last Published</span><span className="mono">{inspecting.lastPublishedAt ? new Date(inspecting.lastPublishedAt).toLocaleString() : 'N/A'}</span></div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn-adm-secondary" onClick={() => setInspecting(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {moderating && (
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="port-mod-title">
            <form onSubmit={handleConfirm} className="admin-modal-dialog">
              <span className="admin-kicker">
                {moderating.action === 'unpublish' ? 'CONFIRM UNPUBLISH' : 'CONFIRM RESTORATION'}
              </span>
              <h2 id="port-mod-title" className="admin-modal-title">
                {moderating.action === 'unpublish'
                  ? `Unpublish @${moderating.portfolio.username}?`
                  : `Restore @${moderating.portfolio.username}?`}
              </h2>
              <p className="admin-page-desc">
                {moderating.action === 'unpublish'
                  ? 'The portfolio will be hidden from public view while preserving all creator content.'
                  : 'The portfolio will become publicly viewable at /p/' + moderating.portfolio.username + '.'}
              </p>

              {modalError && <div className="auth-error-banner" role="alert">{modalError}</div>}

              <div className="form-group">
                <label htmlFor="port-mod-reason" className="form-label">Moderation Reason *</label>
                <input
                  id="port-mod-reason"
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
