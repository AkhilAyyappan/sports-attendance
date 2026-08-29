import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { type Captain } from '@/types'

export function useCaptains() {
  return useQuery({
    queryKey: ['captains'],
    queryFn: () => api.get('/api/users/captains').then((r) => r.data as Captain[]),
  })
}

export function useCreateCaptain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Captain, 'id'>) => api.post('/api/users', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captains'] }),
  })
}

export function useResetPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.patch(`/api/users/${id}/password`, { newPassword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captains'] }),
  })
}

export function useToggleCaptain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch(`/api/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['captains'] }),
  })
}
