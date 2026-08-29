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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import {
  useSports,
  useMySports,
  useSessions,
  usePlayers,
  useAttendance,
  useBulkSubmitAttendance,
  useCreateSession,
  useDeleteSession,
  useAuth,
} from '@/hooks'
import { type AttendanceStatus } from '@/types/attendance'
import { type Session } from '@/types'
import { Trophy, Calendar, Plus, Trash2 } from 'lucide-react'

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']

export default function AttendancePage() {
  const { role } = useAuth()
  const isCaptain = role === 'ROLE_CAPTAIN'

  const { data: allSports = [], isLoading: allSportsLoading } = useSports()
  const { data: mySports = [], isLoading: mySportsLoading } = useMySports()

  const sports = isCaptain ? mySports : allSports
  const sportsLoading = isCaptain ? mySportsLoading : allSportsLoading

  const [selectedSportId, setSelectedSportId] = useState<number | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [deleteSessionDialog, setDeleteSessionDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  })

  const [sessionForm, setSessionForm] = useState({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    notes: '',
  })

  // Auto select sport
  useEffect(() => {
    if (sports.length > 0) {
      if (selectedSportId === null || !sports.some((s) => s.id === selectedSportId)) {
        setSelectedSportId(sports[0].id)
      }
    }
  }, [sports, selectedSportId])

  const { data: sessions = [] } = useSessions(selectedSportId ?? 0)

  // Auto select first session
  useEffect(() => {
    if (sessions.length > 0) {
      if (selectedSessionId === null || !sessions.some((s) => s.id === selectedSessionId)) {
        setSelectedSessionId(sessions[0].id)
      }
    } else {
      setSelectedSessionId(null)
    }
  }, [sessions, selectedSessionId])

  const { data: players = [], isLoading: playersLoading } = usePlayers(selectedSportId ?? 0)
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendance(selectedSessionId ?? 0)

  const bulkSubmit = useBulkSubmitAttendance(selectedSessionId ?? 0)
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()

  // Track status per player: Map<playerId, AttendanceStatus>
  const [playerStatuses, setPlayerStatuses] = useState<Map<number, AttendanceStatus>>(() => new Map())

  useEffect(() => {
    const map = new Map<number, AttendanceStatus>()
    // Pre-populate with existing records
    for (const rec of attendanceRecords) {
      map.set(rec.playerId, rec.status)
    }
    // Default any remaining players to PRESENT if not marked yet
    for (const p of players) {
      if (!map.has(p.id)) {
        map.set(p.id, 'PRESENT')
      }
    }
    setPlayerStatuses(map)
  }, [attendanceRecords, players, selectedSessionId])

  const setStatus = (playerId: number, status: AttendanceStatus) => {
    setPlayerStatuses((prev) => {
      const next = new Map(prev)
      next.set(playerId, status)
      return next
    })
  }

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) {
      toast.error('Please select a session first.')
      return
    }
    const records = Array.from(playerStatuses.entries()).map(([playerId, status]) => ({
      playerId,
      status,
    }))
    try {
      await bulkSubmit.mutateAsync({ records })
      toast.success('Attendance recorded successfully.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.')
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSportId || !sessionForm.title.trim()) {
      toast.error('Please enter session title.')
      return
    }
    try {
      const created: any = await createSession.mutateAsync({
        sportId: selectedSportId,
        data: {
          title: sessionForm.title.trim(),
          sessionDate: sessionForm.sessionDate,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          notes: sessionForm.notes.trim(),
          status: 'SCHEDULED',
        },
      })
      toast.success(`Session "${sessionForm.title}" scheduled.`)
      setCreateSessionOpen(false)
      if (created?.data?.id || created?.id) {
        setSelectedSessionId(created.data?.id || created.id)
      }
      setSessionForm({
        title: '',
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        notes: '',
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create session.')
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionDialog.session) return
    try {
      await deleteSession.mutateAsync(deleteSessionDialog.session.id)
      toast.success(`Session "${deleteSessionDialog.session.title}" deleted.`)
      if (selectedSessionId === deleteSessionDialog.session.id) {
        setSelectedSessionId(null)
      }
      setDeleteSessionDialog({ open: false, session: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete session.')
    }
  }

  const currentSport = sports.find((s) => s.id === selectedSportId)
  const currentSession = sessions.find((s) => s.id === selectedSessionId)

  const summary = useMemo(() => {
    let present = 0, late = 0, absent = 0, excused = 0
    for (const st of playerStatuses.values()) {
      if (st === 'PRESENT') present++
      else if (st === 'LATE') late++
      else if (st === 'ABSENT') absent++
      else if (st === 'EXCUSED') excused++
    }
    return { present, late, absent, excused, total: playerStatuses.size }
  }, [playerStatuses])

  if (sportsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Attendance Register</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Mark athlete attendance for training sessions</p>
        </div>
        <LoadingSkeleton type="table" count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Attendance Register</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            {isCaptain
              ? `Manage training sessions & track attendance for ${currentSport?.name || 'your sport'}`
              : 'Track daily athlete presence, lateness, and training attendance.'}
          </p>
        </div>
        {selectedSportId && (
          <Button
            onClick={() => setCreateSessionOpen(true)}
            className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Schedule Session
          </Button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Sport Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-sans text-slate-700 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            {isCaptain ? 'Your Assigned Sport' : '1. Select Sport Program'}
          </Label>
          <Select
            value={selectedSportId?.toString() ?? ''}
            onValueChange={(v) => {
              setSelectedSportId(Number(v))
              setSelectedSessionId(null)
            }}
          >
            <SelectTrigger className="font-sans bg-surface">
              <SelectValue placeholder={sports.length === 0 ? 'No sports assigned' : 'Choose a sport…'} />
            </SelectTrigger>
            <SelectContent>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id.toString()}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Session Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-sans text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            2. Select Training Session
          </Label>
          <Select
            value={selectedSessionId?.toString() ?? ''}
            onValueChange={(v) => setSelectedSessionId(Number(v))}
            disabled={sessions.length === 0}
          >
            <SelectTrigger className="font-sans bg-surface">
              <SelectValue placeholder={sessions.length === 0 ? 'No sessions scheduled yet' : 'Choose a session…'} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((sess) => (
                <SelectItem key={sess.id} value={sess.id.toString()}>
                  {sess.title} ({sess.sessionDate} {sess.startTime || ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Session Details & Summary */}
      {currentSession && (
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <h3 className="font-serif font-semibold text-brand-900">{currentSession.title}</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0"
                onClick={() => setDeleteSessionDialog({ open: true, session: currentSession })}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Session
              </Button>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Date: <strong>{currentSession.sessionDate}</strong> {currentSession.startTime ? `· Time: ${currentSession.startTime} - ${currentSession.endTime || ''}` : ''}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              ✓ {summary.present} Present
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              ⏱ {summary.late} Late
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
              ✕ {summary.absent} Absent
            </span>
          </div>
        </div>
      )}

      {/* Roster Attendance Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {playersLoading || attendanceLoading ? (
          <div className="p-6">
            <LoadingSkeleton type="table" count={5} />
          </div>
        ) : sports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-sans text-sm">
              You do not have any sports assigned to your captain account yet.
            </p>
          </div>
        ) : !selectedSessionId ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-sans text-sm">
              {sessions.length === 0
                ? 'No sessions exist for this sport yet. Click "Schedule Session" above.'
                : 'Select a training session to view and mark attendance.'}
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-sans text-sm">
              No athletes registered in {currentSport?.name || 'this sport'}. Please add athletes in the Roster tab.
            </p>
          </div>
        ) : (
          <div>
            <Table className="ledger-table">
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-b border-border">
                  <TableHead className="w-16 font-serif text-brand-800">#</TableHead>
                  <TableHead className="font-serif text-brand-800">Athlete</TableHead>
                  <TableHead className="font-serif text-brand-800">Position</TableHead>
                  <TableHead className="text-right font-serif text-brand-800">Attendance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const currentSt = playerStatuses.get(player.id) ?? 'PRESENT'
                  return (
                    <TableRow key={player.id} className="hover:bg-surface/50">
                      <TableCell className="font-mono text-sm font-semibold text-brand-800">
                        {player.jerseyNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-serif font-medium text-brand-900">{player.fullName}</div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-slate-600">
                        {player.position || 'Athlete'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {STATUS_OPTIONS.map((st) => {
                            const isSelected = currentSt === st
                            let style = 'bg-surface text-slate-600 border-border hover:bg-surface/80'
                            if (isSelected) {
                              if (st === 'PRESENT') style = 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              else if (st === 'LATE') style = 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              else if (st === 'ABSENT') style = 'bg-rose-600 text-white border-rose-700 shadow-sm'
                              else if (st === 'EXCUSED') style = 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            }
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setStatus(player.id, st)}
                                className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-all ${style}`}
                              >
                                {st}
                              </button>
                            )
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="p-4 bg-surface border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                {players.length} athletes marked
              </span>
              <Button
                onClick={handleSaveAttendance}
                disabled={bulkSubmit.isPending}
                className="bg-accent hover:bg-accent-light text-white font-sans text-xs"
              >
                {bulkSubmit.isPending ? 'Saving…' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE SESSION DIALOG */}
      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateSession}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Schedule Training Session for {currentSport?.name}
              </DialogTitle>
              <DialogDescription>
                Set up a new training date and time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs font-sans text-slate-700">Session Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Morning Conditioning"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs font-sans text-slate-700">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="start" className="text-xs font-sans text-slate-700">Start Time</Label>
                  <Input
                    id="start"
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end" className="text-xs font-sans text-slate-700">End Time</Label>
                  <Input
                    id="end"
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs font-sans text-slate-700">Session Notes</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Bring agility cones and water"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateSessionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                Create Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE SESSION DIALOG */}
      <Dialog open={deleteSessionDialog.open} onOpenChange={(open) => setDeleteSessionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Training Session?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteSessionDialog.session?.title}</strong>? All marked attendance records for this session will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteSessionDialog({ open: false, session: null })}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteSession}
              className="bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs"
            >
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
