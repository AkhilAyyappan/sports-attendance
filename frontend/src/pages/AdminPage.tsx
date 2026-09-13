import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { PlayerProfileSheet } from '@/components/shared/PlayerProfileSheet'
import { PromoteCaptainModal } from '@/components/shared/PromoteCaptainModal'
import { toast } from 'sonner'
import {
  useSports,
  useCreateSport,
  useUpdateSport,
  useDeleteSport,
  useUpdatePlayer,
  useDemoteCaptain,
  usePlayers,
} from '@/hooks'
import { Plus, Trophy, Activity, Trash2, Pencil, Crown, Users, UserX, UserPlus } from 'lucide-react'
import { type Sport, type CaptainLite, type Player } from '@/types'

export default function AdminPage() {
  // Modal state
  const [createSportOpen, setCreateSportOpen] = useState(false)
  const [deleteSportDialog, setDeleteSportDialog] = useState<{ open: boolean; sport: Sport | null }>({
    open: false,
    sport: null,
  })
  const [editSportDialog, setEditSportDialog] = useState<{ open: boolean; sport: Sport | null }>({
    open: false,
    sport: null,
  })
  const [editSportForm, setEditSportForm] = useState({ name: '', description: '', active: true })
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; sportId: number | null }>({
    open: false,
    sportId: null,
  })
  const [viewProfile, setViewProfile] = useState<{ player: Player; sportId: number; sportName: string } | null>(null)

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
    department: '',
    notes: '',
    sportIds: [] as number[],
  })

  // Forms
  const [sportForm, setSportForm] = useState({
    name: '',
    description: '',
  })

  // Search + expansion
  const [sportSearch, setSportSearch] = useState('')
  const [expandedSports, setExpandedSports] = useState<Set<number>>(new Set())

  // Queries
  const { data: sports = [], isLoading: sportsLoading } = useSports()

  // Mutations
  const updatePlayer = useUpdatePlayer()
  const createSport = useCreateSport()
  const updateSport = useUpdateSport()
  const deleteSport = useDeleteSport()
  const demoteCaptain = useDemoteCaptain()

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

  const openEditSport = (sport: Sport) => {
    setEditSportForm({ name: sport.name, description: sport.description ?? '', active: sport.active })
    setEditSportDialog({ open: true, sport })
  }

  const handleUpdateSport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSportDialog.sport) return
    if (!editSportForm.name.trim()) {
      toast.error('Please enter sport name.')
      return
    }
    try {
      await updateSport.mutateAsync({
        id: editSportDialog.sport.id,
        data: {
          name: editSportForm.name.trim(),
          description: editSportForm.description.trim(),
          active: editSportForm.active,
        },
      })
      toast.success(`Sport "${editSportForm.name}" updated.`)
      setEditSportDialog({ open: false, sport: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update sport.')
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

  const handleToggleActive = (sport: Sport) => {
    updateSport.mutate({ id: sport.id, data: { active: !sport.active } })
  }

  const handleDemotePlayer = async (sportId: number, player: Player) => {
    try {
      await demoteCaptain.mutateAsync({ sportId, playerId: player.id })
      toast.success(`"${player.fullName}" removed as captain.`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to demote player.')
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
      department: player.department ?? '',
      notes: player.notes ?? '',
      sportIds: player.sports?.map((s) => s.id) ?? (player.sportId ? [player.sportId] : []),
    })
    setEditPlayerDialog({ open: true, player, sportId })
  }

  const toggleEditPlayerSport = (sportId: number) => {
    setEditPlayerForm((prev) => ({
      ...prev,
      sportIds: prev.sportIds.includes(sportId)
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId],
    }))
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
          department: editPlayerForm.department.trim() || undefined,
          notes: editPlayerForm.notes.trim() || undefined,
          sportIds: editPlayerForm.sportIds,
        },
      })
      toast.success(`Updated ${editPlayerDialog.player.fullName}.`)
      setEditPlayerDialog({ open: false, player: null, sportId: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update player.')
    }
  }

  const toggleExpandSport = (sportId: number) => {
    setExpandedSports((prev) => {
      const next = new Set(prev)
      if (next.has(sportId)) next.delete(sportId)
      else next.add(sportId)
      return next
    })
  }

  if (sportsLoading) {
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

  const filteredSports = sports.filter(
    (s) =>
      s.name.toLowerCase().includes(sportSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(sportSearch.toLowerCase()))
  )

  const assignSport = sports.find((s) => s.id === assignDialog.sportId) ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            Manage sports disciplines, assign captains, and configure programs.
          </p>
        </div>
        <Button
          onClick={() => setCreateSportOpen(true)}
          className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Sport
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* Unified sports dashboard */}
      {filteredSports.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Trophy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 font-sans text-sm">
            {sportSearch ? 'No sports match your search.' : 'No sports programs yet. Create your first sport to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSports.map((sport) => (
            <SportCard
              key={sport.id}
              sport={sport}
              sportCaptains={sport.captains ?? (sport.captain ? [sport.captain] : [])}
              expanded={expandedSports.has(sport.id)}
              onToggle={() => toggleExpandSport(sport.id)}
              onAssignCaptain={() => setAssignDialog({ open: true, sportId: sport.id })}
              onEditSport={() => openEditSport(sport)}
              onToggleActive={() => handleToggleActive(sport)}
              onDeleteSport={() => setDeleteSportDialog({ open: true, sport })}
              onEditPlayer={openEditPlayer}
              onViewProfile={(player) => setViewProfile({ player, sportId: sport.id, sportName: sport.name })}
              onDemote={(player) => handleDemotePlayer(sport.id, player)}
            />
          ))}
        </div>
      )}

      {/* CREATE SPORT DIALOG */}
      <Dialog open={createSportOpen} onOpenChange={(open) => {
        if (!open) setCreateSportOpen(false)
      }}>
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

      {/* EDIT SPORT DIALOG */}
      <Dialog open={editSportDialog.open} onOpenChange={(open) => {
        if (!open) setEditSportDialog({ open: false, sport: null })
      }}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleUpdateSport}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Pencil className="h-5 w-5 text-accent" />
                Edit Sport Program
              </DialogTitle>
              <DialogDescription>
                Update the details for <strong>{editSportDialog.sport?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="editSportName" className="text-xs font-sans text-slate-700">Sport Name *</Label>
                <Input
                  id="editSportName"
                  value={editSportForm.name}
                  onChange={(e) => setEditSportForm({ ...editSportForm, name: e.target.value })}
                  required
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editSportDescription" className="text-xs font-sans text-slate-700">Description</Label>
                <Input
                  id="editSportDescription"
                  value={editSportForm.description}
                  onChange={(e) => setEditSportForm({ ...editSportForm, description: e.target.value })}
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="editSportActive" className="text-xs font-sans text-slate-700">Active</Label>
                <Switch
                  id="editSportActive"
                  checked={editSportForm.active}
                  onCheckedChange={(v) => setEditSportForm((prev) => ({ ...prev, active: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditSportDialog({ open: false, sport: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSport.isPending} className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                {updateSport.isPending ? 'Saving…' : 'Save Changes'}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editPlayerDepartment" className="text-xs font-sans text-slate-700">Department / Team</Label>
                  <Input
                    id="editPlayerDepartment"
                    value={editPlayerForm.department}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, department: e.target.value })}
                    placeholder="e.g. U-15, Senior Men"
                    className="h-8 text-xs font-sans"
                  />
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans text-slate-700">Sport(s)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {sports.map((sport) => {
                    const checked = editPlayerForm.sportIds.includes(sport.id)
                    return (
                      <label
                        key={sport.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-md border cursor-pointer text-xs font-sans transition-colors ${
                          checked ? 'border-accent bg-accent/5' : 'border-border bg-surface'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditPlayerSport(sport.id)}
                          className="accent-accent h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{sport.name}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Optional — select all sports this athlete participates in.
                </p>
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

      {/* ASSIGN CAPTAIN (PROMOTE WITH CREDENTIALS) */}
      <PromoteCaptainModal
        open={assignDialog.open}
        onOpenChange={(open) => setAssignDialog((prev) => ({ ...prev, open }))}
        sport={assignSport}
        sportCaptains={assignSport?.captains ?? (assignSport?.captain ? [assignSport.captain] : [])}
      />

      {/* PLAYER PROFILE SHEET (admin read-only) */}
      <PlayerProfileSheet
        player={viewProfile?.player ?? null}
        sportId={viewProfile?.sportId ?? null}
        sportName={viewProfile?.sportName}
        open={!!viewProfile}
        onOpenChange={(open) => !open && setViewProfile(null)}
      />
    </div>
  )
}

interface SportCardProps {
  sport: Sport
  sportCaptains: CaptainLite[]
  expanded: boolean
  onToggle: () => void
  onAssignCaptain: () => void
  onEditSport: () => void
  onToggleActive: () => void
  onDeleteSport: () => void
  onEditPlayer: (player: Player, sportId: number) => void
  onViewProfile: (player: Player) => void
  onDemote: (player: Player) => void
}

function SportCard({
  sport,
  sportCaptains,
  expanded,
  onToggle,
  onAssignCaptain,
  onEditSport,
  onToggleActive,
  onDeleteSport,
  onEditPlayer,
  onViewProfile,
  onDemote,
}: SportCardProps) {
  const { data: players = [], isLoading: playersLoading } = usePlayers(sport.id)
  const captainIds = new Set(sportCaptains.map((c) => c.id))
  const full = sportCaptains.length >= 3

  return (
    <Card className="border border-border shadow-sm">
      {/* Collapsed header */}
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg font-semibold text-brand-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  {sport.name}
                </span>
                <StatusBadge status={sport.active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              {sport.description && (
                <p className="text-xs font-sans text-slate-500 mt-1 line-clamp-1">{sport.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Crown className="h-3 w-3 text-emerald-600" />
                {sportCaptains.length}/3 captains
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                <Users className="h-3 w-3" />
                {playersLoading ? '…' : players.length} enrolled
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              className="text-xs h-7 bg-accent hover:bg-accent-light text-white font-sans gap-1"
              disabled={full || playersLoading || players.length === 0}
              onClick={onAssignCaptain}
              title={full ? 'Max 3 captains reached' : !playersLoading && players.length === 0 ? 'Register athletes first' : undefined}
            >
              <UserPlus className="h-3 w-3" />
              {full ? 'Assign Captain (Full)' : 'Assign Captain'}
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 font-sans gap-1" onClick={onEditSport}>
              <Pencil className="h-3 w-3" />
              Edit Sport
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 font-sans"
              onClick={onToggleActive}
            >
              {sport.active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5"
              onClick={onDeleteSport}
              title="Delete Sport"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 font-sans ml-auto"
              onClick={onToggle}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <Plus className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-45' : ''}`} />
              <span className="hidden sm:inline">{expanded ? 'Hide' : 'Show'}</span>
            </Button>
          </div>
        </div>

        {/* Expanded sections */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t border-dashed border-border pt-4">
            {/* Captains section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-semibold text-brand-700 uppercase tracking-wide">
                  Captains ({sportCaptains.length}/{3})
                </span>
                {!full && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6 px-2"
                    onClick={onAssignCaptain}
                    disabled={playersLoading || players.length === 0}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign Captain
                  </Button>
                )}
              </div>
              {sportCaptains.length === 0 ? (
                <p className="text-xs text-slate-400 font-sans italic">No captains assigned yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {sportCaptains.map((cap) => (
                    <div
                      key={cap.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 rounded bg-surface border border-border"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-brand-900 truncate">{cap.fullName}</div>
                          {cap.email && <div className="text-xs font-mono text-slate-400 truncate">{cap.email}</div>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 self-start sm:self-auto"
                        onClick={() => onDemote({ id: cap.id, fullName: cap.fullName, email: cap.email } as Player)}
                      >
                        <UserX className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Demote</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Roster section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-semibold text-brand-700 uppercase tracking-wide">
                  Enrolled Athletes ({players.length})
                </span>
              </div>
              {playersLoading ? (
                <p className="text-xs text-slate-400 font-sans">Loading players…</p>
              ) : players.length === 0 ? (
                <p className="text-xs text-slate-400 font-sans italic">No athletes added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {players.map((player) => {
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
                              {player.department ? ` · ${player.department}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => onViewProfile(player)}
                          >
                            <Crown className="h-3 w-3 sm:mr-1 opacity-60" />
                            <span className="hidden sm:inline">View Profile</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-slate-600"
                            onClick={() => onEditPlayer(player, sport.id)}
                            title="Edit player details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}