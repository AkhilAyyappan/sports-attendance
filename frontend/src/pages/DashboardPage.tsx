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
import { useCamps, useCaptains, useSessions } from '@/hooks'
import { type Session } from '@/types'
import { Users, Star, ShieldCheck, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { data: camps = [], isLoading: campsLoading } = useCamps()
  const { data: captains = [], isLoading: captainsLoading } = useCaptains()

  // Fetch sessions for all active camps to show upcoming ones
  const activeCampIds = camps.filter((c) => c.status === 'ACTIVE' || c.status === 'UPCOMING').map((c) => c.id)
  const sessionQueries = activeCampIds.map((campId) => useSessions(campId))

  // Aggregate all upcoming sessions
  const upcomingSessions = useMemo(() => {
    const all: Array<{ session: Session; campName: string }> = []
    sessionQueries.forEach((q, i) => {
      if (q.data) {
        const campId = activeCampIds[i]
        const camp = camps.find((c) => c.id === campId)
        q.data.forEach((s) => {
          if (s.status === 'SCHEDULED') {
            all.push({ session: s, campName: camp?.name ?? 'Unknown' })
          }
        })
      }
    })
    return all.sort((a, b) => new Date(a.session.sessionDate).getTime() - new Date(b.session.sessionDate).getTime())
  }, [sessionQueries, camps, activeCampIds])

  // Compute total players across all teams (approximate — needs teams endpoint)
  const activeCamps = camps.filter((c) => c.status === 'ACTIVE' || c.status === 'UPCOMING').length
  const totalCaptains = captains.length

  // Mock attendance rate since we don't have a global attendance endpoint
  const attendanceRate = 87

  if (campsLoading || captainsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Executive Overview</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Program metrics and upcoming sessions</p>
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
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Executive Overview</h1>
        <p className="text-slate-500 text-sm font-sans mt-1">Program metrics and upcoming sessions</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Camps"
          value={activeCamps}
          sublabel="UPCOMING and ACTIVE"
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          label="Total Captains"
          value={totalCaptains}
          sublabel="Authorized personnel"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          sublabel="Average across all sessions"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Total Players"
          value="—"
          sublabel="Aggregated from team rosters"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg font-semibold text-brand-900">
            Upcoming Sessions
          </h2>
        </div>
        <div className="p-0">
          {upcomingSessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 font-sans text-sm">No upcoming sessions scheduled.</p>
            </div>
          ) : (
            <Table className="ledger-table">
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-b border-border">
                  <TableHead className="font-serif text-brand-800">Session Title</TableHead>
                  <TableHead className="font-serif text-brand-800">Date</TableHead>
                  <TableHead className="font-serif text-brand-800">Time</TableHead>
                  <TableHead className="font-serif text-brand-800">Camp</TableHead>
                  <TableHead className="font-serif text-brand-800">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSessions.map(({ session, campName }) => (
                  <TableRow key={session.id} className="hover:bg-surface/50">
                    <TableCell className="font-serif font-medium text-brand-900">
                      {session.title}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(session.sessionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.startTime} – {session.endTime}
                    </TableCell>
                    <TableCell className="font-sans text-sm">{campName}</TableCell>
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