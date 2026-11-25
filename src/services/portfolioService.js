/**
 * Portfolio Service
 * Manages retrieval and updates of portfolio data:
 * - Special handler for the 'kowsthuba' flagship demo portfolio
 * - Dynamic isolation of user portfolios stored in localStorage
 */
import { storageService, STORAGE_KEYS } from './storageService'
import { authService } from './authService'
import kowsthubaData from '../data/portfolioData'
import { DEFAULT_SECTION_ORDER, getDefaultDesign } from '../data/designThemes'

export const portfolioService = {
  getPortfolioByUsername(username) {
    if (!username) return null
    const cleanUsername = username.trim().toLowerCase()

    // Flagship Demo Portfolio
    if (cleanUsername === 'kowsthuba') {
      return {
        isDemo: true,
        data: kowsthubaData,
      }
    }

    // Custom user portfolios from localStorage
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const userPortfolio = portfolios[cleanUsername]

    if (userPortfolio) {
      return {
        isDemo: false,
        data: this.normalizePortfolio(userPortfolio, cleanUsername),
      }
    }

    return null
  },

  getUserPortfolio(username) {
    if (!username) return null
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]

    if (!existing) {
      return this.createInitialPortfolio(cleanUsername)
    }

    return this.normalizePortfolio(existing, cleanUsername)
  },

  createInitialPortfolio(username, userId = null, fullName = '') {
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})

    const newPortfolio = {
      id: `port-${Date.now()}`,
      userId: userId || `usr-${Date.now()}`,
      username: cleanUsername,
      fullName: fullName || cleanUsername,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      profile: {
        fullName: fullName || '',
        professionalTitle: '',
        introduction: '',
        about: '',
        email: '',
        location: '',
        profileImage: null,
        socialLinks: {
          github: '',
          linkedin: '',
          website: '',
        },
      },
      skills: [],
      projects: [],
      education: [],
      achievements: [],
      certifications: [],
      blogPosts: [],
      design: getDefaultDesign('modern-editorial'),
      publication: {
        status: 'draft',
        publishedAt: null,
        unpublishedAt: null,
        lastPublishedAt: null,
      },
    }

    portfolios[cleanUsername] = newPortfolio
    storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    return newPortfolio
  },

  normalizePortfolio(rawPortfolio, username) {
    // Ensure all profile fields exist for legacy or newly seeded accounts
    const profile = rawPortfolio.profile || {}
    const socialLinks = profile.socialLinks || {}

    return {
      ...rawPortfolio,
      username: rawPortfolio.username || username,
      fullName: profile.fullName || rawPortfolio.fullName || '',
      status: rawPortfolio.status || 'draft',
      updatedAt: rawPortfolio.updatedAt || new Date().toISOString(),
      profile: {
        fullName: profile.fullName || rawPortfolio.fullName || '',
        professionalTitle: profile.professionalTitle || '',
        introduction: profile.introduction || '',
        about: profile.about || '',
        email: profile.email || '',
        location: profile.location || '',
        profileImage: profile.profileImage || null,
        socialLinks: {
          github: socialLinks.github || '',
          linkedin: socialLinks.linkedin || '',
          website: socialLinks.website || '',
        },
      },
      skills: Array.isArray(rawPortfolio.skills) ? rawPortfolio.skills : [],
      projects: Array.isArray(rawPortfolio.projects) ? rawPortfolio.projects : [],
      education: Array.isArray(rawPortfolio.education) ? rawPortfolio.education : [],
      achievements: Array.isArray(rawPortfolio.achievements) ? rawPortfolio.achievements : [],
      certifications: Array.isArray(rawPortfolio.certifications) ? rawPortfolio.certifications : [],
      blogPosts: Array.isArray(rawPortfolio.blogPosts) ? rawPortfolio.blogPosts : [],
      design: this.normalizeDesign(rawPortfolio.design),
      publication: this.normalizePublication(rawPortfolio.publication),
    }
  },

  normalizePublication(rawPublication) {
    // Idempotent normalization: preserve existing publication metadata untouched
    if (rawPublication && typeof rawPublication === 'object') {
      return {
        status: rawPublication.status === 'published' ? 'published' : 'draft',
        publishedAt: rawPublication.publishedAt ?? null,
        unpublishedAt: rawPublication.unpublishedAt ?? null,
        lastPublishedAt: rawPublication.lastPublishedAt ?? null,
        ...(rawPublication.migratedLegacyPublic ? { migratedLegacyPublic: true } : {}),
        ...(rawPublication.migratedAt ? { migratedAt: rawPublication.migratedAt } : {}),
      }
    }

    // Legacy portfolios without publication metadata were previously public;
    // migrate them as published without inventing a historical publication date.
    return {
      status: 'published',
      publishedAt: null,
      unpublishedAt: null,
      lastPublishedAt: null,
      migratedLegacyPublic: true,
      migratedAt: new Date().toISOString(),
    }
  },

  normalizeDesign(rawDesign) {
    const base = getDefaultDesign(rawDesign?.themeId || 'modern-editorial')
    if (!rawDesign || typeof rawDesign !== 'object') return base

    const rawOrder = Array.isArray(rawDesign.layout?.sectionOrder)
      ? rawDesign.layout.sectionOrder.filter((s) => DEFAULT_SECTION_ORDER.includes(s))
      : []
    const mergedOrder = [
      ...rawOrder,
      ...DEFAULT_SECTION_ORDER.filter((s) => !rawOrder.includes(s)),
    ]

    return {
      themeId: rawDesign.themeId || base.themeId,
      colors: {
        ...base.colors,
        ...(rawDesign.colors || {}),
      },
      typography: {
        ...base.typography,
        ...(rawDesign.typography || {}),
      },
      components: {
        ...base.components,
        ...(rawDesign.components || {}),
      },
      layout: {
        ...base.layout,
        ...(rawDesign.layout || {}),
        sectionOrder: mergedOrder,
        hiddenSections: Array.isArray(rawDesign.layout?.hiddenSections)
          ? rawDesign.layout.hiddenSections.filter((s) => DEFAULT_SECTION_ORDER.includes(s))
          : [],
      },
    }
  },

  updatePortfolioProfile(username, updatedProfile) {
    if (!username) throw new Error('Username is required to update portfolio.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})

    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const newPortfolio = {
      ...normalized,
      fullName: updatedProfile.fullName ? updatedProfile.fullName.trim() : normalized.fullName,
      updatedAt: new Date().toISOString(),
      profile: {
        ...normalized.profile,
        fullName: updatedProfile.fullName ? updatedProfile.fullName.trim() : normalized.profile.fullName,
        professionalTitle: updatedProfile.professionalTitle ? updatedProfile.professionalTitle.trim() : '',
        introduction: updatedProfile.introduction ? updatedProfile.introduction.trim() : '',
        about: updatedProfile.about ? updatedProfile.about.trim() : '',
        email: updatedProfile.email ? updatedProfile.email.trim() : '',
        location: updatedProfile.location ? updatedProfile.location.trim() : '',
        profileImage: updatedProfile.profileImage !== undefined ? updatedProfile.profileImage : normalized.profile.profileImage,
        socialLinks: {
          github: updatedProfile.socialLinks?.github ? updatedProfile.socialLinks.github.trim() : '',
          linkedin: updatedProfile.socialLinks?.linkedin ? updatedProfile.socialLinks.linkedin.trim() : '',
          website: updatedProfile.socialLinks?.website ? updatedProfile.socialLinks.website.trim() : '',
        },
      },
    }

    portfolios[cleanUsername] = newPortfolio
    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)

    if (!saved) {
      throw new Error('Failed to save portfolio to local storage. Storage quota may be exceeded.')
    }

    // Keep user full name in sync in users & session storage
    if (updatedProfile.fullName) {
      const users = storageService.get(STORAGE_KEYS.USERS, [])
      const userIndex = users.findIndex((u) => u.username.toLowerCase() === cleanUsername)
      if (userIndex !== -1) {
        users[userIndex].fullName = updatedProfile.fullName.trim()
        storageService.set(STORAGE_KEYS.USERS, users)
      }

      const session = storageService.get(STORAGE_KEYS.SESSION, null)
      if (session && session.username.toLowerCase() === cleanUsername) {
        session.fullName = updatedProfile.fullName.trim()
        storageService.set(STORAGE_KEYS.SESSION, session)
      }
    }

    return newPortfolio
  },

  calculateCompletion(portfolio) {
    if (!portfolio || !portfolio.profile) {
      return { percentage: 0, completedCount: 0, totalCount: 7, fields: [] }
    }

    const { profile } = portfolio
    const checks = [
      { name: 'Full Name', completed: Boolean(profile.fullName?.trim()), weight: 15 },
      { name: 'Professional Title', completed: Boolean(profile.professionalTitle?.trim()), weight: 15 },
      { name: 'Short Introduction', completed: Boolean(profile.introduction?.trim()), weight: 15 },
      { name: 'About Me', completed: Boolean(profile.about?.trim()), weight: 15 },
      { name: 'Location', completed: Boolean(profile.location?.trim()), weight: 10 },
      { name: 'Profile Photograph', completed: Boolean(profile.profileImage), weight: 15 },
      {
        name: 'Social Links',
        completed: Boolean(
          profile.socialLinks?.github?.trim() ||
          profile.socialLinks?.linkedin?.trim() ||
          profile.socialLinks?.website?.trim()
        ),
        weight: 15,
      },
    ]

    const percentage = checks.reduce((acc, c) => (c.completed ? acc + c.weight : acc), 0)
    const completedCount = checks.filter((c) => c.completed).length

    return {
      percentage,
      completedCount,
      totalCount: checks.length,
      fields: checks,
    }
  },

  getProfileDraft(username) {
    if (!username) return null
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
    return drafts[cleanUsername] || null
  },

  saveProfileDraft(username, draftData) {
    if (!username || !draftData) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
    drafts[cleanUsername] = {
      ...draftData,
      updatedAt: new Date().toISOString(),
    }
    return storageService.set(STORAGE_KEYS.PROFILE_DRAFTS, drafts)
  },

  clearProfileDraft(username) {
    if (!username) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
    if (drafts[cleanUsername]) {
      delete drafts[cleanUsername]
      return storageService.set(STORAGE_KEYS.PROFILE_DRAFTS, drafts)
    }
    return true
  },

  // --------------------------------------------------------------------------
  // Projects Showcase Management (Stage 9)
  // --------------------------------------------------------------------------
  getUserProjects(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.projects) ? portfolio.projects : []
  },

  addProject(username, projectData) {
    if (!username) throw new Error('Username is required to add project.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const projectId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const newProject = {
      id: projectId,
      title: projectData.title?.trim() || 'Untitled Project',
      category: projectData.category?.trim() || 'Other',
      description: projectData.description?.trim() || '',
      technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
      image: projectData.image || '',
      githubUrl: projectData.githubUrl?.trim() || '',
      liveUrl: projectData.liveUrl?.trim() || '',
      completionDate: projectData.completionDate?.trim() || '',
      featured: Boolean(projectData.featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    normalized.projects = [newProject, ...(normalized.projects || [])]
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to save project. Storage quota may be exceeded.')
    }

    return newProject
  },

  updateProject(username, projectId, updatedData) {
    if (!username || !projectId) throw new Error('Username and Project ID are required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.projects.findIndex((p) => p.id === projectId)
    if (index === -1) throw new Error('Project not found.')

    const current = normalized.projects[index]
    const updatedProject = {
      ...current,
      title: updatedData.title !== undefined ? updatedData.title.trim() : current.title,
      category: updatedData.category !== undefined ? updatedData.category.trim() : current.category,
      description: updatedData.description !== undefined ? updatedData.description.trim() : current.description,
      technologies: Array.isArray(updatedData.technologies) ? updatedData.technologies : current.technologies,
      image: updatedData.image !== undefined ? updatedData.image : current.image,
      githubUrl: updatedData.githubUrl !== undefined ? updatedData.githubUrl.trim() : current.githubUrl,
      liveUrl: updatedData.liveUrl !== undefined ? updatedData.liveUrl.trim() : current.liveUrl,
      completionDate: updatedData.completionDate !== undefined ? updatedData.completionDate.trim() : current.completionDate,
      featured: updatedData.featured !== undefined ? Boolean(updatedData.featured) : current.featured,
      updatedAt: new Date().toISOString(),
    }

    normalized.projects[index] = updatedProject
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to update project. Storage quota may be exceeded.')
    }

    return updatedProject
  },

  deleteProject(username, projectId) {
    if (!username || !projectId) throw new Error('Username and Project ID are required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.projects = normalized.projects.filter((p) => p.id !== projectId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  toggleFeaturedProject(username, projectId) {
    if (!username || !projectId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.projects.findIndex((p) => p.id === projectId)
    if (index === -1) return false

    normalized.projects[index].featured = !normalized.projects[index].featured
    normalized.projects[index].updatedAt = new Date().toISOString()
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  reorderProjects(username, newProjectsList) {
    if (!username || !Array.isArray(newProjectsList)) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.projects = newProjectsList
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  getProjectDraft(username) {
    if (!username) return null
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
    return drafts[cleanUsername] || null
  },

  saveProjectDraft(username, draftData) {
    if (!username || !draftData) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
    drafts[cleanUsername] = {
      ...draftData,
      updatedAt: new Date().toISOString(),
    }
    return storageService.set(STORAGE_KEYS.PROJECT_DRAFTS, drafts)
  },

  clearProjectDraft(username) {
    if (!username) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
    if (drafts[cleanUsername]) {
      delete drafts[cleanUsername]
      return storageService.set(STORAGE_KEYS.PROJECT_DRAFTS, drafts)
    }
    return true
  },

  // --------------------------------------------------------------------------
  // Skills Management (Stage 10)
  // --------------------------------------------------------------------------
  getUserSkills(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.skills) ? portfolio.skills : []
  },

  addSkill(username, skillData) {
    if (!username) throw new Error('Username is required to add skill.')
    const cleanUsername = username.trim().toLowerCase()
    const name = skillData.name?.trim() || ''
    const category = skillData.category?.trim() || 'Other Skills'

    if (!name) throw new Error('Skill name is required.')

    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const isDuplicate = normalized.skills.some(
      (s) => s.category.toLowerCase() === category.toLowerCase() && s.name.toLowerCase() === name.toLowerCase()
    )
    if (isDuplicate) {
      throw new Error(`Skill "${name}" already exists under "${category}".`)
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const newSkill = {
      id,
      name,
      category,
      description: skillData.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    normalized.skills = [...normalized.skills, newSkill]
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to save skill. Storage quota exceeded.')
    return newSkill
  },

  updateSkill(username, skillId, updatedData) {
    if (!username || !skillId) throw new Error('Username and Skill ID required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.skills.findIndex((s) => s.id === skillId)
    if (index === -1) throw new Error('Skill not found.')

    const current = normalized.skills[index]
    const newName = updatedData.name !== undefined ? updatedData.name.trim() : current.name
    const newCategory = updatedData.category !== undefined ? updatedData.category.trim() : current.category

    if (!newName) throw new Error('Skill name is required.')

    if (newName.toLowerCase() !== current.name.toLowerCase() || newCategory.toLowerCase() !== current.category.toLowerCase()) {
      const isDuplicate = normalized.skills.some(
        (s) => s.id !== skillId && s.category.toLowerCase() === newCategory.toLowerCase() && s.name.toLowerCase() === newName.toLowerCase()
      )
      if (isDuplicate) {
        throw new Error(`Skill "${newName}" already exists under "${newCategory}".`)
      }
    }

    const updated = {
      ...current,
      name: newName,
      category: newCategory,
      description: updatedData.description !== undefined ? updatedData.description.trim() : current.description,
      updatedAt: new Date().toISOString(),
    }

    normalized.skills[index] = updated
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to update skill.')
    return updated
  },

  deleteSkill(username, skillId) {
    if (!username || !skillId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.skills = normalized.skills.filter((s) => s.id !== skillId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  reorderSkills(username, newSkillsList) {
    if (!username || !Array.isArray(newSkillsList)) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.skills = newSkillsList
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  // --------------------------------------------------------------------------
  // Education Management (Stage 10)
  // --------------------------------------------------------------------------
  getUserEducation(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.education) ? portfolio.education : []
  },

  addEducation(username, eduData) {
    if (!username) throw new Error('Username is required to add education.')
    const cleanUsername = username.trim().toLowerCase()

    if (!eduData.institution?.trim()) throw new Error('Institution name is required.')
    if (!eduData.degree?.trim()) throw new Error('Degree / qualification is required.')
    if (!eduData.fieldOfStudy?.trim()) throw new Error('Field of study is required.')
    if (!eduData.startYear) throw new Error('Start year is required.')

    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `edu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const newEdu = {
      id,
      institution: eduData.institution.trim(),
      degree: eduData.degree.trim(),
      fieldOfStudy: eduData.fieldOfStudy.trim(),
      location: eduData.location?.trim() || '',
      startYear: String(eduData.startYear).trim(),
      endYear: eduData.currentlyStudying ? '' : String(eduData.endYear || '').trim(),
      currentlyStudying: Boolean(eduData.currentlyStudying),
      grade: eduData.grade?.trim() || '',
      description: eduData.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    normalized.education = [newEdu, ...normalized.education]
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to save education record.')
    return newEdu
  },

  updateEducation(username, eduId, updatedData) {
    if (!username || !eduId) throw new Error('Username and ID required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.education.findIndex((e) => e.id === eduId)
    if (index === -1) throw new Error('Education record not found.')

    const current = normalized.education[index]
    const updated = {
      ...current,
      institution: updatedData.institution !== undefined ? updatedData.institution.trim() : current.institution,
      degree: updatedData.degree !== undefined ? updatedData.degree.trim() : current.degree,
      fieldOfStudy: updatedData.fieldOfStudy !== undefined ? updatedData.fieldOfStudy.trim() : current.fieldOfStudy,
      location: updatedData.location !== undefined ? updatedData.location.trim() : current.location,
      startYear: updatedData.startYear !== undefined ? String(updatedData.startYear).trim() : current.startYear,
      endYear: updatedData.currentlyStudying ? '' : updatedData.endYear !== undefined ? String(updatedData.endYear).trim() : current.endYear,
      currentlyStudying: updatedData.currentlyStudying !== undefined ? Boolean(updatedData.currentlyStudying) : current.currentlyStudying,
      grade: updatedData.grade !== undefined ? updatedData.grade.trim() : current.grade,
      description: updatedData.description !== undefined ? updatedData.description.trim() : current.description,
      updatedAt: new Date().toISOString(),
    }

    normalized.education[index] = updated
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to update education record.')
    return updated
  },

  deleteEducation(username, eduId) {
    if (!username || !eduId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.education = normalized.education.filter((e) => e.id !== eduId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  reorderEducation(username, newEduList) {
    if (!username || !Array.isArray(newEduList)) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.education = newEduList
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  // --------------------------------------------------------------------------
  // Achievements Management (Stage 10)
  // --------------------------------------------------------------------------
  getUserAchievements(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.achievements) ? portfolio.achievements : []
  },

  addAchievement(username, achData) {
    if (!username) throw new Error('Username is required to add achievement.')
    const cleanUsername = username.trim().toLowerCase()

    if (!achData.title?.trim()) throw new Error('Achievement title is required.')
    if (!achData.description?.trim()) throw new Error('Achievement description is required.')

    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const newAch = {
      id,
      title: achData.title.trim(),
      description: achData.description.trim(),
      issuer: achData.issuer?.trim() || '',
      date: achData.date?.trim() || '',
      category: achData.category?.trim() || 'Other',
      evidenceUrl: achData.evidenceUrl?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    normalized.achievements = [newAch, ...normalized.achievements]
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to save achievement.')
    return newAch
  },

  updateAchievement(username, achId, updatedData) {
    if (!username || !achId) throw new Error('Username and ID required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.achievements.findIndex((a) => a.id === achId)
    if (index === -1) throw new Error('Achievement not found.')

    const current = normalized.achievements[index]
    const updated = {
      ...current,
      title: updatedData.title !== undefined ? updatedData.title.trim() : current.title,
      description: updatedData.description !== undefined ? updatedData.description.trim() : current.description,
      issuer: updatedData.issuer !== undefined ? updatedData.issuer.trim() : current.issuer,
      date: updatedData.date !== undefined ? updatedData.date.trim() : current.date,
      category: updatedData.category !== undefined ? updatedData.category.trim() : current.category,
      evidenceUrl: updatedData.evidenceUrl !== undefined ? updatedData.evidenceUrl.trim() : current.evidenceUrl,
      updatedAt: new Date().toISOString(),
    }

    normalized.achievements[index] = updated
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to update achievement.')
    return updated
  },

  deleteAchievement(username, achId) {
    if (!username || !achId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.achievements = normalized.achievements.filter((a) => a.id !== achId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  // --------------------------------------------------------------------------
  // Certifications Management (Stage 10)
  // --------------------------------------------------------------------------
  getUserCertifications(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.certifications) ? portfolio.certifications : []
  },

  addCertification(username, certData) {
    if (!username) throw new Error('Username is required to add certification.')
    const cleanUsername = username.trim().toLowerCase()

    if (!certData.name?.trim()) throw new Error('Certification name is required.')
    if (!certData.issuer?.trim()) throw new Error('Issuing organization is required.')

    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const newCert = {
      id,
      name: certData.name.trim(),
      issuer: certData.issuer.trim(),
      issueDate: certData.issueDate?.trim() || '',
      expiryDate: certData.expiryDate?.trim() || '',
      credentialId: certData.credentialId?.trim() || '',
      verificationUrl: certData.verificationUrl?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    normalized.certifications = [newCert, ...normalized.certifications]
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to save certification.')
    return newCert
  },

  updateCertification(username, certId, updatedData) {
    if (!username || !certId) throw new Error('Username and ID required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.certifications.findIndex((c) => c.id === certId)
    if (index === -1) throw new Error('Certification not found.')

    const current = normalized.certifications[index]
    const updated = {
      ...current,
      name: updatedData.name !== undefined ? updatedData.name.trim() : current.name,
      issuer: updatedData.issuer !== undefined ? updatedData.issuer.trim() : current.issuer,
      issueDate: updatedData.issueDate !== undefined ? updatedData.issueDate.trim() : current.issueDate,
      expiryDate: updatedData.expiryDate !== undefined ? updatedData.expiryDate.trim() : current.expiryDate,
      credentialId: updatedData.credentialId !== undefined ? updatedData.credentialId.trim() : current.credentialId,
      verificationUrl: updatedData.verificationUrl !== undefined ? updatedData.verificationUrl.trim() : current.verificationUrl,
      updatedAt: new Date().toISOString(),
    }

    normalized.certifications[index] = updated
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) throw new Error('Failed to update certification.')
    return updated
  },

  deleteCertification(username, certId) {
    if (!username || !certId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.certifications = normalized.certifications.filter((c) => c.id !== certId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  // --------------------------------------------------------------------------
  // Blog Management & Publishing (Stage 11)
  // --------------------------------------------------------------------------
  sanitizeSlug(raw) {
    if (!raw || typeof raw !== 'string') return ''
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  },

  calculateReadingTime(content) {
    if (!content || typeof content !== 'string') return 1
    const words = content.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  },

  getUserBlogPosts(username) {
    if (!username) return []
    const portfolio = this.getUserPortfolio(username)
    return Array.isArray(portfolio?.blogPosts) ? portfolio.blogPosts : []
  },

  getBlogPostById(username, postId) {
    if (!username || !postId) return null
    const posts = this.getUserBlogPosts(username)
    return posts.find((p) => p.id === postId) || null
  },

  getPublishedBlogPosts(username) {
    if (!username) return []
    const cleanUsername = username.trim().toLowerCase()
    if (cleanUsername === 'kowsthuba') return []
    const portfolioRes = this.getPortfolioByUsername(cleanUsername)
    if (!portfolioRes || !portfolioRes.data) return []
    const posts = Array.isArray(portfolioRes.data.blogPosts) ? portfolioRes.data.blogPosts : []
    return posts
      .filter((p) => p.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt))
  },

  getPublishedBlogPostBySlug(username, slug) {
    if (!username || !slug) return null
    const cleanSlug = slug.trim().toLowerCase()
    const published = this.getPublishedBlogPosts(username)
    return published.find((p) => p.slug?.toLowerCase() === cleanSlug) || null
  },

  isBlogSlugAvailable(username, slug, excludePostId = null) {
    const cleanSlug = this.sanitizeSlug(slug)
    if (!cleanSlug) return false
    const posts = this.getUserBlogPosts(username)
    return !posts.some((p) => p.id !== excludePostId && p.slug?.toLowerCase() === cleanSlug)
  },

  createBlogPost(username, postData) {
    if (!username) throw new Error('Username is required to create an article.')
    const cleanUsername = username.trim().toLowerCase()

    const title = postData.title?.trim()
    const excerpt = postData.excerpt?.trim()
    const category = postData.category?.trim()
    const content = postData.content || ''
    const status = postData.status === 'published' ? 'published' : 'draft'
    const slug = this.sanitizeSlug(postData.slug || title)

    if (!title) throw new Error('Article title is required.')
    if (!excerpt) throw new Error('Article excerpt is required.')
    if (!category) throw new Error('Article category is required.')
    if (!slug) throw new Error('A valid URL slug is required.')
    if (status === 'published' && !content.trim()) {
      throw new Error('Article content cannot be empty when publishing.')
    }

    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const slugConflict = normalized.blogPosts.some((p) => p.slug?.toLowerCase() === slug)
    if (slugConflict) {
      throw new Error(`An article with the slug "${slug}" already exists in your blog.`)
    }

    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    const newPost = {
      id,
      title,
      slug,
      excerpt,
      category,
      tags: Array.isArray(postData.tags)
        ? postData.tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      coverImage: postData.coverImage || '',
      content,
      status,
      readingTime: this.calculateReadingTime(content),
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    }

    normalized.blogPosts = [newPost, ...normalized.blogPosts]
    normalized.updatedAt = now
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to save article to local storage. Storage quota may be exceeded.')
    }
    return newPost
  },

  updateBlogPost(username, postId, updatedData) {
    if (!username || !postId) throw new Error('Username and Article ID are required.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) throw new Error('Portfolio not found.')
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const index = normalized.blogPosts.findIndex((p) => p.id === postId)
    if (index === -1) throw new Error('Article not found.')

    const current = normalized.blogPosts[index]
    const nextTitle = updatedData.title !== undefined ? updatedData.title.trim() : current.title
    const nextExcerpt = updatedData.excerpt !== undefined ? updatedData.excerpt.trim() : current.excerpt
    const nextCategory = updatedData.category !== undefined ? updatedData.category.trim() : current.category
    const nextContent = updatedData.content !== undefined ? updatedData.content : current.content
    const nextStatus = updatedData.status !== undefined ? (updatedData.status === 'published' ? 'published' : 'draft') : current.status
    const nextSlug = updatedData.slug !== undefined ? this.sanitizeSlug(updatedData.slug) : current.slug

    if (!nextTitle) throw new Error('Article title is required.')
    if (!nextExcerpt) throw new Error('Article excerpt is required.')
    if (!nextCategory) throw new Error('Article category is required.')
    if (!nextSlug) throw new Error('A valid URL slug is required.')
    if (nextStatus === 'published' && !nextContent.trim()) {
      throw new Error('Article content cannot be empty when publishing.')
    }

    const slugConflict = normalized.blogPosts.some(
      (p) => p.id !== postId && p.slug?.toLowerCase() === nextSlug
    )
    if (slugConflict) {
      throw new Error(`An article with the slug "${nextSlug}" already exists in your blog.`)
    }

    const now = new Date().toISOString()
    const updatedPost = {
      ...current,
      title: nextTitle,
      slug: nextSlug,
      excerpt: nextExcerpt,
      category: nextCategory,
      tags:
        updatedData.tags !== undefined
          ? updatedData.tags.map((t) => String(t).trim()).filter(Boolean)
          : current.tags,
      coverImage: updatedData.coverImage !== undefined ? updatedData.coverImage : current.coverImage,
      content: nextContent,
      status: nextStatus,
      readingTime: this.calculateReadingTime(nextContent),
      updatedAt: now,
      publishedAt:
        nextStatus === 'published' ? current.publishedAt || now : current.publishedAt,
    }

    normalized.blogPosts[index] = updatedPost
    normalized.updatedAt = now
    portfolios[cleanUsername] = normalized

    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to update article. Storage quota may be exceeded.')
    }
    return updatedPost
  },

  deleteBlogPost(username, postId) {
    if (!username || !postId) return false
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    normalized.blogPosts = normalized.blogPosts.filter((p) => p.id !== postId)
    normalized.updatedAt = new Date().toISOString()
    portfolios[cleanUsername] = normalized

    return storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
  },

  publishBlogPost(username, postId) {
    return this.updateBlogPost(username, postId, { status: 'published' })
  },

  unpublishBlogPost(username, postId) {
    return this.updateBlogPost(username, postId, { status: 'draft' })
  },

  getBlogDraft(username) {
    if (!username) return null
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
    return drafts[cleanUsername] || null
  },

  saveBlogDraft(username, draftData) {
    if (!username) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
    drafts[cleanUsername] = {
      ...draftData,
      updatedAt: new Date().toISOString(),
    }
    return storageService.set(STORAGE_KEYS.BLOG_DRAFTS, drafts)
  },

  clearBlogDraft(username) {
    if (!username) return false
    const cleanUsername = username.trim().toLowerCase()
    const drafts = storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
    if (drafts[cleanUsername]) {
      delete drafts[cleanUsername]
      return storageService.set(STORAGE_KEYS.BLOG_DRAFTS, drafts)
    }
    return true
  },

  // --------------------------------------------------------------------------
  // Design Studio Persistence (Stage 13)
  // --------------------------------------------------------------------------
  updatePortfolioDesign(username, designConfig) {
    if (!username) throw new Error('Username is required to save design customization.')
    const cleanUsername = username.trim().toLowerCase()
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername] || this.createInitialPortfolio(cleanUsername)
    const normalized = this.normalizePortfolio(existing, cleanUsername)

    const normalizedDesign = this.normalizeDesign(designConfig)
    const updatedPortfolio = {
      ...normalized,
      design: normalizedDesign,
      updatedAt: new Date().toISOString(),
    }

    portfolios[cleanUsername] = updatedPortfolio
    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to save design customization. Storage quota may be exceeded.')
    }
    return updatedPortfolio
  },

  resetPortfolioDesign(username) {
    return this.updatePortfolioDesign(username, getDefaultDesign('modern-editorial'))
  },

  // --------------------------------------------------------------------------
  // Portfolio Publication System
  // --------------------------------------------------------------------------
  assertCanManagePublication(username) {
    if (!username || typeof username !== 'string' || !username.trim()) {
      throw new Error('A valid username is required.')
    }
    const cleanUsername = username.trim().toLowerCase()
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Authentication required to manage portfolio publication.')
    }
    const currentHandle = (currentUser.username || '').trim().toLowerCase()
    if (currentUser.role !== 'admin' && currentHandle !== cleanUsername) {
      throw new Error('You do not have permission to modify publication settings for this portfolio.')
    }
    return cleanUsername
  },

  getPublicationStatus(username) {
    if (!username || typeof username !== 'string') {
      return {
        status: 'draft',
        publishedAt: null,
        unpublishedAt: null,
        lastPublishedAt: null,
      }
    }
    const cleanUsername = username.trim().toLowerCase()
    if (cleanUsername === 'kowsthuba') {
      return {
        status: 'published',
        publishedAt: null,
        unpublishedAt: null,
        lastPublishedAt: null,
        isDemo: true,
      }
    }
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) {
      return {
        status: 'draft',
        publishedAt: null,
        unpublishedAt: null,
        lastPublishedAt: null,
      }
    }
    const normalizedPub = this.normalizePublication(existing.publication)
    if (!existing.publication) {
      // Persist idempotent legacy migration once
      portfolios[cleanUsername] = {
        ...this.normalizePortfolio(existing, cleanUsername),
        publication: normalizedPub,
      }
      storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    }
    return normalizedPub
  },

  isPortfolioPublished(username) {
    if (!username || typeof username !== 'string') return false
    const cleanUsername = username.trim().toLowerCase()
    if (cleanUsername === 'kowsthuba') return true
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) return false
    return this.getPublicationStatus(cleanUsername).status === 'published'
  },

  publishPortfolio(username) {
    const cleanUsername = this.assertCanManagePublication(username)
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) {
      throw new Error(`Portfolio for "@${cleanUsername}" was not found.`)
    }

    const normalized = this.normalizePortfolio(existing, cleanUsername)
    const now = new Date().toISOString()

    const updatedPortfolio = {
      ...normalized,
      status: 'published',
      updatedAt: now,
      publication: {
        ...normalized.publication,
        status: 'published',
        publishedAt: now,
        lastPublishedAt: now,
      },
    }

    portfolios[cleanUsername] = updatedPortfolio
    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to publish portfolio. Storage quota may be exceeded.')
    }
    return updatedPortfolio
  },

  unpublishPortfolio(username) {
    const cleanUsername = this.assertCanManagePublication(username)
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const existing = portfolios[cleanUsername]
    if (!existing) {
      throw new Error(`Portfolio for "@${cleanUsername}" was not found.`)
    }

    const normalized = this.normalizePortfolio(existing, cleanUsername)
    const now = new Date().toISOString()

    const updatedPortfolio = {
      ...normalized,
      status: 'draft',
      updatedAt: now,
      publication: {
        ...normalized.publication,
        status: 'draft',
        unpublishedAt: now,
      },
    }

    portfolios[cleanUsername] = updatedPortfolio
    const saved = storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    if (!saved) {
      throw new Error('Failed to unpublish portfolio. Storage quota may be exceeded.')
    }
    return updatedPortfolio
  },
}

export default portfolioService
