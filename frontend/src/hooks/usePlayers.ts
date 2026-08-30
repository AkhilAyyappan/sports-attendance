import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Player } from '@/types'

export function usePlayers(sportId: number) {
  return useQuery({
    queryKey: ['sports', sportId, 'players'],
    queryFn: () => api.get(`/api/sports/${sportId}/players`).then((r) => r.data as Player[]),
    enabled: sportId > 0,
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
    mutationFn: ({ sportId, data }: { sportId: number; data: Partial<Player> }) =>
      api.post(`/api/sports/${sportId}/players`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['sports'] })
      qc.invalidateQueries({ queryKey: ['sports', variables.sportId, 'players'] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('players') })
    },
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) =>
      api.put(`/api/players/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('players') }),
  })
}

export function useDeletePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/players/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('players') }),
  })
}
