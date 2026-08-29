import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Session } from '@/types'

export function useAllSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/api/sessions').then((r) => r.data as Session[]),
  })
}

export function useSessions(sportId: number) {
  return useQuery({
    queryKey: ['sports', sportId, 'sessions'],
    queryFn: () =>
      api.get(`/api/sports/${sportId}/sessions`).then((r) => r.data as Session[]),
    enabled: sportId > 0,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sportId,
      data,
    }: {
      sportId: number
      data: Partial<Session>
    }) => api.post(`/api/sports/${sportId}/sessions`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['sports', variables.sportId, 'sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSessionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: Session['status']
    }) => api.patch(`/api/sessions/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('sessions') })
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('sessions') })
    },
  })
}
