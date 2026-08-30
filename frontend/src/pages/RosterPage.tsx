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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { useSports, useMySports, usePlayers, usePlayerAttendance, usePlayerAttendanceSummary, useAddPlayer, useDeletePlayer, useAuth } from '@/hooks'
import { UserPlus, Trophy, Shield, Phone, Mail, FileText, User, Trash2 } from 'lucide-react'
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

  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    jerseyNumber: '',
    position: '',
    phone: '',
    email: '',
    notes: '',
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

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSportId || !playerForm.fullName.trim()) {
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
          notes: playerForm.notes.trim(),
          active: true,
        },
      })
      toast.success(`Player ${playerForm.fullName} registered for ${currentSport?.name}.`)
      setAddPlayerOpen(false)
      setPlayerForm({ fullName: '', jerseyNumber: '', position: '', phone: '', email: '', notes: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add player.')
    }
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
            onClick={() => setAddPlayerOpen(true)}
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
        </div>

        {currentSport && (
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Coach: <strong>{currentSport.captain?.fullName || 'Unassigned'}</strong></span>
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
              onClick={() => setAddPlayerOpen(true)}
              className="mt-4 bg-accent hover:bg-accent-light text-white font-sans text-xs"
            >
              Register First Athlete
            </Button>
          </div>
        ) : (
          <Table className="ledger-table">
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface border-b border-border">
                <TableHead className="w-16 font-serif text-brand-800">#</TableHead>
                <TableHead className="font-serif text-brand-800">Athlete Name</TableHead>
                <TableHead className="font-serif text-brand-800">Position / Role</TableHead>
                <TableHead className="font-serif text-brand-800">Contact</TableHead>
                <TableHead className="font-serif text-brand-800">Attendance</TableHead>
                <TableHead className="text-right font-serif text-brand-800">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow
                  key={player.id}
                  className="hover:bg-surface/50 cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <TableCell className="font-mono text-sm font-semibold text-brand-800">
                    {player.jerseyNumber ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="font-serif font-medium text-brand-900">{player.fullName}</div>
                    {player.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{player.notes}</div>}
                  </TableCell>
                  <TableCell className="font-sans text-sm text-slate-600">
                    {player.position || '—'}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-slate-600">
                    <div>{player.email || '—'}</div>
                    <div className="font-mono text-slate-400">{player.phone || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={player.attendanceStatus ?? (player.active !== false ? 'ACTIVE' : 'INACTIVE')} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-accent hover:text-accent-light"
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
                        className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5"
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
        )}
      </div>

      {/* REGISTER PLAYER DIALOG */}
      <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddPlayer}>
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-accent" />
                Register Athlete for {currentSport?.name}
              </DialogTitle>
              <DialogDescription>
                Add athlete details to the roster. Note: Captains/Coaches can also be added as team athletes.
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
                    placeholder="e.g. Forward / Striker / Player-Coach"
                    value={playerForm.position}
                    onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <Label htmlFor="playerPhone" className="text-xs font-sans text-slate-700">Phone</Label>
                  <Input
                    id="playerPhone"
                    placeholder="07xxxxxxxx"
                    value={playerForm.phone}
                    onChange={(e) => setPlayerForm({ ...playerForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs font-sans text-slate-700">Notes / Medical Info</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Left-footed, also captain"
                  value={playerForm.notes}
                  onChange={(e) => setPlayerForm({ ...playerForm, notes: e.target.value })}
                />
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

      {/* DELETE PLAYER CONFIRMATION */}
      <Dialog open={deletePlayerDialog.open} onOpenChange={(open) => setDeletePlayerDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
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
      <Sheet open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          {selectedPlayer && (
            <div className="space-y-6 pt-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center font-mono font-bold text-lg text-brand-900">
                      {selectedPlayer.jerseyNumber || <User className="h-5 w-5 text-slate-400" />}
                    </div>
                    <div>
                      <SheetTitle className="font-serif text-xl font-bold text-brand-900">
                        {selectedPlayer.fullName}
                      </SheetTitle>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        {selectedPlayer.position || 'Athlete'} · {currentSport?.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => setDeletePlayerDialog({ open: true, player: selectedPlayer })}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </SheetHeader>

              <div className="space-y-4 text-sm font-sans">
                <div className="p-3 bg-surface rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedPlayer.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedPlayer.phone || 'No phone registered'}</span>
                  </div>
                  {selectedPlayer.notes && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 pt-1 border-t border-border">
                      <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                      <span>{selectedPlayer.notes}</span>
                    </div>
                  )}
                </div>

                <PlayerAttendanceHistory playerId={selectedPlayer.id} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PlayerAttendanceHistory({ playerId }: { playerId: number }) {
  const { data: attendances = [], isLoading } = usePlayerAttendance(playerId)
  const { data: summary } = usePlayerAttendanceSummary(playerId)

  if (isLoading) {
    return <LoadingSkeleton type="table" count={3} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-serif font-semibold text-brand-900 text-sm">Attendance History</h4>
        <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {summary?.presentCount ?? 0} Sessions Present
        </span>
      </div>

      {attendances.length === 0 ? (
        <p className="text-xs text-slate-400">No session attendance recorded yet.</p>
      ) : (
        <div className="border border-border rounded overflow-hidden max-h-60 overflow-y-auto">
          <Table className="ledger-table text-xs">
            <TableHeader>
              <TableRow className="bg-surface">
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-brand-900">{`Session #${a.sessionId}`}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="font-mono text-slate-400">{a.markedAt ? new Date(a.markedAt).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}