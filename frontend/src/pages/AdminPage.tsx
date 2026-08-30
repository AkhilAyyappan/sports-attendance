import { useState } from 'react'
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
  useRemoveCaptainFromSport,
  useDeleteSport,
  useCaptains,
  useCreateCaptain,
  useResetPassword,
  useToggleCaptain,
  useDeleteCaptain,
} from '@/hooks'
import { UserPlus, Shield, Plus, Trophy, Activity, Trash2, Crown, UserX, Pencil } from 'lucide-react'
import { type Captain, type Sport, type CaptainLite, type Player } from '@/types'
import { usePromotePlayerToCaptain, useDemoteCaptain, useUpdateCaptain, useUpdatePlayer, usePlayers, useAllPlayers } from '@/hooks'

const MAX_CAPTAINS_PER_SPORT = 3

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'captains' | 'sports'>('captains')

  // Modals
  const [createCaptainOpen, setCreateCaptainOpen] = useState(false)
  const [promotePlayerDialog, setPromotePlayerDialog] = useState<{ open: boolean }>({ open: false })
  const [promotePlayerSelectedSport, setPromotePlayerSelectedSport] = useState<number | null>(null)
  const [promotePlayerSearch, setPromotePlayerSearch] = useState('')
  const [createSportOpen, setCreateSportOpen] = useState(false)
  const [resetPassDialog, setResetPassDialog] = useState<{ open: boolean; captain: Captain | null; newPass: string }>({
    open: false,
    captain: null,
    newPass: '',
  })

  // Delete dialogs
  const [deleteSportDialog, setDeleteSportDialog] = useState<{ open: boolean; sport: Sport | null }>({
    open: false,
    sport: null,
  })
  const [deleteCaptainDialog, setDeleteCaptainDialog] = useState<{ open: boolean; captain: Captain | null }>({
    open: false,
    captain: null,
  })

  // Edit captain dialog
  const [editCaptainDialog, setEditCaptainDialog] = useState<{ open: boolean; captain: Captain | null }>({
    open: false,
    captain: null,
  })
  const [editCaptainForm, setEditCaptainForm] = useState({ fullName: '', email: '', phone: '' })

  // Edit player dialog
  const [editPlayerDialog, setEditPlayerDialog] = useState<{ open: boolean; player: Player | null; sportId: number | null }>({
    open: false,
    player: null,
    sportId: null,
  })
  const [editPlayerForm, setEditPlayerForm] = useState({
    fullName: '',
    dateOfBirth: '',
    jerseyNumber: '',
    position: '',
    phone: '',
    email: '',
    notes: '',
  })

  // Assign Captain to Sport modal
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

  // Search
  const [captainSearch, setCaptainSearch] = useState('')
  const [sportSearch, setSportSearch] = useState('')

  // Queries
  const { data: captains = [], isLoading: captainsLoading } = useCaptains()
  const { data: sports = [], isLoading: sportsLoading } = useSports()
  const { data: allPlayers = [] } = useAllPlayers()

  // Mutations
  const createCaptain = useCreateCaptain()
  const resetPassword = useResetPassword()
  const toggleCaptain = useToggleCaptain()
  const deleteCaptain = useDeleteCaptain()
  const updateCaptain = useUpdateCaptain()
  const updatePlayer = useUpdatePlayer()
  const createSport = useCreateSport()
  const updateSport = useUpdateSport()
  const assignCaptainToSport = useAssignCaptainToSport()
  const removeCaptainFromSport = useRemoveCaptainFromSport()
  const deleteSport = useDeleteSport()
  const promoteToCaptain = usePromotePlayerToCaptain()
  const demoteCaptain = useDemoteCaptain()

  // Collect emails of all existing captains for quick lookup
  const captainEmails = new Set(captains.map((c) => c.username))
  const isPlayerAlreadyCaptain = (player: Player) =>
    !!player.email && captainEmails.has(player.email)

  // Filter players for the promote dialog (by selected sport + search)
  const filteredPromotePlayers = allPlayers.filter((p) => {
    const matchesSport = promotePlayerSelectedSport === null || p.sportId === promotePlayerSelectedSport
    const matchesSearch =
      !promotePlayerSearch ||
      p.fullName.toLowerCase().includes(promotePlayerSearch.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(promotePlayerSearch.toLowerCase()))
    return matchesSport && matchesSearch
  })


  // Expanded player sections per sport
  const [expandedSports, setExpandedSports] = useState<Set<number>>(new Set())
  const [promoteResult, setPromoteResult] = useState<{ playerId: number; result: any } | null>(null)

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

  // Open edit captain dialog with pre-filled form
  const openEditCaptain = (captain: Captain) => {
    setEditCaptainForm({ fullName: captain.fullName, email: captain.email ?? '', phone: captain.phone ?? '' })
    setEditCaptainDialog({ open: true, captain })
  }

  const handleUpdateCaptain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCaptainDialog.captain || !editCaptainForm.fullName.trim()) return
    try {
      await updateCaptain.mutateAsync({
        id: editCaptainDialog.captain.id,
        data: {
          fullName: editCaptainForm.fullName.trim(),
          email: editCaptainForm.email.trim() || undefined,
          phone: editCaptainForm.phone.trim() || undefined,
        },
      })
      toast.success(`Updated ${editCaptainDialog.captain.fullName}.`)
      setEditCaptainDialog({ open: false, captain: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update captain.')
    }
  }

  // Open edit player dialog with pre-filled form
  const openEditPlayer = (player: Player, sportId: number) => {
    setEditPlayerForm({
      fullName: player.fullName,
      dateOfBirth: player.dateOfBirth ?? '',
      jerseyNumber: player.jerseyNumber?.toString() ?? '',
      position: player.position ?? '',
      phone: player.phone ?? '',
      email: player.email ?? '',
      notes: player.notes ?? '',
    })
    setEditPlayerDialog({ open: true, player, sportId })
  }

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPlayerDialog.player) return
    try {
      await updatePlayer.mutateAsync({
        id: editPlayerDialog.player.id,
        data: {
          fullName: editPlayerForm.fullName.trim(),
          dateOfBirth: editPlayerForm.dateOfBirth || undefined,
          jerseyNumber: editPlayerForm.jerseyNumber ? parseInt(editPlayerForm.jerseyNumber, 10) : undefined,
          position: editPlayerForm.position.trim() || undefined,
          phone: editPlayerForm.phone.trim() || undefined,
          email: editPlayerForm.email.trim() || undefined,
          notes: editPlayerForm.notes.trim() || undefined,
        },
      })
      toast.success(`Updated ${editPlayerDialog.player.fullName}.`)
      setEditPlayerDialog({ open: false, player: null, sportId: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update player.')
    }
  }

  // Remove a captain from a sport
  const handleRemoveCaptain = async (sportId: number, captainId: number, captainName: string) => {
    try {
      await removeCaptainFromSport.mutateAsync({ sportId, captainId })
      toast.success(`Removed ${captainName} from sport.`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove captain.')
    }
  }

  // Toggle player expansion for a sport
  const toggleExpandSport = (sportId: number) => {
    setExpandedSports((prev) => {
      const next = new Set(prev)
      if (next.has(sportId)) next.delete(sportId)
      else next.add(sportId)
      return next
    })
  }

  // Promote a player to captain
  const handlePromotePlayer = async (sportId: number, player: Player) => {
    try {
      const result = await promoteToCaptain.mutateAsync({ sportId, playerId: player.id })
      setPromoteResult({ playerId: player.id, result })
      if (result.temporaryPassword) {
        toast.success(`"${player.fullName}" promoted to captain. Temporary password: ${result.temporaryPassword}`)
      } else {
        toast.success(`"${player.fullName}" is now a captain.`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to promote player.')
    }
  }

  // Promote a selected player to captain (from "New Captain" dialog)
  const handlePromotePlayerFromDialog = async (player: Player) => {
    if (!player.sportId) {
      toast.error('Player has no sport assigned.')
      return
    }
    try {
      const result = await promoteToCaptain.mutateAsync({ sportId: player.sportId, playerId: player.id })
      setPromotePlayerDialog({ open: false })
      if (result.temporaryPassword) {
        toast.success(`"${player.fullName}" promoted to captain. Temporary password: ${result.temporaryPassword}`)
      } else {
        toast.success(`"${player.fullName}" is now a captain.`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to promote player.')
    }
  }

  // Demote a player from captain
  const handleDemotePlayer = async (sportId: number, player: Player) => {
    try {
      await demoteCaptain.mutateAsync({ sportId, playerId: player.id })
      toast.success(`"${player.fullName}" removed as captain.`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to demote player.')
    }
  }

  if (captainsLoading || sportsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Manage sports programs and captains</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            Manage sports disciplines, assign coaches & captains, and configure programs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'captains' && (
            <div className="flex gap-2">
              <Button
                onClick={() => setPromotePlayerDialog({ open: true })}
                className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5"
              >
                <Crown className="h-4 w-4" />
                Promote Player to Captain
              </Button>
              <Button
                onClick={() => setCreateCaptainOpen(true)}
                variant="outline"
                className="font-sans text-xs gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                New Captain Account
              </Button>
            </div>
          )}
          {activeTab === 'sports' && (
            <Button
              onClick={() => setCreateSportOpen(true)}
              className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New Sport
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="bg-surface border border-border">
          <TabsTrigger value="captains" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <Shield className="h-3.5 w-3.5" />
            Captains & Coaches ({captains.length})
          </TabsTrigger>
          <TabsTrigger value="sports" className="font-sans text-xs gap-1.5 data-[state=active]:bg-card">
            <Trophy className="h-3.5 w-3.5" />
            Sports Programs ({sports.length})
          </TabsTrigger>
        </TabsList>

        {/* CAPTAINS TAB */}
        <TabsContent value="captains" className="mt-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <Input
                placeholder="Search captains by name or sport…"
                value={captainSearch}
                onChange={(e) => setCaptainSearch(e.target.value)}
                className="max-w-sm text-xs font-sans"
              />
              <span className="text-xs font-mono text-slate-400">
                {filteredCaptains.length} of {captains.length} captains
              </span>
            </div>

            {filteredCaptains.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-sans text-sm">No captains found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="ledger-table w-max">
                  <TableHeader>
                    <TableRow className="bg-surface hover:bg-surface border-b border-border">
                      <TableHead className="font-serif text-brand-800 min-w-[140px]">Captain / Coach</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[120px]">Assigned Sport(s)</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[130px]">Contact</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[80px]">Status</TableHead>
                      <TableHead className="font-serif text-brand-800 text-right min-w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCaptains.map((captain) => {
                      const isAssigned = !!captain.sportName
                      return (
                        <TableRow key={captain.id} className="hover:bg-surface/50">
                          <TableCell>
                            <div className="font-serif font-medium text-brand-900">{captain.fullName}</div>
                            <div className="text-xs font-mono text-slate-400">@{captain.username}</div>
                          </TableCell>
                          <TableCell>
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Trophy className="h-3 w-3 text-emerald-600" />
                                {captain.sportName}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200">
                                Unassigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-sans text-xs text-slate-600">
                            <div>{captain.email || '—'}</div>
                            <div className="font-mono text-slate-400">{captain.phone || '—'}</div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={captain.enabled !== false ? 'ACTIVE' : 'INACTIVE'} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 w-full sm:w-auto"
                                onClick={() => {
                                  setAssignDialog({
                                    open: true,
                                    captain,
                                    sportId: captain.sportId ?? sports[0]?.id ?? null,
                                  })
                                }}
                              >
                                Assign Sport
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 text-slate-500 hover:text-slate-700 w-full sm:w-auto"
                                onClick={() => openEditCaptain(captain)}
                              >
                                <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 text-slate-500 hover:text-slate-700 w-full sm:w-auto"
                                onClick={() => setResetPassDialog({ open: true, captain, newPass: '' })}
                              >
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`text-xs h-7 w-full sm:w-auto ${
                                  captain.enabled !== false ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                                onClick={() => toggleCaptain.mutate(captain.id)}
                              >
                                {captain.enabled !== false ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 w-full sm:w-auto"
                                onClick={() => setDeleteCaptainDialog({ open: true, captain })}
                                title="Delete Captain"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SPORTS TAB */}
        <TabsContent value="sports" className="mt-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <Input
                placeholder="Search sports programs…"
                value={sportSearch}
                onChange={(e) => setSportSearch(e.target.value)}
                className="max-w-sm text-xs font-sans"
              />
              <span className="text-xs font-mono text-slate-400">
                {filteredSports.length} of {sports.length} sports
              </span>
            </div>

            {filteredSports.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-sans text-sm">No sports created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="ledger-table w-max">
                  <TableHeader>
                    <TableRow className="bg-surface hover:bg-surface border-b border-border">
                      <TableHead className="font-serif text-brand-800 min-w-[140px]">Sport Discipline</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[140px]">Description</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[160px]">Captains / Admins</TableHead>
                      <TableHead className="font-serif text-brand-800 min-w-[80px]">Status</TableHead>
                      <TableHead className="font-serif text-brand-800 text-right min-w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSports.map((sport) => {
                      const assignedCap = sport.captain
                      const sportCaptains: CaptainLite[] = (sport as any).captains ?? []
                      const isExpanded = expandedSports.has(sport.id)
                      return (
                        <>
                          <TableRow key={sport.id} className="hover:bg-surface/50">
                            <TableCell>
                              <div className="font-serif font-medium text-brand-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-accent" />
                                {sport.name}
                              </div>
                              <div className="text-xs font-mono text-slate-400">ID: {sport.id}</div>
                            </TableCell>
                            <TableCell className="font-sans text-xs text-slate-600 max-w-xs truncate">
                              {sport.description || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                {sportCaptains.length > 0 ? (
                                  sportCaptains.map((cap) => (
                                    <div key={cap.id} className="inline-flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        <Shield className="h-3 w-3 text-emerald-600" />
                                        {cap.fullName}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 text-slate-400 hover:text-rose-500"
                                        onClick={() => handleRemoveCaptain(sport.id, cap.id, cap.fullName)}
                                        title="Remove admin from sport"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))
                                ) : assignedCap ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Shield className="h-3 w-3 text-emerald-600" />
                                    {assignedCap.fullName}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-500 border border-slate-200">
                                    No admins
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2 mt-0.5"
                                  disabled={sportCaptains.length >= 3 || captains.length === 0}
                                  onClick={() => {
                                    const alreadyIds = new Set(sportCaptains.map((c) => c.id))
                                    const nextCap = captains.find((c) => !alreadyIds.has(c.id)) ?? captains[0]
                                    setAssignDialog({ open: true, captain: nextCap, sportId: sport.id })
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {sportCaptains.length >= 3 ? 'Full' : 'Add Admin'}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={sport.active ? 'ACTIVE' : 'INACTIVE'} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 w-full sm:w-auto"
                                  disabled={sportCaptains.length >= 3 || captains.length === 0}
                                  onClick={() => {
                                    if (captains.length === 0) {
                                      toast.error('Create a captain first.')
                                      return
                                    }
                                    const alreadyIds = new Set(sportCaptains.map((c) => c.id))
                                    const nextCap = captains.find((c) => !alreadyIds.has(c.id)) ?? captains[0]
                                    setAssignDialog({ open: true, captain: nextCap, sportId: sport.id })
                                  }}
                                >
                                  {sportCaptains.length >= 3 ? 'Full' : 'Assign Coach'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7 w-full sm:w-auto"
                                  onClick={() =>
                                    updateSport.mutate({
                                      id: sport.id,
                                      data: { active: !sport.active },
                                    })
                                  }
                                >
                                  {sport.active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 w-full sm:w-auto"
                                  onClick={() => setDeleteSportDialog({ open: true, sport })}
                                  title="Delete Sport"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7 w-full sm:w-auto"
                                  onClick={() => toggleExpandSport(sport.id)}
                                  title={isExpanded ? 'Collapse players' : 'Show players'}
                                >
                                  <Plus className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                                  <span className="hidden sm:inline">{isExpanded ? 'Hide Players' : 'Show Players'}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-surface/30">
                              <TableCell colSpan={5} className="p-0">
                                <SportPlayersSection
                                  sportId={sport.id}
                                  sportName={sport.name}
                                  sportCaptains={sportCaptains}
                                  onPromote={handlePromotePlayer}
                                  onDemote={handleDemotePlayer}
                                  onEditPlayer={openEditPlayer}
                                  promotePending={promoteToCaptain.isPending}
                                  demotePending={demoteCaptain.isPending}
                                  promoteResult={promoteResult}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE CAPTAIN DIALOG */}
      <Dialog open={createCaptainOpen} onOpenChange={setCreateCaptainOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
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
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
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

      {/* ADD ADMIN DIALOG */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Add Admin
            </DialogTitle>
            <DialogDescription>
              Pick a sport, then choose a captain to add. Up to 3 admins per sport.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            {/* Step 1 — choose sport */}
            <div className="space-y-1.5">
              <Label className="text-xs font-sans text-slate-700">Sport</Label>
              <Select
                value={assignDialog.sportId?.toString() ?? ''}
                onValueChange={(val) =>
                  setAssignDialog((prev) => ({ ...prev, sportId: Number(val), captain: null }))
                }
              >
                <SelectTrigger className="font-sans">
                  <SelectValue placeholder="Choose a sport…" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2 — show current captains + available captains for selected sport */}
            {assignDialog.sportId && (() => {
              const sport = sports.find((s) => s.id === assignDialog.sportId)
              const sportCaptainIds = new Set((sport?.captains ?? []).map((c: any) => c.id))
              const assigned = captains.filter((c) => sportCaptainIds.has(c.id))
              const available = captains.filter((c) => !sportCaptainIds.has(c.id))
              const remaining = MAX_CAPTAINS_PER_SPORT - sportCaptainIds.size
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-sans text-slate-700">
                      Captains for {sport?.name}
                    </Label>
                    <span className={`text-[11px] font-medium ${remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {sportCaptainIds.size} / {MAX_CAPTAINS_PER_SPORT} · {remaining} slot{remaining !== 1 ? 's' : ''} left
                    </span>
                  </div>

                  {/* Already-assigned captains */}
                  {assigned.length > 0 && (
                    <div className="space-y-1">
                      {assigned.map((cap) => (
                        <div key={cap.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-100">
                          <span className="text-xs font-medium text-emerald-800 flex-1 truncate">{cap.fullName}</span>
                          <span className="text-[10px] text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded">Admin</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available captains to pick from */}
                  {available.length > 0 ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-sans text-slate-500">Select a captain to add</Label>
                      <Select
                        value={assignDialog.captain?.id?.toString() ?? ''}
                        onValueChange={(val) =>
                          setAssignDialog((prev) => ({
                            ...prev,
                            captain: captains.find((c) => c.id.toString() === val) ?? null,
                          }))
                        }
                      >
                        <SelectTrigger className="font-sans">
                          <SelectValue placeholder="Choose a captain…" />
                        </SelectTrigger>
                        <SelectContent>
                          {available.map((cap) => (
                            <SelectItem key={cap.id} value={cap.id.toString()}>
                              <span className="flex items-center gap-2">
                                {cap.fullName}
                                <span className="text-xs text-slate-400 font-mono">(@{cap.username})</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No other captains available.</p>
                  )}
                </div>
              )
            })()}
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
              disabled={!assignDialog.captain || !assignDialog.sportId || assignCaptainToSport.isPending}
              onClick={handleAssignSport}
              className="bg-accent hover:bg-accent-light text-white font-sans text-xs"
            >
              {assignCaptainToSport.isPending ? 'Adding…' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={resetPassDialog.open} onOpenChange={(open) => setResetPassDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
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
        <DialogContent className="max-w-sm w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
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
        <DialogContent className="max-w-sm w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
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

      {/* EDIT CAPTAIN DIALOG */}
      <Dialog open={editCaptainDialog.open} onOpenChange={(open) => {
        if (!open) setEditCaptainDialog({ open: false, captain: null })
      }}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleUpdateCaptain}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Pencil className="h-5 w-5 text-accent" />
                Edit Captain
              </DialogTitle>
              <DialogDescription>
                Update the details for <strong>{editCaptainDialog.captain?.fullName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="editCaptainFullName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="editCaptainFullName"
                  value={editCaptainForm.fullName}
                  onChange={(e) => setEditCaptainForm({ ...editCaptainForm, fullName: e.target.value })}
                  required
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editCaptainEmail" className="text-xs font-sans text-slate-700">Email</Label>
                  <Input
                    id="editCaptainEmail"
                    type="email"
                    value={editCaptainForm.email}
                    onChange={(e) => setEditCaptainForm({ ...editCaptainForm, email: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editCaptainPhone" className="text-xs font-sans text-slate-700">Phone</Label>
                  <Input
                    id="editCaptainPhone"
                    value={editCaptainForm.phone}
                    onChange={(e) => setEditCaptainForm({ ...editCaptainForm, phone: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCaptainDialog({ open: false, captain: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCaptain.isPending} className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                {updateCaptain.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PLAYER DIALOG */}
      <Dialog open={editPlayerDialog.open} onOpenChange={(open) => {
        if (!open) setEditPlayerDialog({ open: false, player: null, sportId: null })
      }}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleUpdatePlayer}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Pencil className="h-5 w-5 text-accent" />
                Edit Player
              </DialogTitle>
              <DialogDescription>
                Update the details for <strong>{editPlayerDialog.player?.fullName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="editPlayerFullName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="editPlayerFullName"
                  value={editPlayerForm.fullName}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, fullName: e.target.value })}
                  required
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editPlayerDob" className="text-xs font-sans text-slate-700">Date of Birth</Label>
                  <Input
                    id="editPlayerDob"
                    type="date"
                    value={editPlayerForm.dateOfBirth}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, dateOfBirth: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editPlayerJersey" className="text-xs font-sans text-slate-700">Jersey Number</Label>
                  <Input
                    id="editPlayerJersey"
                    type="number"
                    value={editPlayerForm.jerseyNumber}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, jerseyNumber: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editPlayerPosition" className="text-xs font-sans text-slate-700">Position</Label>
                  <Input
                    id="editPlayerPosition"
                    value={editPlayerForm.position}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, position: e.target.value })}
                    placeholder="e.g. Striker, Bowler"
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editPlayerPhone" className="text-xs font-sans text-slate-700">Phone</Label>
                  <Input
                    id="editPlayerPhone"
                    value={editPlayerForm.phone}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, phone: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editPlayerEmail" className="text-xs font-sans text-slate-700">Email</Label>
                <Input
                  id="editPlayerEmail"
                  type="email"
                  value={editPlayerForm.email}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, email: e.target.value })}
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editPlayerNotes" className="text-xs font-sans text-slate-700">Notes</Label>
                <Input
                  id="editPlayerNotes"
                  value={editPlayerForm.notes}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, notes: e.target.value })}
                  placeholder="Any additional notes…"
                  className="h-8 text-xs font-sans"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPlayerDialog({ open: false, player: null, sportId: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlayer.isPending} className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                {updatePlayer.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PROMOTE PLAYER TO CAPTAIN DIALOG */}
      <Dialog open={promotePlayerDialog.open} onOpenChange={(open) => {
        if (!open) { setPromotePlayerDialog({ open: false }); setPromotePlayerSelectedSport(null); setPromotePlayerSearch('') }
      }}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Promote Player to Captain
            </DialogTitle>
            <DialogDescription>
              Step 1: pick a sport. Step 2: promote a player from that team.
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 — choose sport */}
          <div className="space-y-1.5 mb-4">
            <Label className="text-xs font-sans text-slate-700">Choose a sport</Label>
            <Select
              value={promotePlayerSelectedSport?.toString() ?? ''}
              onValueChange={(v) => setPromotePlayerSelectedSport(Number(v))}
            >
              <SelectTrigger className="font-sans">
                <SelectValue placeholder="Select a sport…" />
              </SelectTrigger>
              <SelectContent>
                {(sports || []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2 — players list (shown only after sport is selected) */}
          {promotePlayerSelectedSport && (() => {
            const selectedSport = sports?.find((s) => s.id === promotePlayerSelectedSport)
            const currentCount = selectedSport?.captains?.length ?? 0
            const remaining = MAX_CAPTAINS_PER_SPORT - currentCount
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    Players in {selectedSport?.name}
                    <span className="ml-2 font-mono text-[11px]">
                      <span className={remaining > 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {currentCount}/{MAX_CAPTAINS_PER_SPORT} captains
                      </span>
                    </span>
                  </span>
                  <Input
                    placeholder="Search…"
                    value={promotePlayerSearch}
                    onChange={(e) => setPromotePlayerSearch(e.target.value)}
                    className="h-7 text-xs w-40"
                  />
                </div>
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {filteredPromotePlayers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      {promotePlayerSearch ? 'No players match your search.' : 'No players in this sport yet.'}
                    </p>
                  ) : filteredPromotePlayers.map((player) => {
                    const alreadyCaptain = isPlayerAlreadyCaptain(player)
                    const canPromote = !alreadyCaptain && remaining > 0
                    return (
                      <div key={player.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 border border-slate-100">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {player.jerseyNumber && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-accent text-white text-[10px] font-bold flex-shrink-0">
                                {player.jerseyNumber}
                              </span>
                            )}
                            <span className="font-medium text-xs text-slate-800 truncate">{player.fullName}</span>
                            {alreadyCaptain && (
                              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">
                                Already captain
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{player.position || '—'}</span>
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-muted-foreground">Jersey #{player.jerseyNumber || '—'}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={!canPromote || promoteToCaptain.isPending}
                          onClick={() => handlePromotePlayerFromDialog(player)}
                          className="h-7 px-2 text-xs font-sans shrink-0"
                        >
                          {alreadyCaptain ? '—' : promoteToCaptain.isPending ? '…' : 'Promote'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPromotePlayerDialog({ open: false })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

interface SportPlayersSectionProps {
  sportId: number
  sportName: string
  sportCaptains: CaptainLite[]
  onPromote: (sportId: number, player: Player) => void
  onDemote: (sportId: number, player: Player) => void
  onEditPlayer: (player: Player, sportId: number) => void
  promotePending: boolean
  demotePending: boolean
  promoteResult: { playerId: number; result: any } | null
}

function SportPlayersSection({
  sportId,
  sportName,
  sportCaptains,
  onPromote,
  onDemote,
  onEditPlayer,
  promotePending,
  demotePending,
  promoteResult,
}: SportPlayersSectionProps) {
  const { data: players = [], isLoading: playersLoading } = usePlayers(sportId)
  const captainIds = new Set(sportCaptains.map((c) => c.id))

  return (
    <div className="p-3 sm:p-4 border-t border-dashed border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
        <span className="text-xs font-serif font-semibold text-brand-700 uppercase tracking-wide">
          Players ({players.length}) — {sportName}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Promote any player to captain · Max 3 captains per sport
        </span>
      </div>
      {playersLoading ? (
        <p className="text-xs text-slate-400 font-sans">Loading players…</p>
      ) : players.length === 0 ? (
        <p className="text-xs text-slate-400 font-sans italic">No players added yet.</p>
      ) : (
        <div className="space-y-1.5">
          {players.map((player: Player) => {
            const isCaptain = captainIds.has(player.id)
            return (
              <div
                key={player.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 rounded bg-card border border-border"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isCaptain && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-brand-900 truncate">{player.fullName}</div>
                    <div className="text-xs font-mono text-slate-400">
                      {player.jerseyNumber != null && (
                        <span className="mr-2">#{player.jerseyNumber}</span>
                      )}
                      {player.position ? `${player.position}` : ''}
                      {player.email ? ` · ${player.email}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-slate-600 shrink-0"
                    onClick={() => onEditPlayer(player, sportId)}
                    title="Edit player details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {isCaptain ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 shrink-0"
                      onClick={() => onDemote(sportId, player)}
                      disabled={demotePending}
                    >
                      <UserX className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Demote</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 shrink-0"
                      onClick={() => onPromote(sportId, player)}
                      disabled={sportCaptains.length >= 3 || promotePending}
                    >
                      <Crown className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">
                        {promotePending ? 'Promoting…' : 'Promote'}
                      </span>
                      <span className="sm:hidden">{promotePending ? '…' : 'Promote'}</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {promoteResult && promoteResult.playerId && (
        <div className="mt-3 p-3 rounded bg-amber-50 border border-amber-200">
          <p className="text-xs font-medium text-amber-800">Temporary Password</p>
          <p className="text-sm font-mono text-amber-900 mt-0.5">
            {promoteResult.result.temporaryPassword}
          </p>
          <p className="text-xs text-amber-700 mt-1">{promoteResult.result.passwordNote}</p>
        </div>
      )}
    </div>
  )
}