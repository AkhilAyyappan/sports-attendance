import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { useCaptains, useSports, useResetPassword, useToggleCaptain, useUpdateSport } from '@/hooks'

export default function AdminPage() {
  const { data: captains = [], isLoading: captainsLoading } = useCaptains()
  const { data: sports = [], isLoading: sportsLoading } = useSports()
  const resetPassword = useResetPassword()
  const toggleCaptain = useToggleCaptain()
  const updateSport = useUpdateSport()

  const [resetDialog, setResetDialog] = useState<{ open: boolean; captainId: number | null }>({
    open: false,
    captainId: null,
  })
  const [newPassword, setNewPassword] = useState('')

  const handleResetPassword = async () => {
    if (!resetDialog.captainId || !newPassword) return
    try {
      await resetPassword.mutateAsync({
        id: resetDialog.captainId,
        newPassword,
      })
      toast.success('Password reset successfully.')
      setResetDialog({ open: false, captainId: null })
      setNewPassword('')
    } catch {
      toast.error('Failed to reset password.')
    }
  }

  const handleToggleCaptain = async (id: number) => {
    try {
      await toggleCaptain.mutateAsync(id)
    } catch {
      toast.error('Failed to update captain status.')
    }
  }

  if (captainsLoading || sportsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Manage captains and sports programs</p>
        </div>
        <LoadingSkeleton type="table" count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Administration</h1>
        <p className="text-slate-500 text-sm font-sans mt-1">Manage captains and sports programs</p>
      </div>

      <Tabs defaultValue="captains" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="captains" className="font-sans">
            Captains
          </TabsTrigger>
          <TabsTrigger value="sports" className="font-sans">
            Sports
          </TabsTrigger>
        </TabsList>

        {/* Captains Tab */}
        <TabsContent value="captains" className="mt-4">
          <div className="bg-card border border-border rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-serif text-lg font-semibold text-brand-900">
                Captains & Coaches
              </h2>
            </div>
            {captains.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-sans text-sm">No captains registered.</p>
              </div>
            ) : (
              <Table className="ledger-table">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-b border-border">
                    <TableHead className="font-serif text-brand-800">Username</TableHead>
                    <TableHead className="font-serif text-brand-800">Full Name</TableHead>
                    <TableHead className="font-serif text-brand-800">Email</TableHead>
                    <TableHead className="font-serif text-brand-800">Phone</TableHead>
                    <TableHead className="font-serif text-brand-800">Status</TableHead>
                    <TableHead className="font-serif text-brand-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captains.map((captain) => (
                    <TableRow key={captain.id} className="hover:bg-surface/50">
                      <TableCell className="font-mono text-sm">{captain.username}</TableCell>
                      <TableCell className="font-serif font-medium text-brand-900">
                        {captain.fullName}
                      </TableCell>
                      <TableCell className="font-sans text-sm">{captain.email}</TableCell>
                      <TableCell className="font-sans text-sm">{captain.phone}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleCaptain(captain.id)}
                          className="focus:outline-none"
                        >
                          <StatusBadge status={captain.active ? 'ACTIVE' : 'INACTIVE'} />
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-sans text-xs border-border h-8"
                          onClick={() => {
                            setResetDialog({ open: true, captainId: captain.id })
                            setNewPassword('')
                          }}
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Sports Tab */}
        <TabsContent value="sports" className="mt-4">
          <div className="bg-card border border-border rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-serif text-lg font-semibold text-brand-900">
                Sports Programs
              </h2>
            </div>
            {sports.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-sans text-sm">No sports registered.</p>
              </div>
            ) : (
              <Table className="ledger-table">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-b border-border">
                    <TableHead className="font-serif text-brand-800">Name</TableHead>
                    <TableHead className="font-serif text-brand-800">Description</TableHead>
                    <TableHead className="font-serif text-brand-800">Status</TableHead>
                    <TableHead className="font-serif text-brand-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sports.map((sport) => (
                    <TableRow key={sport.id} className="hover:bg-surface/50">
                      <TableCell className="font-serif font-medium text-brand-900">
                        {sport.name}
                      </TableCell>
                      <TableCell className="font-sans text-sm max-w-[300px] truncate">
                        {sport.description}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            updateSport.mutate({
                              id: sport.id,
                              data: { active: !sport.active },
                            })
                          }
                        >
                          <StatusBadge status={sport.active ? 'ACTIVE' : 'INACTIVE'} />
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-sans text-xs border-border h-8"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetDialog.open}
        onOpenChange={(open) => {
          if (!open) setResetDialog({ open: false, captainId: null })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this captain. They will need to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-sans text-sm">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-sans border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialog({ open: false, captainId: null })}
              className="font-sans border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || resetPassword.isPending}
              className="font-sans bg-accent hover:bg-accent-light"
            >
              {resetPassword.isPending ? 'Resetting…' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}