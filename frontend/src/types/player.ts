import type { AttendanceStatus } from './attendance'

export interface Player {
  id: number
  fullName: string
  dateOfBirth?: string
  jerseyNumber?: number | string
  position?: string
  phone?: string
  email?: string
  notes?: string
  active?: boolean
  attendanceStatus?: AttendanceStatus
  presentCount?: number
  absentCount?: number
  lateCount?: number
  excusedCount?: number
  sportId?: number
  sport?: {
    id: number
    name: string
  }
}
