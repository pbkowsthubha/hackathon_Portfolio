import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import ToastContainer from '../components/dashboard/ToastContainer'
import { useToast } from '../hooks/useToast'
import './EducationManager.css'

export default function EducationManager() {
  const { user } = useAuth()

  const [education, setEducation] = useState(() => {
    if (user?.username) {
      return portfolioService.getUserEducation(user.username)
    }
    return []
  })

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState(null)
  const [deletingEdu, setDeletingEdu] = useState(null)

  // Form states
  const initialForm = {
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startYear: '',
    endYear: '',
    currentlyStudying: false,
    grade: '',
    description: '',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Toast feedback
  const { toasts, showToast } = useToast(3500)

  const handleOpenAdd = () => {
    setEditingEdu(null)
    setFormData(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (edu) => {
    setEditingEdu(edu)
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      location: edu.location || '',
      startYear: edu.startYear || '',
      endYear: edu.endYear || '',
      currentlyStudying: Boolean(edu.currentlyStudying),
      grade: edu.grade || '',
      description: edu.description || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEdu(null)
    setFormError('')
  }

  const handleSaveEducation = (e) => {
    e.preventDefault()
    setFormError('')

    const inst = formData.institution.trim()
    const deg = formData.degree.trim()
    const field = formData.fieldOfStudy.trim()
    const startY = formData.startYear.trim()
    const endY = formData.currentlyStudying ? '' : formData.endYear.trim()

    if (!inst) {
      setFormError('Institution name is required.')
      return
    }
    if (!deg) {
      setFormError('Degree / qualification is required.')
      return
    }
    if (!field) {
      setFormError('Field of study is required.')
      return
    }
    if (!startY) {
      setFormError('Start year is required.')
      return
    }

    // Validate year formats and logic
    const startNum = parseInt(startY, 10)
    if (isNaN(startNum) || startNum < 1900 || startNum > 2100) {
      setFormError('Please enter a valid 4-digit start year (e.g. 2021).')
      return
    }

    if (!formData.currentlyStudying && endY) {
      const endNum = parseInt(endY, 10)
      if (isNaN(endNum) || endNum < 1900 || endNum > 2100) {
        setFormError('Please enter a valid 4-digit completion year (e.g. 2025).')
        return
      }
      if (endNum < startNum) {
        setFormError('End year cannot precede start year.')
        return
      }
    }

    try {
      if (editingEdu) {
        const updated = portfolioService.updateEducation(user.username, editingEdu.id, {
          institution: inst,
          degree: deg,
          fieldOfStudy: field,
          location: formData.location.trim(),
          startYear: startY,
          endYear: endY,
          currentlyStudying: formData.currentlyStudying,
          grade: formData.grade.trim(),
          description: formData.description.trim(),
        })
        setEducation((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        showToast(`Education record for "${inst}" updated.`)
      } else {
        const created = portfolioService.addEducation(user.username, {
          institution: inst,
          degree: deg,
          fieldOfStudy: field,
          location: formData.location.trim(),
          startYear: startY,
          endYear: endY,
          currentlyStudying: formData.currentlyStudying,
          grade: formData.grade.trim(),
          description: formData.description.trim(),
        })
        setEducation((prev) => [created, ...prev])
        showToast(`Education record for "${inst}" added.`)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the education record.')
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingEdu) return
    const success = portfolioService.deleteEducation(user.username, deletingEdu.id)
    if (success) {
      setEducation((prev) => prev.filter((item) => item.id !== deletingEdu.id))
      showToast(`Education record at "${deletingEdu.institution}" removed.`)
    } else {
      showToast('Failed to delete education record.', 'error')
    }
    setDeletingEdu(null)
  }

  const handleMove = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= education.length) return

    const reordered = [...education]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    setEducation(reordered)
    portfolioService.reorderEducation(user.username, reordered)
  }

  return (
    <DashboardLayout>
      <div className="education-manager-container">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />

        {/* Header Bar */}
        <div className="edu-header">
          <div className="edu-header-text">
            <span className="edu-tag">WORKSPACE / ACADEMICS</span>
            <h1 className="edu-title">My Education</h1>
            <p className="edu-desc">
              Document your academic background, degrees, and scholarly achievements.
            </p>
          </div>
          <div className="edu-header-actions">
            <button
              type="button"
              className="btn-add-edu"
              onClick={handleOpenAdd}
            >
              <span className="btn-icon" aria-hidden="true">+</span>
              <span>Add Education</span>
            </button>
          </div>
        </div>

        {/* Education Timeline or Empty State */}
        {education.length === 0 ? (
          <div className="edu-empty-state">
            <div className="empty-icon" aria-hidden="true">◆</div>
            <h2 className="empty-title">No education history recorded</h2>
            <p className="empty-desc">
              Add your university degrees, colleges, relevant coursework, or academic milestones.
            </p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={handleOpenAdd}
            >
              Add Your First Degree
            </button>
          </div>
        ) : (
          <div className="edu-mgr-timeline">
            {education.map((item, index) => {
              const periodDisplay = item.currentlyStudying
                ? `${item.startYear} — Present`
                : item.endYear
                ? `${item.startYear} — ${item.endYear}`
                : item.startYear

              return (
                <div key={item.id} className="edu-mgr-timeline-row">
                  <div className="edu-mgr-spine">
                    <span className="edu-mgr-marker" aria-hidden="true">■</span>
                    {index < education.length - 1 && <span className="edu-mgr-line" />}
                  </div>

                  <div className="edu-mgr-content">
                    <div className="edu-card">
                      <div className="edu-card-header">
                        <div className="edu-card-info">
                          <div className="edu-meta-row">
                            <span className="edu-period">{periodDisplay}</span>
                            {item.currentlyStudying && (
                              <span className="edu-status-pill">Currently Enrolled</span>
                            )}
                            {item.grade && (
                              <span className="edu-grade-pill">Grade: {item.grade}</span>
                            )}
                          </div>
                          <h2 className="edu-degree">
                            {item.degree} in {item.fieldOfStudy}
                          </h2>
                          <h3 className="edu-institution">
                            {item.institution}
                            {item.location && <span className="edu-location"> • {item.location}</span>}
                          </h3>
                        </div>

                        <div className="edu-card-actions">
                          <button
                            type="button"
                            className="btn-edu-icon"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                            title="Move Earlier"
                            aria-label="Move education record earlier"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn-edu-icon"
                            onClick={() => handleMove(index, 1)}
                            disabled={index === education.length - 1}
                            title="Move Later"
                            aria-label="Move education record later"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn-edu-icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Record"
                            aria-label="Edit education record"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="btn-edu-icon btn-edu-icon--delete"
                            onClick={() => setDeletingEdu(item)}
                            title="Delete Record"
                            aria-label="Delete education record"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="edu-description">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add / Edit Education Modal */}
        {isModalOpen && (
          <div className="edu-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edu-modal-title">
            <div className="edu-modal-dialog">
              <div className="edu-modal-header">
                <div>
                  <span className="edu-modal-tag">{editingEdu ? 'UPDATE RECORD' : 'NEW DEGREE'}</span>
                  <h2 id="edu-modal-title" className="edu-modal-title">
                    {editingEdu ? 'Edit Education Record' : 'Add Education Record'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="edu-modal-close"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEducation} className="edu-modal-form">
                {formError && (
                  <div className="edu-form-error" role="alert">
                    <span className="error-icon">!</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="eduInstitution" className="form-label">
                    Institution / University <span className="req">*</span>
                  </label>
                  <input
                    id="eduInstitution"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Stanford University, MIT, IIT Bombay"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="eduDegree" className="form-label">
                      Degree / Qualification <span className="req">*</span>
                    </label>
                    <input
                      id="eduDegree"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bachelor of Technology, M.S., Ph.D."
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eduFieldOfStudy" className="form-label">
                      Field of Study <span className="req">*</span>
                    </label>
                    <input
                      id="eduFieldOfStudy"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science & Engineering"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="eduLocation" className="form-label">
                      Location <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="eduLocation"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Stanford, California"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eduGrade" className="form-label">
                      Grade / CGPA / Honors <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="eduGrade"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 3.9/4.0 GPA, First Class with Distinction"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-dates-section">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="eduStartYear" className="form-label">
                        Start Year <span className="req">*</span>
                      </label>
                      <input
                        id="eduStartYear"
                        type="text"
                        maxLength={4}
                        className="form-input"
                        placeholder="e.g. 2020"
                        value={formData.startYear}
                        onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="eduEndYear" className="form-label">
                        End Year / Expected <span className="opt">{formData.currentlyStudying ? '(Enrolled)' : ''}</span>
                      </label>
                      <input
                        id="eduEndYear"
                        type="text"
                        maxLength={4}
                        className="form-input"
                        placeholder={formData.currentlyStudying ? 'Present' : 'e.g. 2024'}
                        value={formData.currentlyStudying ? '' : formData.endYear}
                        disabled={formData.currentlyStudying}
                        onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                      />
                    </div>
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.currentlyStudying}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentlyStudying: e.target.checked,
                          endYear: e.target.checked ? '' : formData.endYear,
                        })
                      }
                    />
                    <span>I am currently studying or pursuing this degree</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="eduDescription" className="form-label">
                    Key Coursework, Thesis, or Honors <span className="opt">(Optional)</span>
                  </label>
                  <textarea
                    id="eduDescription"
                    rows={3}
                    className="form-textarea"
                    placeholder="e.g. Core Courses: Distributed Systems, Deep Learning. Dean's Honor List."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="edu-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    {editingEdu ? 'Save Changes' : 'Add Degree'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingEdu && (
          <div className="edu-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-edu-title">
            <div className="edu-modal-dialog edu-modal-dialog--sm">
              <div className="edu-modal-header">
                <div>
                  <span className="edu-modal-tag edu-modal-tag--danger">CONFIRM REMOVAL</span>
                  <h2 id="delete-edu-title" className="edu-modal-title">Delete Record</h2>
                </div>
                <button
                  type="button"
                  className="edu-modal-close"
                  onClick={() => setDeletingEdu(null)}
                  aria-label="Cancel deletion"
                >
                  ✕
                </button>
              </div>

              <div className="edu-delete-body">
                <p>
                  Are you sure you want to delete your degree from{' '}
                  <strong>&quot;{deletingEdu.institution}&quot;</strong> ({deletingEdu.degree})?
                </p>
                <p className="delete-subtext">This action permanently removes this entry from your portfolio.</p>
              </div>

              <div className="edu-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeletingEdu(null)}
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
