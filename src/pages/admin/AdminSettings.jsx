import { useState } from 'react'
import { adminService } from '../../services/adminService'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastContainer from '../../components/dashboard/ToastContainer'
import { useToast } from '../../hooks/useToast'
import './AdminPages.css'

export default function AdminSettings() {
  const { toasts, showToast } = useToast(3500)
  const [settings, setSettings] = useState(() => adminService.getPlatformSettings())
  const [saving, setSaving] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const updated = adminService.updatePlatformSettings(
        settings,
        `Updated settings (Registration: ${settings.registrationEnabled ? 'Enabled' : 'Disabled'}, Maintenance: ${settings.maintenanceMode ? 'On' : 'Off'})`
      )
      setSettings(updated)
      showToast('Platform settings saved and logged.')
    } catch (err) {
      showToast(err.message || 'Failed to save platform settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <ToastContainer toasts={toasts} />

        <div className="admin-page-header">
          <div>
            <span className="admin-kicker">CONFIGURATION</span>
            <h1 className="admin-page-title">Platform Settings</h1>
            <p className="admin-page-desc">
              Manage platform identity, creator registration availability, and maintenance mode notices.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-settings-card">
          <div className="admin-panel-top">
            <h2 className="admin-panel-title">PLATFORM IDENTITY &amp; ACCESS CONTROLS</h2>
            <span className="admin-pill admin-pill--active">LIVE CONFIG</span>
          </div>

          <div className="admin-form-group">
            <label htmlFor="platName" className="admin-form-label">
              Platform Display Name
            </label>
            <input
              id="platName"
              type="text"
              className="admin-form-input"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              aria-describedby="platNameHint"
              required
            />
            <span id="platNameHint" className="admin-form-hint">
              Shown in platform metadata and administrative headers.
            </span>
          </div>

          <div className="admin-form-group">
            <label htmlFor="platDesc" className="admin-form-label">
              Platform Description
            </label>
            <textarea
              id="platDesc"
              rows={3}
              className="admin-form-textarea"
              value={settings.platformDescription}
              onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
              aria-describedby="platDescHint"
            />
            <span id="platDescHint" className="admin-form-hint">
              Concise summary describing the multi-user portfolio platform.
            </span>
          </div>

          <label className="admin-toggle-row" htmlFor="regEnabledToggle">
            <div>
              <span className="admin-toggle-title">Allow New Creator Registration</span>
              <div className="admin-form-hint">
                When disabled, new signups are blocked while existing creators can still sign in.
              </div>
            </div>
            <input
              id="regEnabledToggle"
              type="checkbox"
              className="admin-toggle-checkbox"
              checked={settings.registrationEnabled}
              onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
            />
          </label>

          <label className="admin-toggle-row" htmlFor="maintModeToggle">
            <div>
              <span className="admin-toggle-title">Maintenance Mode Notice</span>
              <div className="admin-form-hint">
                Displays a maintenance notice to ordinary visitors while keeping administrator access active.
              </div>
            </div>
            <input
              id="maintModeToggle"
              type="checkbox"
              className="admin-toggle-checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
          </label>

          <div className="admin-settings-footer">
            <span className="admin-form-hint mono">
              {settings.updatedAt
                ? `Last updated: ${new Date(settings.updatedAt).toLocaleString()}`
                : 'Using default platform configuration'}
            </span>
            <button type="submit" className="btn-adm-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
