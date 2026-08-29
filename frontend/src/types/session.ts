export interface Session {
  id: number
  title: string
  sessionDate: string
  startTime: string
  endTime: string
  notes?: string
  teamId?: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}
