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
  sportId?: number
  sport?: {
    id: number
    name: string
  }
}
