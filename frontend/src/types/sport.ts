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
