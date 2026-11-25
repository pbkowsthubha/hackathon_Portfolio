/**
 * Client-Side Authentication Service
 * Uses salted SHA-256 via Web Crypto API with localStorage persistence.
 * Note: Demonstration authentication for hackathon only; not a substitute for a backend.
 */
import { storageService, STORAGE_KEYS } from './storageService'

const CURRENT_HASH_VERSION = 'sha256-v1'
const USERS_BACKUP_KEY = 'portfolioStudio:users_backup'

// Helper: Convert ArrayBuffer to Hex string
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper: Compute raw SHA-256 hex digest
async function sha256Hex(input) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available in this browser environment.')
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hashBuffer)
}

// Helper: Generate a cryptographic random salt
export function generateSalt() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16)
    window.crypto.getRandomValues(array)
    return bufferToHex(array.buffer)
  }
  // Fallback pseudorandom string if crypto.getRandomValues is unavailable
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Helper: Hash password with salt using SHA-256 (current registration format)
export async function hashPassword(password, salt) {
  return sha256Hex(password + salt)
}

// Helper: Safely extract normalized identifiers from current or legacy user records
function getRecordIdentifiers(user) {
  if (!user || typeof user !== 'object') return []
  const rawFields = [user.email, user.userEmail, user.username, user.userName, user.handle]
  return rawFields
    .filter((val) => typeof val === 'string' && val.trim().length > 0)
    .map((val) => val.trim().toLowerCase())
}

// Helper: Verify password against current and legacy hash formats without modifying password
async function verifyUserPassword(user, password) {
  if (!user || typeof user !== 'object' || typeof password !== 'string' || password.length === 0) {
    return { valid: false, needsMigration: false }
  }

  const storedHash =
    typeof user.passwordHash === 'string'
      ? user.passwordHash.trim().toLowerCase()
      : typeof user.hash === 'string'
        ? user.hash.trim().toLowerCase()
        : ''
  const storedSalt = typeof user.salt === 'string' ? user.salt : ''

  // 1. Current format: SHA-256(password + salt)
  if (storedHash && storedSalt) {
    const currentDigest = (await hashPassword(password, storedSalt)).toLowerCase()
    if (currentDigest === storedHash) {
      return { valid: true, needsMigration: user.hashVersion !== CURRENT_HASH_VERSION }
    }

    // 2. Legacy reversed salt order: SHA-256(salt + password)
    const reversedDigest = (await sha256Hex(storedSalt + password)).toLowerCase()
    if (reversedDigest === storedHash) {
      return { valid: true, needsMigration: true }
    }
  }

  // 3. Legacy unsalted SHA-256: SHA-256(password)
  if (storedHash) {
    const unsaltedDigest = (await sha256Hex(password)).toLowerCase()
    if (unsaltedDigest === storedHash) {
      return { valid: true, needsMigration: true }
    }
  }

  // 4. Legacy plaintext prototype record (only if no passwordHash was stored)
  if (!storedHash && typeof user.password === 'string' && user.password.length > 0) {
    if (password === user.password) {
      return { valid: true, needsMigration: true }
    }
  }

  return { valid: false, needsMigration: false }
}

// Demo Admin Credentials
export const DEMO_ADMIN = {
  id: 'admin-default',
  fullName: 'Portfolio Administrator',
  username: 'admin',
  email: 'admin@portfolio.local',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// Initialize and auto-seed demo admin if not present
export async function seedDemoAdmin() {
  const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
  const users = Array.isArray(rawUsers) ? rawUsers : []
  const existingAdmin = users.find(
    (u) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === DEMO_ADMIN.email.toLowerCase()
  )

  if (!existingAdmin) {
    const salt = generateSalt()
    const passwordHash = await hashPassword('AdminDemo123!', salt)

    const adminUser = {
      ...DEMO_ADMIN,
      salt,
      passwordHash,
      hashVersion: CURRENT_HASH_VERSION,
    }

    users.push(adminUser)
    storageService.set(STORAGE_KEYS.USERS, users)
  }
}

export const authService = {
  async register({ fullName, username, email, password }) {
    await seedDemoAdmin()
    const settings = storageService.get(STORAGE_KEYS.SETTINGS, {})
    if (settings && settings.registrationEnabled === false) {
      throw new Error('New creator registration is currently disabled by the platform administrator.')
    }

    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()

    // Uniqueness checks
    if (
      users.some(
        (u) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === cleanEmail
      )
    ) {
      throw new Error('An account with this email address already exists.')
    }

    if (
      users.some(
        (u) => u && typeof u.username === 'string' && u.username.trim().toLowerCase() === cleanUsername
      )
    ) {
      throw new Error('This username is already taken. Please choose another.')
    }

    // Role is strictly 'creator'. Never admin.
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)

    const newUser = {
      id: `usr-${Date.now()}`,
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: 'creator',
      status: 'active',
      salt,
      passwordHash,
      hashVersion: CURRENT_HASH_VERSION,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    storageService.set(STORAGE_KEYS.USERS, users)

    // Create initial empty portfolio record only if one does not already exist
    const portfolios = storageService.get(STORAGE_KEYS.PORTFOLIOS, {})
    if (!portfolios[cleanUsername]) {
      portfolios[cleanUsername] = {
        id: `port-${Date.now()}`,
        userId: newUser.id,
        username: cleanUsername,
        fullName: newUser.fullName,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        personalInfo: {
          name: newUser.fullName,
          tagline: 'PORTFOLIO IN PROGRESS',
          professionalIdentity: 'Creator & Builder',
        },
        skills: [],
        projects: [],
        education: [],
        achievements: [],
        certifications: [],
        blogPosts: [],
        publication: {
          status: 'draft',
          publishedAt: null,
          unpublishedAt: null,
          lastPublishedAt: null,
        },
      }
      storageService.set(STORAGE_KEYS.PORTFOLIOS, portfolios)
    }

    // Establish active session
    const safeUser = {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    }
    storageService.set(STORAGE_KEYS.SESSION, safeUser)

    return safeUser
  },

  async login(identifier, password) {
    await seedDemoAdmin()
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    const cleanIdentifier = typeof identifier === 'string' ? identifier.trim().toLowerCase() : ''

    if (!cleanIdentifier || !password) {
      throw new Error('Please provide both your email/username and password.')
    }

    // Locate all matching candidate accounts (handles duplicate/legacy fields safely)
    const candidateIndices = []
    users.forEach((u, idx) => {
      if (getRecordIdentifiers(u).includes(cleanIdentifier)) {
        candidateIndices.push(idx)
      }
    })

    if (candidateIndices.length === 0) {
      throw new Error('Invalid email/username or password.')
    }

    let matchedIndex = -1
    let needsMigration = false

    for (const idx of candidateIndices) {
      const verification = await verifyUserPassword(users[idx], password)
      if (verification.valid) {
        matchedIndex = idx
        needsMigration = verification.needsMigration
        break
      }
    }

    if (matchedIndex === -1) {
      throw new Error('Invalid email/username or password.')
    }

    const matchedUser = users[matchedIndex]

    if ((matchedUser.status || 'active') === 'suspended') {
      throw new Error('This account has been suspended by a platform administrator.')
    }

    // Upgrade legacy hash or missing hashVersion atomically after successful verification
    if (needsMigration) {
      try {
        const existingBackup = storageService.get(USERS_BACKUP_KEY, null)
        if (!existingBackup) {
          storageService.set(USERS_BACKUP_KEY, {
            createdAt: new Date().toISOString(),
            users,
          })
        }

        const newSalt = generateSalt()
        const newHash = await hashPassword(password, newSalt)
        const upgradedUser = { ...matchedUser }
        delete upgradedUser.password
        delete upgradedUser.hash
        upgradedUser.salt = newSalt
        upgradedUser.passwordHash = newHash
        upgradedUser.hashVersion = CURRENT_HASH_VERSION

        const updatedUsers = [...users]
        updatedUsers[matchedIndex] = upgradedUser
        storageService.set(STORAGE_KEYS.USERS, updatedUsers)
      } catch (err) {
        // Non-fatal: login still succeeds using the verified existing record
        console.warn('[authService] Legacy hash upgrade skipped:', err)
      }
    }

    const safeUser = {
      id: matchedUser.id,
      fullName: matchedUser.fullName || matchedUser.name || '',
      username: (matchedUser.username || matchedUser.userName || matchedUser.handle || '').trim().toLowerCase(),
      email: (matchedUser.email || matchedUser.userEmail || '').trim().toLowerCase(),
      role: matchedUser.role || 'creator',
      status: matchedUser.status || 'active',
      createdAt: matchedUser.createdAt,
    }

    storageService.set(STORAGE_KEYS.SESSION, safeUser)
    return safeUser
  },

  logout() {
    storageService.remove(STORAGE_KEYS.SESSION)
  },

  getCurrentUser() {
    const session = storageService.get(STORAGE_KEYS.SESSION, null)
    if (!session) return null
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    const record = users.find((u) => u && u.id === session.id)
    if (record && (record.status || 'active') === 'suspended') {
      storageService.remove(STORAGE_KEYS.SESSION)
      return null
    }
    if (record) {
      return {
        ...session,
        role: record.role || session.role || 'creator',
        status: record.status || 'active',
      }
    }
    return session
  },

  getAllUsers() {
    // Only return safe user fields (omit salt & passwordHash)
    const rawUsers = storageService.get(STORAGE_KEYS.USERS, [])
    const users = Array.isArray(rawUsers) ? rawUsers : []
    return users
      .filter((u) => u && typeof u === 'object')
      .map(({ id, fullName, username, email, role, status, createdAt }) => ({
        id,
        fullName,
        username,
        email,
        role: role || 'creator',
        status: status || 'active',
        createdAt,
      }))
  },
}

export default authService
