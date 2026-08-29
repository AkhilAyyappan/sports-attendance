import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { useCamps, useSessionsFiltered, usePlayers, useAttendance, useBulkSubmitAttendance, useUpdateAttendanceRecord } from '@/hooks'
import { type AttendanceStatus } from '@/types/attendance'

const STATUS_ORDER: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']
const UNMARKED = '—' as const

function cycleStatus(current: AttendanceStatus | typeof UNMARKED): AttendanceStatus | typeof UNMARKED {
  if (current === UNMARKED) return STATUS_ORDER[0]
  const idx = STATUS_ORDER.indexOf(current)
  return idx === STATUS_ORDER.length - 1 ? UNMARKED : STATUS_ORDER[idx + 1]
}

export default function AttendancePage() {
  const { data: camps = [], isLoading: campsLoading } = useCamps()
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null)

  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsFiltered(
    selectedCampId ?? 0
  )
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendance(
    selectedSessionId ?? 0
  )

  // We need players for the session's team. Fetch team players from the session's teamId.
  const session = sessions.find((s) => s.id === selectedSessionId)
  const { data: players = [] } = usePlayers(session?.teamId ?? 0)

  const bulkSubmit = useBulkSubmitAttendance(selectedSessionId ?? 0)
  const updateRecord = useUpdateAttendanceRecord()

  // Track locally edited statuses (optimistic)
  const [localStatuses, setLocalStatuses] = useState<Map<number, AttendanceStatus | typeof UNMARKED>>(
    () => new Map()
  )

  // Reset local statuses when switching sessions to prevent stale data
  useEffect(() => {
    setLocalStatuses(new Map())
  }, [selectedSessionId])

  // Sync localStatuses when attendance data changes
  useEffect(() => {
    const merged = new Map<number, AttendanceStatus | typeof UNMARKED>()
    for (const rec of attendanceRecords) {
      merged.set(rec.playerId, rec.status)
    }
    // Don't overwrite local edits, only fill in missing ones
    setLocalStatuses((prev) => {
      const next = new Map(prev)
      for (const [pid, status] of merged) {
        if (!next.has(pid)) next.set(pid, status)
      }
      return next
    })
  }, [attendanceRecords])

  const markedCount = useMemo(() => {
    let count = 0
    for (const v of localStatuses.values()) {
      if (v !== UNMARKED) count++
    }
    return count
  }, [localStatuses])

  const handleStatusClick = (playerId: number) => {
    setLocalStatuses((prev) => {
      const next = new Map(prev)
      const current = next.get(playerId) ?? UNMARKED
      next.set(playerId, cycleStatus(current))
      return next
    })
  }

  const handleRemarksChange = (playerId: number, remarks: string) => {
    // Find the actual record ID
    const record = attendanceRecords.find((r) => r.playerId === playerId)
    if (record) {
      updateRecord.mutate({ id: record.id, data: { remarks } })
    }
  }

  const handleBulkSubmit = async () => {
    const records = Array.from(localStatuses.entries())
      .filter(([, status]) => status !== UNMARKED)
      .map(([playerId, status]) => ({ playerId, status: status as AttendanceStatus }))

    if (records.length === 0) {
      toast.error('No attendance records to submit.')
      return
    }

    try {
      await bulkSubmit.mutateAsync({ records })
      toast.success('Attendance submitted successfully.')
      setLocalStatuses(new Map())
    } catch {
      toast.error('Failed to submit attendance. Please try again.')
    }
  }

  if (campsLoading || sessionsLoading || attendanceLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Attendance Ledger</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Mark and submit session attendance</p>
        </div>
        <LoadingSkeleton type="table" count={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Attendance Ledger</h1>
        <p className="text-slate-500 text-sm font-sans mt-1">Mark and submit session attendance</p>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
        <span className="font-serif text-sm font-medium text-brand-800 whitespace-nowrap">
          Camp:
        </span>
        <Select
          value={selectedCampId?.toString() ?? ''}
          onValueChange={(v) => {
            setSelectedCampId(Number(v))
            setSelectedSessionId(null)
          }}
        >
          <SelectTrigger className="w-56 font-sans border-border">
            <SelectValue placeholder="Choose a camp…" />
          </SelectTrigger>
          <SelectContent>
            {camps.map((camp) => (
              <SelectItem key={camp.id} value={camp.id.toString()}>
                {camp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="font-serif text-sm font-medium text-brand-800 whitespace-nowrap">
          Session:
        </span>
        <Select
          value={selectedSessionId?.toString() ?? ''}
          onValueChange={(v) => setSelectedSessionId(Number(v))}
          disabled={selectedCampId === null}
        >
          <SelectTrigger className="w-72 font-sans border-border">
            <SelectValue placeholder="Choose a session…" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.title} — {new Date(s.sessionDate).toLocaleDateString()} ({s.startTime}–{s.endTime})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSessionId === null ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-slate-400 font-sans text-sm">
            Select a camp and session to open the attendance ledger.
          </p>
        </div>
      ) : (
        <>
          {/* Ledger table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-brand-900">
                {session?.title ?? 'Session'} — Roster
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {markedCount} of {players.length} marked
              </span>
            </div>

            {players.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-sans text-sm">
                  No players found for this session's team.
                </p>
              </div>
            ) : (
              <Table className="ledger-table">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-b border-border">
                    <TableHead className="font-serif text-brand-800 w-16">Jersey #</TableHead>
                    <TableHead className="font-serif text-brand-800">Player Name</TableHead>
                    <TableHead className="font-serif text-brand-800">Status</TableHead>
                    <TableHead className="font-serif text-brand-800">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => {
                    const status = localStatuses.get(player.id) ?? UNMARKED
                    const record = attendanceRecords.find((r) => r.playerId === player.id)
                    return (
                      <TableRow key={player.id} className="hover:bg-surface/50">
                        <TableCell className="font-mono text-sm text-slate-500">
                          #{player.jerseyNumber}
                        </TableCell>
                        <TableCell className="font-serif font-medium text-brand-900">
                          {player.fullName}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleStatusClick(player.id)}
                            className="focus:outline-none"
                            title="Click to cycle status"
                          >
                            <StatusBadge
                              status={status}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={record?.remarks ?? ''}
                            onChange={(e) => handleRemarksChange(player.id, e.target.value)}
                            placeholder="Add note…"
                            className="font-sans text-sm border border-border rounded px-2 py-1 w-full max-w-[200px] bg-transparent focus:outline-none focus:border-accent"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Bulk actions bar */}
          <div className="sticky bottom-4 bg-card border border-border rounded-lg px-6 py-4 flex items-center justify-between shadow-lg">
            <span className="font-sans text-sm text-slate-500">
              {markedCount === players.length && players.length > 0
                ? 'All players marked'
                : `${markedCount} of ${players.length} players marked`}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalStatuses(new Map())}
                className="font-sans text-sm border-border"
              >
                Clear All
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={markedCount === 0 || bulkSubmit.isPending}
                className="font-sans text-sm bg-accent hover:bg-accent-light text-white"
              >
                {bulkSubmit.isPending ? 'Submitting…' : 'Submit Attendance'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


