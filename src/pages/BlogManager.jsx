import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import { processProjectThumbnail, validateImageFile } from '../services/imageUtils'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import MarkdownRenderer from '../components/blog/MarkdownRenderer'
import { useToast } from '../hooks/useToast'
import './BlogManager.css'

const BLOG_CATEGORIES = [
  'Technology',
  'Programming',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Design',
  'Tutorials',
  'Career',
  'Academic',
  'Personal',
  'Other',
]

const WIZARD_STEPS = [
  { id: 1, number: '01', title: 'Article Details' },
  { id: 2, number: '02', title: 'Article Content' },
  { id: 3, number: '03', title: 'Review & Publish' },
]

const INITIAL_FORM_STATE = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Technology',
  tags: [],
  coverImage: '',
  content: '',
}

export default function BlogManager() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const { toasts, showToast } = useToast(3500)

  const [posts, setPosts] = useState(() =>
    user?.username ? portfolioService.getUserBlogPosts(user.username) : []
  )
  const [mountTimeMs] = useState(() => Date.now())

  // Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  // Modal & Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [slugTouched, setSlugTouched] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [tagInput, setTagInput] = useState('')
  const [formError, setFormError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  // Editor UX state
  const [mobileEditorTab, setMobileEditorTab] = useState('write')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const [restoredDraftBanner, setRestoredDraftBanner] = useState(() =>
    user?.username ? Boolean(portfolioService.getBlogDraft(user.username)) : false
  )

  // Preview & Delete confirmation
  const [previewPost, setPreviewPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)

  // Auto-save draft when wizard is open for a new article (never overwrites published posts)
  useEffect(() => {
    if (!isWizardOpen || !user?.username || !hasUnsavedChanges) return
    const timer = setTimeout(() => {
      const saved = portfolioService.saveBlogDraft(user.username, {
        editingPostId,
        currentStep,
        slugTouched,
        formData,
      })
      if (saved) {
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [isWizardOpen, user?.username, editingPostId, currentStep, slugTouched, formData, hasUnsavedChanges])

  // Computed statistics from actual saved records
  const totalCount = posts.length
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status !== 'published').length
  const recentlyUpdatedCount = posts.filter((p) => {
    if (!p.updatedAt) return false
    const ageMs = mountTimeMs - new Date(p.updatedAt).getTime()
    return ageMs <= 7 * 24 * 60 * 60 * 1000
  }).length

  const wordCount = formData.content.trim()
    ? formData.content.trim().split(/\s+/).filter(Boolean).length
    : 0
  const readingTime = portfolioService.calculateReadingTime(formData.content)

  const handleOpenCreate = () => {
    setEditingPostId(null)
    setCurrentStep(1)
    setSlugTouched(false)
    setFormData(INITIAL_FORM_STATE)
    setTagInput('')
    setFormError('')
    setMobileEditorTab('write')
    setHasUnsavedChanges(false)
    setDraftSavedAt(null)
    setIsWizardOpen(true)
  }

  const handleRestoreDraft = () => {
    if (!user?.username) return
    const draft = portfolioService.getBlogDraft(user.username)
    if (!draft) {
      setRestoredDraftBanner(false)
      return
    }
    setEditingPostId(draft.editingPostId || null)
    setCurrentStep(draft.currentStep || 1)
    setSlugTouched(Boolean(draft.slugTouched))
    setFormData({ ...INITIAL_FORM_STATE, ...(draft.formData || {}) })
    setFormError('')
    setHasUnsavedChanges(false)
    setDraftSavedAt(
      draft.updatedAt
        ? new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null
    )
    setIsWizardOpen(true)
  }

  const handleDiscardDraft = () => {
    if (!user?.username) return
    portfolioService.clearBlogDraft(user.username)
    setRestoredDraftBanner(false)
    setHasUnsavedChanges(false)
    setDraftSavedAt(null)
    if (isWizardOpen && !editingPostId) {
      setFormData(INITIAL_FORM_STATE)
      setCurrentStep(1)
    }
    showToast('Unsaved blog draft discarded.')
  }

  const handleOpenEdit = (post) => {
    setEditingPostId(post.id)
    setCurrentStep(1)
    setSlugTouched(true)
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      category: post.category || 'Technology',
      tags: Array.isArray(post.tags) ? post.tags : [],
      coverImage: post.coverImage || '',
      content: post.content || '',
    })
    setTagInput('')
    setFormError('')
    setMobileEditorTab('write')
    setHasUnsavedChanges(false)
    setDraftSavedAt(null)
    setIsWizardOpen(true)
  }

  const handleCloseWizard = () => {
    setIsWizardOpen(false)
    setFormError('')
  }

  const updateFormField = (field, value) => {
    setHasUnsavedChanges(true)
    setFormError('')
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !slugTouched) {
        next.slug = portfolioService.sanitizeSlug(value)
      }
      if (field === 'slug') {
        next.slug = portfolioService.sanitizeSlug(value)
      }
      return next
    })
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const cleanTag = tagInput.trim().replace(/,$/, '')
      if (!cleanTag) return
      if (!formData.tags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
        setHasUnsavedChanges(true)
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, cleanTag] }))
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setHasUnsavedChanges(true)
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }))
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const check = validateImageFile(file)
    if (!check.valid) {
      setFormError(check.error)
      return
    }

    setImageUploading(true)
    setFormError('')
    try {
      const compressed = await processProjectThumbnail(file, 1000, 0.82)
      setHasUnsavedChanges(true)
      setFormData((prev) => ({ ...prev, coverImage: compressed }))
    } catch (err) {
      setFormError(err.message || 'Failed to process cover image.')
    } finally {
      setImageUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const insertMarkdownSnippet = (before, after = '', placeholder = 'text') => {
    const el = textareaRef.current
    if (!el) {
      updateFormField('content', `${formData.content}${before}${placeholder}${after}`)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = formData.content.slice(start, end) || placeholder
    const nextValue =
      formData.content.slice(0, start) + before + selected + after + formData.content.slice(end)
    updateFormField('content', nextValue)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      setFormError('Article title is required.')
      return false
    }
    if (!formData.excerpt.trim()) {
      setFormError('Subtitle / excerpt is required.')
      return false
    }
    if (!formData.category.trim()) {
      setFormError('Category is required.')
      return false
    }
    const cleanSlug = portfolioService.sanitizeSlug(formData.slug || formData.title)
    if (!cleanSlug) {
      setFormError('Please provide a valid URL slug.')
      return false
    }
    if (!portfolioService.isBlogSlugAvailable(user.username, cleanSlug, editingPostId)) {
      setFormError(`The URL slug "${cleanSlug}" is already used by another article.`)
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setFormError('')
    if (currentStep === 1 && !validateStep1()) return
    setCurrentStep((prev) => Math.min(3, prev + 1))
  }

  const handlePrevStep = () => {
    setFormError('')
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleSaveArticle = (targetStatus) => {
    setFormError('')
    if (!validateStep1()) {
      setCurrentStep(1)
      return
    }
    if (targetStatus === 'published' && !formData.content.trim()) {
      setFormError('Article content cannot be empty when publishing.')
      setCurrentStep(2)
      return
    }

    const payload = {
      ...formData,
      slug: portfolioService.sanitizeSlug(formData.slug || formData.title),
      status: targetStatus,
    }

    try {
      if (editingPostId) {
        const updated = portfolioService.updateBlogPost(user.username, editingPostId, payload)
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        showToast(
          targetStatus === 'published'
            ? `Article "${updated.title}" published.`
            : `Article "${updated.title}" saved as draft.`
        )
      } else {
        const created = portfolioService.createBlogPost(user.username, payload)
        setPosts((prev) => [created, ...prev])
        showToast(
          targetStatus === 'published'
            ? `Article "${created.title}" published.`
            : `Draft "${created.title}" created.`
        )
      }

      portfolioService.clearBlogDraft(user.username)
      setRestoredDraftBanner(false)
      setHasUnsavedChanges(false)
      setIsWizardOpen(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save article.')
    }
  }

  const handleTogglePublish = (post) => {
    try {
      const updated =
        post.status === 'published'
          ? portfolioService.unpublishBlogPost(user.username, post.id)
          : portfolioService.publishBlogPost(user.username, post.id)
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      showToast(
        updated.status === 'published'
          ? `"${updated.title}" is now published.`
          : `"${updated.title}" moved back to drafts.`
      )
    } catch (err) {
      showToast(err.message || 'Unable to change publication status.', 'error')
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingPost) return
    const ok = portfolioService.deleteBlogPost(user.username, deletingPost.id)
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id))
      showToast(`Article "${deletingPost.title}" deleted.`)
    } else {
      showToast('Failed to delete article.', 'error')
    }
    setDeletingPost(null)
  }

  const filteredPosts = posts
    .filter((post) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && post.status === 'published') ||
        (statusFilter === 'DRAFT' && post.status !== 'published')
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }
      if (sortBy === 'UPDATED') {
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <DashboardLayout>
      <div className="blog-manager-container">
        <ToastContainer toasts={toasts} />

        {/* Header */}
        <div className="bm-header">
          <div className="bm-header-text">
            <span className="bm-tag">WORKSPACE / PUBLISHING</span>
            <h1 className="bm-title">My Blog</h1>
            <p className="bm-desc">
              Share your knowledge, ideas and experiences with the world.
            </p>
          </div>
          <div className="bm-header-actions">
            <button type="button" className="btn-create-article" onClick={handleOpenCreate}>
              <span aria-hidden="true">+</span>
              <span>Create New Article</span>
            </button>
          </div>
        </div>

        {/* Unsaved Draft Restoration Banner */}
        {restoredDraftBanner && !isWizardOpen && (
          <div className="bm-draft-banner" role="region" aria-label="Saved blog draft">
            <div className="draft-banner-text">
              <span className="draft-dot" aria-hidden="true">■</span>
              <span>You have an unsaved article draft waiting to be resumed.</span>
            </div>
            <div className="draft-banner-actions">
              <button type="button" className="btn-resume-draft" onClick={handleRestoreDraft}>
                Resume Draft
              </button>
              <button type="button" className="btn-discard-draft" onClick={handleDiscardDraft}>
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Statistics Strip */}
        <div className="bm-stats-strip">
          <div className="bm-stat-card">
            <span className="bm-stat-num">{totalCount}</span>
            <span className="bm-stat-label">Total Articles</span>
          </div>
          <div className="bm-stat-card">
            <span className="bm-stat-num">{publishedCount}</span>
            <span className="bm-stat-label">Published Articles</span>
          </div>
          <div className="bm-stat-card">
            <span className="bm-stat-num">{draftCount}</span>
            <span className="bm-stat-label">Draft Articles</span>
          </div>
          <div className="bm-stat-card">
            <span className="bm-stat-num">{recentlyUpdatedCount}</span>
            <span className="bm-stat-label">Recently Updated</span>
          </div>
        </div>

        {/* Controls Bar */}
        {posts.length > 0 && (
          <div className="bm-controls-bar">
            <div className="bm-search-row">
              <div className="bm-search-wrapper">
                <input
                  type="text"
                  className="bm-search-input"
                  placeholder="Search articles by title or excerpt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search blog articles"
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

              <select
                className="bm-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort articles"
              >
                <option value="NEWEST">Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="UPDATED">Sort: Recently Updated</option>
              </select>
            </div>

            <div className="bm-tabs" role="tablist" aria-label="Article status filter">
              <button
                type="button"
                className={`bm-tab-btn ${statusFilter === 'ALL' ? 'bm-tab-btn--active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                className={`bm-tab-btn ${statusFilter === 'PUBLISHED' ? 'bm-tab-btn--active' : ''}`}
                onClick={() => setStatusFilter('PUBLISHED')}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                className={`bm-tab-btn ${statusFilter === 'DRAFT' ? 'bm-tab-btn--active' : ''}`}
                onClick={() => setStatusFilter('DRAFT')}
              >
                Draft ({draftCount})
              </button>
            </div>
          </div>
        )}

        {/* Empty State or Article Cards */}
        {posts.length === 0 ? (
          <div className="bm-empty-state">
            <div className="empty-icon" aria-hidden="true">◆</div>
            <h2 className="empty-title">Your ideas deserve to be shared.</h2>
            <p className="empty-desc">
              Write your first article and start building your professional presence.
            </p>
            <button type="button" className="btn-empty-action" onClick={handleOpenCreate}>
              Create New Article
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bm-empty-state">
            <div className="empty-icon" aria-hidden="true">○</div>
            <h2 className="empty-title">No matching articles</h2>
            <p className="empty-desc">
              No articles match your current filter or search query.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('ALL')
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="bm-cards-grid">
            {filteredPosts.map((post) => {
              const isPublished = post.status === 'published'
              return (
                <article key={post.id} className="blog-card">
                  <div className="blog-card-cover">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="blog-card-img" />
                    ) : (
                      <div className="blog-card-placeholder">
                        <span className="placeholder-cat">{post.category}</span>
                        <span className="placeholder-mark" aria-hidden="true">■</span>
                      </div>
                    )}
                    <span
                      className={`blog-status-badge ${
                        isPublished ? 'blog-status-badge--published' : 'blog-status-badge--draft'
                      }`}
                    >
                      {isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <span className="blog-cat-label">{post.category}</span>
                      <span className="blog-read-time">{post.readingTime || 1} min read</span>
                    </div>

                    <h2 className="blog-card-title">{post.title}</h2>
                    <p className="blog-card-excerpt">{post.excerpt}</p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="blog-tags-row">
                        {post.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="blog-tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="blog-date-row">
                      <span>
                        {isPublished && post.publishedAt
                          ? `Published ${formatDate(post.publishedAt)}`
                          : `Updated ${formatDate(post.updatedAt)}`}
                      </span>
                    </div>

                    {isPublished && user?.username && (
                      <div className="blog-public-url-row">
                        <Link
                          to={`/p/${user.username}/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="blog-public-link"
                        >
                          <span>/p/{user.username}/blog/{post.slug}</span>
                          <span aria-hidden="true">↗</span>
                        </Link>
                      </div>
                    )}

                    <div className="blog-card-actions">
                      <button
                        type="button"
                        className="btn-card-action"
                        onClick={() => setPreviewPost(post)}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="btn-card-action"
                        onClick={() => handleOpenEdit(post)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-card-action btn-card-action--accent"
                        onClick={() => handleTogglePublish(post)}
                      >
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        className="btn-card-action btn-card-action--danger"
                        onClick={() => setDeletingPost(post)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* 3-Step Article Creation / Editing Wizard Modal */}
        {isWizardOpen && (
          <div className="bm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="blog-wizard-title">
            <div className="bm-wizard-dialog">
              <div className="bm-wizard-header">
                <div>
                  <span className="bm-modal-tag">
                    {editingPostId ? 'EDIT ARTICLE' : 'NEW ARTICLE'}
                    {hasUnsavedChanges && ' · UNSAVED CHANGES'}
                    {draftSavedAt && ` · DRAFT SAVED ${draftSavedAt}`}
                  </span>
                  <h2 id="blog-wizard-title" className="bm-modal-title">
                    {editingPostId ? formData.title || 'Edit Article' : 'Write New Article'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="bm-modal-close"
                  onClick={handleCloseWizard}
                  aria-label="Close wizard"
                >
                  ✕
                </button>
              </div>

              {/* Wizard Step Indicator */}
              <div className="bm-stepper" role="navigation" aria-label="Article wizard steps">
                {WIZARD_STEPS.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`bm-step-pill ${
                      currentStep === step.id
                        ? 'bm-step-pill--active'
                        : currentStep > step.id
                        ? 'bm-step-pill--done'
                        : ''
                    }`}
                    onClick={() => {
                      if (step.id < currentStep || (step.id > 1 && validateStep1())) {
                        setFormError('')
                        setCurrentStep(step.id)
                      }
                    }}
                  >
                    <span className="step-num">{step.number}</span>
                    <span className="step-title">{step.title}</span>
                  </button>
                ))}
              </div>

              {formError && (
                <div className="bm-form-error" role="alert">
                  <span className="error-icon">!</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="bm-wizard-body">
                {/* STEP 01: ARTICLE DETAILS */}
                {currentStep === 1 && (
                  <div className="bm-step-panel">
                    <div className="form-group">
                      <label htmlFor="blogTitle" className="form-label">
                        Article Title <span className="req">*</span>
                      </label>
                      <input
                        id="blogTitle"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Designing Resilient Frontend Systems"
                        value={formData.title}
                        onChange={(e) => updateFormField('title', e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor="blogSlug" className="form-label">
                          URL Slug <span className="req">*</span>
                        </label>
                        <input
                          id="blogSlug"
                          type="text"
                          className="form-input mono-input"
                          placeholder="designing-resilient-frontend-systems"
                          value={formData.slug}
                          onChange={(e) => {
                            setSlugTouched(true)
                            updateFormField('slug', e.target.value)
                          }}
                        />
                        <span className="field-hint">
                          Public URL: /p/{user?.username}/blog/{formData.slug || 'your-slug'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor="blogCategory" className="form-label">
                          Category <span className="req">*</span>
                        </label>
                        <select
                          id="blogCategory"
                          className="form-select"
                          value={formData.category}
                          onChange={(e) => updateFormField('category', e.target.value)}
                        >
                          {BLOG_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="label-between">
                        <label htmlFor="blogExcerpt" className="form-label">
                          Subtitle / Excerpt <span className="req">*</span>
                        </label>
                        <span className="char-counter">{formData.excerpt.length} chars</span>
                      </div>
                      <textarea
                        id="blogExcerpt"
                        rows={2}
                        className="form-textarea"
                        placeholder="A concise summary that introduces your article to readers..."
                        value={formData.excerpt}
                        onChange={(e) => updateFormField('excerpt', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="blogTags" className="form-label">
                        Tags <span className="opt">(Optional — press Enter or comma)</span>
                      </label>
                      <input
                        id="blogTags"
                        type="text"
                        className="form-input"
                        placeholder="e.g. react, architecture, performance"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                      {formData.tags.length > 0 && (
                        <div className="bm-tags-list">
                          {formData.tags.map((tag) => (
                            <span key={tag} className="bm-tag-chip">
                              <span>#{tag}</span>
                              <button
                                type="button"
                                className="tag-remove-btn"
                                onClick={() => handleRemoveTag(tag)}
                                aria-label={`Remove tag ${tag}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Cover Image <span className="opt">(Optional · JPG, PNG, WebP · Max 2MB)</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverUpload}
                        className="hidden-file-input"
                        aria-label="Upload cover image"
                      />
                      {formData.coverImage ? (
                        <div className="cover-preview-box">
                          <img src={formData.coverImage} alt="Article cover preview" className="cover-preview-img" />
                          <div className="cover-preview-actions">
                            <button
                              type="button"
                              className="btn-cover-secondary"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={imageUploading}
                            >
                              Replace Image
                            </button>
                            <button
                              type="button"
                              className="btn-cover-danger"
                              onClick={() => updateFormField('coverImage', '')}
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-upload-cover"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? 'Compressing image...' : '+ Upload Cover Image'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 02: ARTICLE CONTENT */}
                {currentStep === 2 && (
                  <div className="bm-editor-step">
                    <div className="bm-editor-meta-bar">
                      <div className="editor-stats">
                        <span>{wordCount} words</span>
                        <span>·</span>
                        <span>{readingTime} min read</span>
                      </div>
                      <div className="mobile-editor-switcher">
                        <button
                          type="button"
                          className={`switch-tab ${mobileEditorTab === 'write' ? 'switch-tab--active' : ''}`}
                          onClick={() => setMobileEditorTab('write')}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          className={`switch-tab ${mobileEditorTab === 'preview' ? 'switch-tab--active' : ''}`}
                          onClick={() => setMobileEditorTab('preview')}
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    <div className="bm-split-workspace">
                      <div className={`bm-editor-pane ${mobileEditorTab === 'write' ? 'pane--active' : 'pane--hidden-mobile'}`}>
                        <div className="md-toolbar" role="toolbar" aria-label="Markdown formatting toolbar">
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('## ', '', 'Heading')}>
                            H2
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('### ', '', 'Subheading')}>
                            H3
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('**', '**', 'bold text')}>
                            <strong>B</strong>
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('*', '*', 'italic text')}>
                            <em>I</em>
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('- ', '', 'List item')}>
                            • List
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('1. ', '', 'Ordered item')}>
                            1. List
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('[', '](https://example.com)', 'link label')}>
                            Link
                          </button>
                          <button type="button" className="tb-btn" onClick={() => insertMarkdownSnippet('> ', '', 'Quote')}>
                            Quote
                          </button>
                        </div>
                        <textarea
                          ref={textareaRef}
                          className="bm-markdown-textarea"
                          placeholder="Write your article in Markdown... Use # for headings, **bold**, *italic*, - for lists, and [text](https://...) for links."
                          value={formData.content}
                          onChange={(e) => updateFormField('content', e.target.value)}
                          aria-label="Article Markdown content"
                        />
                      </div>

                      <div className={`bm-preview-pane ${mobileEditorTab === 'preview' ? 'pane--active' : 'pane--hidden-mobile'}`}>
                        <div className="preview-pane-label">LIVE PREVIEW</div>
                        <div className="preview-pane-scroll">
                          <MarkdownRenderer content={formData.content} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 03: REVIEW & PUBLISH */}
                {currentStep === 3 && (
                  <div className="bm-review-panel">
                    {formData.coverImage && (
                      <img src={formData.coverImage} alt={formData.title} className="review-cover-img" />
                    )}

                    <div className="review-meta-grid">
                      <div>
                        <span className="review-label">CATEGORY</span>
                        <span className="review-val">{formData.category}</span>
                      </div>
                      <div>
                        <span className="review-label">READING TIME</span>
                        <span className="review-val">{readingTime} min read ({wordCount} words)</span>
                      </div>
                      <div>
                        <span className="review-label">PUBLIC URL PREVIEW</span>
                        <span className="review-val mono-url">
                          /p/{user?.username}/blog/{formData.slug || 'slug'}
                        </span>
                      </div>
                    </div>

                    <div className="review-article-header">
                      <h3 className="review-title">{formData.title}</h3>
                      <p className="review-excerpt">{formData.excerpt}</p>
                      {formData.tags.length > 0 && (
                        <div className="blog-tags-row">
                          {formData.tags.map((t) => (
                            <span key={t} className="blog-tag-pill">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="review-content-box">
                      <MarkdownRenderer content={formData.content} />
                    </div>
                  </div>
                )}
              </div>

              <div className="bm-wizard-footer">
                <div className="wizard-footer-left">
                  {currentStep > 1 && (
                    <button type="button" className="btn-modal-cancel" onClick={handlePrevStep}>
                      ← Previous
                    </button>
                  )}
                  {!editingPostId && hasUnsavedChanges && (
                    <button type="button" className="btn-discard-inline" onClick={handleDiscardDraft}>
                      Discard Draft
                    </button>
                  )}
                </div>

                <div className="wizard-footer-right">
                  {currentStep < 3 ? (
                    <>
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => handleSaveArticle('draft')}
                      >
                        Save as Draft
                      </button>
                      <button type="button" className="btn-modal-save" onClick={handleNextStep}>
                        Next Step →
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => handleSaveArticle('draft')}
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        className="btn-modal-save"
                        onClick={() => handleSaveArticle('published')}
                      >
                        Publish Article
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Article Preview Modal */}
        {previewPost && (
          <div className="bm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="preview-post-title">
            <div className="bm-wizard-dialog bm-preview-dialog">
              <div className="bm-wizard-header">
                <div>
                  <span className="bm-modal-tag">
                    {previewPost.category} · {previewPost.readingTime || 1} MIN READ · {previewPost.status.toUpperCase()}
                  </span>
                  <h2 id="preview-post-title" className="bm-modal-title">{previewPost.title}</h2>
                </div>
                <button
                  type="button"
                  className="bm-modal-close"
                  onClick={() => setPreviewPost(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
              <div className="bm-wizard-body">
                {previewPost.coverImage && (
                  <img src={previewPost.coverImage} alt={previewPost.title} className="review-cover-img" />
                )}
                <p className="review-excerpt">{previewPost.excerpt}</p>
                <div className="review-content-box">
                  <MarkdownRenderer content={previewPost.content} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingPost && (
          <div className="bm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-post-title">
            <div className="bm-delete-dialog">
              <div className="bm-wizard-header">
                <div>
                  <span className="bm-modal-tag bm-modal-tag--danger">CONFIRM REMOVAL</span>
                  <h2 id="delete-post-title" className="bm-modal-title">Delete Article</h2>
                </div>
                <button
                  type="button"
                  className="bm-modal-close"
                  onClick={() => setDeletingPost(null)}
                  aria-label="Cancel deletion"
                >
                  ✕
                </button>
              </div>
              <div className="bm-delete-body">
                <p>
                  Are you sure you want to permanently delete <strong>&quot;{deletingPost.title}&quot;</strong>?
                </p>
              </div>
              <div className="bm-delete-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setDeletingPost(null)}>
                  Cancel
                </button>
                <button type="button" className="btn-modal-delete" onClick={handleConfirmDelete}>
                  Delete Article
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
