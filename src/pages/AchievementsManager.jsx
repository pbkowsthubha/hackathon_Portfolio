import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import { useToast } from '../hooks/useToast'
import './AchievementsManager.css'

const ACHIEVEMENT_CATEGORIES = [
  'Hackathons',
  'Competitions',
  'Awards',
  'Academic Recognition',
  'Research',
  'Other',
]

export default function AchievementsManager() {
  const { user } = useAuth()

  const [achievements, setAchievements] = useState(() => {
    if (user?.username) {
      return portfolioService.getUserAchievements(user.username)
    }
    return []
  })

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAch, setEditingAch] = useState(null)
  const [deletingAch, setDeletingAch] = useState(null)

  // Form states
  const initialForm = {
    title: '',
    description: '',
    issuer: '',
    date: '',
    category: 'Hackathons',
    evidenceUrl: '',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Toast feedback
  const { toasts, showToast } = useToast(3500)

  const handleOpenAdd = () => {
    setEditingAch(null)
    setFormData(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (ach) => {
    setEditingAch(ach)
    setFormData({
      title: ach.title,
      description: ach.description,
      issuer: ach.issuer || '',
      date: ach.date || '',
      category: ach.category || 'Other',
      evidenceUrl: ach.evidenceUrl || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAch(null)
    setFormError('')
  }

  const validateUrl = (url) => {
    if (!url) return true
    const trimmed = url.trim()
    return /^https?:\/\//i.test(trimmed)
  }

  const handleSaveAchievement = (e) => {
    e.preventDefault()
    setFormError('')

    const title = formData.title.trim()
    const description = formData.description.trim()
    const evidenceUrl = formData.evidenceUrl.trim()

    if (!title) {
      setFormError('Achievement title is required.')
      return
    }
    if (!description) {
      setFormError('Achievement description is required.')
      return
    }
    if (evidenceUrl && !validateUrl(evidenceUrl)) {
      setFormError('Evidence URL must begin with http:// or https://')
      return
    }

    try {
      if (editingAch) {
        const updated = portfolioService.updateAchievement(user.username, editingAch.id, {
          title,
          description,
          issuer: formData.issuer.trim(),
          date: formData.date.trim(),
          category: formData.category,
          evidenceUrl,
        })
        setAchievements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        showToast(`Achievement "${title}" updated.`)
      } else {
        const created = portfolioService.addAchievement(user.username, {
          title,
          description,
          issuer: formData.issuer.trim(),
          date: formData.date.trim(),
          category: formData.category,
          evidenceUrl,
        })
        setAchievements((prev) => [created, ...prev])
        showToast(`Achievement "${title}" recorded.`)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the achievement.')
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingAch) return
    const success = portfolioService.deleteAchievement(user.username, deletingAch.id)
    if (success) {
      setAchievements((prev) => prev.filter((item) => item.id !== deletingAch.id))
      showToast(`Achievement "${deletingAch.title}" deleted.`)
    } else {
      showToast('Failed to delete achievement.', 'error')
    }
    setDeletingAch(null)
  }

  // Filter achievements
  const filteredAchievements = achievements.filter((ach) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      ach.category?.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch =
      ach.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ach.issuer && ach.issuer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ach.description && ach.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="achievements-manager-container">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />

        {/* Header Bar */}
        <div className="ach-header">
          <div className="ach-header-text">
            <span className="ach-tag">WORKSPACE / HONORS</span>
            <h1 className="ach-title">My Achievements</h1>
            <p className="ach-desc">
              Showcase honors, awards, hackathon victories, and academic recognitions.
            </p>
          </div>
          <div className="ach-header-actions">
            <button
              type="button"
              className="btn-add-ach"
              onClick={handleOpenAdd}
            >
              <span className="btn-icon" aria-hidden="true">+</span>
              <span>Add Achievement</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="ach-controls-bar">
          <div className="ach-search-wrapper">
            <input
              type="text"
              className="ach-search-input"
              placeholder="Search achievements by title, issuer, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search achievements"
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

          <div className="ach-tabs" role="tablist" aria-label="Achievement Categories">
            <button
              type="button"
              className={`ach-tab-btn ${selectedCategory === 'ALL' ? 'ach-tab-btn--active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All ({achievements.length})
            </button>
            {ACHIEVEMENT_CATEGORIES.map((cat) => {
              const count = achievements.filter(
                (a) => a.category?.toLowerCase() === cat.toLowerCase()
              ).length
              return (
                <button
                  key={cat}
                  type="button"
                  className={`ach-tab-btn ${selectedCategory === cat ? 'ach-tab-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Content View */}
        {achievements.length === 0 ? (
          <div className="ach-empty-state">
            <div className="empty-icon" aria-hidden="true">◆</div>
            <h2 className="empty-title">No achievements recorded yet</h2>
            <p className="empty-desc">
              Add your competition wins, published papers, hackathon prizes, or prestigious awards.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={handleOpenAdd}
            >
              Record Your First Achievement
            </button>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="ach-empty-state">
            <div className="empty-icon" aria-hidden="true">○</div>
            <h2 className="empty-title">No matching achievements</h2>
            <p className="empty-desc">
              No records match your search query &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="ach-cards-grid">
            {filteredAchievements.map((item) => (
              <div key={item.id} className="ach-card">
                <div className="ach-card-top">
                  <div className="ach-meta-row">
                    <span className="ach-cat-pill">{item.category}</span>
                    {item.date && <span className="ach-date">{item.date}</span>}
                  </div>
                  <div className="ach-card-actions">
                    <button
                      type="button"
                      className="btn-ach-icon"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Achievement"
                      aria-label="Edit achievement"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn-ach-icon btn-ach-icon--delete"
                      onClick={() => setDeletingAch(item)}
                      title="Delete Achievement"
                      aria-label="Delete achievement"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <h2 className="ach-card-title">{item.title}</h2>

                {item.issuer && (
                  <div className="ach-issuer">
                    <span className="issuer-label">Conferred by:</span>
                    <span className="issuer-val">{item.issuer}</span>
                  </div>
                )}

                <p className="ach-card-desc">{item.description}</p>

                {item.evidenceUrl && (
                  <div className="ach-card-footer">
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ach-evidence-link"
                    >
                      <span>View Credential / Proof</span>
                      <span className="link-arrow" aria-hidden="true">↗</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Achievement Modal */}
        {isModalOpen && (
          <div className="ach-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ach-modal-title">
            <div className="ach-modal-dialog">
              <div className="ach-modal-header">
                <div>
                  <span className="ach-modal-tag">{editingAch ? 'UPDATE RECORD' : 'NEW HONOR'}</span>
                  <h2 id="ach-modal-title" className="ach-modal-title">
                    {editingAch ? 'Edit Achievement' : 'Record Achievement'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="ach-modal-close"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAchievement} className="ach-modal-form">
                {formError && (
                  <div className="ach-form-error" role="alert">
                    <span className="error-icon">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="achTitle" className="form-label">
                    Achievement Title <span className="req">*</span>
                  </label>
                  <input
                    id="achTitle"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1st Place - National Hackathon 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="achCategory" className="form-label">
                      Category <span className="req">*</span>
                    </label>
                    <select
                      id="achCategory"
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {ACHIEVEMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="achDate" className="form-label">
                      Date / Period <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="achDate"
                      type="text"
                      className="form-input"
                      placeholder="e.g. October 2024, Spring 2023"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="achIssuer" className="form-label">
                    Awarding Organization / Issuer <span className="opt">(Optional)</span>
                  </label>
                  <input
                    id="achIssuer"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Google Cloud, Major League Hacking, IEEE"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="achDescription" className="form-label">
                    Description & Impact <span className="req">*</span>
                  </label>
                  <textarea
                    id="achDescription"
                    rows={4}
                    className="form-textarea"
                    placeholder="Summarize the achievement, project delivered, competition scale, or key recognition."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="achEvidence" className="form-label">
                    Evidence URL / Certificate Link <span className="opt">(Optional)</span>
                  </label>
                  <input
                    id="achEvidence"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/certificate"
                    value={formData.evidenceUrl}
                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                  />
                </div>

                <div className="ach-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    {editingAch ? 'Save Changes' : 'Record Achievement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingAch && (
          <div className="ach-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-ach-title">
            <div className="ach-modal-dialog ach-modal-dialog--sm">
              <div className="ach-modal-header">
                <div>
                  <span className="ach-modal-tag ach-modal-tag--danger">CONFIRM REMOVAL</span>
                  <h2 id="delete-ach-title" className="ach-modal-title">Delete Achievement</h2>
                </div>
                <button
                  type="button"
                  className="ach-modal-close"
                  onClick={() => setDeletingAch(null)}
                  aria-label="Cancel deletion"
                >
                  ✕
                </button>
              </div>

              <div className="ach-delete-body">
                <p>
                  Are you sure you want to delete <strong>&quot;{deletingAch.title}&quot;</strong>?
                </p>
                <p className="delete-subtext">This action permanently removes this record from your portfolio.</p>
              </div>

              <div className="ach-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeletingAch(null)}
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
