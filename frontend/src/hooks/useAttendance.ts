import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import {
  type AttendanceRecord,
  type AttendanceSummary,
  type BulkAttendancePayload,
} from '@/types/attendance'

export function useAttendance(sessionId: number) {
  return useQuery({
    queryKey: ['sessions', sessionId, 'attendance'],
    queryFn: () =>
      api
        .get(`/api/sessions/${sessionId}/attendance`)
        .then((r) => r.data as AttendanceRecord[]),
    enabled: sessionId > 0,
  })
}

export function useBulkSubmitAttendance(sessionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkAttendancePayload) =>
      api.post(`/api/sessions/${sessionId}/attendance`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', sessionId, 'attendance'] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'sessions' })
    },
  })
}

export function useUpdateAttendanceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<AttendanceRecord>
    }) => api.patch(`/api/attendance/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'sessions' }),
  })
}

export function usePlayerAttendance(playerId: number) {
  return useQuery({
    queryKey: ['players', playerId, 'attendance'],
    queryFn: () =>
      api
        .get(`/api/players/${playerId}/attendance`)
        .then((r) => r.data as AttendanceRecord[]),
    enabled: playerId > 0,
  })
}

export function usePlayerAttendanceSummary(playerId: number) {
  return useQuery({
    queryKey: ['players', playerId, 'attendance', 'summary'],
    queryFn: () =>
      api
        .get(`/api/players/${playerId}/attendance/summary`)
        .then((r) => r.data as AttendanceSummary),
    enabled: playerId > 0,
  })
}
