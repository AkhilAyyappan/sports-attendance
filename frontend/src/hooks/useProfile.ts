import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type { SportLite } from '@/types/sport'

export interface Me {
  id: number
  username: string
  fullName: string
  email: string | null
  phone: string | null
  role: string
  enabled: boolean
  /** Sports the caller captains (captain accounts). Returned by GET /api/auth/me. */
  sports?: SportLite[]
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/api/auth/me').then((r) => r.data as Me),
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { fullName: string; email?: string; phone?: string }) =>
      api.patch('/api/auth/me', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/api/auth/me', data),
  })
}