import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Player } from '@/types'

export function usePlayers(teamId: number) {
  return useQuery({
    queryKey: ['teams', teamId, 'players'],
    queryFn: () => api.get(`/api/teams/${teamId}/players`).then((r) => r.data as Player[]),
    enabled: teamId > 0,
  })
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => api.get(`/api/players/${id}`).then((r) => r.data as Player),
    enabled: id > 0,
  })
}

export function useAddPlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: number; data: Omit<Player, 'id' | 'teamId'> }) =>
      api.post(`/api/teams/${teamId}/players`, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['teams', variables.teamId, 'players'] }),
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) =>
      api.put(`/api/players/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'players' }),
  })
}

export function useDeletePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/players/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'players' }),
  })
}
