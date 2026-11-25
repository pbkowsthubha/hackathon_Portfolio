/**
 * Administrator Moderation & Platform Oversight Service
 * Enforces admin role checks on all operations and maintains an immutable
 * audit log under portfolioStudio:adminLogs.
 */
import { storageService, STORAGE_KEYS } from './storageService'
import { authService } from './authService'
import { portfolioService } from './portfolioService'
import { getThemeById } from '../data/designThemes'

const DEFAULT_SETTINGS = {
  platformName: 'PORTFOLIO STUDIO',
  platformDescription: 'Multi-user portfolio builder and editorial publishing platform.',
  registrationEnabled: true,
  maintenanceMode: false,
}

export const adminService = {
  /**
   * Verify active session and stored user record both hold the 'admin' role.
   */
  assertAdmin() {
    const session = authService.getCurrentUser()
    if (!session || session.role !== 'admin') {
      throw new Error('Unauthorized: Administrator privileges are required.')
    }
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    const storedAdmin = users.find((u) => u && u.id === session.id)
    if (!storedAdmin || storedAdmin.role !== 'admin') {
      throw new Error('Unauthorized: Administrator account verification failed.')
    }
    return session
  },

  // --------------------------------------------------------------------------
  // Activity Logs (portfolioStudio:adminLogs)
  // --------------------------------------------------------------------------
  getActivityLogs() {
    const rawLogs = storageService.get(STORAGE_KEYS.ADMIN_LOGS, [])
    if (!Array.isArray(rawLogs)) return []
    return rawLogs
      .filter((entry) => entry && typeof entry === 'object' && entry.id && entry.action)
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
  },

  recordAdminAction({ adminUsername, action, targetType, targetId, reason }) {
    const existing = this.getActivityLogs()
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const entry = {
      id,
      adminUsername: adminUsername || 'admin',
      action,
      targetType,
      targetId: String(targetId || ''),
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Administrative action',
      timestamp: new Date().toISOString(),
    }

    storageService.set(STORAGE_KEYS.ADMIN_LOGS, [entry, ...existing])
    return entry
  },

  // --------------------------------------------------------------------------
  // Platform Settings (portfolioStudio:settings)
  // --------------------------------------------------------------------------
  getPlatformSettings() {
    const stored = storageService.get(STORAGE_KEYS.SETTINGS, {})
    const safeStored = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
    return {
      ...DEFAULT_SETTINGS,
      ...safeStored,
    }
  },

  updatePlatformSettings(updates, reason = 'Updated platform settings') {
    const admin = this.assertAdmin()
    const current = storageService.get(STORAGE_KEYS.SETTINGS, {})
    const safeCurrent = current && typeof current === 'object' && !Array.isArray(current) ? current : {}

    const nextSettings = {
      ...safeCurrent,
      platformName:
        typeof updates.platformName === 'string' && updates.platformName.trim()
          ? updates.platformName.trim()
          : safeCurrent.platformName || DEFAULT_SETTINGS.platformName,
      platformDescription:
        typeof updates.platformDescription === 'string'
          ? updates.platformDescription.trim()
          : safeCurrent.platformDescription || DEFAULT_SETTINGS.platformDescription,
      registrationEnabled:
        updates.registrationEnabled !== undefined
          ? Boolean(updates.registrationEnabled)
          : safeCurrent.registrationEnabled !== undefined
            ? Boolean(safeCurrent.registrationEnabled)
            : true,
      maintenanceMode:
        updates.maintenanceMode !== undefined
          ? Boolean(updates.maintenanceMode)
          : Boolean(safeCurrent.maintenanceMode),
      updatedAt: new Date().toISOString(),
    }

    const saved = storageService.set(STORAGE_KEYS.SETTINGS, nextSettings)
    if (!saved) throw new Error('Failed to save platform settings.')

    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'PLATFORM_SETTINGS_CHANGED',
      targetType: 'settings',
      targetId: 'platform',
      reason,
    })

    return this.getPlatformSettings()
  },

  // --------------------------------------------------------------------------
  // Overview Metrics (Excludes seeded admin & /p/kowsthuba demo)
  // --------------------------------------------------------------------------
  getPlatformMetrics() {
    this.assertAdmin()
    const creators = this.getAllCreators()
    const portfolios = this.getAllCreatorPortfolios()
    const blogs = this.getAllCreatorBlogPosts()
    const logs = this.getActivityLogs()

    const publishedPortfolios = portfolios.filter((p) => p.publicationStatus === 'published').length
    const draftPortfolios = portfolios.length - publishedPortfolios
    const publishedBlogPosts = blogs.filter((b) => b.status === 'published').length
    const draftBlogPosts = blogs.length - publishedBlogPosts

    const recentRegistrations = [...creators]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)

    return {
      totalCreators: creators.length,
      activeCreators: creators.filter((c) => c.status !== 'suspended').length,
      suspendedCreators: creators.filter((c) => c.status === 'suspended').length,
      publishedPortfolios,
      draftPortfolios,
      publishedBlogPosts,
      draftBlogPosts,
      recentRegistrations,
      recentLogs: logs.slice(0, 5),
    }
  },

  // --------------------------------------------------------------------------
  // User Management
  // --------------------------------------------------------------------------
  getAllCreators() {
    this.assertAdmin()
    const users = authService.getAllUsers()
    const rawPortfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const portfoliosObj = rawPortfolios && typeof rawPortfolios === 'object' ? rawPortfolios : {}

    return users
      .filter((u) => u.role !== 'admin')
      .map((u) => {
        const handle = (u.username || '').trim().toLowerCase()
        const rawPort = portfoliosObj[handle]
        const normalizedPort = rawPort ? portfolioService.normalizePortfolio(rawPort, handle) : null
        return {
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          role: u.role || 'creator',
          status: u.status || 'active',
          createdAt: u.createdAt,
          publicationStatus: normalizedPort ? normalizedPort.publication.status : 'draft',
          projectsCount: normalizedPort ? normalizedPort.projects.length : 0,
          blogCount: normalizedPort ? normalizedPort.blogPosts.length : 0,
          skillsCount: normalizedPort ? normalizedPort.skills.length : 0,
        }
      })
  },

  suspendUser(userId, reason) {
    const admin = this.assertAdmin()
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required to suspend an account.')
    }
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    const index = users.findIndex((u) => u && u.id === userId)
    if (index === -1) throw new Error('User record not found.')

    const target = users[index]
    if (target.id === admin.id || target.role === 'admin') {
      throw new Error('Administrator accounts cannot be suspended.')
    }

    const updatedUsers = [...users]
    updatedUsers[index] = {
      ...target,
      status: 'suspended',
      suspendedAt: new Date().toISOString(),
    }

    const saved = storageService.set(STORAGE_KEYS.USERS, updatedUsers)
    if (!saved) throw new Error('Failed to update user status.')

    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'USER_SUSPENDED',
      targetType: 'user',
      targetId: target.username || target.email,
      reason,
    })

    return true
  },

  restoreUser(userId, reason) {
    const admin = this.assertAdmin()
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required to restore an account.')
    }
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    const index = users.findIndex((u) => u && u.id === userId)
    if (index === -1) throw new Error('User record not found.')

    const target = users[index]
    const updatedUsers = [...users]
    updatedUsers[index] = {
      ...target,
      status: 'active',
      restoredAt: new Date().toISOString(),
    }

    const saved = storageService.set(STORAGE_KEYS.USERS, updatedUsers)
    if (!saved) throw new Error('Failed to restore user account.')

    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'USER_RESTORED',
      targetType: 'user',
      targetId: target.username || target.email,
      reason,
    })

    return true
  },

  // --------------------------------------------------------------------------
  // Portfolio Moderation (Excludes /p/kowsthuba demo)
  // --------------------------------------------------------------------------
  getAllCreatorPortfolios() {
    this.assertAdmin()
    const rawPortfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    if (!rawPortfolios || typeof rawPortfolios !== 'object') return []

    return Object.entries(rawPortfolios)
      .filter(([key]) => key.toLowerCase() !== 'kowsthuba')
      .map(([key, raw]) => {
        const normalized = portfolioService.normalizePortfolio(raw, key)
        return {
          username: normalized.username,
          displayName: normalized.profile?.fullName || normalized.fullName || normalized.username,
          publicationStatus: normalized.publication?.status || 'draft',
          themeName: getThemeById(normalized.design?.themeId).name,
          projectsCount: normalized.projects.length,
          blogCount: normalized.blogPosts.length,
          skillsCount: normalized.skills.length,
          updatedAt: normalized.updatedAt,
          lastPublishedAt: normalized.publication?.lastPublishedAt || null,
        }
      })
  },

  moderateUnpublishPortfolio(username, reason) {
    const admin = this.assertAdmin()
    if (!username || username.trim().toLowerCase() === 'kowsthuba') {
      throw new Error('The flagship demo portfolio cannot be moderated.')
    }
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required.')
    }

    const updated = portfolioService.unpublishPortfolio(username)
    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'PORTFOLIO_UNPUBLISHED',
      targetType: 'portfolio',
      targetId: updated.username,
      reason,
    })
    return updated
  },

  moderateRestorePortfolio(username, reason) {
    const admin = this.assertAdmin()
    if (!username || username.trim().toLowerCase() === 'kowsthuba') {
      throw new Error('The flagship demo portfolio cannot be moderated.')
    }
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required.')
    }

    const updated = portfolioService.publishPortfolio(username)
    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'PORTFOLIO_RESTORED',
      targetType: 'portfolio',
      targetId: updated.username,
      reason,
    })
    return updated
  },

  // --------------------------------------------------------------------------
  // Blog Moderation
  // --------------------------------------------------------------------------
  getAllCreatorBlogPosts() {
    this.assertAdmin()
    const rawPortfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    if (!rawPortfolios || typeof rawPortfolios !== 'object') return []

    const articles = []
    Object.entries(rawPortfolios).forEach(([key, raw]) => {
      if (key.toLowerCase() === 'kowsthuba') return
      const normalized = portfolioService.normalizePortfolio(raw, key)
      normalized.blogPosts.forEach((post) => {
        articles.push({
          ...post,
          authorUsername: normalized.username,
          authorName: normalized.profile?.fullName || normalized.fullName || normalized.username,
          portfolioPublished: normalized.publication?.status === 'published',
        })
      })
    })

    return articles.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  },

  moderateUnpublishBlogPost(username, postId, reason) {
    const admin = this.assertAdmin()
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required.')
    }
    const updated = portfolioService.unpublishBlogPost(username, postId)
    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'BLOG_UNPUBLISHED',
      targetType: 'blog',
      targetId: `${username}/${updated.slug}`,
      reason,
    })
    return updated
  },

  moderateRestoreBlogPost(username, postId, reason) {
    const admin = this.assertAdmin()
    if (!reason || !reason.trim()) {
      throw new Error('A moderation reason is required.')
    }
    const updated = portfolioService.publishBlogPost(username, postId)
    this.recordAdminAction({
      adminUsername: admin.username,
      action: 'BLOG_RESTORED',
      targetType: 'blog',
      targetId: `${username}/${updated.slug}`,
      reason,
    })
    return updated
  },
}

export default adminService
