import { useState } from 'react'
import { adminService } from '../../services/adminService'
import AdminLayout from '../../components/admin/AdminLayout'
import './AdminPages.css'

const ACTION_FILTERS = [
  'ALL',
  'USER_SUSPENDED',
  'USER_RESTORED',
  'PORTFOLIO_UNPUBLISHED',
  'PORTFOLIO_RESTORED',
  'BLOG_UNPUBLISHED',
  'BLOG_RESTORED',
  'PLATFORM_SETTINGS_CHANGED',
]

export default function AdminLogs() {
  const [logs, setLogs] = useState(() => adminService.getActivityLogs())
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const reload = () => {
    setLogs(adminService.getActivityLogs())
  }

  const filtered = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      (log.targetId && log.targetId.toLowerCase().includes(q)) ||
      (log.reason && log.reason.toLowerCase().includes(q)) ||
      (log.adminUsername && log.adminUsername.toLowerCase().includes(q))
    return matchesAction && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">AUDIT TRAIL</span>
            <h1 className="admin-page-title">Admin Activity Logs ({logs.length})</h1>
            <p className="admin-page-desc">
              Read-only chronological record of administrative moderation and configuration actions.
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
            placeholder="Search logs by target, admin, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search activity logs"
          />

          <select
            className="bm-sort-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by action type"
          >
            {ACTION_FILTERS.map((act) => (
              <option key={act} value={act}>
                {act === 'ALL' ? 'All Actions' : act}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-box">No activity log entries recorded yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Admin</th>
                  <th>Reason</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="admin-pill admin-pill--draft">{log.action}</span>
                    </td>
                    <td className="mono">
                      {log.targetType}: {log.targetId}
                    </td>
                    <td className="mono">@{log.adminUsername}</td>
                    <td>{log.reason}</td>
                    <td className="mono">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
