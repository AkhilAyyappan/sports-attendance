import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Session } from '@/types'

export function useSessions(campId: number) {
  return useQuery({
    queryKey: ['camps', campId, 'sessions'],
    queryFn: () =>
      api.get(`/api/camps/${campId}/sessions`).then((r) => r.data as Session[]),
    enabled: campId > 0,
  })
}

export function useSessionsFiltered(campId: number, teamId?: number) {
  return useQuery({
    queryKey: ['camps', campId, 'sessions', { teamId }],
    queryFn: () => {
      const params = teamId ? `?teamId=${teamId}` : ''
      return api
        .get(`/api/camps/${campId}/sessions${params}`)
        .then((r) => r.data as Session[])
    },
    enabled: campId > 0,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      campId,
      data,
    }: {
      campId: number
      data: Omit<Session, 'id' | 'status'>
    }) => api.post(`/api/camps/${campId}/sessions`, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['camps', variables.campId, 'sessions'] }),
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
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'camps' }),
  })
}
