import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import { getThemeById } from '../data/designThemes'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import { useToast } from '../hooks/useToast'
import './PublishingManager.css'

export default function PublishingManager() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast(3500)

  const [portfolio, setPortfolio] = useState(() =>
    user?.username ? portfolioService.getUserPortfolio(user.username) : null
  )
  const [publication, setPublication] = useState(() =>
    user?.username ? portfolioService.getPublicationStatus(user.username) : { status: 'draft' }
  )

  const [confirmAction, setConfirmAction] = useState(null) // 'publish' | 'unpublish' | null
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPublished = publication?.status === 'published'
  const publicPath = `/p/${user?.username || ''}`
  const fullPublicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${publicPath}` : publicPath
  const activeThemeName = getThemeById(portfolio?.design?.themeId).name

  const formatDateTime = (iso) => {
    if (!iso) return null
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }

  const handleConfirmOperation = () => {
    if (!user?.username || isSubmitting || !confirmAction) return
    setIsSubmitting(true)
    try {
      if (confirmAction === 'publish') {
        const updated = portfolioService.publishPortfolio(user.username)
        setPortfolio(updated)
        setPublication(updated.publication)
        showToast('Your portfolio is now published and viewable at its public URL.')
      } else {
        const updated = portfolioService.unpublishPortfolio(user.username)
        setPortfolio(updated)
        setPublication(updated.publication)
        showToast('Your portfolio has been unpublished and returned to draft mode.')
      }
      setConfirmAction(null)
    } catch (err) {
      showToast(err.message || 'Unable to update publication status.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullPublicUrl)
      } else {
        const tempInput = document.createElement('input')
        tempInput.value = fullPublicUrl
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
      }
      showToast('Public portfolio link copied to clipboard.')
    } catch {
      showToast('Could not copy link automatically. Please copy it from the URL field.', 'error')
    }
  }

  return (
    <DashboardLayout>
      <div className="pm-container">
        <ToastContainer toasts={toasts} />

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-text">
            <span className="pm-tag">WORKSPACE / VISIBILITY</span>
            <h1 className="pm-title">Portfolio Publishing</h1>
            <p className="pm-desc">
              Control whether your portfolio is publicly viewable or kept private as a draft.
            </p>
          </div>
          <div className="pm-header-actions">
            <Link to={`/preview/${user?.username}`} className="btn-pm-secondary">
              Preview Portfolio
            </Link>
            {isPublished ? (
              <button
                type="button"
                className="btn-pm-danger"
                onClick={() => setConfirmAction('unpublish')}
                disabled={isSubmitting}
              >
                Unpublish Portfolio
              </button>
            ) : (
              <button
                type="button"
                className="btn-pm-primary"
                onClick={() => setConfirmAction('publish')}
                disabled={isSubmitting}
              >
                Publish Portfolio
              </button>
            )}
          </div>
        </div>

        {/* Status Overview Card */}
        <div className="pm-status-card">
          <div className="pm-status-top">
            <span className="pm-card-label">PUBLICATION OVERVIEW</span>
            <span
              className={`pm-status-badge ${
                isPublished ? 'pm-status-badge--published' : 'pm-status-badge--draft'
              }`}
            >
              {isPublished ? 'PUBLISHED' : 'DRAFT'}
            </span>
          </div>

          <div className="pm-details-grid">
            <div className="pm-detail-item">
              <span className="pm-detail-key">Portfolio Username</span>
              <span className="pm-detail-val mono">@{user?.username}</span>
            </div>

            <div className="pm-detail-item">
              <span className="pm-detail-key">Active Design Theme</span>
              <span className="pm-detail-val">{activeThemeName}</span>
            </div>

            <div className="pm-detail-item">
              <span className="pm-detail-key">Public URL</span>
              <span className="pm-detail-val mono">{fullPublicUrl}</span>
            </div>

            <div className="pm-detail-item">
              <span className="pm-detail-key">Last Published</span>
              <span className="pm-detail-val">
                {formatDateTime(publication?.lastPublishedAt) ||
                  (publication?.migratedLegacyPublic
                    ? 'Published (Legacy Portfolio)'
                    : 'Not published yet')}
              </span>
            </div>
          </div>

          <div className="pm-actions-bar">
            <Link to={`/preview/${user?.username}`} className="btn-pm-secondary">
              Preview Portfolio
            </Link>

            {isPublished && (
              <>
                <button type="button" className="btn-pm-secondary" onClick={handleCopyLink}>
                  Copy Public Link
                </button>
                <Link
                  to={publicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pm-primary"
                >
                  <span>Open Public Portfolio</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* LocalStorage Prototype Notice */}
        <div className="pm-notice-box" role="note">
          <span className="pm-notice-title">PROTOTYPE PUBLISHING SCOPE</span>
          <p className="pm-notice-text">
            Prototype publishing stores portfolio data in this browser. Public access across devices will require backend integration.
          </p>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="pm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pm-modal-title">
            <div className="pm-modal-dialog">
              <span className="pm-tag">
                {confirmAction === 'publish' ? 'CONFIRM PUBLICATION' : 'CONFIRM UNPUBLISH'}
              </span>
              <h2 id="pm-modal-title" className="pm-modal-title">
                {confirmAction === 'publish' ? 'Publish Your Portfolio?' : 'Unpublish Your Portfolio?'}
              </h2>
              <p className="pm-modal-desc">
                {confirmAction === 'publish'
                  ? `Your portfolio will become publicly viewable at ${publicPath} within this application environment.`
                  : `Your portfolio will return to Draft mode and ${publicPath} will no longer display your content to visitors. Your saved data will remain intact.`}
              </p>
              <div className="pm-modal-actions">
                <button
                  type="button"
                  className="btn-pm-secondary"
                  onClick={() => setConfirmAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={confirmAction === 'publish' ? 'btn-pm-primary' : 'btn-pm-danger'}
                  onClick={handleConfirmOperation}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Updating...'
                    : confirmAction === 'publish'
                    ? 'Confirm Publish'
                    : 'Confirm Unpublish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
