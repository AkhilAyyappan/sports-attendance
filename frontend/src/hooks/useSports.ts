import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Sport } from '@/types'

export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get('/api/sports').then((r) => r.data as Sport[]),
  })
}

export function useActiveSports() {
  return useQuery({
    queryKey: ['sports', { active: true }],
    queryFn: () => api.get('/api/sports/active').then((r) => r.data as Sport[]),
  })
}

export function useCreateSport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Sport, 'id'>) => api.post('/api/sports', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sports'] }),
  })
}

export function useUpdateSport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Sport> }) =>
      api.put(`/api/sports/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sports'] }),
  })
}
