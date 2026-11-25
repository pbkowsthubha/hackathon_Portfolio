import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import { useToast } from '../hooks/useToast'
import './CertificationsManager.css'

export default function CertificationsManager() {
  const { user } = useAuth()

  const [certifications, setCertifications] = useState(() => {
    if (user?.username) {
      return portfolioService.getUserCertifications(user.username)
    }
    return []
  })

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [deletingCert, setDeletingCert] = useState(null)

  // Form states
  const initialForm = {
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    verificationUrl: '',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Toast feedback
  const { toasts, showToast } = useToast(3500)

  const handleOpenAdd = () => {
    setEditingCert(null)
    setFormData(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cert) => {
    setEditingCert(cert)
    setFormData({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
      verificationUrl: cert.verificationUrl || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCert(null)
    setFormError('')
  }

  const validateUrl = (url) => {
    if (!url) return true
    const trimmed = url.trim()
    return /^https?:\/\//i.test(trimmed)
  }

  const handleSaveCertification = (e) => {
    e.preventDefault()
    setFormError('')

    const name = formData.name.trim()
    const issuer = formData.issuer.trim()
    const issueDate = formData.issueDate.trim()
    const expiryDate = formData.expiryDate.trim()
    const credentialId = formData.credentialId.trim()
    const verificationUrl = formData.verificationUrl.trim()

    if (!name) {
      setFormError('Certification name is required.')
      return
    }
    if (!issuer) {
      setFormError('Issuing organization is required.')
      return
    }
    if (verificationUrl && !validateUrl(verificationUrl)) {
      setFormError('Verification URL must begin with http:// or https://')
      return
    }

    // Expiry check if both dates are given
    if (issueDate && expiryDate) {
      const issueTime = new Date(issueDate).getTime()
      const expiryTime = new Date(expiryDate).getTime()
      if (!isNaN(issueTime) && !isNaN(expiryTime) && expiryTime < issueTime) {
        setFormError('Expiration date cannot be earlier than issue date.')
        return
      }
    }

    try {
      if (editingCert) {
        const updated = portfolioService.updateCertification(user.username, editingCert.id, {
          name,
          issuer,
          issueDate,
          expiryDate,
          credentialId,
          verificationUrl,
        })
        setCertifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        showToast(`Certification "${name}" updated.`)
      } else {
        const created = portfolioService.addCertification(user.username, {
          name,
          issuer,
          issueDate,
          expiryDate,
          credentialId,
          verificationUrl,
        })
        setCertifications((prev) => [created, ...prev])
        showToast(`Certification "${name}" added.`)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the certification.')
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingCert) return
    const success = portfolioService.deleteCertification(user.username, deletingCert.id)
    if (success) {
      setCertifications((prev) => prev.filter((item) => item.id !== deletingCert.id))
      showToast(`Certification "${deletingCert.name}" deleted.`)
    } else {
      showToast('Failed to delete certification.', 'error')
    }
    setDeletingCert(null)
  }

  // Filter certifications
  const filteredCertifications = certifications.filter((cert) => {
    const q = searchQuery.toLowerCase()
    return (
      cert.name.toLowerCase().includes(q) ||
      cert.issuer.toLowerCase().includes(q) ||
      (cert.credentialId && cert.credentialId.toLowerCase().includes(q))
    )
  })

  const getExpirationStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Expiration', isExpired: false }
    const expiryTime = new Date(expiryDate).getTime()
    if (isNaN(expiryTime)) return { label: `Expires: ${expiryDate}`, isExpired: false }
    return { label: `Expires: ${expiryDate}`, isExpired: false }
  }

  return (
    <DashboardLayout>
      <div className="cert-manager-container">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />

        {/* Header Bar */}
        <div className="cert-header">
          <div className="cert-header-text">
            <span className="cert-tag">WORKSPACE / CREDENTIALS</span>
            <h1 className="cert-title">My Certifications</h1>
            <p className="cert-desc">
              Verify your professional credentials, licenses, and verified certificates.
            </p>
          </div>
          <div className="cert-header-actions">
            <button
              type="button"
              className="btn-add-cert"
              onClick={handleOpenAdd}
            >
              <span className="btn-icon" aria-hidden="true">+</span>
              <span>Add Certification</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="cert-controls-bar">
          <div className="cert-search-wrapper">
            <input
              type="text"
              className="cert-search-input"
              placeholder="Search by certification name, issuer, or credential ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search certifications"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {certifications.length === 0 ? (
          <div className="cert-empty-state">
            <div className="empty-icon" aria-hidden="true">◆</div>
            <h2 className="empty-title">No certifications recorded yet</h2>
            <p className="empty-desc">
              Add professional credentials from AWS, Google, Microsoft, Meta, Coursera, or industry authorities.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={handleOpenAdd}
            >
              Add Your First Certification
            </button>
          </div>
        ) : filteredCertifications.length === 0 ? (
          <div className="cert-empty-state">
            <div className="empty-icon" aria-hidden="true">○</div>
            <h2 className="empty-title">No matching certifications</h2>
            <p className="empty-desc">
              No certifications match your query &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="cert-cards-grid">
            {filteredCertifications.map((item) => {
              const expStatus = getExpirationStatus(item.expiryDate)
              return (
                <div key={item.id} className="cert-card">
                  <div className="cert-card-top">
                    <div className="cert-badge-row">
                      <span className="cert-icon-bullet" aria-hidden="true">❖</span>
                      <span className={`cert-status-badge ${expStatus.isExpired ? 'cert-status-badge--expired' : ''}`}>
                        {expStatus.label}
                      </span>
                    </div>

                    <div className="cert-card-actions">
                      <button
                        type="button"
                        className="btn-cert-icon"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Certification"
                        aria-label="Edit certification"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-cert-icon btn-cert-icon--delete"
                        onClick={() => setDeletingCert(item)}
                        title="Delete Certification"
                        aria-label="Delete certification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <h2 className="cert-card-name">{item.name}</h2>
                  <div className="cert-issuer">{item.issuer}</div>

                  <div className="cert-meta-section">
                    {item.issueDate && (
                      <div className="cert-meta-item">
                        <span className="meta-label">Issued:</span>
                        <span className="meta-val">{item.issueDate}</span>
                      </div>
                    )}
                    {item.credentialId && (
                      <div className="cert-meta-item">
                        <span className="meta-label">Credential ID:</span>
                        <code className="meta-id-code">{item.credentialId}</code>
                      </div>
                    )}
                  </div>

                  {item.verificationUrl && (
                    <div className="cert-card-footer">
                      <a
                        href={item.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-verify-link"
                      >
                        <span>Verify Credential</span>
                        <span className="link-arrow" aria-hidden="true">↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add / Edit Certification Modal */}
        {isModalOpen && (
          <div className="cert-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cert-modal-title">
            <div className="cert-modal-dialog">
              <div className="cert-modal-header">
                <div>
                  <span className="cert-modal-tag">{editingCert ? 'UPDATE RECORD' : 'NEW CREDENTIAL'}</span>
                  <h2 id="cert-modal-title" className="cert-modal-title">
                    {editingCert ? 'Edit Certification' : 'Add Certification'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="cert-modal-close"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCertification} className="cert-modal-form">
                {formError && (
                  <div className="cert-form-error" role="alert">
                    <span className="error-icon">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="certName" className="form-label">
                    Certification Name <span className="req">*</span>
                  </label>
                  <input
                    id="certName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. AWS Certified Solutions Architect - Associate"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="certIssuer" className="form-label">
                    Issuing Organization <span className="req">*</span>
                  </label>
                  <input
                    id="certIssuer"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Amazon Web Services, Google Cloud, Microsoft"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="certIssueDate" className="form-label">
                      Issue Date <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="certIssueDate"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2024-05 or May 2024"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="certExpiryDate" className="form-label">
                      Expiration Date <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="certExpiryDate"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2027-05 or Leave blank"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="certCredId" className="form-label">
                    Credential ID / Serial <span className="opt">(Optional)</span>
                  </label>
                  <input
                    id="certCredId"
                    type="text"
                    className="form-input"
                    placeholder="e.g. AWS-839201948"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="certVerifyUrl" className="form-label">
                    Verification URL <span className="opt">(Optional)</span>
                  </label>
                  <input
                    id="certVerifyUrl"
                    type="url"
                    className="form-input"
                    placeholder="https://www.credly.com/badges/..."
                    value={formData.verificationUrl}
                    onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                  />
                </div>

                <div className="cert-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    {editingCert ? 'Save Changes' : 'Add Certification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCert && (
          <div className="cert-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-cert-title">
            <div className="cert-modal-dialog cert-modal-dialog--sm">
              <div className="cert-modal-header">
                <div>
                  <span className="cert-modal-tag cert-modal-tag--danger">CONFIRM REMOVAL</span>
                  <h2 id="delete-cert-title" className="cert-modal-title">Delete Certification</h2>
                </div>
                <button
                  type="button"
                  className="cert-modal-close"
                  onClick={() => setDeletingCert(null)}
                  aria-label="Cancel deletion"
                >
                  ✕
                </button>
              </div>

              <div className="cert-delete-body">
                <p>
                  Are you sure you want to delete <strong>&quot;{deletingCert.name}&quot;</strong> ({deletingCert.issuer})?
                </p>
                <p className="delete-subtext">This action permanently removes this credential from your portfolio.</p>
              </div>

              <div className="cert-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeletingCert(null)}
                >
                  Keep Record
                </button>
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={handleConfirmDelete}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
