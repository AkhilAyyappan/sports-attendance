export interface Sport {
  id: number
  name: string
  description?: string
  active: boolean
  captain?: {
    id: number
    username: string
    fullName: string
    email?: string
    phone?: string
  } | null
  captainId?: number
}
