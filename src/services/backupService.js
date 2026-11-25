/**
 * Data Backup & Restore Service
 * Frontend-only localStorage backup, validation, safe merge, full restore,
 * and automatic pre-restore snapshot rollback for Portfolio Studio.
 *
 * Security & Browser Limitations:
 * - Requires verified administrator role for every operation.
 * - Never exports or restores portfolioStudio:session (active login state).
 * - Exported JSON files are unencrypted and contain user password hashes/salts.
 * - Browser localStorage has a finite quota (~5-10 MB) and synchronous writes are
 *   not multi-key ACID transactions; rollback is best-effort from an in-memory
 *   pre-restore snapshot.
 */
import { storageService, STORAGE_KEYS } from './storageService'
import { adminService } from './adminService'

export const BACKUP_APPLICATION = 'Portfolio Studio'
export const BACKUP_VERSION = 1
export const SUPPORTED_BACKUP_VERSIONS = [1]
export const LEGACY_USERS_BACKUP_KEY = 'portfolioStudio:users_backup'
export const PRE_RESTORE_BACKUP_KEY = 'portfolioStudio:preRestoreBackup'

export const SUPPORTED_BACKUP_KEYS = [
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.PORTFOLIOS,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.PROFILE_DRAFTS,
  STORAGE_KEYS.PROJECT_DRAFTS,
  STORAGE_KEYS.BLOG_DRAFTS,
  STORAGE_KEYS.ADMIN_LOGS,
  LEGACY_USERS_BACKUP_KEY,
]

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val)
}

function isQuotaError(err) {
  if (!err) return false
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014
  )
}

function writeStorageKeyStrict(key, value) {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error(
        `Browser localStorage quota exceeded while writing "${key}". Free up browser storage and try again.`
      )
    }
    throw new Error(`Failed to write "${key}" to localStorage: ${err?.message || 'Unknown error'}`)
  }
}

function removeStorageKeyStrict(key) {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    throw new Error(`Failed to remove "${key}" from localStorage: ${err?.message || 'Unknown error'}`)
  }
}

function captureRawSnapshot() {
  const snapshot = {}
  for (const key of SUPPORTED_BACKUP_KEYS) {
    snapshot[key] = localStorage.getItem(key)
  }
  return snapshot
}

function rollbackRawSnapshot(snapshot) {
  const rollbackErrors = []
  for (const key of SUPPORTED_BACKUP_KEYS) {
    try {
      const raw = snapshot[key]
      if (raw === null || raw === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, raw)
      }
    } catch (err) {
      rollbackErrors.push(`${key}: ${err?.message || 'Unknown error'}`)
    }
  }
  return rollbackErrors
}

function buildSummaryFromData(data, meta = {}) {
  const users = Array.isArray(data.users) ? data.users : []
  const portfolios = isPlainObject(data.portfolios) ? data.portfolios : {}
  const profileDrafts = isPlainObject(data.profileDrafts) ? data.profileDrafts : {}
  const projectDrafts = isPlainObject(data.projectDrafts) ? data.projectDrafts : {}
  const blogDrafts = isPlainObject(data.blogDrafts) ? data.blogDrafts : {}
  const adminLogs = Array.isArray(data.adminLogs) ? data.adminLogs : []
  const settings = isPlainObject(data.settings) ? data.settings : {}
  const usersBackup = isPlainObject(data.usersBackup) ? data.usersBackup : null

  return {
    application: meta.application || BACKUP_APPLICATION,
    backupVersion: meta.backupVersion || BACKUP_VERSION,
    createdAt: meta.createdAt || new Date().toISOString(),
    counts: {
      users: users.length,
      portfolios: Object.keys(portfolios).length,
      profileDrafts: Object.keys(profileDrafts).length,
      projectDrafts: Object.keys(projectDrafts).length,
      blogDrafts: Object.keys(blogDrafts).length,
      adminLogs: adminLogs.length,
      hasSettings: Object.keys(settings).length > 0,
      hasUsersBackup: Boolean(usersBackup),
    },
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const backupService = {
  /**
   * Read current localStorage state (excluding active session) and return a
   * versioned backup payload, serialized JSON string, byte size, and summary.
   */
  exportBackup() {
    const admin = adminService.assertAdmin()

    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const rawPortfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    const rawSettings = storageService.get(STORAGE_KEYS.SETTINGS, {})
    const rawProfileDrafts = storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
    const rawProjectDrafts = storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
    const rawBlogDrafts = storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
    const rawAdminLogs = storageService.get(STORAGE_KEYS.ADMIN_LOGS, [])
    const rawUsersBackup = storageService.get(LEGACY_USERS_BACKUP_KEY, null)

    const createdAt = new Date().toISOString()

    const payload = {
      application: BACKUP_APPLICATION,
      backupVersion: BACKUP_VERSION,
      createdAt,
      data: {
        users: Array.isArray(rawUsers) ? rawUsers : [],
        portfolios: isPlainObject(rawPortfolios) ? rawPortfolios : {},
        settings: isPlainObject(rawSettings) ? rawSettings : {},
        profileDrafts: isPlainObject(rawProfileDrafts) ? rawProfileDrafts : {},
        projectDrafts: isPlainObject(rawProjectDrafts) ? rawProjectDrafts : {},
        blogDrafts: isPlainObject(rawBlogDrafts) ? rawBlogDrafts : {},
        adminLogs: Array.isArray(rawAdminLogs) ? rawAdminLogs : [],
        usersBackup: isPlainObject(rawUsersBackup) ? rawUsersBackup : null,
      },
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const sizeBytes =
      typeof Blob !== 'undefined'
        ? new Blob([jsonString]).size
        : new TextEncoder().encode(jsonString).length

    const summary = buildSummaryFromData(payload.data, {
      application: payload.application,
      backupVersion: payload.backupVersion,
      createdAt: payload.createdAt,
    })

    adminService.recordAdminAction({
      adminUsername: admin.username,
      action: 'BACKUP_EXPORTED',
      targetType: 'backup',
      targetId: `v${BACKUP_VERSION}`,
      reason: `Exported complete backup (${summary.counts.users} users, ${summary.counts.portfolios} portfolios, ${formatBytes(sizeBytes)})`,
    })

    return {
      payload,
      jsonString,
      sizeBytes,
      formattedSize: formatBytes(sizeBytes),
      fileName: `portfolio-studio-backup-${createdAt.replace(/[:.]/g, '-')}.json`,
      summary,
    }
  },

  /**
   * Inspect current localStorage counts without modifying anything.
   */
  getCurrentStorageSummary() {
    adminService.assertAdmin()
    const data = {
      users: storageService.get(STORAGE_KEYS.USERS, []),
      portfolios: storageService.get(STORAGE_KEYS.PORTFOLIOS, {}),
      settings: storageService.get(STORAGE_KEYS.SETTINGS, {}),
      profileDrafts: storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {}),
      projectDrafts: storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {}),
      blogDrafts: storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {}),
      adminLogs: storageService.get(STORAGE_KEYS.ADMIN_LOGS, []),
      usersBackup: storageService.get(LEGACY_USERS_BACKUP_KEY, null),
    }
    return buildSummaryFromData(data)
  },

  /**
   * Check whether a persisted pre-restore snapshot exists in localStorage.
   */
  getPreRestoreSnapshotInfo() {
    adminService.assertAdmin()
    const snap = storageService.get(PRE_RESTORE_BACKUP_KEY, null)
    if (!isPlainObject(snap) || !snap.createdAt) return null
    return {
      createdAt: snap.createdAt,
      mode: snap.mode || 'restore',
    }
  },

  /**
   * Validate a JSON string or parsed backup object without modifying storage.
   */
  validateBackup(input) {
    adminService.assertAdmin()
    const errors = []
    const warnings = []

    let parsed = input
    if (typeof input === 'string') {
      try {
        parsed = JSON.parse(input)
      } catch (err) {
        return {
          valid: false,
          errors: [`Invalid JSON syntax: ${err?.message || 'Unable to parse file.'}`],
          warnings: [],
          backup: null,
          summary: null,
        }
      }
    }

    if (!isPlainObject(parsed)) {
      return {
        valid: false,
        errors: ['Backup root must be a valid JSON object.'],
        warnings: [],
        backup: null,
        summary: null,
      }
    }

    if (parsed.application !== BACKUP_APPLICATION) {
      errors.push(
        `Invalid application identifier "${String(parsed.application || '')}". Expected "${BACKUP_APPLICATION}".`
      )
    }

    if (
      typeof parsed.backupVersion !== 'number' ||
      !SUPPORTED_BACKUP_VERSIONS.includes(parsed.backupVersion)
    ) {
      errors.push(
        `Unsupported backup version "${String(parsed.backupVersion ?? '')}". Supported versions: ${SUPPORTED_BACKUP_VERSIONS.join(', ')}.`
      )
    }

    if (typeof parsed.createdAt !== 'string' || Number.isNaN(Date.parse(parsed.createdAt))) {
      errors.push('Missing or invalid "createdAt" ISO timestamp.')
    }

    if (!isPlainObject(parsed.data)) {
      errors.push('Missing or invalid "data" object in backup payload.')
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        backup: null,
        summary: null,
      }
    }

    const { data } = parsed

    // Validate users array
    if (!Array.isArray(data.users)) {
      errors.push('Backup "data.users" must be an array.')
    } else {
      data.users.forEach((u, idx) => {
        if (!isPlainObject(u)) {
          errors.push(`Malformed user record at index ${idx}: expected an object.`)
          return
        }
        if (typeof u.id !== 'string' || !u.id.trim()) {
          errors.push(`Malformed user record at index ${idx}: missing valid "id".`)
        }
        if (typeof u.username !== 'string' || !u.username.trim()) {
          errors.push(`Malformed user record at index ${idx}: missing valid "username".`)
        }
        if (typeof u.email !== 'string' || !u.email.trim()) {
          errors.push(`Malformed user record at index ${idx}: missing valid "email".`)
        }
      })
    }

    // Validate portfolios map
    if (!isPlainObject(data.portfolios)) {
      errors.push('Backup "data.portfolios" must be an object keyed by username.')
    } else {
      Object.entries(data.portfolios).forEach(([key, port]) => {
        if (!key || !isPlainObject(port)) {
          errors.push(`Malformed portfolio entry for key "${key}".`)
        }
      })
    }

    // Validate settings
    if (!isPlainObject(data.settings)) {
      errors.push('Backup "data.settings" must be an object.')
    }

    // Validate drafts maps
    if (!isPlainObject(data.profileDrafts)) {
      errors.push('Backup "data.profileDrafts" must be an object.')
    }
    if (data.projectDrafts !== undefined && !isPlainObject(data.projectDrafts)) {
      errors.push('Backup "data.projectDrafts" must be an object when provided.')
    }
    if (!isPlainObject(data.blogDrafts)) {
      errors.push('Backup "data.blogDrafts" must be an object.')
    }

    // Validate adminLogs array
    if (!Array.isArray(data.adminLogs)) {
      errors.push('Backup "data.adminLogs" must be an array.')
    } else {
      data.adminLogs.forEach((log, idx) => {
        if (!isPlainObject(log) || !log.id || !log.action) {
          errors.push(`Malformed admin log entry at index ${idx}: missing "id" or "action".`)
        }
      })
    }

    // Validate optional usersBackup
    if (
      data.usersBackup !== undefined &&
      data.usersBackup !== null &&
      !isPlainObject(data.usersBackup)
    ) {
      errors.push('Backup "data.usersBackup" must be an object or null when provided.')
    }

    if (data.session !== undefined) {
      warnings.push(
        'A session field was present in the file and will be ignored. Active sessions are never restored.'
      )
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        backup: null,
        summary: null,
      }
    }

    // Sanitized copy without any session field
    const cleanBackup = {
      application: parsed.application,
      backupVersion: parsed.backupVersion,
      createdAt: parsed.createdAt,
      data: {
        users: data.users,
        portfolios: data.portfolios,
        settings: data.settings,
        profileDrafts: data.profileDrafts,
        projectDrafts: isPlainObject(data.projectDrafts) ? data.projectDrafts : {},
        blogDrafts: data.blogDrafts,
        adminLogs: data.adminLogs,
        usersBackup: data.usersBackup ?? null,
      },
    }

    const summary = buildSummaryFromData(cleanBackup.data, {
      application: cleanBackup.application,
      backupVersion: cleanBackup.backupVersion,
      createdAt: cleanBackup.createdAt,
    })

    return {
      valid: true,
      errors: [],
      warnings,
      backup: cleanBackup,
      summary,
    }
  },

  /**
   * Preview conflicts between the validated backup and current localStorage
   * for Safe Merge without modifying anything.
   */
  analyzeMergeConflicts(validatedBackup) {
    adminService.assertAdmin()
    const check = this.validateBackup(validatedBackup)
    if (!check.valid) {
      throw new Error(check.errors[0] || 'Invalid backup payload.')
    }

    const incoming = check.backup.data
    const currentUsers = Array.isArray(storageService.get(STORAGE_KEYS.USERS, []))
      ? storageService.get(STORAGE_KEYS.USERS, [])
      : []
    const currentPortfolios = isPlainObject(storageService.get(STORAGE_KEYS.PORTFOLIOS, {}))
      ? storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
      : {}
    const currentProfileDrafts = isPlainObject(storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
      : {}
    const currentProjectDrafts = isPlainObject(storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
      : {}
    const currentBlogDrafts = isPlainObject(storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
      : {}
    const currentLogs = Array.isArray(storageService.get(STORAGE_KEYS.ADMIN_LOGS, []))
      ? storageService.get(STORAGE_KEYS.ADMIN_LOGS, [])
      : []
    const currentSettings = isPlainObject(storageService.get(STORAGE_KEYS.SETTINGS, {}))
      ? storageService.get(STORAGE_KEYS.SETTINGS, {})
      : {}

    const existingUserIds = new Set(currentUsers.map((u) => u?.id).filter(Boolean))
    const existingUsernames = new Set(
      currentUsers.map((u) => String(u?.username || '').trim().toLowerCase()).filter(Boolean)
    )
    const existingEmails = new Set(
      currentUsers.map((u) => String(u?.email || '').trim().toLowerCase()).filter(Boolean)
    )

    const userConflicts = []
    const usersToAdd = []
    for (const u of incoming.users) {
      const uname = String(u.username || '').trim().toLowerCase()
      const email = String(u.email || '').trim().toLowerCase()
      if (existingUserIds.has(u.id) || existingUsernames.has(uname) || existingEmails.has(email)) {
        userConflicts.push(`@${u.username}`)
      } else {
        usersToAdd.push(u)
      }
    }

    const portfolioConflicts = []
    const portfoliosToAdd = []
    for (const key of Object.keys(incoming.portfolios)) {
      const cleanKey = key.trim().toLowerCase()
      if (Object.prototype.hasOwnProperty.call(currentPortfolios, cleanKey)) {
        portfolioConflicts.push(cleanKey)
      } else {
        portfoliosToAdd.push(cleanKey)
      }
    }

    const draftConflicts = []
    let draftsToAddCount = 0
    for (const [label, currentMap, incomingMap] of [
      ['profileDrafts', currentProfileDrafts, incoming.profileDrafts],
      ['projectDrafts', currentProjectDrafts, incoming.projectDrafts],
      ['blogDrafts', currentBlogDrafts, incoming.blogDrafts],
    ]) {
      for (const key of Object.keys(incomingMap)) {
        if (Object.prototype.hasOwnProperty.call(currentMap, key)) {
          draftConflicts.push(`${label}:${key}`)
        } else {
          draftsToAddCount += 1
        }
      }
    }

    const existingLogIds = new Set(currentLogs.map((l) => l?.id).filter(Boolean))
    let logsToAddCount = 0
    let logConflictsCount = 0
    for (const log of incoming.adminLogs) {
      if (existingLogIds.has(log.id)) {
        logConflictsCount += 1
      } else {
        logsToAddCount += 1
      }
    }

    const hasExistingSettings = Object.keys(currentSettings).length > 0
    const hasIncomingSettings = Object.keys(incoming.settings).length > 0
    const settingsConflict = hasExistingSettings && hasIncomingSettings

    return {
      toAdd: {
        users: usersToAdd.length,
        portfolios: portfoliosToAdd.length,
        drafts: draftsToAddCount,
        adminLogs: logsToAddCount,
        settings: !hasExistingSettings && hasIncomingSettings,
      },
      conflicts: {
        users: userConflicts,
        portfolios: portfolioConflicts,
        drafts: draftConflicts,
        adminLogsCount: logConflictsCount,
        settings: settingsConflict,
      },
    }
  },

  /**
   * Safe Merge: Preserve existing records, import missing records, report conflicts.
   * Never silently overwrites existing records. Rolls back on write failure.
   */
  safeMerge(validatedBackup) {
    const admin = adminService.assertAdmin()
    const check = this.validateBackup(validatedBackup)
    if (!check.valid) {
      throw new Error(`Validation failed: ${check.errors.join(' ')}`)
    }

    const incoming = check.backup.data
    const rawSnapshot = captureRawSnapshot()
    const preRestoreAt = new Date().toISOString()

    // Best-effort persistent pre-restore snapshot (non-fatal if quota is tight)
    let preRestorePersisted = false
    try {
      writeStorageKeyStrict(PRE_RESTORE_BACKUP_KEY, {
        createdAt: preRestoreAt,
        mode: 'safe-merge',
        snapshot: rawSnapshot,
      })
      preRestorePersisted = true
    } catch {
      preRestorePersisted = false
    }

    const currentUsers = Array.isArray(storageService.get(STORAGE_KEYS.USERS, []))
      ? storageService.get(STORAGE_KEYS.USERS, [])
      : []
    const currentPortfolios = isPlainObject(storageService.get(STORAGE_KEYS.PORTFOLIOS, {}))
      ? storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
      : {}
    const currentProfileDrafts = isPlainObject(storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.PROFILE_DRAFTS, {})
      : {}
    const currentProjectDrafts = isPlainObject(storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.PROJECT_DRAFTS, {})
      : {}
    const currentBlogDrafts = isPlainObject(storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {}))
      ? storageService.get(STORAGE_KEYS.BLOG_DRAFTS, {})
      : {}
    const currentLogs = Array.isArray(storageService.get(STORAGE_KEYS.ADMIN_LOGS, []))
      ? storageService.get(STORAGE_KEYS.ADMIN_LOGS, [])
      : []
    const currentSettings = isPlainObject(storageService.get(STORAGE_KEYS.SETTINGS, {}))
      ? storageService.get(STORAGE_KEYS.SETTINGS, {})
      : {}
    const currentUsersBackup = storageService.get(LEGACY_USERS_BACKUP_KEY, null)

    const existingUserIds = new Set(currentUsers.map((u) => u?.id).filter(Boolean))
    const existingUsernames = new Set(
      currentUsers.map((u) => String(u?.username || '').trim().toLowerCase()).filter(Boolean)
    )
    const existingEmails = new Set(
      currentUsers.map((u) => String(u?.email || '').trim().toLowerCase()).filter(Boolean)
    )

    const mergedUsers = [...currentUsers]
    const userConflicts = []
    let usersAdded = 0
    for (const u of incoming.users) {
      const uname = String(u.username || '').trim().toLowerCase()
      const email = String(u.email || '').trim().toLowerCase()
      if (existingUserIds.has(u.id) || existingUsernames.has(uname) || existingEmails.has(email)) {
        userConflicts.push(`@${u.username}`)
      } else {
        mergedUsers.push(u)
        existingUserIds.add(u.id)
        existingUsernames.add(uname)
        existingEmails.add(email)
        usersAdded += 1
      }
    }

    const mergedPortfolios = { ...currentPortfolios }
    const portfolioConflicts = []
    let portfoliosAdded = 0
    for (const [rawKey, port] of Object.entries(incoming.portfolios)) {
      const cleanKey = rawKey.trim().toLowerCase()
      if (Object.prototype.hasOwnProperty.call(mergedPortfolios, cleanKey)) {
        portfolioConflicts.push(cleanKey)
      } else {
        mergedPortfolios[cleanKey] = port
        portfoliosAdded += 1
      }
    }

    const mergeDraftMap = (currentMap, incomingMap, label, conflictsOut) => {
      const merged = { ...currentMap }
      let added = 0
      for (const [key, val] of Object.entries(incomingMap)) {
        if (Object.prototype.hasOwnProperty.call(merged, key)) {
          conflictsOut.push(`${label}:${key}`)
        } else {
          merged[key] = val
          added += 1
        }
      }
      return { merged, added }
    }

    const draftConflicts = []
    const profRes = mergeDraftMap(currentProfileDrafts, incoming.profileDrafts, 'profileDrafts', draftConflicts)
    const projRes = mergeDraftMap(currentProjectDrafts, incoming.projectDrafts, 'projectDrafts', draftConflicts)
    const blogRes = mergeDraftMap(currentBlogDrafts, incoming.blogDrafts, 'blogDrafts', draftConflicts)

    const existingLogIds = new Set(currentLogs.map((l) => l?.id).filter(Boolean))
    const mergedLogs = [...currentLogs]
    let logsAdded = 0
    let logConflictsCount = 0
    for (const log of incoming.adminLogs) {
      if (existingLogIds.has(log.id)) {
        logConflictsCount += 1
      } else {
        mergedLogs.push(log)
        existingLogIds.add(log.id)
        logsAdded += 1
      }
    }

    const hasExistingSettings = Object.keys(currentSettings).length > 0
    const hasIncomingSettings = Object.keys(incoming.settings).length > 0
    const settingsConflict = hasExistingSettings && hasIncomingSettings
    const nextSettings = !hasExistingSettings && hasIncomingSettings ? incoming.settings : currentSettings

    try {
      writeStorageKeyStrict(STORAGE_KEYS.USERS, mergedUsers)
      writeStorageKeyStrict(STORAGE_KEYS.PORTFOLIOS, mergedPortfolios)
      writeStorageKeyStrict(STORAGE_KEYS.PROFILE_DRAFTS, profRes.merged)
      writeStorageKeyStrict(STORAGE_KEYS.PROJECT_DRAFTS, projRes.merged)
      writeStorageKeyStrict(STORAGE_KEYS.BLOG_DRAFTS, blogRes.merged)
      writeStorageKeyStrict(STORAGE_KEYS.ADMIN_LOGS, mergedLogs)
      if (!hasExistingSettings && hasIncomingSettings) {
        writeStorageKeyStrict(STORAGE_KEYS.SETTINGS, nextSettings)
      }
      if (!currentUsersBackup && isPlainObject(incoming.usersBackup)) {
        writeStorageKeyStrict(LEGACY_USERS_BACKUP_KEY, incoming.usersBackup)
      }
    } catch (err) {
      const rollbackErrors = rollbackRawSnapshot(rawSnapshot)
      if (rollbackErrors.length > 0) {
        throw new Error(
          `${err.message} Rollback also encountered errors: ${rollbackErrors.join('; ')}`
        )
      }
      throw new Error(`${err.message} Previous localStorage state has been restored.`)
    }

    adminService.recordAdminAction({
      adminUsername: admin.username,
      action: 'BACKUP_SAFE_MERGE',
      targetType: 'backup',
      targetId: check.backup.createdAt,
      reason: `Merged +${usersAdded} users, +${portfoliosAdded} portfolios, +${logsAdded} logs (${userConflicts.length + portfolioConflicts.length} conflicts preserved)`,
    })

    return {
      success: true,
      preRestoreCreatedAt: preRestoreAt,
      preRestorePersisted,
      added: {
        users: usersAdded,
        portfolios: portfoliosAdded,
        drafts: profRes.added + projRes.added + blogRes.added,
        adminLogs: logsAdded,
        settings: !hasExistingSettings && hasIncomingSettings,
      },
      conflicts: {
        users: userConflicts,
        portfolios: portfolioConflicts,
        drafts: draftConflicts,
        adminLogsCount: logConflictsCount,
        settings: settingsConflict,
      },
    }
  },

  /**
   * Full Restore: Create automatic pre-restore backup, replace all supported
   * Portfolio Studio keys with validated backup data, roll back on write failure,
   * and clear the active session so the administrator must log in again.
   */
  fullRestore(validatedBackup) {
    const admin = adminService.assertAdmin()
    const check = this.validateBackup(validatedBackup)
    if (!check.valid) {
      throw new Error(`Validation failed: ${check.errors.join(' ')}`)
    }

    const incoming = check.backup.data
    const rawSnapshot = captureRawSnapshot()
    const preRestoreAt = new Date().toISOString()

    // Best-effort persistent pre-restore snapshot
    let preRestorePersisted = false
    try {
      writeStorageKeyStrict(PRE_RESTORE_BACKUP_KEY, {
        createdAt: preRestoreAt,
        mode: 'full-restore',
        snapshot: rawSnapshot,
      })
      preRestorePersisted = true
    } catch {
      preRestorePersisted = false
    }

    try {
      writeStorageKeyStrict(STORAGE_KEYS.USERS, incoming.users)
      writeStorageKeyStrict(STORAGE_KEYS.PORTFOLIOS, incoming.portfolios)
      writeStorageKeyStrict(STORAGE_KEYS.SETTINGS, incoming.settings)
      writeStorageKeyStrict(STORAGE_KEYS.PROFILE_DRAFTS, incoming.profileDrafts)
      writeStorageKeyStrict(STORAGE_KEYS.PROJECT_DRAFTS, incoming.projectDrafts)
      writeStorageKeyStrict(STORAGE_KEYS.BLOG_DRAFTS, incoming.blogDrafts)
      writeStorageKeyStrict(STORAGE_KEYS.ADMIN_LOGS, incoming.adminLogs)
      if (isPlainObject(incoming.usersBackup)) {
        writeStorageKeyStrict(LEGACY_USERS_BACKUP_KEY, incoming.usersBackup)
      } else {
        removeStorageKeyStrict(LEGACY_USERS_BACKUP_KEY)
      }
    } catch (err) {
      const rollbackErrors = rollbackRawSnapshot(rawSnapshot)
      if (rollbackErrors.length > 0) {
        throw new Error(
          `${err.message} Rollback also encountered errors: ${rollbackErrors.join('; ')}`
        )
      }
      throw new Error(`${err.message} Previous localStorage state has been rolled back.`)
    }

    // Record restore event in the newly restored adminLogs
    adminService.recordAdminAction({
      adminUsername: admin.username,
      action: 'BACKUP_FULL_RESTORE',
      targetType: 'backup',
      targetId: check.backup.createdAt,
      reason: `Full restore applied from backup created ${check.backup.createdAt}. Active session cleared.`,
    })

    // Never preserve or restore active session after full restore
    storageService.remove(STORAGE_KEYS.SESSION)

    return {
      success: true,
      preRestoreCreatedAt: preRestoreAt,
      preRestorePersisted,
      restoredCounts: check.summary.counts,
      requiresReauth: true,
    }
  },
}

export default backupService
