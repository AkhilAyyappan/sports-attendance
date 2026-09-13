/** Minimal sport reference used on players, profiles, and sessions. */
export interface SportLite {
  id: number
  name: string
}

export interface CaptainLite {
  id: number
  username: string
  fullName: string
  email?: string
  phone?: string
}

export interface Sport {
  id: number
  name: string
  description?: string
  active: boolean
  captain?: CaptainLite | null
  captainId?: number
  admins?: CaptainLite[]
  captains?: CaptainLite[]
}
