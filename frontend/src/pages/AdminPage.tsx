import { useEffect, useMemo, useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { toast } from 'sonner'
import {
  useSports,
  useCreateSport,
  useUpdateSport,
  useAssignCaptainToSport,
  useDeleteSport,
  useCaptains,
  useCreateCaptain,
  useResetPassword,
  useToggleCaptain,
  useDeleteCaptain,
  useAllSessions,
  useSessions,
  useCreateSession,
  useDeleteSession,
  usePlayers,
  useAttendance,
} from '@/hooks'
import {
  UserPlus,
  Shield,
  Plus,
  Trophy,
  Activity,
  Trash2,
  CalendarDays,
  ClipboardCheck,
  Users,
  BarChart3,
} from 'lucide-react'
import { type Captain, type Sport } from '@/types'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sports' | 'sessions' | 'captains' | 'attendance' | 'settings'>('overview')
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const validSportId = selectedSportId && selectedSportId > 0 ? selectedSportId : null
  const validSessionId = selectedSessionId && selectedSessionId > 0 ? selectedSessionId : null

  // Modals
  const [createCaptainOpen, setCreateCaptainOpen] = useState(false)
  const [createSportOpen, setCreateSportOpen] = useState(false)
  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [resetPassDialog, setResetPassDialog] = useState<{ open: boolean; captain: Captain | null; newPass: string }>({
    open: false,
    captain: null,
    newPass: '',
  })

  const [deleteSportDialog, setDeleteSportDialog] = useState<{ open: boolean; sport: Sport | null }>({
    open: false,
    sport: null,
  })
  const [deleteCaptainDialog, setDeleteCaptainDialog] = useState<{ open: boolean; captain: Captain | null }>({
    open: false,
    captain: null,
  })

  const [assignDialog, setAssignDialog] = useState<{
    open: boolean
    captain: Captain | null
    sportId: number | null
  }>({
    open: false,
    captain: null,
    sportId: null,
  })

  // Forms
  const [captainForm, setCaptainForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
  })

  const [sportForm, setSportForm] = useState({
    name: '',
    description: '',
  })

  const [sessionForm, setSessionForm] = useState({
    sportId: '',
    title: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '09:00',
    notes: '',
  })

  // Search
  const [captainSearch, setCaptainSearch] = useState('')
  const [sportSearch, setSportSearch] = useState('')

  // Queries
  const { data: captains = [], isLoading: captainsLoading } = useCaptains()
  const { data: sports = [], isLoading: sportsLoading } = useSports()
  const { data: allSessions = [], isLoading: sessionsLoading } = useAllSessions()
  const { data: sportSessions = [] } = useSessions(validSportId ?? 0)
  const { data: players = [], isLoading: playersLoading } = usePlayers(validSportId ?? 0)
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendance(validSessionId ?? 0)

  // Mutations
  const createCaptain = useCreateCaptain()
  const resetPassword = useResetPassword()
  const toggleCaptain = useToggleCaptain()
  const deleteCaptain = useDeleteCaptain()
  const createSport = useCreateSport()
  const updateSport = useUpdateSport()
  const assignCaptainToSport = useAssignCaptainToSport()
  const deleteSport = useDeleteSport()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()

  useEffect(() => {
    if (sports.length > 0) {
      if (selectedSportId === null || !sports.some((s) => s.id === selectedSportId)) {
        setSelectedSportId(sports[0].id)
      }
    } else {
      setSelectedSportId(null)
    }
  }, [sports, selectedSportId])

  useEffect(() => {
    if (validSportId && sportSessions.length > 0) {
      if (validSessionId === null || !sportSessions.some((s) => s.id === validSessionId)) {
        setSelectedSessionId(sportSessions[0].id)
      }
    } else {
      setSelectedSessionId(null)
    }
  }, [sportSessions, validSessionId, validSportId])

  useEffect(() => {
    if (selectedSportId && !sessionForm.sportId) {
      setSessionForm((prev) => ({ ...prev, sportId: String(selectedSportId) }))
    }
  }, [selectedSportId, sessionForm.sportId])

  // Handlers
  const handleCreateCaptain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captainForm.username.trim() || !captainForm.password.trim() || !captainForm.fullName.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    try {
      await createCaptain.mutateAsync({
        username: captainForm.username.trim(),
        fullName: captainForm.fullName.trim(),
        email: captainForm.email.trim(),
        phone: captainForm.phone.trim(),
        role: 'ROLE_CAPTAIN',
        password: captainForm.password,
      } as any)
      toast.success(`Captain account for ${captainForm.fullName} created.`)
      setCreateCaptainOpen(false)
      setCaptainForm({ username: '', password: '', fullName: '', email: '', phone: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create captain.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPassDialog.captain || !resetPassDialog.newPass.trim()) return
    try {
      await resetPassword.mutateAsync({
        id: resetPassDialog.captain.id,
        newPassword: resetPassDialog.newPass.trim(),
      })
      toast.success(`Password reset for ${resetPassDialog.captain.fullName}.`)
      setResetPassDialog({ open: false, captain: null, newPass: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    }
  }

  const handleDeleteCaptain = async () => {
    if (!deleteCaptainDialog.captain) return
    try {
      await deleteCaptain.mutateAsync(deleteCaptainDialog.captain.id)
      toast.success(`Captain "${deleteCaptainDialog.captain.fullName}" removed.`)
      setDeleteCaptainDialog({ open: false, captain: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete captain.')
    }
  }

  const handleCreateSport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sportForm.name.trim()) {
      toast.error('Please enter sport name.')
      return
    }
    try {
      await createSport.mutateAsync({
        name: sportForm.name.trim(),
        description: sportForm.description.trim(),
        active: true,
      })
      toast.success(`Sport "${sportForm.name}" created successfully.`)
      setCreateSportOpen(false)
      setSportForm({ name: '', description: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create sport.')
    }
  }

  const handleDeleteSport = async () => {
    if (!deleteSportDialog.sport) return
    try {
      await deleteSport.mutateAsync(deleteSportDialog.sport.id)
      toast.success(`Sport "${deleteSportDialog.sport.name}" and its roster deleted.`)
      setDeleteSportDialog({ open: false, sport: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete sport.')
    }
  }

  const handleAssignSport = async () => {
    if (!assignDialog.captain || !assignDialog.sportId) {
      toast.error('Please select a sport.')
      return
    }
    try {
      await assignCaptainToSport.mutateAsync({
        sportId: assignDialog.sportId,
        captainId: assignDialog.captain.id,
      })
      const targetSport = sports.find((s) => s.id === assignDialog.sportId)
      toast.success(`Assigned ${assignDialog.captain.fullName} to ${targetSport?.name || 'Sport'}.`)
      setAssignDialog({ open: false, captain: null, sportId: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign captain to sport.')
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionForm.title.trim() || !sessionForm.sportId || !sessionForm.sessionDate) {
      toast.error('Please complete the required session fields.')
      return
    }

    try {
      const created = await createSession.mutateAsync({
        sportId: Number(sessionForm.sportId),
        data: {
          title: sessionForm.title.trim(),
          sessionDate: sessionForm.sessionDate,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          notes: sessionForm.notes.trim() || undefined,
          status: 'SCHEDULED',
        },
      })

      const createdId = (created as any)?.data?.id ?? (created as any)?.id
      if (createdId) {
        setSelectedSessionId(createdId)
      }
      setCreateSessionOpen(false)
      setSessionForm((prev) => ({
        ...prev,
        title: '',
        notes: '',
        sportId: prev.sportId || String(selectedSportId ?? ''),
      }))
      toast.success('Session created successfully.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create session.')
    }
  }

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteSession.mutateAsync(id)
      toast.success('Session deleted successfully.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete session.')
    }
  }

  if (captainsLoading || sportsLoading || sessionsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Manage sports programs, sessions and attendance.</p>
        </div>
        <LoadingSkeleton type="table" count={5} />
      </div>
    )
  }

  const filteredCaptains = captains.filter(
    (c) =>
      c.fullName.toLowerCase().includes(captainSearch.toLowerCase()) ||
      c.username.toLowerCase().includes(captainSearch.toLowerCase()) ||
      (c.sportName && c.sportName.toLowerCase().includes(captainSearch.toLowerCase()))
  )

  const filteredSports = sports.filter(
    (s) =>
      s.name.toLowerCase().includes(sportSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(sportSearch.toLowerCase()))
  )

  const attendanceMap = useMemo(() => {
    const map = new Map<number, string>()
    attendanceRecords.forEach((record) => {
      const playerId = record.playerId ?? record.player?.id
      if (playerId != null) {
        map.set(Number(playerId), record.status)
      }
    })
    return map
  }, [attendanceRecords])

  const attendanceSummary = useMemo(() => {
    const summary = { present: 0, absent: 0, late: 0, excused: 0 }
    attendanceRecords.forEach((record) => {
      const status = record.status
      if (status === 'PRESENT') summary.present += 1
      if (status === 'ABSENT') summary.absent += 1
      if (status === 'LATE') summary.late += 1
      if (status === 'EXCUSED') summary.excused += 1
    })
    return summary
  }, [attendanceRecords])

  const currentSport = sports.find((s) => s.id === selectedSportId) ?? sports[0] ?? null
  const currentSession = sportSessions.find((s) => s.id === selectedSessionId) ?? sportSessions[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            Manage sports disciplines, assign coaches, create sessions, and track attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'captains' && (
            <Button onClick={() => setCreateCaptainOpen(true)} className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5">
              <UserPlus className="h-4 w-4" />
              New Captain
            </Button>
          )}
          {activeTab === 'sports' && (
            <Button onClick={() => setCreateSportOpen(true)} className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5">
              <Plus className="h-4 w-4" />
              New Sport
            </Button>
          )}
          {activeTab === 'sessions' && (
            <Button onClick={() => setCreateSessionOpen(true)} className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5">
              <CalendarDays className="h-4 w-4" />
              New Session
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="bg-surface border border-border flex-wrap">
          <TabsTrigger value="overview" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sports" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <Trophy className="h-3.5 w-3.5" />
            Sports ({sports.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <CalendarDays className="h-3.5 w-3.5" />
            Sessions ({allSessions.length})
          </TabsTrigger>
          <TabsTrigger value="captains" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <Shield className="h-3.5 w-3.5" />
            Captains ({captains.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Sports</span>
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3 font-serif text-3xl text-brand-900">{sports.length}</div>
              <div className="text-xs text-slate-500">Active programs</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Captains</span>
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3 font-serif text-3xl text-brand-900">{captains.length}</div>
              <div className="text-xs text-slate-500">Coaches assigned</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Sessions</span>
                <CalendarDays className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3 font-serif text-3xl text-brand-900">{allSessions.length}</div>
              <div className="text-xs text-slate-500">Training records</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Athletes</span>
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3 font-serif text-3xl text-brand-900">{players.length || 0}</div>
              <div className="text-xs text-slate-500">In selected roster</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sports" className="mt-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <Input placeholder="Search sports programs…" value={sportSearch} onChange={(e) => setSportSearch(e.target.value)} className="max-w-sm text-xs font-sans" />
              <span className="text-xs font-mono text-slate-400">{filteredSports.length} of {sports.length} sports</span>
            </div>

            {filteredSports.length === 0 ? (
              <div className="p-12 text-center"><p className="text-slate-400 font-sans text-sm">No sports created yet.</p></div>
            ) : (
              <Table className="ledger-table">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-b border-border">
                    <TableHead className="font-serif text-brand-800">Sport Discipline</TableHead>
                    <TableHead className="font-serif text-brand-800">Description</TableHead>
                    <TableHead className="font-serif text-brand-800">Assigned Captain</TableHead>
                    <TableHead className="font-serif text-brand-800">Status</TableHead>
                    <TableHead className="text-right font-serif text-brand-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSports.map((sport) => {
                    const assignedCap = sport.captain
                    return (
                      <TableRow key={sport.id} className="hover:bg-surface/50">
                        <TableCell>
                          <div className="font-serif font-medium text-brand-900 flex items-center gap-2"><Activity className="h-4 w-4 text-accent" />{sport.name}</div>
                          <div className="text-xs font-mono text-slate-400">ID: {sport.id}</div>
                        </TableCell>
                        <TableCell className="font-sans text-xs text-slate-600 max-w-xs truncate">{sport.description || '—'}</TableCell>
                        <TableCell>
                          {assignedCap ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"><Shield className="h-3 w-3 text-emerald-600" />{assignedCap.fullName} (@{assignedCap.username})</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200">No Captain Assigned</span>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={sport.active ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                              if (captains.length > 0) {
                                setAssignDialog({ open: true, captain: assignedCap ? (captains.find((c) => c.id === assignedCap.id) || captains[0]) : captains[0], sportId: sport.id })
                              } else {
                                toast.error('Create a captain first.')
                              }
                            }}>Assign Coach</Button>
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => updateSport.mutate({ id: sport.id, data: { active: !sport.active } })}>{sport.active ? 'Deactivate' : 'Activate'}</Button>
                            <Button size="sm" variant="ghost" className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5" onClick={() => setDeleteSportDialog({ open: true, sport })} title="Delete Sport"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-brand-900">Select sport</h3>
              </div>
              <Select value={selectedSportId?.toString() ?? ''} onValueChange={(value) => setSelectedSportId(Number(value))}>
                <SelectTrigger className="w-full font-sans">
                  <SelectValue placeholder="Choose a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>{sport.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setCreateSessionOpen(true)} className="w-full bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Create Session
              </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-serif text-lg text-brand-900">{currentSport ? currentSport.name : 'No sport selected'} sessions</h3>
              </div>
              {sportSessions.length === 0 ? (
                <div className="p-12 text-center"><p className="text-slate-400 font-sans text-sm">No sessions created for this sport yet.</p></div>
              ) : (
                <Table className="ledger-table">
                  <TableHeader>
                    <TableRow className="bg-surface hover:bg-surface border-b border-border">
                      <TableHead className="font-serif text-brand-800">Session</TableHead>
                      <TableHead className="font-serif text-brand-800">Date</TableHead>
                      <TableHead className="font-serif text-brand-800">Time</TableHead>
                      <TableHead className="font-serif text-brand-800">Status</TableHead>
                      <TableHead className="text-right font-serif text-brand-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sportSessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-surface/50">
                        <TableCell>
                          <button type="button" className="font-serif font-medium text-brand-900 text-left" onClick={() => setSelectedSessionId(session.id)}>{session.title}</button>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{session.sessionDate}</TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{session.startTime || '—'} {session.endTime ? `- ${session.endTime}` : ''}</TableCell>
                        <TableCell><StatusBadge status={session.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5" onClick={() => handleDeleteSession(session.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="captains" className="mt-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <Input placeholder="Search captains by name or sport…" value={captainSearch} onChange={(e) => setCaptainSearch(e.target.value)} className="max-w-sm text-xs font-sans" />
              <span className="text-xs font-mono text-slate-400">{filteredCaptains.length} of {captains.length} captains</span>
            </div>

            {filteredCaptains.length === 0 ? (
              <div className="p-12 text-center"><p className="text-slate-400 font-sans text-sm">No captains found.</p></div>
            ) : (
              <Table className="ledger-table">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-b border-border">
                    <TableHead className="font-serif text-brand-800">Captain / Coach</TableHead>
                    <TableHead className="font-serif text-brand-800">Assigned Sport(s)</TableHead>
                    <TableHead className="font-serif text-brand-800">Contact</TableHead>
                    <TableHead className="font-serif text-brand-800">Status</TableHead>
                    <TableHead className="text-right font-serif text-brand-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCaptains.map((captain) => (
                    <TableRow key={captain.id} className="hover:bg-surface/50">
                      <TableCell>
                        <div className="font-serif font-medium text-brand-900">{captain.fullName}</div>
                        <div className="text-xs font-mono text-slate-400">@{captain.username}</div>
                      </TableCell>
                      <TableCell>
                        {captain.sportName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"><Trophy className="h-3 w-3 text-emerald-600" />{captain.sportName}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-xs text-slate-600"><div>{captain.email || '—'}</div><div className="font-mono text-slate-400">{captain.phone || '—'}</div></TableCell>
                      <TableCell><StatusBadge status={captain.enabled !== false ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAssignDialog({ open: true, captain, sportId: captain.sportId ?? sports[0]?.id ?? null })}>Assign Sport</Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-slate-500 hover:text-slate-700" onClick={() => setResetPassDialog({ open: true, captain, newPass: '' })}>Reset Password</Button>
                          <Button size="sm" variant="ghost" className={`text-xs h-7 ${captain.enabled !== false ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`} onClick={() => toggleCaptain.mutate(captain.id)}>{captain.enabled !== false ? 'Disable' : 'Enable'}</Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5" onClick={() => setDeleteCaptainDialog({ open: true, captain })} title="Delete Captain"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-brand-900">Sport + session</h3>
              </div>

              <Select value={selectedSportId?.toString() ?? ''} onValueChange={(value) => setSelectedSportId(Number(value))}>
                <SelectTrigger className="w-full font-sans"><SelectValue placeholder="Choose sport" /></SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>{sport.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSessionId?.toString() ?? ''} onValueChange={(value) => setSelectedSessionId(Number(value))}>
                <SelectTrigger className="w-full font-sans"><SelectValue placeholder="Choose session" /></SelectTrigger>
                <SelectContent>
                  {sportSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>{session.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded border border-border bg-surface p-2">PRESENT: <span className="font-semibold text-emerald-700">{attendanceSummary.present}</span></div>
                <div className="rounded border border-border bg-surface p-2">ABSENT: <span className="font-semibold text-red-700">{attendanceSummary.absent}</span></div>
                <div className="rounded border border-border bg-surface p-2">LATE: <span className="font-semibold text-amber-700">{attendanceSummary.late}</span></div>
                <div className="rounded border border-border bg-surface p-2">EXCUSED: <span className="font-semibold text-blue-700">{attendanceSummary.excused}</span></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-serif text-lg text-brand-900">{currentSession ? currentSession.title : 'No session selected'}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">{currentSport ? currentSport.name : 'No sport'} • {currentSession ? currentSession.sessionDate : '—'}</p>
              </div>

              {playersLoading || attendanceLoading ? (
                <div className="p-6"><LoadingSkeleton type="table" count={4} /></div>
              ) : !selectedSessionId || !selectedSportId ? (
                <div className="p-12 text-center"><p className="text-slate-400 font-sans text-sm">Select a sport and a session to view athlete attendance.</p></div>
              ) : (
                <Table className="ledger-table">
                  <TableHeader>
                    <TableRow className="bg-surface hover:bg-surface border-b border-border">
                      <TableHead className="font-serif text-brand-800">Athlete</TableHead>
                      <TableHead className="font-serif text-brand-800">Jersey</TableHead>
                      <TableHead className="font-serif text-brand-800">Position</TableHead>
                      <TableHead className="font-serif text-brand-800">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id} className="hover:bg-surface/50">
                        <TableCell>
                          <div className="font-serif font-medium text-brand-900">{player.fullName}</div>
                          <div className="text-xs text-slate-400">{player.email || 'No email'}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{player.jerseyNumber ?? '—'}</TableCell>
                        <TableCell className="font-sans text-sm text-slate-600">{player.position || '—'}</TableCell>
                        <TableCell><StatusBadge status={attendanceMap.get(player.id) ?? 'NOT MARKED'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* CREATE CAPTAIN DIALOG */}
      <Dialog open={createCaptainOpen} onOpenChange={setCreateCaptainOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateCaptain}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                Create Captain Account
              </DialogTitle>
              <DialogDescription>
                Register a new coach or captain. You can assign them to a sport program immediately after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Coach David Miller"
                  value={captainForm.fullName}
                  onChange={(e) => setCaptainForm({ ...captainForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-xs font-sans text-slate-700">Username *</Label>
                  <Input
                    id="username"
                    placeholder="e.g. coach_david"
                    value={captainForm.username}
                    onChange={(e) => setCaptainForm({ ...captainForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-sans text-slate-700">Initial Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Temporary pass"
                    value={captainForm.password}
                    onChange={(e) => setCaptainForm({ ...captainForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-sans text-slate-700">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="david@example.com"
                    value={captainForm.email}
                    onChange={(e) => setCaptainForm({ ...captainForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-sans text-slate-700">Phone (optional)</Label>
                  <Input
                    id="phone"
                    placeholder="07xxxxxxxx"
                    value={captainForm.phone}
                    onChange={(e) => setCaptainForm({ ...captainForm, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateCaptainOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE SPORT DIALOG */}
      <Dialog open={createSportOpen} onOpenChange={setCreateSportOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateSport}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Add Sport Program
              </DialogTitle>
              <DialogDescription>
                Add a new sport discipline (e.g. Football, Basketball, Cricket, Athletics).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="sportName" className="text-xs font-sans text-slate-700">Sport Name *</Label>
                <Input
                  id="sportName"
                  placeholder="e.g. Athletics"
                  value={sportForm.name}
                  onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sportDescription" className="text-xs font-sans text-slate-700">Description</Label>
                <Input
                  id="sportDescription"
                  placeholder="e.g. Track & field conditioning"
                  value={sportForm.description}
                  onChange={(e) => setSportForm({ ...sportForm, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateSportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                Create Sport
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE SESSION DIALOG */}
      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateSession}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent" />
                Create Training Session
              </DialogTitle>
              <DialogDescription>
                Add a new session for the selected sport and start tracking attendance immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="sessionSport" className="text-xs font-sans text-slate-700">Sport *</Label>
                <Select
                  value={sessionForm.sportId}
                  onValueChange={(value) => setSessionForm((prev) => ({ ...prev, sportId: value }))}
                >
                  <SelectTrigger id="sessionSport" className="font-sans">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id.toString()}>{sport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sessionTitle" className="text-xs font-sans text-slate-700">Session Title *</Label>
                <Input
                  id="sessionTitle"
                  placeholder="e.g. Football Training"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sessionDate" className="text-xs font-sans text-slate-700">Date *</Label>
                  <Input
                    id="sessionDate"
                    type="date"
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans text-slate-700">Status</Label>
                  <div className="flex items-center h-10 rounded-md border border-input bg-background px-3 text-xs text-slate-600">
                    SCHEDULED
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sessionStart" className="text-xs font-sans text-slate-700">Start Time</Label>
                  <Input
                    id="sessionStart"
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sessionEnd" className="text-xs font-sans text-slate-700">End Time</Label>
                  <Input
                    id="sessionEnd"
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sessionNotes" className="text-xs font-sans text-slate-700">Notes</Label>
                <Input
                  id="sessionNotes"
                  placeholder="Optional training notes"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, notes: e.target.value }))}
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

      {/* ASSIGN CAPTAIN TO SPORT DIALOG */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Assign Captain to Sport
            </DialogTitle>
            <DialogDescription>
              Assign <strong>{assignDialog.captain?.fullName}</strong> to manage a sport program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans text-slate-700">Select Sport</Label>
              <Select
                value={assignDialog.sportId?.toString() ?? ''}
                onValueChange={(val) => setAssignDialog((prev) => ({ ...prev, sportId: Number(val) }))}
              >
                <SelectTrigger className="font-sans">
                  <SelectValue placeholder="Choose a sport program…" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name} {sport.captain ? `(Coach: ${sport.captain.fullName})` : '(No coach)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignDialog({ open: false, captain: null, sportId: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignSport}
              className="bg-accent hover:bg-accent-light text-white font-sans text-xs"
            >
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={resetPassDialog.open} onOpenChange={(open) => setResetPassDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="font-serif">Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for <strong>{resetPassDialog.captain?.fullName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-1">
              <Label htmlFor="newPass" className="text-xs font-sans text-slate-700">New Password</Label>
              <Input
                id="newPass"
                type="password"
                placeholder="New strong password"
                value={resetPassDialog.newPass}
                onChange={(e) => setResetPassDialog({ ...resetPassDialog, newPass: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPassDialog({ open: false, captain: null, newPass: '' })}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE SPORT CONFIRMATION */}
      <Dialog open={deleteSportDialog.open} onOpenChange={(open) => setDeleteSportDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Sport Program?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteSportDialog.sport?.name}</strong>? This will also remove all its registered athletes, training sessions, and attendance history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteSportDialog({ open: false, sport: null })}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteSport}
              className="bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs"
            >
              Delete Sport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CAPTAIN CONFIRMATION */}
      <Dialog open={deleteCaptainDialog.open} onOpenChange={(open) => setDeleteCaptainDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Captain Account?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteCaptainDialog.captain?.fullName}</strong>? Their login access will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteCaptainDialog({ open: false, captain: null })}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCaptain}
              className="bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs"
            >
              Delete Captain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}