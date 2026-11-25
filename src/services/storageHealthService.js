/**
 * LocalStorage Health & Capacity Estimation Service
 * Read-only diagnostics for Portfolio Studio administrators.
 * Never deletes, clears, or modifies user records, portfolios, or drafts.
 */
import { storageService, STORAGE_KEYS } from './storageService'
import { adminService } from './adminService'
import {
  LEGACY_USERS_BACKUP_KEY,
  PRE_RESTORE_BACKUP_KEY,
  formatBytes,
} from './backupService'

// Conservative typical browser localStorage limit (~5 MB) used only as an approximate reference
const APPROX_LOCALSTORAGE_LIMIT_BYTES = 5 * 1024 * 1024

const TRACKED_CATEGORIES = [
  { key: STORAGE_KEYS.PORTFOLIOS, label: 'Creator Portfolios' },
  { key: STORAGE_KEYS.USERS, label: 'User Accounts' },
  { key: STORAGE_KEYS.ADMIN_LOGS, label: 'Admin Activity Logs' },
  { key: STORAGE_KEYS.PROFILE_DRAFTS, label: 'Profile Drafts' },
  { key: STORAGE_KEYS.PROJECT_DRAFTS, label: 'Project Drafts' },
  { key: STORAGE_KEYS.BLOG_DRAFTS, label: 'Blog Drafts' },
  { key: STORAGE_KEYS.SETTINGS, label: 'Platform Settings' },
  { key: LEGACY_USERS_BACKUP_KEY, label: 'Legacy Users Backup' },
  { key: PRE_RESTORE_BACKUP_KEY, label: 'Pre-Restore Snapshot' },
  { key: STORAGE_KEYS.SESSION, label: 'Active Session' },
]

export const storageHealthService = {
  getHealthReport() {
    adminService.assertAdmin()

    const available = storageService.isAvailable()
    if (!available) {
      return {
        available: false,
        totalBytes: 0,
        formattedTotal: '0 B',
        approximateLimitBytes: APPROX_LOCALSTORAGE_LIMIT_BYTES,
        formattedApproximateLimit: formatBytes(APPROX_LOCALSTORAGE_LIMIT_BYTES),
        approximatePercent: null,
        quotaNote: 'Browser localStorage API is unavailable in this context.',
        categories: [],
        corruptedKeys: [],
        warnings: [
          'localStorage is unavailable or blocked by browser privacy settings. Data cannot be persisted.',
        ],
        hasPreRestoreSnapshot: false,
        lastStorageError: storageService.getLastError(),
      }
    }

    let totalBytes = 0
    const corruptedKeys = []
    const rawCategories = TRACKED_CATEGORIES.map((cat) => {
      const bytes = storageService.getRawSizeBytes(cat.key)
      totalBytes += bytes
      const status = storageService.getStatus(cat.key, null)
      if (status.corrupted) {
        corruptedKeys.push({ key: cat.key, label: cat.label, error: status.error })
      }
      return {
        key: cat.key,
        label: cat.label,
        bytes,
        formattedBytes: formatBytes(bytes),
        exists: status.exists,
        corrupted: status.corrupted,
      }
    })

    const categories = rawCategories
      .map((cat) => ({
        ...cat,
        percentOfUsed: totalBytes > 0 ? Math.round((cat.bytes / totalBytes) * 100) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes)

    const approximatePercent = Math.min(
      100,
      Math.round((totalBytes / APPROX_LOCALSTORAGE_LIMIT_BYTES) * 1000) / 10
    )

    const warnings = []
    if (approximatePercent >= 85) {
      warnings.push(
        `Storage usage is high (~${approximatePercent}% of a typical ~5 MB localStorage budget). Export a JSON backup soon.`
      )
    } else if (approximatePercent >= 65) {
      warnings.push(
        `Storage usage is approaching typical browser limits (~${approximatePercent}% of ~5 MB). Keep a recent backup.`
      )
    }

    if (corruptedKeys.length > 0) {
      warnings.push(
        `${corruptedKeys.length} storage key(s) contain malformed JSON (${corruptedKeys.map((c) => c.key).join(', ')}). Existing raw data has been preserved.`
      )
    }

    const lastError = storageService.getLastError()
    if (lastError) {
      warnings.push(`Recent storage error on "${lastError.key}": ${lastError.message}`)
    }

    const hasPreRestoreSnapshot = categories.some(
      (c) => c.key === PRE_RESTORE_BACKUP_KEY && c.exists
    )

    return {
      available: true,
      totalBytes,
      formattedTotal: formatBytes(totalBytes),
      approximateLimitBytes: APPROX_LOCALSTORAGE_LIMIT_BYTES,
      formattedApproximateLimit: formatBytes(APPROX_LOCALSTORAGE_LIMIT_BYTES),
      approximatePercent,
      quotaNote:
        'Browsers do not expose an exact synchronous localStorage quota; percentage is estimated against a ~5 MB reference budget.',
      categories,
      corruptedKeys,
      warnings,
      hasPreRestoreSnapshot,
      lastStorageError: lastError,
    }
  },
}

export default storageHealthService
