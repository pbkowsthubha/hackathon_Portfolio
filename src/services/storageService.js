/**
 * Centralized Storage Service
 * Namespaced localStorage manager for Portfolio Studio with safe parsing,
 * QuotaExceededError detection, and strict write support.
 */

export const STORAGE_KEYS = {
  USERS: 'portfolioStudio:users',
  SESSION: 'portfolioStudio:session',
  PORTFOLIOS: 'portfolioStudio:portfolios',
  PROFILE_DRAFTS: 'portfolioStudio:profileDrafts',
  PROJECT_DRAFTS: 'portfolioStudio:projectDrafts',
  BLOG_DRAFTS: 'portfolioStudio:blogDrafts',
  ADMIN_LOGS: 'portfolioStudio:adminLogs',
  SETTINGS: 'portfolioStudio:settings',
}

let lastStorageError = null

export function isQuotaExceededError(err) {
  if (!err) return false
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014
  )
}

export const storageService = {
  isAvailable() {
    try {
      if (typeof localStorage === 'undefined') return false
      const probe = '__ps_storage_probe__'
      localStorage.setItem(probe, '1')
      localStorage.removeItem(probe)
      return true
    } catch {
      return false
    }
  },

  getLastError() {
    return lastStorageError
  },

  clearLastError() {
    lastStorageError = null
  },

  /**
   * Read and parse a key, returning status metadata without discarding or
   * overwriting corrupted raw values in localStorage.
   */
  getStatus(key, defaultValue = null) {
    try {
      if (typeof localStorage === 'undefined') {
        return { value: defaultValue, exists: false, corrupted: false, error: 'localStorage unavailable' }
      }
      const raw = localStorage.getItem(key)
      if (raw === null) {
        return { value: defaultValue, exists: false, corrupted: false, error: null }
      }
      const parsed = JSON.parse(raw)
      return { value: parsed, exists: true, corrupted: false, error: null }
    } catch (err) {
      const msg = err?.message || 'Malformed JSON in storage'
      lastStorageError = { key, operation: 'read', message: msg, isQuota: false }
      return { value: defaultValue, exists: true, corrupted: true, error: msg }
    }
  },

  get(key, defaultValue = null) {
    const status = this.getStatus(key, defaultValue)
    if (status.corrupted && import.meta.env?.DEV) {
      console.warn(`[storageService] Corrupted JSON at key "${key}":`, status.error)
    }
    return status.value
  },

  setStrict(key, value) {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('Browser localStorage is unavailable in this environment.')
      }
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      lastStorageError = null
      return true
    } catch (err) {
      const isQuota = isQuotaExceededError(err)
      const message = isQuota
        ? `Browser storage quota exceeded while saving "${key}". Export a backup and free browser storage.`
        : `Failed to save "${key}": ${err?.message || 'Storage write error'}`
      lastStorageError = { key, operation: 'write', message, isQuota }
      throw new Error(message)
    }
  },

  set(key, value) {
    try {
      return this.setStrict(key, value)
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.error(`[storageService] Error writing key "${key}":`, err)
      }
      return false
    }
  },

  remove(key) {
    try {
      if (typeof localStorage === 'undefined') return false
      localStorage.removeItem(key)
      return true
    } catch (err) {
      lastStorageError = { key, operation: 'remove', message: err?.message || 'Remove failed', isQuota: false }
      return false
    }
  },

  getRawSizeBytes(key) {
    try {
      if (typeof localStorage === 'undefined') return 0
      const raw = localStorage.getItem(key)
      if (!raw) return 0
      return typeof Blob !== 'undefined'
        ? new Blob([raw]).size
        : new TextEncoder().encode(raw).length
    } catch {
      return 0
    }
  },

  clearAllPortfolioData() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
      return true
    } catch (err) {
      console.error('[storageService] Error clearing portfolio studio data:', err)
      return false
    }
  },
}

export default storageService
