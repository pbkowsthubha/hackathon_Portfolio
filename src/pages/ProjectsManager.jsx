import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import { processProjectThumbnail, validateImageFile } from '../services/imageUtils'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import './ProjectsManager.css'

const CATEGORIES = [
  'Web Development',
  'Mobile Application',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Research',
  'Other',
]

const WIZARD_STEPS = [
  { id: 1, number: '01', title: 'Project Details' },
  { id: 2, number: '02', title: 'Technologies & Media' },
  { id: 3, number: '03', title: 'Review & Save' },
]

export default function ProjectsManager() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Loaded projects list
  const [projects, setProjects] = useState(() => {
    if (user?.username) {
      return portfolioService.getUserProjects(user.username)
    }
    return []
  })

  // Modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [previewProject, setPreviewProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1)

  // Active form data
  const initialFormState = {
    title: '',
    category: 'Web Development',
    description: '',
    technologies: [],
    image: '',
    githubUrl: '',
    liveUrl: '',
    completionDate: '',
    featured: false,
  }

  const [formData, setFormData] = useState(initialFormState)
  const [techInput, setTechInput] = useState('')
  const [imageProcessing, setImageProcessing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [notification, setNotification] = useState(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  // Reload projects from storage
  const reloadProjects = useCallback(() => {
    if (user?.username) {
      const projs = portfolioService.getUserProjects(user.username)
      setProjects(projs)
    }
  }, [user])

  // Clear notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Keyboard accessibility for modals (Escape key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewProject) setPreviewProject(null)
        else if (deletingProject) setDeletingProject(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewProject, deletingProject])

  // Derived Statistics
  const totalCount = projects.length
  const featuredCount = projects.filter((p) => p.featured).length
  const githubCount = projects.filter((p) => Boolean(p.githubUrl?.trim())).length
  const liveCount = projects.filter((p) => Boolean(p.liveUrl?.trim())).length

  // Save draft for new project in progress
  const persistDraft = (updatedForm, step) => {
    if (editingProjectId || !user?.username) return
    portfolioService.saveProjectDraft(user.username, {
      currentStep: step,
      formData: updatedForm,
    })
  }

  // Open Add Project Wizard
  const handleOpenAddWizard = () => {
    setEditingProjectId(null)
    setFieldErrors({})

    // Check for existing draft
    if (user?.username) {
      const draft = portfolioService.getProjectDraft(user.username)
      if (draft && draft.formData && Object.keys(draft.formData).length > 0) {
        setFormData({ ...initialFormState, ...draft.formData })
        setCurrentStep(draft.currentStep || 1)
        setHasRestoredDraft(true)
        setIsWizardOpen(true)
        return
      }
    }

    setFormData(initialFormState)
    setTechInput('')
    setCurrentStep(1)
    setHasRestoredDraft(false)
    setIsWizardOpen(true)
  }

  // Open Edit Project Wizard
  const handleOpenEditWizard = (project) => {
    setEditingProjectId(project.id)
    setFormData({
      title: project.title || '',
      category: project.category || 'Web Development',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) ? [...project.technologies] : [],
      image: project.image || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      completionDate: project.completionDate || '',
      featured: Boolean(project.featured),
    })
    setTechInput('')
    setFieldErrors({})
    setCurrentStep(1)
    setHasRestoredDraft(false)
    setIsWizardOpen(true)
  }

  // Close Wizard
  const handleCloseWizard = () => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormState)
    if (isDirty && !editingProjectId) {
      // Draft remains saved automatically
    }
    setIsWizardOpen(false)
    setEditingProjectId(null)
  }

  // Discard Draft
  const handleDiscardDraft = () => {
    const confirm = window.confirm('Discard your unsaved project draft?')
    if (!confirm) return

    if (user?.username) {
      portfolioService.clearProjectDraft(user.username)
    }
    setFormData(initialFormState)
    setCurrentStep(1)
    setHasRestoredDraft(false)
    setFieldErrors({})
  }

  // Field change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    const updated = { ...formData, [name]: val }
    setFormData(updated)
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    persistDraft(updated, currentStep)
  }

  // Add technology tag
  const handleAddTech = (e) => {
    if (e) e.preventDefault()
    const trimmed = techInput.trim()
    if (!trimmed) return

    // Case-insensitive duplicate check
    if (formData.technologies.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setFieldErrors((prev) => ({ ...prev, technologies: 'Technology already added.' }))
      return
    }

    const updatedTechs = [...formData.technologies, trimmed]
    const updated = { ...formData, technologies: updatedTechs }
    setFormData(updated)
    setTechInput('')
    setFieldErrors((prev) => ({ ...prev, technologies: '' }))
    persistDraft(updated, currentStep)
  }

  // Remove technology tag
  const handleRemoveTech = (techToRemove) => {
    const updatedTechs = formData.technologies.filter((t) => t !== techToRemove)
    const updated = { ...formData, technologies: updatedTechs }
    setFormData(updated)
    persistDraft(updated, currentStep)
  }

  // Handle Thumbnail upload with canvas resizing
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setFieldErrors((prev) => ({ ...prev, image: validation.error }))
      return
    }

    setImageProcessing(true)
    setFieldErrors((prev) => ({ ...prev, image: '' }))

    try {
      const compressedDataUrl = await processProjectThumbnail(file, 900, 0.82)
      const updated = { ...formData, image: compressedDataUrl }
      setFormData(updated)
      persistDraft(updated, currentStep)
    } catch (err) {
      setFieldErrors((prev) => ({ ...prev, image: err.message || 'Image processing failed.' }))
    } finally {
      setImageProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Remove thumbnail
  const handleRemoveImage = () => {
    const updated = { ...formData, image: '' }
    setFormData(updated)
    persistDraft(updated, currentStep)
  }

  // URL Validation
  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true
    const trimmed = url.trim()
    if (trimmed.toLowerCase().startsWith('javascript:')) return false
    return /^https?:\/\//i.test(trimmed)
  }

  // Step Validation
  const validateStep = (stepNumber) => {
    const errs = {}

    if (stepNumber === 1) {
      if (!formData.title.trim()) {
        errs.title = 'Project Title is required.'
      }
      if (!formData.category.trim()) {
        errs.category = 'Project Category is required.'
      }
      if (!formData.description.trim()) {
        errs.description = 'Project Description is required.'
      }
    }

    if (stepNumber === 2) {
      if (!formData.technologies || formData.technologies.length === 0) {
        errs.technologies = 'Please add at least one technology tag.'
      }
      if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
        errs.githubUrl = 'Must be a valid URL starting with http:// or https://'
      }
      if (formData.liveUrl && !isValidUrl(formData.liveUrl)) {
        errs.liveUrl = 'Must be a valid URL starting with http:// or https://'
      }
    }

    return errs
  }

  // Navigation handlers
  const handleNextStep = () => {
    const errs = validateStep(currentStep)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    const next = currentStep + 1
    setCurrentStep(next)
    persistDraft(formData, next)
  }

  const handlePrevStep = () => {
    setFieldErrors({})
    const prev = Math.max(1, currentStep - 1)
    setCurrentStep(prev)
    persistDraft(formData, prev)
  }

  // Save Project (Final Step 3)
  const handleSaveProject = (e) => {
    e.preventDefault()
    const errs1 = validateStep(1)
    const errs2 = validateStep(2)
    const allErrs = { ...errs1, ...errs2 }

    if (Object.keys(allErrs).length > 0) {
      setFieldErrors(allErrs)
      if (errs1.title || errs1.category || errs1.description) setCurrentStep(1)
      else setCurrentStep(2)
      return
    }

    try {
      if (editingProjectId) {
        portfolioService.updateProject(user.username, editingProjectId, formData)
        setNotification({ type: 'success', message: `Project "${formData.title}" updated successfully.` })
      } else {
        portfolioService.addProject(user.username, formData)
        portfolioService.clearProjectDraft(user.username)
        setNotification({ type: 'success', message: `Project "${formData.title}" created successfully.` })
      }

      reloadProjects()
      setIsWizardOpen(false)
      setEditingProjectId(null)
      setFormData(initialFormState)
      setCurrentStep(1)
    } catch (err) {
      setFieldErrors({ submit: err.message || 'Failed to save project. Storage quota may be exceeded.' })
    }
  }

  // Toggle Featured
  const handleToggleFeatured = (projectId) => {
    try {
      portfolioService.toggleFeaturedProject(user.username, projectId)
      reloadProjects()
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update featured status.' })
    }
  }

  // Move Project Up in Order
  const handleMoveUp = (index) => {
    if (index === 0) return
    const reordered = [...projects]
    const temp = reordered[index - 1]
    reordered[index - 1] = reordered[index]
    reordered[index] = temp
    portfolioService.reorderProjects(user.username, reordered)
    reloadProjects()
  }

  // Move Project Down in Order
  const handleMoveDown = (index) => {
    if (index === projects.length - 1) return
    const reordered = [...projects]
    const temp = reordered[index + 1]
    reordered[index + 1] = reordered[index]
    reordered[index] = temp
    portfolioService.reorderProjects(user.username, reordered)
    reloadProjects()
  }

  // Delete Project Confirmation & Execution
  const handleConfirmDelete = () => {
    if (!deletingProject) return
    try {
      portfolioService.deleteProject(user.username, deletingProject.id)
      setNotification({ type: 'success', message: `Project "${deletingProject.title}" was deleted.` })
      setDeletingProject(null)
      reloadProjects()
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete project.' })
    }
  }

  return (
    <DashboardLayout>
      <div className="projects-manager-container">
        {/* Top Header */}
        <div className="projects-top-bar">
          <div className="top-bar-left">
            <span className="projects-sub-tag">PORTFOLIO STUDIO · SHOWCASE MANAGER</span>
            <h1 className="projects-heading">My Projects</h1>
            <p className="projects-caption">
              Showcase your work, experiments and accomplishments.
            </p>
          </div>

          <div className="top-bar-actions">
            <button
              type="button"
              onClick={handleOpenAddWizard}
              className="btn-add-project"
            >
              <span>+</span> Add New Project
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div
            className={`projects-alert-banner alert-${notification.type}`}
            role="status"
          >
            <span className="alert-icon">
              {notification.type === 'success' ? '✓' : '⚠'}
            </span>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Real-time Statistics Cards */}
        <div className="projects-stats-grid">
          <div className="stat-card">
            <span className="stat-label">TOTAL PROJECTS</span>
            <span className="stat-value">{totalCount}</span>
            <span className="stat-desc">Published & draft showcases</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">FEATURED PROJECTS</span>
            <span className="stat-value">{featuredCount}</span>
            <span className="stat-desc">Highlighted on public portfolio</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">WITH GITHUB REPOSITORY</span>
            <span className="stat-value">{githubCount}</span>
            <span className="stat-desc">Open-source codebases linked</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">WITH LIVE DEMO</span>
            <span className="stat-value">{liveCount}</span>
            <span className="stat-desc">Interactive deployments connected</span>
          </div>
        </div>

        {/* Projects List or Empty State */}
        {projects.length === 0 ? (
          <div className="projects-empty-card">
            <div className="empty-card-visual" aria-hidden="true">
              <span className="empty-icon-monogram">◈</span>
            </div>
            <h2 className="empty-title">Your next great project starts here.</h2>
            <p className="empty-desc">
              Add your first project to begin building your professional showcase. Include technologies, architecture notes, and live repository links.
            </p>
            <button
              type="button"
              onClick={handleOpenAddWizard}
              className="btn-empty-cta"
            >
              + Add Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, idx) => (
              <article key={project.id} className="project-card">
                {/* Card Thumbnail */}
                <div className="card-thumb-frame">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={`Thumbnail for ${project.title}`}
                      className="card-thumb-img"
                    />
                  ) : (
                    <div className="card-thumb-fallback">
                      <span className="thumb-fallback-mono">FIG. 0{idx + 1}</span>
                      <span className="thumb-fallback-icon">◈</span>
                    </div>
                  )}

                  <div className="card-thumb-badges">
                    <span className="badge-project-num">PROJECT {String(idx + 1).padStart(2, '0')}</span>
                    {project.featured && (
                      <span className="badge-featured">★ FEATURED</span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-body">
                  <div className="card-meta-line">
                    <span className="project-category-tag">{project.category}</span>
                    {project.completionDate && (
                      <span className="project-date-tag">{project.completionDate}</span>
                    )}
                  </div>

                  <h3 className="project-card-title">{project.title}</h3>

                  <p className="project-card-desc">
                    {project.description.length > 130
                      ? `${project.description.slice(0, 130)}...`
                      : project.description}
                  </p>

                  {/* Technology Chips */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="project-tech-chips">
                      {project.technologies.map((tech, tIdx) => (
                        <span key={tIdx} className="tech-chip">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="card-footer">
                  <div className="card-links-group">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-link"
                        title="View GitHub Repository"
                      >
                        GitHub ↗
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-link"
                        title="View Live Application"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>

                  <div className="card-manage-group">
                    {/* Reorder Buttons */}
                    <div className="reorder-btn-pair">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="btn-reorder"
                        title="Move project up in display order"
                        aria-label="Move project up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === projects.length - 1}
                        className="btn-reorder"
                        title="Move project down in display order"
                        aria-label="Move project down"
                      >
                        ↓
                      </button>
                    </div>

                    {/* Toggle Featured */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project.id)}
                      className={`btn-icon-action ${project.featured ? 'btn-star--active' : ''}`}
                      title={project.featured ? 'Unfeature project' : 'Mark as featured'}
                      aria-label={project.featured ? 'Unfeature project' : 'Mark as featured'}
                    >
                      {project.featured ? '★' : '☆'}
                    </button>

                    {/* Preview Project */}
                    <button
                      type="button"
                      onClick={() => setPreviewProject(project)}
                      className="btn-icon-action"
                      title="Preview project in presentation layout"
                      aria-label="Preview project"
                    >
                      👁
                    </button>

                    {/* Edit Project */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditWizard(project)}
                      className="btn-icon-action"
                      title="Edit project details"
                      aria-label="Edit project"
                    >
                      ✎
                    </button>

                    {/* Delete Project */}
                    <button
                      type="button"
                      onClick={() => setDeletingProject(project)}
                      className="btn-icon-action btn-icon-delete"
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* -----------------------------------------------------------------
            THREE-STEP ADD / EDIT PROJECT WIZARD MODAL
           ----------------------------------------------------------------- */}
        {isWizardOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-modal-title">
            <div className="modal-container wizard-modal">
              {/* Modal Top Bar */}
              <div className="modal-header">
                <div>
                  <span className="modal-sub-tag">
                    {editingProjectId ? 'EDITING PROJECT' : 'NEW SHOWCASE INITIATIVE'}
                  </span>
                  <h2 id="wizard-modal-title" className="modal-title">
                    {editingProjectId ? 'Edit Project' : 'Add New Project'}
                  </h2>
                </div>

                <div className="modal-header-actions">
                  {hasRestoredDraft && !editingProjectId && (
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="btn-modal-discard"
                    >
                      Discard Draft
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseWizard}
                    className="btn-modal-close"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Restored Draft Banner */}
              {hasRestoredDraft && !editingProjectId && (
                <div className="editor-alert-banner alert-info modal-draft-alert">
                  <span className="alert-icon">ℹ</span>
                  <span>Restored unsaved project draft. You can continue or discard it.</span>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="wizard-stepper-wrap">
                <div className="wizard-progress-track">
                  <div
                    className="wizard-progress-fill"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>

                <div className="wizard-steps-tabs">
                  {WIZARD_STEPS.map((s) => {
                    const isCurrent = s.id === currentStep
                    const isDone = s.id < currentStep
                    return (
                      <div
                        key={s.id}
                        className={`modal-step-tab ${isCurrent ? 'modal-step-tab--active' : ''} ${
                          isDone ? 'modal-step-tab--done' : ''
                        }`}
                      >
                        <span className="step-num-circle">{isDone ? '✓' : s.number}</span>
                        <span className="step-name-text">{s.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Modal Form Body */}
              <div className="modal-body">
                {/* STEP 1: PROJECT DETAILS */}
                {currentStep === 1 && (
                  <div className="wizard-step-content" id="project-wizard-step-1">
                    <div className="field-group">
                      <label htmlFor="proj-title" className="field-label">
                        Project Title <span className="field-required">*</span>
                      </label>
                      <input
                        id="proj-title"
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Distributed Consensus Engine"
                        className={`field-input ${fieldErrors.title ? 'field-input--error' : ''}`}
                        autoFocus
                      />
                      {fieldErrors.title && (
                        <span className="field-error-text">{fieldErrors.title}</span>
                      )}
                    </div>

                    <div className="field-group">
                      <label htmlFor="proj-category" className="field-label">
                        Project Category <span className="field-required">*</span>
                      </label>
                      <select
                        id="proj-category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="field-select"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <div className="field-label-with-counter">
                        <label htmlFor="proj-desc" className="field-label">
                          Project Description <span className="field-required">*</span>
                        </label>
                        <span className="char-counter">{formData.description.length} / 1000</span>
                      </div>
                      <textarea
                        id="proj-desc"
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleInputChange}
                        maxLength={1000}
                        placeholder="Describe the architectural problem, your engineering implementation, key trade-offs, and project impact..."
                        className={`field-textarea ${fieldErrors.description ? 'field-textarea--error' : ''}`}
                      />
                      {fieldErrors.description && (
                        <span className="field-error-text">{fieldErrors.description}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: TECHNOLOGIES & MEDIA */}
                {currentStep === 2 && (
                  <div className="wizard-step-content" id="project-wizard-step-2">
                    {/* Technology Tags Input */}
                    <div className="field-group">
                      <label className="field-label">
                        Technologies Used <span className="field-required">*</span>
                      </label>
                      <div className="tag-input-row">
                        <input
                          type="text"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTech()
                            }
                          }}
                          placeholder="e.g. React, Rust, PostgreSQL (press Enter)"
                          className="field-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddTech}
                          className="btn-add-tag"
                        >
                          Add Tag
                        </button>
                      </div>

                      {fieldErrors.technologies && (
                        <span className="field-error-text">{fieldErrors.technologies}</span>
                      )}

                      {/* Rendered Chips */}
                      <div className="tags-container">
                        {formData.technologies.map((tech, i) => (
                          <span key={i} className="active-tag-chip">
                            {tech}
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(tech)}
                              className="btn-remove-tag"
                              aria-label={`Remove ${tech}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* URLs */}
                    <div className="form-row-pair">
                      <div className="field-group">
                        <label htmlFor="proj-github" className="field-label">
                          GitHub Repository URL (Optional)
                        </label>
                        <input
                          id="proj-github"
                          type="url"
                          name="githubUrl"
                          value={formData.githubUrl}
                          onChange={handleInputChange}
                          placeholder="https://github.com/user/repo"
                          className={`field-input ${fieldErrors.githubUrl ? 'field-input--error' : ''}`}
                        />
                        {fieldErrors.githubUrl && (
                          <span className="field-error-text">{fieldErrors.githubUrl}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label htmlFor="proj-live" className="field-label">
                          Live Demo URL (Optional)
                        </label>
                        <input
                          id="proj-live"
                          type="url"
                          name="liveUrl"
                          value={formData.liveUrl}
                          onChange={handleInputChange}
                          placeholder="https://demo.domain.com"
                          className={`field-input ${fieldErrors.liveUrl ? 'field-input--error' : ''}`}
                        />
                        {fieldErrors.liveUrl && (
                          <span className="field-error-text">{fieldErrors.liveUrl}</span>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div className="field-group">
                      <label className="field-label">Project Thumbnail Image (Optional)</label>
                      <div className="project-image-upload-row">
                        <div className="project-image-preview-frame">
                          {formData.image ? (
                            <img
                              src={formData.image}
                              alt="Project thumbnail preview"
                              className="project-thumb-preview-img"
                            />
                          ) : (
                            <div className="project-image-placeholder">
                              <span>NO IMAGE</span>
                              <span className="placeholder-sub">Max 2MB (JPG, PNG, WebP)</span>
                            </div>
                          )}
                        </div>

                        <div className="image-action-controls">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="file-input-hidden"
                            id="project-thumb-input"
                          />
                          <div className="image-btn-row">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={imageProcessing}
                              className="btn-upload-photo"
                            >
                              {imageProcessing ? 'Optimizing Image...' : 'Upload Thumbnail'}
                            </button>
                            {formData.image && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="btn-remove-photo"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <span className="photo-req-hint">
                            Automatically compressed to ~100KB (max 900x650) to preserve browser quota.
                          </span>
                        </div>
                      </div>
                      {fieldErrors.image && (
                        <span className="field-error-text">{fieldErrors.image}</span>
                      )}
                    </div>

                    {/* Date & Featured Toggle */}
                    <div className="form-row-pair">
                      <div className="field-group">
                        <label htmlFor="proj-date" className="field-label">
                          Completion Date (Optional)
                        </label>
                        <input
                          id="proj-date"
                          type="text"
                          name="completionDate"
                          value={formData.completionDate}
                          onChange={handleInputChange}
                          placeholder="e.g. November 2026"
                          className="field-input"
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Featured Showcase</label>
                        <label className="checkbox-featured-label">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className="checkbox-featured-input"
                          />
                          <span>Pin as a Featured Project</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & SAVE */}
                {currentStep === 3 && (
                  <div className="wizard-step-content" id="project-wizard-step-3">
                    <div className="review-project-card">
                      <div className="review-project-header">
                        <div>
                          <span className="review-cat-tag">{formData.category}</span>
                          <h3 className="review-proj-title">{formData.title}</h3>
                        </div>
                        {formData.featured && (
                          <span className="badge-featured">★ FEATURED</span>
                        )}
                      </div>

                      {formData.image && (
                        <div className="review-image-frame">
                          <img
                            src={formData.image}
                            alt="Project thumbnail"
                            className="review-image-img"
                          />
                        </div>
                      )}

                      <div className="review-section">
                        <span className="review-sec-label">DESCRIPTION</span>
                        <p className="review-desc-text">{formData.description}</p>
                      </div>

                      <div className="review-section">
                        <span className="review-sec-label">TECHNOLOGY STACK</span>
                        <div className="project-tech-chips">
                          {formData.technologies.map((t, idx) => (
                            <span key={idx} className="tech-chip">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="review-meta-row">
                        <div>
                          <span className="review-sec-label">GITHUB REPO</span>
                          <span className="review-meta-val">
                            {formData.githubUrl ? (
                              <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer">
                                {formData.githubUrl}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="review-sec-label">LIVE DEMO</span>
                          <span className="review-meta-val">
                            {formData.liveUrl ? (
                              <a href={formData.liveUrl} target="_blank" rel="noopener noreferrer">
                                {formData.liveUrl}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="review-sec-label">COMPLETION</span>
                          <span className="review-meta-val">
                            {formData.completionDate || 'Ongoing / Unspecified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {fieldErrors.submit && (
                      <div className="editor-alert-banner alert-error">
                        <span>⚠</span> {fieldErrors.submit}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Navigation */}
              <div className="modal-footer">
                <div className="footer-left">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="btn-wizard-secondary"
                    >
                      ← Previous
                    </button>
                  )}
                </div>

                <div className="footer-right">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn-wizard-primary"
                    >
                      {currentStep === 1 ? 'Next: Tech & Media →' : 'Review Project →'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveProject}
                      className="btn-wizard-save"
                    >
                      {editingProjectId ? 'Update Project' : 'Save Project'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            PRESENTATION-STYLE PROJECT PREVIEW MODAL
           ----------------------------------------------------------------- */}
        {previewProject && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
            <div className="modal-container preview-modal">
              {/* Header */}
              <div className="modal-header">
                <div className="preview-header-tags">
                  <span className="preview-live-tag">
                    <span className="live-tag-dot" /> LOCAL PROJECT PREVIEW
                  </span>
                  <span className="preview-disclaimer">
                    (Unpublished local preview · not yet visible on public domain)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProject(null)}
                  className="btn-modal-close"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>

              {/* Preview Body */}
              <div className="modal-body preview-modal-body">
                {previewProject.image ? (
                  <div className="presentation-hero-image-wrap">
                    <img
                      src={previewProject.image}
                      alt={`Showcase visual for ${previewProject.title}`}
                      className="presentation-hero-img"
                    />
                  </div>
                ) : (
                  <div className="presentation-hero-placeholder">
                    <span className="placeholder-monogram">FIG. SHOWCASE</span>
                    <span className="placeholder-icon">◈</span>
                  </div>
                )}

                <div className="presentation-meta-header">
                  <div className="presentation-tags-row">
                    <span className="project-category-tag">{previewProject.category}</span>
                    {previewProject.featured && (
                      <span className="badge-featured">★ FEATURED PROJECT</span>
                    )}
                    {previewProject.completionDate && (
                      <span className="project-date-tag">Completed: {previewProject.completionDate}</span>
                    )}
                  </div>
                  <h2 id="preview-modal-title" className="presentation-title">
                    {previewProject.title}
                  </h2>
                </div>

                <div className="presentation-section">
                  <span className="presentation-sec-heading">PROJECT OVERVIEW & ARCHITECTURE</span>
                  <p className="presentation-desc-text">{previewProject.description}</p>
                </div>

                <div className="presentation-section">
                  <span className="presentation-sec-heading">TECHNOLOGIES & TOOLING</span>
                  <div className="project-tech-chips">
                    {previewProject.technologies?.map((tech, i) => (
                      <span key={i} className="tech-chip tech-chip--large">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="presentation-actions-row">
                  {previewProject.githubUrl && (
                    <a
                      href={previewProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-presentation-ext btn-presentation-gh"
                    >
                      View Source on GitHub ↗
                    </a>
                  )}
                  {previewProject.liveUrl && (
                    <a
                      href={previewProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-presentation-ext btn-presentation-live"
                    >
                      Launch Live Demo ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            ACCESSIBLE DELETE CONFIRMATION DIALOG
           ----------------------------------------------------------------- */}
        {deletingProject && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="modal-container delete-dialog">
              <div className="delete-dialog-body">
                <span className="delete-warning-icon">⚠</span>
                <h3 id="delete-dialog-title" className="delete-dialog-title">
                  Delete Project?
                </h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete <strong>"{deletingProject.title}"</strong>? This action will remove the project from your showcase immediately and cannot be undone.
                </p>
                <div className="delete-dialog-actions">
                  <button
                    type="button"
                    onClick={() => setDeletingProject(null)}
                    className="btn-wizard-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="btn-confirm-delete"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
