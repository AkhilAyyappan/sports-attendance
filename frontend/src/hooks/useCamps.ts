import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Camp } from '@/types'

export function useCamps() {
  return useQuery({
    queryKey: ['camps'],
    queryFn: () => api.get('/api/camps').then((r) => r.data as Camp[]),
  })
}

export function useCamp(id: number) {
  return useQuery({
    queryKey: ['camps', id],
    queryFn: () => api.get(`/api/camps/${id}`).then((r) => r.data as Camp),
    enabled: id > 0,
  })
}

export function useCreateCamp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Camp, 'id'>) => api.post('/api/camps', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camps'] }),
  })
}

export function useUpdateCamp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Camp> }) =>
      api.put(`/api/camps/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camps'] }),
  })
}

export function useDeleteCamp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/camps/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camps'] }),
  })
}
