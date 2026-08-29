import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { StatCard } from '@/components/shared/StatCard'
import { useSports, useMySports, useCaptains, useAllSessions } from '@/hooks'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, ShieldCheck, Calendar, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { username, role } = useAuth()
  const isCaptain = role === 'ROLE_CAPTAIN'

  const { data: allSports = [], isLoading: allSportsLoading } = useSports()
  const { data: mySports = [], isLoading: mySportsLoading } = useMySports()
  const { data: captains = [], isLoading: captainsLoading } = useCaptains()
  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessions()

  const sports = isCaptain ? mySports : allSports
  const sportsLoading = isCaptain ? mySportsLoading : allSportsLoading

  const mySportIds = useMemo(() => new Set(sports.map((s) => s.id)), [sports])

  const upcomingSessions = useMemo(() => {
    return [...sessions]
      .filter((s) => {
        const isMySport = isCaptain ? (s.sportId ? mySportIds.has(s.sportId) : false) : true
        return isMySport && (s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS')
      })
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
  }, [sessions, isCaptain, mySportIds])

  const totalSports = sports.length
  const totalCaptains = captains.length
  const activeSports = sports.filter((s) => s.active).length

  if (sportsLoading || captainsLoading || sessionsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Executive Overview</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Sports programs and training sessions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} type="stat" />
          ))}
        </div>
        <LoadingSkeleton type="table" count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Executive Overview</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            Welcome back, <span className="font-medium text-brand-800">{username}</span> ({isCaptain ? 'Captain / Coach' : 'Administrator'})
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isCaptain ? "My Assigned Sports" : "Sports Programs"}
          value={totalSports}
          sublabel={`${activeSports} active disciplines`}
          icon={<Trophy className="h-5 w-5 text-accent" />}
        />
        <StatCard
          label="Coaches & Captains"
          value={isCaptain ? 1 : totalCaptains}
          sublabel={isCaptain ? "Your coach account" : "Authorized coaches"}
          icon={<ShieldCheck className="h-5 w-5 text-accent" />}
        />
        <StatCard
          label="Upcoming Sessions"
          value={upcomingSessions.length}
          sublabel="Scheduled training"
          icon={<Calendar className="h-5 w-5 text-accent" />}
        />
        <StatCard
          label="Active Disciplines"
          value={activeSports}
          sublabel="Ready for training"
          icon={<Activity className="h-5 w-5 text-accent" />}
        />
      </div>

      {/* Upcoming Sessions Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg font-semibold text-brand-900">
            {isCaptain ? 'Your Scheduled Training Sessions' : 'Upcoming Training Sessions'}
          </h2>
        </div>
        <div className="p-0">
          {upcomingSessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 font-sans text-sm">No upcoming training sessions scheduled.</p>
            </div>
          ) : (
            <Table className="ledger-table">
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-b border-border">
                  <TableHead className="font-serif text-brand-800">Session Title</TableHead>
                  <TableHead className="font-serif text-brand-800">Sport Discipline</TableHead>
                  <TableHead className="font-serif text-brand-800">Date</TableHead>
                  <TableHead className="font-serif text-brand-800">Time</TableHead>
                  <TableHead className="font-serif text-brand-800">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-surface/50">
                    <TableCell className="font-serif font-medium text-brand-900">
                      {session.title}
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {session.sport?.name || 'General Sport'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.sessionDate}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.startTime || '—'} {session.endTime ? `– ${session.endTime}` : ''}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}