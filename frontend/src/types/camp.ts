export interface Camp {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}
