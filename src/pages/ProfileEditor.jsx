import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import { processAndCompressImage, validateImageFile } from '../services/imageUtils'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import './ProfileEditor.css'

const CURRENT_YEAR = new Date().getFullYear()

const WIZARD_STEPS = [
  { id: 1, number: '01', title: 'Personal Identity', shortLabel: 'Identity' },
  { id: 2, number: '02', title: 'About Yourself', shortLabel: 'About' },
  { id: 3, number: '03', title: 'Contact & Social', shortLabel: 'Contact' },
  { id: 4, number: '04', title: 'Review & Save', shortLabel: 'Review' },
]

export default function ProfileEditor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Baseline data generator from saved profile
  const getSavedProfileData = useCallback(() => {
    if (user?.username) {
      const port = portfolioService.getUserPortfolio(user.username)
      const prof = port?.profile || {}
      const social = prof.socialLinks || {}

      return {
        fullName: prof.fullName || user.fullName || '',
        username: user.username,
        professionalTitle: prof.professionalTitle || '',
        introduction: prof.introduction || '',
        about: prof.about || '',
        email: prof.email || user.email || '',
        location: prof.location || '',
        profileImage: prof.profileImage || null,
        github: social.github || '',
        linkedin: social.linkedin || '',
        website: social.website || '',
      }
    }
    return {
      fullName: '',
      username: '',
      professionalTitle: '',
      introduction: '',
      about: '',
      email: '',
      location: '',
      profileImage: null,
      github: '',
      linkedin: '',
      website: '',
    }
  }, [user])

  // Saved baseline state
  const [savedData, setSavedData] = useState(getSavedProfileData)

  // Wizard state: Step 1 to 4 initialized from draft if present
  const [currentStep, setCurrentStep] = useState(() => {
    if (user?.username) {
      const draft = portfolioService.getProfileDraft(user.username)
      if (draft && draft.currentStep && draft.currentStep >= 1 && draft.currentStep <= 4) {
        return draft.currentStep
      }
    }
    return 1
  })

  const [maxStepReached, setMaxStepReached] = useState(() => {
    if (user?.username) {
      const draft = portfolioService.getProfileDraft(user.username)
      if (draft && draft.maxStepReached && draft.maxStepReached >= 1 && draft.maxStepReached <= 4) {
        return draft.maxStepReached
      }
      if (draft && draft.currentStep) {
        return draft.currentStep
      }
    }
    return 1
  })

  // Active form data (restored from draft if available)
  const [formData, setFormData] = useState(() => {
    if (user?.username) {
      const draft = portfolioService.getProfileDraft(user.username)
      if (draft && draft.formData) {
        return { ...getSavedProfileData(), ...draft.formData }
      }
    }
    return getSavedProfileData()
  })

  // Has restored draft banner state
  const [restoredDraftInfo, setRestoredDraftInfo] = useState(() => {
    if (user?.username) {
      const draft = portfolioService.getProfileDraft(user.username)
      if (draft && draft.updatedAt) {
        return draft.updatedAt
      }
    }
    return null
  })

  // Mobile preview toggle
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  // Status flags
  const [imageProcessing, setImageProcessing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Sync draft whenever formData or currentStep changes
  const persistDraft = useCallback((updatedForm, step, maxStep) => {
    if (!user?.username) return
    portfolioService.saveProfileDraft(user.username, {
      currentStep: step,
      maxStepReached: maxStep,
      formData: updatedForm,
    })
  }, [user])

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)
    setSaveSuccess(false)
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    persistDraft(updated, currentStep, maxStepReached)
  }

  // Handle image upload with canvas compression
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setErrorMsg(validation.error)
      return
    }

    setImageProcessing(true)
    try {
      const compressedDataUrl = await processAndCompressImage(file, 360, 0.85)
      const updated = { ...formData, profileImage: compressedDataUrl }
      setFormData(updated)
      setSaveSuccess(false)
      persistDraft(updated, currentStep, maxStepReached)
    } catch (err) {
      setErrorMsg(err.message || 'Error processing image.')
    } finally {
      setImageProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle image removal
  const handleRemoveImage = () => {
    const updated = { ...formData, profileImage: null }
    setFormData(updated)
    setSaveSuccess(false)
    persistDraft(updated, currentStep, maxStepReached)
  }

  // Step-specific validation
  const validateStep = (stepNumber) => {
    const errs = {}

    if (stepNumber === 1) {
      if (!formData.fullName.trim()) {
        errs.fullName = 'Full Name is required.'
      }
    }

    if (stepNumber === 2) {
      if (formData.introduction.length > 140) {
        errs.introduction = 'Short introduction cannot exceed 140 characters.'
      }
      if (formData.about.length > 1000) {
        errs.about = 'About Me narrative cannot exceed 1000 characters.'
      }
    }

    if (stepNumber === 3) {
      if (formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email.trim())) {
          errs.email = 'Please provide a valid email address (e.g. name@domain.com).'
        }
      }

      const validateUrl = (url, fieldName, label) => {
        if (!url.trim()) return
        const trimmed = url.trim()
        if (trimmed.toLowerCase().startsWith('javascript:')) {
          errs[fieldName] = `${label} cannot contain javascript: URLs.`
          return
        }
        if (!/^https?:\/\//i.test(trimmed)) {
          errs[fieldName] = `${label} must begin with http:// or https://`
        }
      }

      validateUrl(formData.github, 'github', 'GitHub URL')
      validateUrl(formData.linkedin, 'linkedin', 'LinkedIn URL')
      validateUrl(formData.website, 'website', 'Personal Website URL')
    }

    return errs
  }

  // Comprehensive validation before Step 4 saving
  const validateAll = () => {
    const errs1 = validateStep(1)
    const errs2 = validateStep(2)
    const errs3 = validateStep(3)
    return { ...errs1, ...errs2, ...errs3 }
  }

  // Navigation: Next Step
  const handleNextStep = () => {
    setErrorMsg('')
    const errs = validateStep(currentStep)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    const next = currentStep + 1
    const newMax = Math.max(maxStepReached, next)
    setCurrentStep(next)
    setMaxStepReached(newMax)
    persistDraft(formData, next, newMax)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Navigation: Previous Step
  const handlePrevStep = () => {
    setErrorMsg('')
    setFieldErrors({})
    const prev = Math.max(1, currentStep - 1)
    setCurrentStep(prev)
    persistDraft(formData, prev, maxStepReached)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step indicator navigation click
  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return
    // Allow jumping back to any previously visited step or current step
    if (targetStep < currentStep) {
      setErrorMsg('')
      setFieldErrors({})
      setCurrentStep(targetStep)
      persistDraft(formData, targetStep, maxStepReached)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Jumping forward requires validation of all intermediate steps
    for (let s = currentStep; s < targetStep; s++) {
      const errs = validateStep(s)
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setCurrentStep(s)
        setErrorMsg(`Please complete required fields in Step ${s} before proceeding.`)
        return
      }
    }

    setFieldErrors({})
    setErrorMsg('')
    const newMax = Math.max(maxStepReached, targetStep)
    setCurrentStep(targetStep)
    setMaxStepReached(newMax)
    persistDraft(formData, targetStep, newMax)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Discard draft action
  const handleDiscardDraft = () => {
    const confirm = window.confirm(
      'Discard your unsaved draft and revert all fields to your saved portfolio profile?'
    )
    if (!confirm) return

    if (user?.username) {
      portfolioService.clearProfileDraft(user.username)
    }

    const baseline = getSavedProfileData()
    setFormData(baseline)
    setSavedData(baseline)
    setCurrentStep(1)
    setMaxStepReached(1)
    setRestoredDraftInfo(null)
    setFieldErrors({})
    setErrorMsg('')
    setSaveSuccess(false)
  }

  // Final Save Profile (Step 4)
  const handleSaveProfile = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSaveSuccess(false)

    const allErrors = validateAll()
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors)
      // Navigate to the earliest step with an error
      if (allErrors.fullName) setCurrentStep(1)
      else if (allErrors.introduction || allErrors.about) setCurrentStep(2)
      else if (allErrors.email || allErrors.github || allErrors.linkedin || allErrors.website) setCurrentStep(3)
      setErrorMsg('Please fix the highlighted validation errors before saving.')
      return
    }

    try {
      const profilePayload = {
        fullName: formData.fullName,
        professionalTitle: formData.professionalTitle,
        introduction: formData.introduction,
        about: formData.about,
        email: formData.email,
        location: formData.location,
        profileImage: formData.profileImage,
        socialLinks: {
          github: formData.github,
          linkedin: formData.linkedin,
          website: formData.website,
        },
      }

      portfolioService.updatePortfolioProfile(user.username, profilePayload)
      // Clear temporary draft after successful save
      portfolioService.clearProfileDraft(user.username)

      setSavedData(formData)
      setSaveSuccess(true)
      setRestoredDraftInfo(null)
      setFieldErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrorMsg(err.message || 'Failed to persist changes to local storage.')
    }
  }

  // Dirty check: differs from saved profile
  const isDirty = savedData ? JSON.stringify(formData) !== JSON.stringify(savedData) : false

  return (
    <DashboardLayout>
      <div className="editor-page-container">
        {/* Top Header */}
        <div className="editor-top-bar">
          <div className="top-bar-left">
            <span className="editor-sub-tag">PORTFOLIO STUDIO · PROFILE SETUP WIZARD</span>
            <h1 className="editor-heading">Profile Setup Wizard</h1>
            <p className="editor-caption">
              Complete your profile step-by-step to craft a distinctive Modern Editorial portfolio.
            </p>
          </div>

          <div className="top-bar-right-actions">
            {(isDirty || restoredDraftInfo) && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="btn-discard-draft"
                title="Discard unsaved draft and revert to saved profile"
              >
                Discard Draft
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-exit-dashboard"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>

        {/* Restored Draft Banner */}
        {restoredDraftInfo && !saveSuccess && (
          <div className="editor-alert-banner alert-info" role="status">
            <span className="alert-icon">ℹ</span>
            <div className="alert-content">
              <strong>Draft Restored:</strong> We loaded your unsaved draft progress. You can continue editing or discard the draft at any time.
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="alert-btn-inline"
            >
              Discard
            </button>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <div className="editor-alert-banner alert-success" role="status">
            <span className="alert-icon">✓</span>
            <div className="alert-content">
              <strong>Profile saved successfully!</strong> Your portfolio profile and readiness score have been updated.
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="editor-alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠</span>
            <div className="alert-content">{errorMsg}</div>
          </div>
        )}

        {/* 4-Step Progress Indicator */}
        <div className="wizard-stepper-container" aria-label="Profile setup steps">
          <div className="wizard-progress-header">
            <span className="wizard-step-label">STEP {currentStep} OF 4</span>
            <span className="wizard-step-title">{WIZARD_STEPS[currentStep - 1].title}</span>
          </div>

          {/* Graphical Progress Bar */}
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          {/* Stepper Tabs */}
          <div className="wizard-steps-grid">
            {WIZARD_STEPS.map((step) => {
              const isCurrent = step.id === currentStep
              const isCompleted = step.id < currentStep
              const isAccessible = step.id <= maxStepReached

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isAccessible}
                  className={`wizard-step-tab ${
                    isCurrent ? 'step-tab--active' : ''
                  } ${isCompleted ? 'step-tab--completed' : ''} ${
                    !isAccessible ? 'step-tab--disabled' : ''
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="step-tab-indicator">
                    {isCompleted ? (
                      <span className="step-check-mark">✓</span>
                    ) : (
                      <span className="step-number">{step.number}</span>
                    )}
                  </div>
                  <div className="step-tab-text">
                    <span className="step-tab-meta">STEP {step.id}</span>
                    <span className="step-tab-name">{step.title}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile Live Preview Expandable Trigger */}
        <div className="mobile-preview-toggle-wrap">
          <button
            type="button"
            onClick={() => setShowMobilePreview((prev) => !prev)}
            className="btn-mobile-preview-toggle"
            aria-expanded={showMobilePreview}
          >
            {showMobilePreview ? '✕ Hide Live Preview' : '👁 Preview Profile (Live)'}
          </button>
        </div>

        {/* Main Content Grid: Two Columns (Form left, Live Preview right) */}
        <div className="editor-columns-grid">
          {/* Left Column: Active Wizard Step Card */}
          <div className="editor-form-col">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {/* STEP 1: PERSONAL IDENTITY */}
              {currentStep === 1 && (
                <div className="wizard-step-panel" id="wizard-step-1">
                  <div className="wizard-card-header">
                    <span className="card-sec-tag">STEP 01 / 04 · IDENTITY</span>
                    <h2 className="card-sec-title">Personal Identity</h2>
                    <p className="card-sec-desc">
                      Set your public name, primary professional title, location, and portrait photograph.
                    </p>
                  </div>

                  {/* Profile Photograph Uploader */}
                  <div className="form-group-section">
                    <label className="field-label">Profile Photograph</label>
                    <div className="photo-upload-row">
                      <div className="photo-preview-box">
                        {formData.profileImage ? (
                          <img
                            src={formData.profileImage}
                            alt="Profile preview"
                            className="photo-thumb-img"
                          />
                        ) : (
                          <div className="photo-fallback-initial">
                            {formData.fullName?.trim()?.charAt(0)?.toUpperCase() || 'K'}
                          </div>
                        )}
                      </div>

                      <div className="photo-actions-col">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="file-input-hidden"
                          id="avatar-file-input"
                          aria-label="Upload profile photograph"
                        />
                        <div className="photo-btn-group">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageProcessing}
                            className="btn-upload-photo"
                          >
                            {imageProcessing ? 'Compressing...' : 'Upload New Photo'}
                          </button>
                          {formData.profileImage && (
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
                          Supported: JPG, PNG, WebP (Max 2MB). Automatically optimized to ~30KB for browser storage.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name and Read-only Username */}
                  <div className="form-row-pair">
                    <div className={`form-field ${fieldErrors.fullName ? 'form-field--error' : ''}`}>
                      <label htmlFor="fullName" className="field-label">
                        Full Name <span className="field-required">*</span>
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Alex Morgan"
                        className="field-input"
                        autoComplete="name"
                      />
                      {fieldErrors.fullName && (
                        <span className="field-error-text">{fieldErrors.fullName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="username" className="field-label">
                        Username (Read-Only)
                      </label>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        disabled
                        className="field-input field-input--readonly"
                      />
                      <span className="field-hint">
                        Portfolio URL: <code>/p/{formData.username}</code>
                      </span>
                    </div>
                  </div>

                  {/* Professional Title and Location */}
                  <div className="form-row-pair">
                    <div className="form-field">
                      <label htmlFor="professionalTitle" className="field-label">
                        Professional Title
                      </label>
                      <input
                        id="professionalTitle"
                        type="text"
                        name="professionalTitle"
                        value={formData.professionalTitle}
                        onChange={handleInputChange}
                        placeholder="e.g. Computer Science Student & Engineer"
                        className="field-input"
                      />
                      <span className="field-hint">Your primary academic or engineering headline.</span>
                    </div>

                    <div className="form-field">
                      <label htmlFor="location" className="field-label">
                        Location
                      </label>
                      <input
                        id="location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. Seattle, WA or Bangalore, India"
                        className="field-input"
                      />
                      <span className="field-hint">City, State or Country.</span>
                    </div>
                  </div>

                  {/* Step 1 Navigation */}
                  <div className="wizard-step-nav-bar">
                    <div className="nav-bar-left">
                      <span className="nav-step-counter">Step 1 of 4</span>
                    </div>
                    <div className="nav-bar-right">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn-wizard-primary"
                      >
                        Next Step →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ABOUT YOURSELF */}
              {currentStep === 2 && (
                <div className="wizard-step-panel" id="wizard-step-2">
                  <div className="wizard-card-header">
                    <span className="card-sec-tag">STEP 02 / 04 · BIOGRAPHY</span>
                    <h2 className="card-sec-title">About Yourself</h2>
                    <p className="card-sec-desc">
                      Craft your concise introductory statement and an in-depth biography for recruiters and peers.
                    </p>
                  </div>

                  {/* Short Introduction / Tagline */}
                  <div className={`form-field ${fieldErrors.introduction ? 'form-field--error' : ''}`}>
                    <div className="field-label-with-counter">
                      <label htmlFor="introduction" className="field-label">
                        Short Introduction / Tagline
                      </label>
                      <span className={`char-counter ${formData.introduction.length > 140 ? 'counter--exceeded' : ''}`}>
                        {formData.introduction.length} / 140
                      </span>
                    </div>
                    <input
                      id="introduction"
                      type="text"
                      name="introduction"
                      value={formData.introduction}
                      onChange={handleInputChange}
                      maxLength={160}
                      placeholder="e.g. Building resilient distributed systems and modern web architectures."
                      className="field-input"
                    />
                    <span className="field-hint">
                      A high-impact headline displayed prominently in the hero section.
                    </span>
                    {fieldErrors.introduction && (
                      <span className="field-error-text">{fieldErrors.introduction}</span>
                    )}
                  </div>

                  {/* About Me Narrative */}
                  <div className={`form-field ${fieldErrors.about ? 'form-field--error' : ''}`}>
                    <div className="field-label-with-counter">
                      <label htmlFor="about" className="field-label">
                        About Me / Biography
                      </label>
                      <span className={`char-counter ${formData.about.length > 1000 ? 'counter--exceeded' : ''}`}>
                        {formData.about.length} / 1000
                      </span>
                    </div>
                    <textarea
                      id="about"
                      name="about"
                      rows={6}
                      value={formData.about}
                      onChange={handleInputChange}
                      maxLength={1200}
                      placeholder="Describe your academic focus, what drives your engineering curiosity, recent projects, and career aspirations..."
                      className="field-textarea"
                    />
                    <span className="field-hint">
                      Share your technical journey, engineering ethos, and areas of exploration.
                    </span>
                    {fieldErrors.about && (
                      <span className="field-error-text">{fieldErrors.about}</span>
                    )}
                  </div>

                  {/* Step 2 Navigation */}
                  <div className="wizard-step-nav-bar">
                    <div className="nav-bar-left">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="btn-wizard-secondary"
                      >
                        ← Previous
                      </button>
                    </div>
                    <div className="nav-bar-right">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn-wizard-primary"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & SOCIAL LINKS */}
              {currentStep === 3 && (
                <div className="wizard-step-panel" id="wizard-step-3">
                  <div className="wizard-card-header">
                    <span className="card-sec-tag">STEP 03 / 04 · CONNECTIVITY</span>
                    <h2 className="card-sec-title">Contact & Social Links</h2>
                    <p className="card-sec-desc">
                      Provide verified channels for recruiters, collaborators, and peers to connect with you.
                    </p>
                  </div>

                  {/* Contact Email */}
                  <div className={`form-field ${fieldErrors.email ? 'form-field--error' : ''}`}>
                    <label htmlFor="email" className="field-label">
                      Contact Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. yourname@university.edu"
                      className="field-input"
                      autoComplete="email"
                    />
                    <span className="field-hint">
                      Public inquiries and verified portfolio communication will reference this address.
                    </span>
                    {fieldErrors.email && (
                      <span className="field-error-text">{fieldErrors.email}</span>
                    )}
                  </div>

                  {/* GitHub URL */}
                  <div className={`form-field ${fieldErrors.github ? 'form-field--error' : ''}`}>
                    <label htmlFor="github" className="field-label">
                      GitHub Profile URL
                    </label>
                    <input
                      id="github"
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username"
                      className="field-input"
                    />
                    {fieldErrors.github ? (
                      <span className="field-error-text">{fieldErrors.github}</span>
                    ) : (
                      <span className="field-hint">Must begin with http:// or https://</span>
                    )}
                  </div>

                  {/* LinkedIn URL */}
                  <div className={`form-field ${fieldErrors.linkedin ? 'form-field--error' : ''}`}>
                    <label htmlFor="linkedin" className="field-label">
                      LinkedIn Profile URL
                    </label>
                    <input
                      id="linkedin"
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className="field-input"
                    />
                    {fieldErrors.linkedin ? (
                      <span className="field-error-text">{fieldErrors.linkedin}</span>
                    ) : (
                      <span className="field-hint">Must begin with http:// or https://</span>
                    )}
                  </div>

                  {/* Personal Website */}
                  <div className={`form-field ${fieldErrors.website ? 'form-field--error' : ''}`}>
                    <label htmlFor="website" className="field-label">
                      Personal Website / Blog URL
                    </label>
                    <input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://mywebsite.com"
                      className="field-input"
                    />
                    {fieldErrors.website ? (
                      <span className="field-error-text">{fieldErrors.website}</span>
                    ) : (
                      <span className="field-hint">Must begin with http:// or https://</span>
                    )}
                  </div>

                  {/* Step 3 Navigation */}
                  <div className="wizard-step-nav-bar">
                    <div className="nav-bar-left">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="btn-wizard-secondary"
                      >
                        ← Previous
                      </button>
                    </div>
                    <div className="nav-bar-right">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn-wizard-primary"
                      >
                        Review Profile →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SAVE */}
              {currentStep === 4 && (
                <div className="wizard-step-panel" id="wizard-step-4">
                  <div className="wizard-card-header">
                    <span className="card-sec-tag">STEP 04 / 04 · CONFIRMATION</span>
                    <h2 className="card-sec-title">Review & Save Profile</h2>
                    <p className="card-sec-desc">
                      Inspect your configured portfolio identity details before persisting them to your public profile.
                    </p>
                  </div>

                  {/* Structured Review Summary Cards */}
                  <div className="review-summary-stack">
                    {/* Identity Review Card */}
                    <div className="review-card">
                      <div className="review-card-top">
                        <span className="review-group-title">01 · Personal Identity</span>
                        <button
                          type="button"
                          onClick={() => handleStepClick(1)}
                          className="btn-review-edit"
                        >
                          Edit Identity
                        </button>
                      </div>

                      <div className="review-identity-body">
                        <div className="review-avatar-frame">
                          {formData.profileImage ? (
                            <img
                              src={formData.profileImage}
                              alt="Profile avatar"
                              className="review-avatar-img"
                            />
                          ) : (
                            <div className="review-avatar-fallback">
                              {formData.fullName?.trim()?.charAt(0)?.toUpperCase() || 'K'}
                            </div>
                          )}
                        </div>

                        <div className="review-identity-meta">
                          <h3 className="review-person-name">
                            {formData.fullName || <span className="review-empty">Full Name Not Set</span>}
                          </h3>
                          <p className="review-person-sub">
                            {formData.professionalTitle || 'No professional title provided'}
                          </p>
                          <div className="review-tags-row">
                            <span className="review-pill">@{formData.username}</span>
                            {formData.location && (
                              <span className="review-pill">📍 {formData.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* About Review Card */}
                    <div className="review-card">
                      <div className="review-card-top">
                        <span className="review-group-title">02 · Narrative & Bio</span>
                        <button
                          type="button"
                          onClick={() => handleStepClick(2)}
                          className="btn-review-edit"
                        >
                          Edit Bio
                        </button>
                      </div>

                      <div className="review-item-row">
                        <span className="review-item-label">Tagline:</span>
                        <p className="review-item-val">
                          {formData.introduction || <span className="review-empty">No short introduction added</span>}
                        </p>
                      </div>

                      <div className="review-item-row">
                        <span className="review-item-label">About Me:</span>
                        <p className="review-item-val review-about-para">
                          {formData.about || <span className="review-empty">No biography narrative provided</span>}
                        </p>
                      </div>
                    </div>

                    {/* Contact & Social Review Card */}
                    <div className="review-card">
                      <div className="review-card-top">
                        <span className="review-group-title">03 · Connectivity</span>
                        <button
                          type="button"
                          onClick={() => handleStepClick(3)}
                          className="btn-review-edit"
                        >
                          Edit Links
                        </button>
                      </div>

                      <div className="review-links-grid">
                        <div className="review-link-cell">
                          <span className="review-link-type">Email:</span>
                          <span className="review-link-val">
                            {formData.email || <span className="review-empty">None</span>}
                          </span>
                        </div>
                        <div className="review-link-cell">
                          <span className="review-link-type">GitHub:</span>
                          <span className="review-link-val">
                            {formData.github ? (
                              <a href={formData.github} target="_blank" rel="noreferrer">
                                {formData.github}
                              </a>
                            ) : (
                              <span className="review-empty">None</span>
                            )}
                          </span>
                        </div>
                        <div className="review-link-cell">
                          <span className="review-link-type">LinkedIn:</span>
                          <span className="review-link-val">
                            {formData.linkedin ? (
                              <a href={formData.linkedin} target="_blank" rel="noreferrer">
                                {formData.linkedin}
                              </a>
                            ) : (
                              <span className="review-empty">None</span>
                            )}
                          </span>
                        </div>
                        <div className="review-link-cell">
                          <span className="review-link-type">Website:</span>
                          <span className="review-link-val">
                            {formData.website ? (
                              <a href={formData.website} target="_blank" rel="noreferrer">
                                {formData.website}
                              </a>
                            ) : (
                              <span className="review-empty">None</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 Navigation */}
                  <div className="wizard-step-nav-bar">
                    <div className="nav-bar-left">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="btn-wizard-secondary"
                      >
                        ← Previous
                      </button>
                    </div>
                    <div className="nav-bar-right">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="btn-wizard-save"
                      >
                        Save Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Sticky Live Preview Panel (Always synced) */}
          <div className={`editor-preview-col ${showMobilePreview ? 'preview-col--mobile-visible' : ''}`}>
            <div className="preview-sticky-wrapper">
              <div className="preview-card-frame">
                {/* Frame Header */}
                <div className="preview-frame-header">
                  <div className="preview-badge-status">
                    <span className={`preview-badge-dot ${isDirty ? 'dot--unsaved' : 'dot--synced'}`} />
                    <span>{isDirty ? 'UNSAVED LOCAL DRAFT' : 'CURRENT PROFILE STATE'}</span>
                  </div>
                  <span className="preview-frame-mark">■</span>
                </div>

                {/* Frame Body */}
                <div className="preview-frame-body">
                  {/* Portrait / Initial */}
                  <div className="preview-portrait-container">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile preview"
                        className="preview-portrait-img"
                      />
                    ) : (
                      <div className="preview-portrait-fallback">
                        {formData.fullName?.trim()?.charAt(0)?.toUpperCase() || 'K'}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="preview-meta-details">
                    <span className="preview-meta-label">
                      CREATOR / {CURRENT_YEAR}
                    </span>
                    <h3 className="preview-person-name">
                      {formData.fullName.trim() || 'Your Name'}
                    </h3>
                    <p className="preview-person-title">
                      {formData.professionalTitle.trim() || 'Professional Title / Degree'}
                    </p>
                    {formData.location.trim() && (
                      <span className="preview-person-location">
                        📍 {formData.location.trim()}
                      </span>
                    )}
                    <p className="preview-person-intro">
                      {formData.introduction.trim() ||
                        'Your brief introductory statement will appear here as you type.'}
                    </p>
                  </div>

                  {/* About Extract */}
                  {formData.about.trim() && (
                    <div className="preview-about-box">
                      <span className="preview-about-label">BIOGRAPHY EXTRACT</span>
                      <p className="preview-about-text">
                        {formData.about.length > 220
                          ? `${formData.about.slice(0, 220)}...`
                          : formData.about}
                      </p>
                    </div>
                  )}

                  {/* Social Chips */}
                  <div className="preview-socials-row">
                    {formData.github.trim() && (
                      <span className="preview-social-chip">GitHub</span>
                    )}
                    {formData.linkedin.trim() && (
                      <span className="preview-social-chip">LinkedIn</span>
                    )}
                    {formData.website.trim() && (
                      <span className="preview-social-chip">Website</span>
                    )}
                    {formData.email.trim() && (
                      <span className="preview-social-chip">Email</span>
                    )}
                    {!formData.github.trim() &&
                      !formData.linkedin.trim() &&
                      !formData.website.trim() &&
                      !formData.email.trim() && (
                        <span className="preview-social-empty">
                          No contact links added
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
