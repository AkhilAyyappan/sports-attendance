import { useState, useEffect } from 'react'
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { PlayerProfileSheet } from '@/components/shared/PlayerProfileSheet'
import { PromoteCaptainModal } from '@/components/shared/PromoteCaptainModal'
import { useSports, useMySports, usePlayers, useAddPlayer, useDeletePlayer, useUpdatePlayer, useAuth } from '@/hooks'
import { UserPlus, Trophy, Shield, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { type Player } from '@/types'

export default function RosterPage() {
  const { role } = useAuth()
  const isCaptain = role === 'ROLE_CAPTAIN'

  const { data: allSports = [], isLoading: allSportsLoading } = useSports(!isCaptain)
  const { data: mySports = [], isLoading: mySportsLoading } = useMySports()

  // If captain, scope strictly to mySports; if admin, allSports
  const sports = isCaptain ? mySports : allSports
  const sportsLoading = isCaptain ? mySportsLoading : allSportsLoading

  const [selectedSportId, setSelectedSportId] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [deletePlayerDialog, setDeletePlayerDialog] = useState<{ open: boolean; player: Player | null }>({
    open: false,
    player: null,
  })
  const [editPlayerDialog, setEditPlayerDialog] = useState<{ open: boolean; player: Player | null }>({
    open: false,
    player: null,
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

  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    jerseyNumber: '',
    position: '',
    phone: '',
    email: '',
    department: '',
    notes: '',
    sportIds: [] as number[],
  })

  // Auto-select first sport once loaded
  useEffect(() => {
    if (sports.length > 0) {
      if (selectedSportId === null || !sports.some(s => s.id === selectedSportId)) {
        setSelectedSportId(sports[0].id)
      }
    }
  }, [sports, selectedSportId])

  const currentSport = sports.find((s) => s.id === selectedSportId)
  const { data: players = [], isLoading: playersLoading } = usePlayers(selectedSportId ?? 0)
  const addPlayerMutation = useAddPlayer()
  const deletePlayerMutation = useDeletePlayer()
  const updatePlayerMutation = useUpdatePlayer()

  // Captain promotion is credentialed (unified with Admin): opens a modal that collects
  // username + password and posts to the promote-captain endpoint.
  const [promoteOpen, setPromoteOpen] = useState(false)

  const openAddPlayer = () => {
    // No sport is pre-selected or forced — every sport is an optional checkbox.
    setPlayerForm((prev) => ({ ...prev, sportIds: [] }))
    setAddPlayerOpen(true)
  }

  const togglePlayerSport = (sportId: number) => {
    setPlayerForm((prev) => ({
      ...prev,
      sportIds: prev.sportIds.includes(sportId)
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId],
    }))
  }

  const toggleEditPlayerSport = (sportId: number) => {
    setEditPlayerForm((prev) => ({
      ...prev,
      sportIds: prev.sportIds.includes(sportId)
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId],
    }))
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerForm.fullName.trim()) {
      toast.error('Please enter player full name.')
      return
    }
    try {
      await addPlayerMutation.mutateAsync({
        sportId: selectedSportId,
        data: {
          fullName: playerForm.fullName.trim(),
          jerseyNumber: playerForm.jerseyNumber ? Number(playerForm.jerseyNumber) : undefined,
          position: playerForm.position.trim(),
          phone: playerForm.phone.trim(),
          email: playerForm.email.trim(),
          department: playerForm.department.trim() || undefined,
          notes: playerForm.notes.trim(),
          active: true,
          sportIds: playerForm.sportIds,
        },
      })
      const sportNames = playerForm.sportIds
        .map((id) => sports.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      toast.success(
        sportNames
          ? `Player ${playerForm.fullName} registered for ${sportNames}.`
          : `Player ${playerForm.fullName} registered. Assign sports anytime via Edit.`
      )
      setAddPlayerOpen(false)
      setPlayerForm({
        fullName: '',
        jerseyNumber: '',
        position: '',
        phone: '',
        email: '',
        department: '',
        notes: '',
        sportIds: [],
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add player.')
    }
  }

  const openEditPlayer = (player: Player) => {
    setEditPlayerDialog({ open: true, player })
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
  }

  const handleUpdatePlayer = async () => {
    const player = editPlayerDialog.player
    if (!player) return
    if (!editPlayerForm.fullName.trim()) {
      toast.error('Full name is required.')
      return
    }
    try {
      await updatePlayerMutation.mutateAsync({
        id: player.id,
        data: {
          fullName: editPlayerForm.fullName.trim(),
          dateOfBirth: editPlayerForm.dateOfBirth || undefined,
          jerseyNumber: editPlayerForm.jerseyNumber ? parseInt(editPlayerForm.jerseyNumber, 10) : undefined,
          position: editPlayerForm.position || undefined,
          phone: editPlayerForm.phone || undefined,
          email: editPlayerForm.email || undefined,
          department: editPlayerForm.department || undefined,
          notes: editPlayerForm.notes || undefined,
          sportIds: editPlayerForm.sportIds,
        },
      })
      toast.success(`Athlete ${editPlayerForm.fullName} updated.`)
      setEditPlayerDialog({ open: false, player: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update player.')
    }
  }

  const openPromoteModal = () => {
    if (!selectedPlayer || !currentSport) return
    setPromoteOpen(true)
  }

  const handleDeletePlayer = async () => {
    if (!deletePlayerDialog.player) return
    try {
      await deletePlayerMutation.mutateAsync(deletePlayerDialog.player.id)
      toast.success(`Athlete ${deletePlayerDialog.player.fullName} removed from roster.`)
      if (selectedPlayer?.id === deletePlayerDialog.player.id) {
        setSelectedPlayer(null)
      }
      setDeletePlayerDialog({ open: false, player: null })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove athlete.')
    }
  }

  if (sportsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Athletes & Sport Rosters</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Browse athletes registered in each sports discipline</p>
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
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Athletes & Sport Rosters</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            {isCaptain
              ? `Manage athlete roster for your assigned sport: ${currentSport?.name || 'Program'}`
              : 'Browse and manage athletes across all sport disciplines'}
          </p>
        </div>
        {selectedSportId && (
          <Button
            onClick={openAddPlayer}
            className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Register Athlete
          </Button>
        )}
      </div>

      {/* Sport Selector Header */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-accent" />
          <span className="font-serif text-sm font-medium text-brand-800 whitespace-nowrap">
            {isCaptain ? 'Your Assigned Sport:' : 'Select Sport:'}
          </span>
          {isCaptain ? (
            <span className="font-sans text-sm font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-md">
              {currentSport?.name || 'Loading…'}
            </span>
          ) : (
            <Select
              value={selectedSportId?.toString() ?? ''}
              onValueChange={(v) => {
                setSelectedSportId(Number(v))
                setSelectedPlayer(null)
              }}
            >
              <SelectTrigger className="w-64 font-sans bg-surface">
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
          )}
        </div>

        {currentSport && (
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>
                Captain:{' '}
                <strong>
                  {(currentSport.captains?.length ?? 0) > 0
                    ? currentSport.captains!.map((c) => c.fullName).join(', ')
                    : 'Unassigned'}
                </strong>
              </span>
            </div>
            <div className="text-slate-400">|</div>
            <div className="text-slate-600">
              Athletes: <strong>{players.length}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Players Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {playersLoading ? (
          <div className="p-6">
            <LoadingSkeleton type="table" count={4} />
          </div>
        ) : sports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-sans text-sm">
              You do not have any sports assigned to your captain account yet. Contact an administrator.
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-sans text-sm">
              No athletes registered for {currentSport?.name || 'this sport'} yet.
            </p>
            <Button
              onClick={openAddPlayer}
              className="mt-4 bg-accent hover:bg-accent-light text-white font-sans text-xs"
            >
              Register First Athlete
            </Button>
          </div>
        ) : (
          <div className="sm:overflow-x-auto">
            <Table className="ledger-table w-full card-table">
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-b border-border">
                  <TableHead className="w-16 font-serif text-brand-800 min-w-[40px]">#</TableHead>
                  <TableHead className="font-serif text-brand-800 min-w-[140px]">Athlete Name</TableHead>
                  <TableHead className="font-serif text-brand-800 min-w-[100px]">Position / Role</TableHead>
                  <TableHead className="font-serif text-brand-800 min-w-[130px]">Contact</TableHead>
                  <TableHead className="font-serif text-brand-800 min-w-[80px]">Status</TableHead>
                  <TableHead className="font-serif text-brand-800 text-right min-w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow
                    key={player.id}
                    className="hover:bg-surface/50 cursor-pointer"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <TableCell data-label="#" className="font-mono text-sm font-semibold text-brand-800">
                      {player.jerseyNumber ?? '—'}
                    </TableCell>
                    <TableCell data-label="Athlete Name">
                      <div className="font-serif font-medium text-brand-900">{player.fullName}</div>
                      {player.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{player.notes}</div>}
                    </TableCell>
                    <TableCell data-label="Position / Role" className="font-sans text-sm text-slate-600">
                      {player.position || '—'}
                    </TableCell>
                    <TableCell data-label="Contact" className="font-sans text-xs text-slate-600">
                      <div>{player.email || '—'}</div>
                      <div className="font-mono text-slate-400">{player.phone || '—'}</div>
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge status={player.active !== false ? 'ACTIVE' : 'INACTIVE'} />
                    </TableCell>
                    <TableCell data-label="Actions">
                      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-accent hover:text-accent-light w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPlayer(player)
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-accent hover:text-accent-light p-1.5 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditPlayer(player)
                          }}
                          title="Edit Athlete"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletePlayerDialog({ open: true, player })
                          }}
                          title="Delete Athlete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* REGISTER PLAYER DIALOG */}
      <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleAddPlayer}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                Register Athlete
              </DialogTitle>
              <DialogDescription>
                Add athlete details to the roster. Sport assignments are optional — pick none, one, or several.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="playerName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="playerName"
                  placeholder="e.g. Alex Morgan"
                  value={playerForm.fullName}
                  onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="jersey" className="text-xs font-sans text-slate-700">Jersey Number</Label>
                  <Input
                    id="jersey"
                    type="number"
                    placeholder="e.g. 10"
                    value={playerForm.jerseyNumber}
                    onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="position" className="text-xs font-sans text-slate-700">Position / Role</Label>
                  <Input
                    id="position"
                    placeholder="e.g. Forward / Striker / Goalkeeper"
                    value={playerForm.position}
                    onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="playerDepartment" className="text-xs font-sans text-slate-700">Department / Team</Label>
                  <Input
                    id="playerDepartment"
                    placeholder="e.g. U-15, Senior Men"
                    value={playerForm.department}
                    onChange={(e) => setPlayerForm({ ...playerForm, department: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="playerEmail" className="text-xs font-sans text-slate-700">Email</Label>
                  <Input
                    id="playerEmail"
                    type="email"
                    placeholder="alex@example.com"
                    value={playerForm.email}
                    onChange={(e) => setPlayerForm({ ...playerForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="playerPhone" className="text-xs font-sans text-slate-700">Phone</Label>
                  <Input
                    id="playerPhone"
                    placeholder="07xxxxxxxx"
                    value={playerForm.phone}
                    onChange={(e) => setPlayerForm({ ...playerForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="playerNotes" className="text-xs font-sans text-slate-700">Notes / Medical Info</Label>
                  <Input
                    id="playerNotes"
                    placeholder="e.g. Left-footed, also captain"
                    value={playerForm.notes}
                    onChange={(e) => setPlayerForm({ ...playerForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans text-slate-700">Sport(s)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {sports.map((sport) => {
                    const checked = playerForm.sportIds.includes(sport.id)
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
                          onChange={() => togglePlayerSport(sport.id)}
                          className="accent-accent h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{sport.name}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Optional — check none, one, or several sports. You can change assignments later from Edit.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddPlayerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                Register Athlete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PLAYER DIALOG */}
      <Dialog open={editPlayerDialog.open} onOpenChange={(open) => {
        if (!open) setEditPlayerDialog({ open: false, player: null })
      }}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleUpdatePlayer}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Pencil className="h-5 w-5 text-accent" />
                Edit Athlete
              </DialogTitle>
              <DialogDescription>
                Update details for <strong>{editPlayerDialog.player?.fullName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label htmlFor="editRosterFullName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="editRosterFullName"
                  value={editPlayerForm.fullName}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, fullName: e.target.value })}
                  required
                  className="h-8 text-xs font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editRosterDob" className="text-xs font-sans text-slate-700">Date of Birth</Label>
                  <Input
                    id="editRosterDob"
                    type="date"
                    value={editPlayerForm.dateOfBirth}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, dateOfBirth: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editRosterJersey" className="text-xs font-sans text-slate-700">Jersey Number</Label>
                  <Input
                    id="editRosterJersey"
                    value={editPlayerForm.jerseyNumber}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, jerseyNumber: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editRosterPosition" className="text-xs font-sans text-slate-700">Position</Label>
                  <Input
                    id="editRosterPosition"
                    value={editPlayerForm.position}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, position: e.target.value })}
                    placeholder="e.g. Striker, Bowler"
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editRosterPhone" className="text-xs font-sans text-slate-700">Phone</Label>
                  <Input
                    id="editRosterPhone"
                    value={editPlayerForm.phone}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, phone: e.target.value })}
                    className="h-8 text-xs font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editRosterDepartment" className="text-xs font-sans text-slate-700">Department / Team</Label>
                  <Input
                    id="editRosterDepartment"
                    value={editPlayerForm.department}
                    onChange={(e) => setEditPlayerForm({ ...editPlayerForm, department: e.target.value })}
                    placeholder="e.g. U-15, Senior Men"
                    className="h-8 text-xs font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editRosterEmail" className="text-xs font-sans text-slate-700">Email</Label>
                  <Input
                    id="editRosterEmail"
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
                  Select all sports this athlete participates in. Can be left empty; removing a sport also removes captain assignments within it.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editRosterNotes" className="text-xs font-sans text-slate-700">Notes</Label>
                <Input
                  id="editRosterNotes"
                  value={editPlayerForm.notes}
                  onChange={(e) => setEditPlayerForm({ ...editPlayerForm, notes: e.target.value })}
                  placeholder="Any additional notes…"
                  className="h-8 text-xs font-sans"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPlayerDialog({ open: false, player: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlayerMutation.isPending} className="bg-accent hover:bg-accent-light text-white font-sans text-xs">
                {updatePlayerMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE PLAYER CONFIRMATION */}
      <Dialog open={deletePlayerDialog.open} onOpenChange={(open) => setDeletePlayerDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remove Athlete?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deletePlayerDialog.player?.fullName}</strong> from {currentSport?.name}? Their attendance history will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeletePlayerDialog({ open: false, player: null })}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeletePlayer}
              className="bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs"
            >
              Delete Athlete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PLAYER DETAILS SHEET */}
      <PlayerProfileSheet
        player={selectedPlayer}
        sportId={currentSport?.id ?? null}
        sportName={currentSport?.name}
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
        showPromote
        canPromote={(currentSport?.captains?.length ?? 0) < 3}
        onPromote={openPromoteModal}
        onDeletePlayer={selectedPlayer ? () => setDeletePlayerDialog({ open: true, player: selectedPlayer }) : undefined}
      />

      {/* PROMOTE CAPTAIN (with credentials) */}
      <PromoteCaptainModal
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        sport={currentSport ?? null}
        sportCaptains={currentSport?.captains ?? (currentSport?.captain ? [currentSport.captain] : [])}
        preselectedPlayer={selectedPlayer}
      />
    </div>
  )
}