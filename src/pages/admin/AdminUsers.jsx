import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastContainer from '../../components/dashboard/ToastContainer'
import { useToast } from '../../hooks/useToast'
import './AdminPages.css'

export default function AdminUsers() {
  const { toasts, showToast } = useToast(3500)
  const [creators, setCreators] = useState(() => adminService.getAllCreators())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [inspectingUser, setInspectingUser] = useState(null)
  const [moderatingUser, setModeratingUser] = useState(null) // { user, action: 'suspend' | 'restore' }
  const [reason, setReason] = useState('')
  const [modalError, setModalError] = useState('')

  const reloadCreators = () => {
    setCreators(adminService.getAllCreators())
  }

  const handleOpenModeration = (user, action) => {
    setModeratingUser({ user, action })
    setReason('')
    setModalError('')
  }

  const handleConfirmModeration = (e) => {
    e.preventDefault()
    if (!moderatingUser) return
    if (!reason.trim()) {
      setModalError('Please enter a moderation reason.')
      return
    }
    try {
      if (moderatingUser.action === 'suspend') {
        adminService.suspendUser(moderatingUser.user.id, reason)
        showToast(`Account @${moderatingUser.user.username} suspended.`)
      } else {
        adminService.restoreUser(moderatingUser.user.id, reason)
        showToast(`Account @${moderatingUser.user.username} restored to active.`)
      }
      setModeratingUser(null)
      reloadCreators()
    } catch (err) {
      setModalError(err.message || 'Moderation action failed.')
    }
  }

  const filtered = creators.filter((c) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.status !== 'suspended') ||
      (statusFilter === 'SUSPENDED' && c.status === 'suspended')
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      c.username.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <ToastContainer toasts={toasts} />

        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">USER MANAGEMENT</span>
            <h1 className="admin-page-title">Registered Creators ({creators.length})</h1>
            <p className="admin-page-desc">
              Inspect creator accounts, monitor publication status, and suspend or restore access.
            </p>
          </div>
          <button type="button" className="btn-adm-secondary" onClick={reloadCreators}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-controls-bar">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search creators"
          />

          <div className="admin-filter-tabs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((tab) => (
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
          <div className="admin-empty-box">No creator accounts match your filter.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Email</th>
                  <th>Account Status</th>
                  <th>Portfolio</th>
                  <th>Content</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.fullName}</strong>
                      <div className="mono">@{c.username}</div>
                    </td>
                    <td className="mono">{c.email}</td>
                    <td>
                      <span
                        className={`admin-pill ${
                          c.status === 'suspended' ? 'admin-pill--suspended' : 'admin-pill--active'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${
                          c.publicationStatus === 'published' ? 'admin-pill--published' : 'admin-pill--draft'
                        }`}
                      >
                        {c.publicationStatus}
                      </span>
                    </td>
                    <td className="mono">
                      {c.projectsCount} proj · {c.blogCount} posts
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn-adm-sm"
                          onClick={() => setInspectingUser(c)}
                        >
                          Details
                        </button>
                        {c.publicationStatus === 'published' && (
                          <Link
                            to={`/p/${c.username}?from=admin-users`}
                            state={{ adminReturnTo: '/admin/users', fromAdminUsers: true }}
                            className="btn-adm-sm"
                          >
                            Open →
                          </Link>
                        )}
                        {c.status === 'suspended' ? (
                          <button
                            type="button"
                            className="btn-adm-primary"
                            onClick={() => handleOpenModeration(c, 'restore')}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-adm-danger"
                            onClick={() => handleOpenModeration(c, 'suspend')}
                          >
                            Suspend
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

        {/* Safe Details Modal (Never exposes passwords or hashes) */}
        {inspectingUser && (
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="usr-detail-title">
            <div className="admin-modal-dialog">
              <span className="admin-kicker">CREATOR DETAILS</span>
              <h2 id="usr-detail-title" className="admin-modal-title">{inspectingUser.fullName}</h2>
              <div className="admin-list-stack">
                <div className="admin-list-row"><span>Username</span><span className="mono">@{inspectingUser.username}</span></div>
                <div className="admin-list-row"><span>Email</span><span className="mono">{inspectingUser.email}</span></div>
                <div className="admin-list-row"><span>Role</span><span className="mono">{inspectingUser.role}</span></div>
                <div className="admin-list-row"><span>Account Status</span><span className="mono">{inspectingUser.status}</span></div>
                <div className="admin-list-row"><span>Portfolio Status</span><span className="mono">{inspectingUser.publicationStatus}</span></div>
                <div className="admin-list-row"><span>Projects / Skills / Blog</span><span className="mono">{inspectingUser.projectsCount} / {inspectingUser.skillsCount} / {inspectingUser.blogCount}</span></div>
                <div className="admin-list-row"><span>Registered</span><span className="mono">{inspectingUser.createdAt ? new Date(inspectingUser.createdAt).toLocaleString() : 'N/A'}</span></div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn-adm-secondary" onClick={() => setInspectingUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend / Restore Confirmation Modal */}
        {moderatingUser && (
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="usr-mod-title">
            <form onSubmit={handleConfirmModeration} className="admin-modal-dialog">
              <span className="admin-kicker">
                {moderatingUser.action === 'suspend' ? 'CONFIRM SUSPENSION' : 'CONFIRM RESTORATION'}
              </span>
              <h2 id="usr-mod-title" className="admin-modal-title">
                {moderatingUser.action === 'suspend'
                  ? `Suspend @${moderatingUser.user.username}?`
                  : `Restore @${moderatingUser.user.username}?`}
              </h2>
              <p className="admin-page-desc">
                {moderatingUser.action === 'suspend'
                  ? 'The creator will be blocked from logging in or accessing the creator dashboard. All portfolio data will be preserved.'
                  : 'The creator will regain access to their account and preserved portfolio.'}
              </p>

              {modalError && (
                <div className="auth-error-banner" role="alert">{modalError}</div>
              )}

              <div className="form-group">
                <label htmlFor="usr-mod-reason" className="form-label">Moderation Reason *</label>
                <input
                  id="usr-mod-reason"
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
                <button type="button" className="btn-adm-secondary" onClick={() => setModeratingUser(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={moderatingUser.action === 'suspend' ? 'btn-adm-danger' : 'btn-adm-primary'}
                >
                  {moderatingUser.action === 'suspend' ? 'Confirm Suspend' : 'Confirm Restore'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
