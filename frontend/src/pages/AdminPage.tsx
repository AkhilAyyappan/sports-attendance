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
  useDeleteSport,
  useCaptains,
  useCreateCaptain,
  useResetPassword,
  useToggleCaptain,
  useDeleteCaptain,
} from '@/hooks'
import { UserPlus, Shield, Plus, Trophy, Activity, Trash2 } from 'lucide-react'
import { type Captain, type Sport } from '@/types'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'captains' | 'sports'>('captains')

  // Modals
  const [createCaptainOpen, setCreateCaptainOpen] = useState(false)
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

  // Mutations
  const createCaptain = useCreateCaptain()
  const resetPassword = useResetPassword()
  const toggleCaptain = useToggleCaptain()
  const deleteCaptain = useDeleteCaptain()
  const createSport = useCreateSport()
  const updateSport = useUpdateSport()
  const assignCaptainToSport = useAssignCaptainToSport()
  const deleteSport = useDeleteSport()

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
            <Button
              onClick={() => setCreateCaptainOpen(true)}
              className="bg-accent hover:bg-accent-light text-white font-sans text-xs gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              New Captain
            </Button>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
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
                              className="text-xs h-7 text-slate-500 hover:text-slate-700"
                              onClick={() => setResetPassDialog({ open: true, captain, newPass: '' })}
                            >
                              Reset Password
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`text-xs h-7 ${
                                captain.enabled !== false ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              onClick={() => toggleCaptain.mutate(captain.id)}
                            >
                              {captain.enabled !== false ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5"
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
                          {assignedCap ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Shield className="h-3 w-3 text-emerald-600" />
                              {assignedCap.fullName} (@{assignedCap.username})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200">
                              No Captain Assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sport.active ? 'ACTIVE' : 'INACTIVE'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => {
                                if (captains.length > 0) {
                                  setAssignDialog({
                                    open: true,
                                    captain: assignedCap ? (captains.find(c => c.id === assignedCap.id) || captains[0]) : captains[0],
                                    sportId: sport.id,
                                  })
                                } else {
                                  toast.error('Create a captain first.')
                                }
                              }}
                            >
                              Assign Coach
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
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
                              className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5"
                              onClick={() => setDeleteSportDialog({ open: true, sport })}
                              title="Delete Sport"
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
            )}
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