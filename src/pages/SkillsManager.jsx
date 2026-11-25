import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import { useToast } from '../hooks/useToast'
import './SkillsManager.css'

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frameworks & Libraries',
  'Tools & Platforms',
  'Other Skills',
]

export default function SkillsManager() {
  const { user } = useAuth()

  const [skills, setSkills] = useState(() => {
    if (user?.username) {
      return portfolioService.getUserSkills(user.username)
    }
    return []
  })

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [deletingSkill, setDeletingSkill] = useState(null)

  // Form states
  const initialForm = {
    name: '',
    category: 'Programming Languages',
    description: '',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Toast feedback
  const { toasts, showToast } = useToast(3500)

  const handleOpenAdd = (defaultCat = 'Programming Languages') => {
    setEditingSkill(null)
    setFormData({
      name: '',
      category: SKILL_CATEGORIES.includes(defaultCat) ? defaultCat : 'Programming Languages',
      description: '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSkill(null)
    setFormError('')
  }

  const handleSaveSkill = (e) => {
    e.preventDefault()
    setFormError('')

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setFormError('Skill name is required.')
      return
    }

    try {
      if (editingSkill) {
        const updated = portfolioService.updateSkill(user.username, editingSkill.id, {
          name: trimmedName,
          category: formData.category,
          description: formData.description,
        })
        setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        showToast(`Skill "${trimmedName}" updated successfully.`)
      } else {
        const created = portfolioService.addSkill(user.username, {
          name: trimmedName,
          category: formData.category,
          description: formData.description,
        })
        setSkills((prev) => [...prev, created])
        showToast(`Skill "${trimmedName}" added to ${formData.category}.`)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the skill.')
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingSkill) return
    const success = portfolioService.deleteSkill(user.username, deletingSkill.id)
    if (success) {
      setSkills((prev) => prev.filter((s) => s.id !== deletingSkill.id))
      showToast(`Skill "${deletingSkill.name}" removed.`)
    } else {
      showToast('Failed to delete skill.', 'error')
    }
    setDeletingSkill(null)
  }

  const handleMove = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= skills.length) return

    const reordered = [...skills]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    setSkills(reordered)
    portfolioService.reorderSkills(user.username, reordered)
  }

  // Filter skills based on category & search
  const filteredSkills = skills.filter((skill) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      skill.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Group filtered skills by category for organized display
  const categoriesToRender =
    selectedCategory === 'ALL'
      ? SKILL_CATEGORIES
      : SKILL_CATEGORIES.filter((c) => c.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <DashboardLayout>
      <div className="skills-manager-container">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />

        {/* Header Bar */}
        <div className="sm-header">
          <div className="sm-header-text">
            <span className="sm-tag">WORKSPACE / CURATION</span>
            <h1 className="sm-title">My Skills</h1>
            <p className="sm-desc">
              Organize the technologies and capabilities that define your work.
            </p>
          </div>
          <div className="sm-header-actions">
            <button
              type="button"
              className="btn-add-skill"
              onClick={() => handleOpenAdd()}
            >
              <span className="btn-icon" aria-hidden="true">+</span>
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="sm-controls-bar">
          <div className="sm-search-wrapper">
            <input
              type="text"
              className="sm-search-input"
              placeholder="Filter skills by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search skills"
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

          <div className="sm-tabs" role="tablist" aria-label="Skill Categories">
            <button
              type="button"
              className={`sm-tab-btn ${selectedCategory === 'ALL' ? 'sm-tab-btn--active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All Skills ({skills.length})
            </button>
            {SKILL_CATEGORIES.map((cat) => {
              const count = skills.filter(
                (s) => s.category.toLowerCase() === cat.toLowerCase()
              ).length
              return (
                <button
                  key={cat}
                  type="button"
                  className={`sm-tab-btn ${selectedCategory === cat ? 'sm-tab-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Skills View */}
        {skills.length === 0 ? (
          <div className="sm-empty-state">
            <div className="empty-icon" aria-hidden="true">◆</div>
            <h2 className="empty-title">No skills added yet</h2>
            <p className="empty-desc">
              Showcase your technical stack and proficiencies to potential collaborators and employers.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => handleOpenAdd()}
            >
              Add Your First Skill
            </button>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="sm-empty-state">
            <div className="empty-icon" aria-hidden="true">○</div>
            <h2 className="empty-title">No matching skills found</h2>
            <p className="empty-desc">
              No skills match your current search query &quot;{searchQuery}&quot;.
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
          <div className="sm-categories-stack">
            {categoriesToRender.map((cat) => {
              const catSkills = filteredSkills.filter(
                (s) => s.category.toLowerCase() === cat.toLowerCase()
              )

              if (catSkills.length === 0 && selectedCategory !== 'ALL') {
                return (
                  <div key={cat} className="sm-category-section">
                    <div className="sm-category-header">
                      <h2 className="sm-category-name">{cat}</h2>
                      <span className="sm-category-badge">0 skills</span>
                    </div>
                    <div className="sm-empty-cat">
                      <span>No skills in this category yet.</span>
                      <button
                        type="button"
                        className="btn-text-add"
                        onClick={() => handleOpenAdd(cat)}
                      >
                        + Add to {cat}
                      </button>
                    </div>
                  </div>
                )
              }

              if (catSkills.length === 0) return null

              return (
                <div key={cat} className="sm-category-section">
                  <div className="sm-category-header">
                    <div className="cat-title-group">
                      <span className="cat-bullet">■</span>
                      <h2 className="sm-category-name">{cat}</h2>
                    </div>
                    <div className="cat-header-right">
                      <span className="sm-category-badge">{catSkills.length} {catSkills.length === 1 ? 'skill' : 'skills'}</span>
                      <button
                        type="button"
                        className="btn-cat-quick-add"
                        onClick={() => handleOpenAdd(cat)}
                        title={`Add skill to ${cat}`}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="sm-skills-grid">
                    {catSkills.map((skill) => {
                      const globalIndex = skills.findIndex((s) => s.id === skill.id)
                      return (
                        <div key={skill.id} className="skill-card">
                          <div className="skill-card-top">
                            <h3 className="skill-name">{skill.name}</h3>
                            <div className="skill-card-actions">
                              <button
                                type="button"
                                className="btn-skill-icon"
                                onClick={() => handleMove(globalIndex, -1)}
                                disabled={globalIndex === 0}
                                title="Move Earlier"
                                aria-label="Move skill earlier"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn-skill-icon"
                                onClick={() => handleMove(globalIndex, 1)}
                                disabled={globalIndex === skills.length - 1}
                                title="Move Later"
                                aria-label="Move skill later"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="btn-skill-icon"
                                onClick={() => handleOpenEdit(skill)}
                                title="Edit Skill"
                                aria-label="Edit skill"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                className="btn-skill-icon btn-skill-icon--delete"
                                onClick={() => setDeletingSkill(skill)}
                                title="Delete Skill"
                                aria-label="Delete skill"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {skill.description && (
                            <p className="skill-desc">{skill.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add / Edit Skill Modal */}
        {isModalOpen && (
          <div className="sm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="skill-modal-title">
            <div className="sm-modal-dialog">
              <div className="sm-modal-header">
                <div>
                  <span className="sm-modal-tag">{editingSkill ? 'UPDATE RECORD' : 'NEW CAPABILITY'}</span>
                  <h2 id="skill-modal-title" className="sm-modal-title">
                    {editingSkill ? `Edit "${editingSkill.name}"` : 'Add New Skill'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="sm-modal-close"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSkill} className="sm-modal-form">
                {formError && (
                  <div className="sm-form-error" role="alert">
                    <span className="error-icon">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="skillName" className="form-label">
                    Skill Name <span className="req">*</span>
                  </label>
                  <input
                    id="skillName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. TypeScript, React, Docker, Figma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="skillCategory" className="form-label">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    id="skillCategory"
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="skillDescription" className="form-label">
                    Proficiency Context / Notes <span className="opt">(Optional)</span>
                  </label>
                  <input
                    id="skillDescription"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4+ years building production SPAs and component systems"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="sm-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    {editingSkill ? 'Save Changes' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingSkill && (
          <div className="sm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-skill-title">
            <div className="sm-modal-dialog sm-modal-dialog--sm">
              <div className="sm-modal-header">
                <div>
                  <span className="sm-modal-tag sm-modal-tag--danger">CONFIRM REMOVAL</span>
                  <h2 id="delete-skill-title" className="sm-modal-title">Delete Skill</h2>
                </div>
                <button
                  type="button"
                  className="sm-modal-close"
                  onClick={() => setDeletingSkill(null)}
                  aria-label="Cancel deletion"
                >
                  ✕
                </button>
              </div>

              <div className="sm-delete-body">
                <p>
                  Are you sure you want to delete <strong>&quot;{deletingSkill.name}&quot;</strong> from your{' '}
                  <em>{deletingSkill.category}</em>?
                </p>
                <p className="delete-subtext">This action can be undone by re-adding the skill.</p>
              </div>

              <div className="sm-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeletingSkill(null)}
                >
                  Keep Skill
                </button>
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={handleConfirmDelete}
                >
                  Delete Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
