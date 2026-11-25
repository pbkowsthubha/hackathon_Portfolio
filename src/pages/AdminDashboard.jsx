import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { storageHealthService } from '../services/storageHealthService'
import AdminLayout from '../components/admin/AdminLayout'
import './admin/AdminPages.css'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(() => adminService.getPlatformMetrics())
  const [storageHealth, setStorageHealth] = useState(() =>
    storageHealthService.getHealthReport()
  )

  const handleRefresh = () => {
    setMetrics(adminService.getPlatformMetrics())
    setStorageHealth(storageHealthService.getHealthReport())
  }

  const formatDate = (iso) => {
    if (!iso) return 'N/A'
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'N/A'
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">PLATFORM OVERSIGHT</span>
            <h1 className="admin-page-title">Admin Control Center</h1>
            <p className="admin-page-desc">
              Real-time overview of registered creators, portfolios, blog publishing, and moderation activity.
            </p>
          </div>
          <button type="button" className="btn-adm-secondary" onClick={handleRefresh}>
            ↻ Refresh Metrics
          </button>
        </div>

        {/* Dynamic Metrics Grid */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <span className="admin-metric-num">{metrics.totalCreators}</span>
            <span className="admin-metric-label">Registered Creators</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-num">{metrics.publishedPortfolios}</span>
            <span className="admin-metric-label">Published Portfolios</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-num">{metrics.draftPortfolios}</span>
            <span className="admin-metric-label">Draft Portfolios</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-num">{metrics.publishedBlogPosts}</span>
            <span className="admin-metric-label">Published Articles</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-num">{metrics.draftBlogPosts}</span>
            <span className="admin-metric-label">Draft Articles</span>
          </div>
        </div>

        <div className="admin-split-grid">
          {/* Recent Registrations */}
          <div className="admin-panel-card">
            <div className="admin-panel-top">
              <h2 className="admin-panel-title">RECENT CREATOR REGISTRATIONS</h2>
              <Link to="/admin/users" className="btn-adm-sm">
                Manage Users →
              </Link>
            </div>

            {metrics.recentRegistrations.length === 0 ? (
              <div className="admin-empty-box">No creator accounts registered yet.</div>
            ) : (
              <div className="admin-list-stack">
                {metrics.recentRegistrations.map((c) => (
                  <div key={c.id} className="admin-list-row">
                    <div>
                      <strong>{c.fullName}</strong>{' '}
                      <span className="mono">@{c.username}</span>
                    </div>
                    <div className="admin-row-actions">
                      <span
                        className={`admin-pill ${
                          c.status === 'suspended' ? 'admin-pill--suspended' : 'admin-pill--active'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="mono">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Moderation Activity */}
          <div className="admin-panel-card">
            <div className="admin-panel-top">
              <h2 className="admin-panel-title">RECENT MODERATION ACTIVITY</h2>
              <Link to="/admin/logs" className="btn-adm-sm">
                View All Logs →
              </Link>
            </div>

            {metrics.recentLogs.length === 0 ? (
              <div className="admin-empty-box">No administrative actions recorded yet.</div>
            ) : (
              <div className="admin-list-stack">
                {metrics.recentLogs.map((log) => (
                  <div key={log.id} className="admin-list-row">
                    <div>
                      <span className="mono" style={{ fontWeight: 700 }}>{log.action}</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        Target: <span className="mono">{log.targetId}</span> · By @{log.adminUsername}
                      </div>
                    </div>
                    <span className="mono">{formatDate(log.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LocalStorage Health & Backup Reminder */}
        <section className="admin-panel-card" aria-labelledby="storage-health-title">
          <div className="admin-panel-top">
            <h2 id="storage-health-title" className="admin-panel-title">
              LOCALSTORAGE HEALTH &amp; CAPACITY
            </h2>
            <Link to="/admin/backup" className="btn-adm-sm">
              Open Backup &amp; Restore →
            </Link>
          </div>

          <div className="backup-meta-strip">
            <span>
              <strong>Estimated Usage:</strong> {storageHealth.formattedTotal}
            </span>
            <span>
              <strong>Approx. Capacity:</strong>{' '}
              {storageHealth.approximatePercent !== null
                ? `~${storageHealth.approximatePercent}% of ${storageHealth.formattedApproximateLimit}`
                : 'Unavailable'}
            </span>
            <span>
              <strong>Pre-Restore Snapshot:</strong>{' '}
              {storageHealth.hasPreRestoreSnapshot ? 'Available' : 'None yet'}
            </span>
          </div>

          {storageHealth.warnings.length > 0 && (
            <div className="backup-alert backup-alert--warning" role="status">
              {storageHealth.warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          )}

          <div className="backup-summary-grid">
            {storageHealth.categories.slice(0, 4).map((cat) => (
              <div key={cat.key} className="backup-stat-box">
                <span className="backup-stat-value">{cat.formattedBytes}</span>
                <span className="backup-stat-label">
                  {cat.label} ({cat.percentOfUsed}%)
                </span>
              </div>
            ))}
          </div>

          <p className="admin-page-desc">
            {storageHealth.quotaNote} Export regular JSON backups from{' '}
            <Link to="/admin/backup" style={{ textDecoration: 'underline' }}>
              Data Backup &amp; Restore
            </Link>{' '}
            to protect creator portfolios against browser storage resets.
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
