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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { useCamps, useTeams, usePlayers, useSports, useCaptains } from '@/hooks'
import { ChevronRight } from 'lucide-react'
import { useTeam } from '@/hooks/useTeams'

export default function RosterPage() {
  const { data: camps = [], isLoading: campsLoading } = useCamps()
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null)

  const { data: teams = [], isLoading: teamsLoading } = useTeams(selectedCampId ?? 0)
  const { data: sports = [] } = useSports()
  const { data: captains = [] } = useCaptains()

  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)

  const { data: players = [], isLoading: playersLoading } = usePlayers(
    expandedTeamId ?? 0
  )

  const getSportName = (sportId: number) =>
    sports.find((s) => s.id === sportId)?.name ?? '—'

  const getCaptainName = (captainId: number | undefined) =>
    captainId
      ? captains.find((c) => c.id === captainId)?.fullName ?? 'Unassigned'
      : 'Unassigned'

  if (campsLoading || teamsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Academic Roster & Team Directory</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Browse camps, teams, and player profiles</p>
        </div>
        <LoadingSkeleton type="table" count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Academic Roster & Team Directory</h1>
        <p className="text-slate-500 text-sm font-sans mt-1">Browse camps, teams, and player profiles</p>
      </div>

      {/* Camp selector */}
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
        <span className="font-serif text-sm font-medium text-brand-800 whitespace-nowrap">
          Select Camp:
        </span>
        <Select
          value={selectedCampId?.toString() ?? ''}
          onValueChange={(v) => {
            setSelectedCampId(Number(v))
            setExpandedTeamId(null)
            setSelectedPlayerId(null)
          }}
        >
          <SelectTrigger className="w-72 font-sans border-border">
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
      </div>

      {selectedCampId === null ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-slate-400 font-sans text-sm">
            Select a camp from the dropdown above to view its teams and players.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-brand-900">
              {camps.find((c) => c.id === selectedCampId)?.name ?? 'Selected Camp'}
            </h2>
            <span className="text-xs font-mono text-slate-400">{teams.length} team{teams.length !== 1 ? 's' : ''}</span>
          </div>

          {teams.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-sans text-sm">No teams found for this camp.</p>
            </div>
          ) : (
            <Table className="ledger-table">
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-b border-border">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-serif text-brand-800">Team Name</TableHead>
                  <TableHead className="font-serif text-brand-800">Sport</TableHead>
                  <TableHead className="font-serif text-brand-800">Captain</TableHead>
                  <TableHead className="font-serif text-brand-800">Status</TableHead>
                  <TableHead className="font-serif text-brand-800 text-right">Players</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => {
                  const teamPlayers = players.filter((p) => p.teamId === team.id)
                  return (
                    <TableRow key={team.id} className="hover:bg-surface/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setExpandedTeamId(
                              expandedTeamId === team.id ? null : team.id
                            )
                          }
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              expandedTeamId === team.id ? 'rotate-90' : ''
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-serif font-medium text-brand-900">
                        {team.name}
                      </TableCell>
                      <TableCell className="font-sans text-sm">{getSportName(team.sportId)}</TableCell>
                      <TableCell className="font-sans text-sm">{getCaptainName(team.captainId)}</TableCell>
                      <TableCell>
                        <StatusBadge status={team.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-500">
                        {teamPlayers.length}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Player sheets for expanded teams */}
      {expandedTeamId && (
        <TeamPlayerSheet
          teamId={expandedTeamId}
          players={players}
          playersLoading={playersLoading}
          onPlayerSelect={setSelectedPlayerId}
          selectedPlayerId={selectedPlayerId}
          onClose={() => setExpandedTeamId(null)}
        />
      )}
    </div>
  )
}

// Separate component to avoid re-creating on every render
function TeamPlayerSheet({
  teamId,
  players,
  playersLoading,
  onPlayerSelect,
  selectedPlayerId,
  onClose,
}: {
  teamId: number
  players: import('@/types').Player[]
  playersLoading: boolean
  onPlayerSelect: (id: number | null) => void
  selectedPlayerId: number | null
  onClose: () => void
}) {
  const { data: team } = useTeam(teamId)

  // Find the player summary when a player is selected
  const currentPlayer = players.find((p) => p.id === selectedPlayerId)

  return (
    <Sheet open={!!team} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-3/4 sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-brand-900">
            {team?.name ?? 'Team'} — Player Roster
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {playersLoading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : players.length === 0 ? (
            <p className="text-slate-400 font-sans text-sm text-center py-8">
              No players on this team yet.
            </p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between ${
                    selectedPlayerId === player.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-slate-500">
                      #{player.jerseyNumber}
                    </span>
                    <span className="font-serif text-brand-900 font-medium">
                      {player.fullName}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-slate-400">{player.position}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {currentPlayer && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-serif text-base font-semibold text-brand-900 mb-3">
              Player Profile
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm font-sans">
              <div>
                <span className="text-slate-500">Full Name</span>
                <p className="font-medium text-brand-900">{currentPlayer.fullName}</p>
              </div>
              <div>
                <span className="text-slate-500">Jersey #</span>
                <p className="font-mono font-medium text-brand-900">{currentPlayer.jerseyNumber}</p>
              </div>
              <div>
                <span className="text-slate-500">Position</span>
                <p className="font-medium text-brand-900">{currentPlayer.position}</p>
              </div>
              <div>
                <span className="text-slate-500">Date of Birth</span>
                <p className="font-mono text-brand-900">
                  {new Date(currentPlayer.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              {currentPlayer.email && (
                <div>
                  <span className="text-slate-500">Email</span>
                  <p className="font-medium text-brand-900">{currentPlayer.email}</p>
                </div>
              )}
              {currentPlayer.phone && (
                <div>
                  <span className="text-slate-500">Phone</span>
                  <p className="font-medium text-brand-900">{currentPlayer.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}