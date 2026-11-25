import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { backupService, formatBytes } from '../../services/backupService'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastContainer from '../../components/dashboard/ToastContainer'
import { useToast } from '../../hooks/useToast'
import './AdminPages.css'

export default function AdminBackup() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { toasts, showToast } = useToast(4000)
  const fileInputRef = useRef(null)

  const [currentSummary, setCurrentSummary] = useState(() =>
    backupService.getCurrentStorageSummary()
  )
  const [lastExport, setLastExport] = useState(null)
  const [sessionHistory, setSessionHistory] = useState([])

  // Restore workflow state
  const [selectedFileMeta, setSelectedFileMeta] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [mergeAnalysis, setMergeAnalysis] = useState(null)
  const [restoreOutcome, setRestoreOutcome] = useState(null)

  // Confirmation modal state: null | 'safe-merge' | 'full-restore'
  const [confirmMode, setConfirmMode] = useState(null)
  const [fullRestoreAck, setFullRestoreAck] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!confirmMode) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        setConfirmMode(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmMode, busy])

  const refreshSummary = () => {
    try {
      setCurrentSummary(backupService.getCurrentStorageSummary())
    } catch {
      // Ignore if session was just cleared
    }
  }

  const appendSessionHistory = (entry) => {
    setSessionHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ])
  }

  const handleExportBackup = () => {
    if (busy) return
    setBusy(true)
    try {
      const result = backupService.exportBackup()
      const blob = new Blob([result.jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      setLastExport({
        fileName: result.fileName,
        createdAt: result.summary.createdAt,
        formattedSize: result.formattedSize,
        counts: result.summary.counts,
      })

      appendSessionHistory({
        type: 'EXPORT',
        status: 'Completed',
        detail: `${result.fileName} (${result.formattedSize}) — ${result.summary.counts.users} users, ${result.summary.counts.portfolios} portfolios`,
      })

      refreshSummary()
      showToast('Complete backup exported and downloaded as JSON.')
    } catch (err) {
      appendSessionHistory({
        type: 'EXPORT',
        status: 'Failed',
        detail: err?.message || 'Backup export failed.',
      })
      showToast(err?.message || 'Failed to export backup.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    setRestoreOutcome(null)
    setConfirmMode(null)
    setFullRestoreAck(false)

    if (!file) {
      setSelectedFileMeta(null)
      setValidationResult(null)
      setMergeAnalysis(null)
      return
    }

    setSelectedFileMeta({
      name: file.name,
      size: formatBytes(file.size),
    })

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        const check = backupService.validateBackup(text)
        setValidationResult(check)

        if (check.valid) {
          const analysis = backupService.analyzeMergeConflicts(check.backup)
          setMergeAnalysis(analysis)
          appendSessionHistory({
            type: 'VALIDATE',
            status: 'Valid',
            detail: `${file.name} (${formatBytes(file.size)}) passed schema & version validation.`,
          })
        } else {
          setMergeAnalysis(null)
          appendSessionHistory({
            type: 'VALIDATE',
            status: 'Rejected',
            detail: `${file.name}: ${check.errors[0] || 'Validation failed.'}`,
          })
        }
      } catch (err) {
        setValidationResult({
          valid: false,
          errors: [err?.message || 'Unable to validate backup file.'],
          warnings: [],
          backup: null,
          summary: null,
        })
        setMergeAnalysis(null)
      }
    }
    reader.onerror = () => {
      setValidationResult({
        valid: false,
        errors: ['Failed to read the selected file from disk.'],
        warnings: [],
        backup: null,
        summary: null,
      })
      setMergeAnalysis(null)
    }
    reader.readAsText(file)
  }

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSelectedFileMeta(null)
    setValidationResult(null)
    setMergeAnalysis(null)
    setRestoreOutcome(null)
    setConfirmMode(null)
    setFullRestoreAck(false)
  }

  const handleConfirmSafeMerge = () => {
    if (busy || !validationResult?.valid) return
    setBusy(true)
    try {
      const result = backupService.safeMerge(validationResult.backup)
      setRestoreOutcome({
        mode: 'safe-merge',
        result,
      })
      setConfirmMode(null)
      refreshSummary()

      // Refresh merge analysis against updated storage
      setMergeAnalysis(backupService.analyzeMergeConflicts(validationResult.backup))

      appendSessionHistory({
        type: 'SAFE_MERGE',
        status: 'Completed',
        detail: `Added +${result.added.users} users, +${result.added.portfolios} portfolios, +${result.added.adminLogs} logs. Preserved ${result.conflicts.users.length} user & ${result.conflicts.portfolios.length} portfolio conflicts.`,
      })

      showToast('Safe Merge completed without overwriting existing records.')
    } catch (err) {
      appendSessionHistory({
        type: 'SAFE_MERGE',
        status: 'Failed',
        detail: err?.message || 'Safe Merge failed.',
      })
      showToast(err?.message || 'Safe Merge failed.', 'error')
      setConfirmMode(null)
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmFullRestore = () => {
    if (busy || !validationResult?.valid || !fullRestoreAck) return
    setBusy(true)
    try {
      backupService.fullRestore(validationResult.backup)
      setConfirmMode(null)
      // Clear React auth state and send administrator back to login
      logout()
      navigate('/login', {
        replace: true,
        state: {
          message: 'Full backup restored. Please sign in again to continue.',
        },
      })
    } catch (err) {
      appendSessionHistory({
        type: 'FULL_RESTORE',
        status: 'Failed',
        detail: err?.message || 'Full Restore failed.',
      })
      showToast(err?.message || 'Full Restore failed.', 'error')
      setConfirmMode(null)
      setBusy(false)
    }
  }

  const counts = currentSummary.counts

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <ToastContainer toasts={toasts} />

        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">DATA INTEGRITY</span>
            <h1 className="admin-page-title">Data Backup &amp; Restore</h1>
            <p className="admin-page-desc">
              Export versioned localStorage snapshots, validate backup files, and perform safe
              merges or full platform restoration.
            </p>
          </div>
        </div>

        {/* SECTION 1: BACKUP */}
        <section className="admin-panel-card" aria-labelledby="backup-section-title">
          <div className="admin-panel-top">
            <h2 id="backup-section-title" className="admin-panel-title">
              1. EXPORT COMPLETE BACKUP
            </h2>
            <span className="admin-pill admin-pill--active">VERSION 1 JSON</span>
          </div>

          <div className="backup-alert backup-alert--warning" role="note">
            <strong>Sensitive Data Warning:</strong> Exported JSON backup files are{' '}
            <strong>unencrypted</strong> and contain user account records including password hashes
            and salts. Store backup files securely and never share them publicly. Active login
            sessions (<code>portfolioStudio:session</code>) are always excluded.
          </div>

          <div className="backup-summary-grid">
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.users}</span>
              <span className="backup-stat-label">User Accounts</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.portfolios}</span>
              <span className="backup-stat-label">Portfolios</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.profileDrafts}</span>
              <span className="backup-stat-label">Profile Drafts</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.projectDrafts}</span>
              <span className="backup-stat-label">Project Drafts</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.blogDrafts}</span>
              <span className="backup-stat-label">Blog Drafts</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.adminLogs}</span>
              <span className="backup-stat-label">Admin Logs</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.hasSettings ? 'Yes' : 'No'}</span>
              <span className="backup-stat-label">Platform Settings</span>
            </div>
            <div className="backup-stat-box">
              <span className="backup-stat-value">{counts.hasUsersBackup ? 'Yes' : 'No'}</span>
              <span className="backup-stat-label">Legacy Users Backup</span>
            </div>
          </div>

          <div className="backup-actions-row">
            <button
              type="button"
              className="btn-adm-primary"
              onClick={handleExportBackup}
              disabled={busy}
            >
              Export Complete Backup (JSON)
            </button>
          </div>

          {lastExport && (
            <div className="backup-meta-strip" data-testid="last-export-meta">
              <span>
                <strong>Last Backup:</strong> {lastExport.fileName}
              </span>
              <span>
                <strong>Created:</strong> {new Date(lastExport.createdAt).toLocaleString()}
              </span>
              <span>
                <strong>Size:</strong> {lastExport.formattedSize}
              </span>
            </div>
          )}
        </section>

        {/* SECTION 2: RESTORE */}
        <section className="admin-panel-card" aria-labelledby="restore-section-title">
          <div className="admin-panel-top">
            <h2 id="restore-section-title" className="admin-panel-title">
              2. RESTORE FROM BACKUP FILE
            </h2>
            <span className="admin-pill admin-pill--draft">VALIDATED PREVIEW</span>
          </div>

          <p className="admin-page-desc">
            Select a previously exported Portfolio Studio JSON backup. Selecting a file only
            validates and previews its contents—no data is modified until you confirm a restore
            mode.
          </p>

          <div className="backup-file-drop">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="backup-file-input"
              aria-label="Select backup JSON file"
            />
            {selectedFileMeta && (
              <button type="button" className="btn-adm-secondary" onClick={handleClearFile}>
                Clear Selection
              </button>
            )}
          </div>

          {validationResult && !validationResult.valid && (
            <div className="backup-alert backup-alert--error" role="alert">
              <strong>Validation Failed — Restore Blocked:</strong>
              <ul className="backup-error-list">
                {validationResult.errors.map((errMsg, idx) => (
                  <li key={idx}>{errMsg}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult?.valid && (
            <>
              <div className="backup-alert backup-alert--success">
                <strong>Backup Validated:</strong> {selectedFileMeta?.name} (
                {selectedFileMeta?.size}) — Created{' '}
                {new Date(validationResult.summary.createdAt).toLocaleString()} (v
                {validationResult.summary.backupVersion})
              </div>

              {validationResult.warnings.length > 0 && (
                <div className="backup-alert backup-alert--warning">
                  {validationResult.warnings.join(' ')}
                </div>
              )}

              <div className="backup-summary-grid">
                <div className="backup-stat-box">
                  <span className="backup-stat-value">{validationResult.summary.counts.users}</span>
                  <span className="backup-stat-label">Backup Users</span>
                </div>
                <div className="backup-stat-box">
                  <span className="backup-stat-value">
                    {validationResult.summary.counts.portfolios}
                  </span>
                  <span className="backup-stat-label">Backup Portfolios</span>
                </div>
                <div className="backup-stat-box">
                  <span className="backup-stat-value">
                    {validationResult.summary.counts.profileDrafts +
                      validationResult.summary.counts.projectDrafts +
                      validationResult.summary.counts.blogDrafts}
                  </span>
                  <span className="backup-stat-label">Backup Drafts</span>
                </div>
                <div className="backup-stat-box">
                  <span className="backup-stat-value">
                    {validationResult.summary.counts.adminLogs}
                  </span>
                  <span className="backup-stat-label">Backup Logs</span>
                </div>
              </div>

              {mergeAnalysis && (
                <div className="backup-meta-strip">
                  <span>
                    <strong>Safe Merge Preview:</strong> +{mergeAnalysis.toAdd.users} users, +
                    {mergeAnalysis.toAdd.portfolios} portfolios, +{mergeAnalysis.toAdd.drafts}{' '}
                    drafts, +{mergeAnalysis.toAdd.adminLogs} logs
                  </span>
                  <span>
                    <strong>Conflicts (Preserved):</strong> {mergeAnalysis.conflicts.users.length}{' '}
                    users, {mergeAnalysis.conflicts.portfolios.length} portfolios,{' '}
                    {mergeAnalysis.conflicts.drafts.length} drafts
                  </span>
                </div>
              )}

              <div className="backup-actions-row">
                <button
                  type="button"
                  className="btn-adm-primary"
                  onClick={() => setConfirmMode('safe-merge')}
                  disabled={busy}
                >
                  Safe Merge (Preserve Existing)
                </button>
                <button
                  type="button"
                  className="btn-adm-danger"
                  onClick={() => {
                    setFullRestoreAck(false)
                    setConfirmMode('full-restore')
                  }}
                  disabled={busy}
                >
                  Full Restore (Replace All Data)
                </button>
              </div>
            </>
          )}

          {restoreOutcome?.mode === 'safe-merge' && (
            <div className="backup-alert backup-alert--success">
              <strong>Safe Merge Completed:</strong> Added {restoreOutcome.result.added.users}{' '}
              users, {restoreOutcome.result.added.portfolios} portfolios,{' '}
              {restoreOutcome.result.added.drafts} drafts, and{' '}
              {restoreOutcome.result.added.adminLogs} admin logs. Existing conflicts preserved:{' '}
              {restoreOutcome.result.conflicts.users.length} users,{' '}
              {restoreOutcome.result.conflicts.portfolios.length} portfolios.
            </div>
          )}
        </section>

        {/* SECTION 3: BACKUP HISTORY (CURRENT SESSION) */}
        <section className="admin-panel-card" aria-labelledby="history-section-title">
          <div className="admin-panel-top">
            <h2 id="history-section-title" className="admin-panel-title">
              3. SESSION BACKUP HISTORY
            </h2>
            <span className="admin-pill admin-pill--draft">CURRENT TAB SESSION</span>
          </div>

          <p className="admin-page-desc">
            Tracks backup and validation actions performed during the current browser session.
            Browser file downloads are not permanently tracked across sessions.
          </p>

          {sessionHistory.length === 0 ? (
            <div className="admin-empty-box">
              No backup or restore actions performed in this session yet.
            </div>
          ) : (
            <div className="admin-list-stack">
              {sessionHistory.map((item) => (
                <div key={item.id} className="admin-list-row">
                  <div>
                    <strong>{item.type}</strong> ·{' '}
                    <span className="mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <div className="admin-page-desc">{item.detail}</div>
                  </div>
                  <span
                    className={`admin-pill ${
                      item.status === 'Failed' || item.status === 'Rejected'
                        ? 'admin-pill--danger'
                        : 'admin-pill--active'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="admin-page-desc">
            <strong>Storage &amp; Rollback Note:</strong> Browser <code>localStorage</code> is
            unencrypted, limited by browser quota (~5–10 MB), and does not support multi-key ACID
            transactions. Before any merge or full restore, an automatic pre-restore snapshot is
            captured in memory (and persisted when quota allows) for best-effort rollback on write
            errors.
          </div>
        </section>

        {/* CONFIRMATION MODAL */}
        {confirmMode && (
          <div
            className="admin-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-modal-title"
          >
            <div className="admin-modal-dialog">
              {confirmMode === 'safe-merge' ? (
                <>
                  <h3 id="backup-modal-title" className="admin-modal-title">
                    Confirm Safe Merge
                  </h3>
                  <p className="admin-page-desc">
                    Safe Merge preserves all existing records and only imports missing users,
                    portfolios, drafts, and logs. Conflicting records will be skipped.
                  </p>
                  {mergeAnalysis && (
                    <div className="backup-meta-strip">
                      <span>
                        <strong>Will Import:</strong> +{mergeAnalysis.toAdd.users} users, +
                        {mergeAnalysis.toAdd.portfolios} portfolios, +{mergeAnalysis.toAdd.drafts}{' '}
                        drafts
                      </span>
                      <span>
                        <strong>Will Preserve (Conflicts):</strong>{' '}
                        {mergeAnalysis.conflicts.users.join(', ') || 'None'}
                        {mergeAnalysis.conflicts.portfolios.length > 0
                          ? ` | Portfolios: ${mergeAnalysis.conflicts.portfolios.join(', ')}`
                          : ''}
                      </span>
                    </div>
                  )}
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="btn-adm-secondary"
                      onClick={() => setConfirmMode(null)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-adm-primary"
                      onClick={handleConfirmSafeMerge}
                      disabled={busy}
                    >
                      {busy ? 'Merging...' : 'Confirm Safe Merge'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 id="backup-modal-title" className="admin-modal-title">
                    Confirm Full Restore
                  </h3>
                  <div className="backup-alert backup-alert--warning">
                    <strong>Warning:</strong> This replaces all supported Portfolio Studio data
                    with the selected backup. An automatic pre-restore snapshot will be created
                    first. Active sessions are never restored, and you will be logged out and
                    redirected to the login page.
                  </div>
                  <label className="backup-checkbox-label">
                    <input
                      type="checkbox"
                      checked={fullRestoreAck}
                      onChange={(e) => setFullRestoreAck(e.target.checked)}
                    />
                    <span>
                      I understand this replaces current application data and requires me to sign
                      in again.
                    </span>
                  </label>
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="btn-adm-secondary"
                      onClick={() => setConfirmMode(null)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-adm-danger"
                      onClick={handleConfirmFullRestore}
                      disabled={busy || !fullRestoreAck}
                    >
                      {busy ? 'Restoring...' : 'Confirm Full Restore'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
