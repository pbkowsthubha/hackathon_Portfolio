import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import {
  DESIGN_THEMES,
  FONT_FAMILY_OPTIONS,
  SECTION_LABELS,
  getDefaultDesign,
  getThemeById,
} from '../data/designThemes'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import PortfolioRenderer from '../components/portfolio/PortfolioRenderer'
import { useToast } from '../hooks/useToast'
import './DesignStudio.css'

export default function DesignStudio() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast(3500)

  const [portfolio, setPortfolio] = useState(() =>
    user?.username ? portfolioService.getUserPortfolio(user.username) : null
  )
  const [savedDesign, setSavedDesign] = useState(() =>
    portfolio?.design || getDefaultDesign('modern-editorial')
  )
  const [draftDesign, setDraftDesign] = useState(() =>
    portfolio?.design || getDefaultDesign('modern-editorial')
  )

  const [activeTab, setActiveTab] = useState('themes')
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const hasUnsavedChanges = JSON.stringify(draftDesign) !== JSON.stringify(savedDesign)

  const handleSelectTheme = (themeId) => {
    const theme = getThemeById(themeId)
    setDraftDesign((prev) => ({
      ...prev,
      themeId: theme.id,
      colors: { ...theme.config.colors },
      typography: { ...theme.config.typography },
      components: { ...theme.config.components },
      layout: {
        ...prev.layout,
        heroLayout: theme.config.layout.heroLayout,
        projectLayout: theme.config.layout.projectLayout,
        navStyle: theme.config.layout.navStyle,
      },
    }))
  }

  const handleResetToThemeDefault = () => {
    const theme = getThemeById(draftDesign.themeId)
    setDraftDesign((prev) => ({
      ...prev,
      colors: { ...theme.config.colors },
      typography: { ...theme.config.typography },
      components: { ...theme.config.components },
      layout: {
        ...prev.layout,
        heroLayout: theme.config.layout.heroLayout,
        projectLayout: theme.config.layout.projectLayout,
        navStyle: theme.config.layout.navStyle,
      },
    }))
    showToast(`Reset styles to "${theme.name}" defaults (unsaved).`)
  }

  const updateColor = (key, value) => {
    setDraftDesign((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }

  const updateTypography = (key, value) => {
    setDraftDesign((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }))
  }

  const updateComponent = (key, value) => {
    setDraftDesign((prev) => ({
      ...prev,
      components: { ...prev.components, [key]: value },
    }))
  }

  const updateLayoutField = (key, value) => {
    setDraftDesign((prev) => ({
      ...prev,
      layout: { ...prev.layout, [key]: value },
    }))
  }

  const toggleSectionVisibility = (sectionId) => {
    setDraftDesign((prev) => {
      const hidden = prev.layout.hiddenSections || []
      const nextHidden = hidden.includes(sectionId)
        ? hidden.filter((s) => s !== sectionId)
        : [...hidden, sectionId]
      return {
        ...prev,
        layout: { ...prev.layout, hiddenSections: nextHidden },
      }
    })
  }

  const moveSection = (index, direction) => {
    setDraftDesign((prev) => {
      const order = [...(prev.layout.sectionOrder || [])]
      const target = index + direction
      if (target < 0 || target >= order.length) return prev
      const [item] = order.splice(index, 1)
      order.splice(target, 0, item)
      return {
        ...prev,
        layout: { ...prev.layout, sectionOrder: order },
      }
    })
  }

  const handleSaveChanges = () => {
    if (!user?.username) return
    try {
      const updated = portfolioService.updatePortfolioDesign(user.username, draftDesign)
      setPortfolio(updated)
      setSavedDesign(updated.design)
      setDraftDesign(updated.design)
      showToast('Design customization saved and applied to your portfolio.')
    } catch (err) {
      showToast(err.message || 'Failed to save design customization.', 'error')
    }
  }

  const handleConfirmResetAll = () => {
    if (!user?.username) return
    try {
      const updated = portfolioService.resetPortfolioDesign(user.username)
      setPortfolio(updated)
      setSavedDesign(updated.design)
      setDraftDesign(updated.design)
      setIsResetModalOpen(false)
      showToast('Design customization reset to Modern Editorial defaults.')
    } catch (err) {
      showToast(err.message || 'Failed to reset design.', 'error')
    }
  }

  return (
    <DashboardLayout>
      <div className="ds-container">
        <ToastContainer toasts={toasts} />

        {/* Top Toolbar */}
        <div className="ds-toolbar">
          <div className="ds-toolbar-left">
            <span className="ds-kicker">WORKSPACE / VISUALIZATION</span>
            <div className="ds-title-row">
              <h1 className="ds-title">Design Studio</h1>
              {hasUnsavedChanges && (
                <span className="ds-unsaved-badge">UNSAVED PREVIEW</span>
              )}
            </div>
          </div>

          <div className="ds-toolbar-center" role="group" aria-label="Preview viewport size">
            <button
              type="button"
              className={`ds-device-btn ${previewDevice === 'desktop' ? 'ds-device-btn--active' : ''}`}
              onClick={() => setPreviewDevice('desktop')}
            >
              Desktop
            </button>
            <button
              type="button"
              className={`ds-device-btn ${previewDevice === 'tablet' ? 'ds-device-btn--active' : ''}`}
              onClick={() => setPreviewDevice('tablet')}
            >
              Tablet
            </button>
            <button
              type="button"
              className={`ds-device-btn ${previewDevice === 'mobile' ? 'ds-device-btn--active' : ''}`}
              onClick={() => setPreviewDevice('mobile')}
            >
              Mobile
            </button>
          </div>

          <div className="ds-toolbar-right">
            {user?.username && (
              <Link
                to={`/p/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-btn-secondary"
              >
                View Public ↗
              </Link>
            )}
            <button
              type="button"
              className="ds-btn-secondary"
              onClick={() => setIsResetModalOpen(true)}
            >
              Reset Customization
            </button>
            <button
              type="button"
              className="ds-btn-primary"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Main Studio Workspace */}
        <div className="ds-workspace">
          {/* Left Customization Panel */}
          <aside className="ds-controls-panel" aria-label="Design customization controls">
            <div className="ds-panel-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'themes'}
                className={`ds-tab ${activeTab === 'themes' ? 'ds-tab--active' : ''}`}
                onClick={() => setActiveTab('themes')}
              >
                Themes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'style'}
                className={`ds-tab ${activeTab === 'style' ? 'ds-tab--active' : ''}`}
                onClick={() => setActiveTab('style')}
              >
                Colors &amp; Style
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'layout'}
                className={`ds-tab ${activeTab === 'layout' ? 'ds-tab--active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                Layout
              </button>
            </div>

            <div className="ds-panel-body">
              {/* TAB 1: THEME LIBRARY */}
              {activeTab === 'themes' && (
                <div className="ds-themes-list">
                  {DESIGN_THEMES.map((theme) => {
                    const isSelected = draftDesign.themeId === theme.id
                    return (
                      <div
                        key={theme.id}
                        className={`ds-theme-card ${isSelected ? 'ds-theme-card--selected' : ''}`}
                      >
                        <div className="theme-swatches" aria-hidden="true">
                          {theme.previewSwatches.map((hex, i) => (
                            <span
                              key={i}
                              className="theme-swatch"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                        <div className="theme-card-head">
                          <h2 className="theme-card-name">{theme.name}</h2>
                          {isSelected && <span className="theme-selected-pill">Selected</span>}
                        </div>
                        <p className="theme-card-desc">{theme.description}</p>
                        <button
                          type="button"
                          className={`btn-select-theme ${isSelected ? 'btn-select-theme--active' : ''}`}
                          onClick={() => handleSelectTheme(theme.id)}
                        >
                          {isSelected ? 'Currently Selected' : 'Select Theme'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* TAB 2: COLORS, TYPOGRAPHY & COMPONENTS */}
              {activeTab === 'style' && (
                <div className="ds-style-controls">
                  <div className="ds-control-group">
                    <div className="ds-group-header">
                      <h2 className="ds-group-title">Palette</h2>
                      <button
                        type="button"
                        className="ds-link-reset"
                        onClick={handleResetToThemeDefault}
                      >
                        Reset to Theme Default
                      </button>
                    </div>

                    <div className="ds-color-grid">
                      {[
                        { key: 'background', label: 'Background' },
                        { key: 'secondary', label: 'Surface' },
                        { key: 'primary', label: 'Primary Heading' },
                        { key: 'text', label: 'Body Text' },
                        { key: 'accent', label: 'Accent' },
                      ].map(({ key, label }) => (
                        <label key={key} className="ds-color-field">
                          <span className="ds-field-label">{label}</span>
                          <div className="ds-color-input-wrap">
                            <input
                              type="color"
                              value={draftDesign.colors[key]}
                              onChange={(e) => updateColor(key, e.target.value)}
                              aria-label={`${label} color`}
                            />
                            <span className="ds-color-hex">{draftDesign.colors[key]}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="ds-control-group">
                    <h2 className="ds-group-title">Typography</h2>
                    <label className="ds-select-field">
                      <span className="ds-field-label">Heading Font</span>
                      <select
                        value={draftDesign.typography.headingFont}
                        onChange={(e) => updateTypography('headingFont', e.target.value)}
                      >
                        {FONT_FAMILY_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="ds-select-field">
                      <span className="ds-field-label">Body Font</span>
                      <select
                        value={draftDesign.typography.fontFamily}
                        onChange={(e) => updateTypography('fontFamily', e.target.value)}
                      >
                        {FONT_FAMILY_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="ds-control-group">
                    <h2 className="ds-group-title">Components &amp; Rhythm</h2>
                    <div className="ds-select-grid">
                      <label className="ds-select-field">
                        <span className="ds-field-label">Button Style</span>
                        <select
                          value={draftDesign.components.buttonStyle}
                          onChange={(e) => updateComponent('buttonStyle', e.target.value)}
                        >
                          <option value="solid">Solid Fill</option>
                          <option value="outline">Outline</option>
                          <option value="pill">Rounded Pill</option>
                        </select>
                      </label>

                      <label className="ds-select-field">
                        <span className="ds-field-label">Border Radius</span>
                        <select
                          value={draftDesign.components.borderRadius}
                          onChange={(e) => updateComponent('borderRadius', e.target.value)}
                        >
                          <option value="none">Sharp (0px)</option>
                          <option value="sm">Subtle (4px)</option>
                          <option value="md">Medium (10px)</option>
                          <option value="lg">Rounded (18px)</option>
                        </select>
                      </label>

                      <label className="ds-select-field">
                        <span className="ds-field-label">Card Style</span>
                        <select
                          value={draftDesign.components.cardStyle}
                          onChange={(e) => updateComponent('cardStyle', e.target.value)}
                        >
                          <option value="bordered">Bordered</option>
                          <option value="elevated">Elevated Shadow</option>
                          <option value="minimal">Minimal Transparent</option>
                        </select>
                      </label>

                      <label className="ds-select-field">
                        <span className="ds-field-label">Spacing Density</span>
                        <select
                          value={draftDesign.components.spacing}
                          onChange={(e) => updateComponent('spacing', e.target.value)}
                        >
                          <option value="compact">Compact</option>
                          <option value="normal">Normal</option>
                          <option value="spacious">Spacious</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LAYOUT & SECTIONS */}
              {activeTab === 'layout' && (
                <div className="ds-layout-controls">
                  <div className="ds-control-group">
                    <h2 className="ds-group-title">Structure Presets</h2>
                    <label className="ds-select-field">
                      <span className="ds-field-label">Hero Layout</span>
                      <select
                        value={draftDesign.layout.heroLayout}
                        onChange={(e) => updateLayoutField('heroLayout', e.target.value)}
                      >
                        <option value="split">Asymmetric Split</option>
                        <option value="centered">Centered Editorial</option>
                        <option value="minimal">Minimal Typographic</option>
                      </select>
                    </label>

                    <label className="ds-select-field">
                      <span className="ds-field-label">Project Card Layout</span>
                      <select
                        value={draftDesign.layout.projectLayout}
                        onChange={(e) => updateLayoutField('projectLayout', e.target.value)}
                      >
                        <option value="grid">Multi-Column Grid</option>
                        <option value="list">Editorial List</option>
                      </select>
                    </label>

                    <label className="ds-select-field">
                      <span className="ds-field-label">Navigation Style</span>
                      <select
                        value={draftDesign.layout.navStyle}
                        onChange={(e) => updateLayoutField('navStyle', e.target.value)}
                      >
                        <option value="standard">Standard Split</option>
                        <option value="centered">Centered Stack</option>
                        <option value="minimal">Minimal Dashed</option>
                      </select>
                    </label>
                  </div>

                  <div className="ds-control-group">
                    <h2 className="ds-group-title">Sections Order &amp; Visibility</h2>
                    <p className="ds-helper-note">
                      Hiding a section removes it from public view without deleting your saved data.
                    </p>
                    <div className="ds-sections-list">
                      {(draftDesign.layout.sectionOrder || []).map((sectionId, idx, arr) => {
                        const isHidden = (draftDesign.layout.hiddenSections || []).includes(sectionId)
                        return (
                          <div key={sectionId} className={`ds-section-row ${isHidden ? 'ds-section-row--hidden' : ''}`}>
                            <label className="ds-section-toggle">
                              <input
                                type="checkbox"
                                checked={!isHidden}
                                onChange={() => toggleSectionVisibility(sectionId)}
                              />
                              <span>{SECTION_LABELS[sectionId] || sectionId}</span>
                            </label>
                            <div className="ds-section-order-btns">
                              <button
                                type="button"
                                className="ds-order-btn"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, -1)}
                                aria-label={`Move ${SECTION_LABELS[sectionId]} up`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="ds-order-btn"
                                disabled={idx === arr.length - 1}
                                onClick={() => moveSection(idx, 1)}
                                aria-label={`Move ${SECTION_LABELS[sectionId]} down`}
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Central Live Portfolio Preview */}
          <section className="ds-preview-stage" aria-label="Live portfolio preview">
            <div className="ds-preview-bar">
              <span className="preview-bar-label">
                LIVE PREVIEW · {previewDevice.toUpperCase()} · THEME: {getThemeById(draftDesign.themeId).name.toUpperCase()}
              </span>
              <span className="preview-bar-url">/p/{user?.username}</span>
            </div>

            <div className="ds-preview-canvas">
              <div className={`ds-preview-frame ds-preview-frame--${previewDevice}`}>
                <PortfolioRenderer
                  portfolio={portfolio}
                  designOverride={draftDesign}
                  isPreview
                />
              </div>
            </div>
          </section>
        </div>

        {/* Reset Confirmation Modal */}
        {isResetModalOpen && (
          <div className="ds-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ds-reset-title">
            <div className="ds-modal-dialog">
              <h2 id="ds-reset-title" className="ds-modal-title">Reset Design Customization?</h2>
              <p className="ds-modal-desc">
                This will restore your portfolio theme, colors, typography, and section order to the default Modern Editorial configuration. Your saved profile, projects, and blog articles will not be affected.
              </p>
              <div className="ds-modal-actions">
                <button type="button" className="ds-btn-secondary" onClick={() => setIsResetModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="ds-btn-danger" onClick={handleConfirmResetAll}>
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
