import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Team } from '@/types'

export function useTeams(campId: number) {
  return useQuery({
    queryKey: ['camps', campId, 'teams'],
    queryFn: () => api.get(`/api/camps/${campId}/teams`).then((r) => r.data as Team[]),
    enabled: campId > 0,
  })
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => api.get(`/api/teams/${id}`).then((r) => r.data as Team),
    enabled: id > 0,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campId, data }: { campId: number; data: Omit<Team, 'id'> }) =>
      api.post(`/api/camps/${campId}/teams`, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['camps', variables.campId, 'teams'] }),
  })
}

export function useAssignCaptain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, captainId }: { teamId: number; captainId: number }) =>
      api.post(`/api/teams/${teamId}/captain`, { captainId }),
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'teams' }),
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Team> }) =>
      api.patch(`/api/teams/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'teams' }),
  })
}
