export const API_BASE_URL = 'http://localhost:8080'

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  CAPTAIN: 'ROLE_CAPTAIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
