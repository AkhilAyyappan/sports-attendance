import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { useMe, useUpdateMyProfile, useChangeMyPassword } from '@/hooks'
import { UserCircle, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: me, isLoading } = useMe()
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangeMyPassword()

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' })
  const [initialized, setInitialized] = useState(false)

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Populate the form from the loaded profile once.
  if (!initialized && me) {
    setProfileForm({
      fullName: me.fullName || '',
      email: me.email || '',
      phone: me.phone || '',
    })
    setInitialized(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.fullName.trim()) {
      toast.error('Full name is required.')
      return
    }
    try {
      await updateProfile.mutateAsync({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      })
      toast.success('Profile updated successfully.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passForm.currentPassword) {
      toast.error('Enter your current password.')
      return
    }
    if (!passForm.newPassword) {
      toast.error('Enter a new password.')
      return
    }
    if (passForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })
      // Refresh the stored Basic-auth token so the session isn't dropped.
      const raw = sessionStorage.getItem('auth')
      if (raw) {
        try {
          const stored = JSON.parse(raw)
          stored.token = `Basic ${btoa(`${me?.username}:${passForm.newPassword}`)}`
          sessionStorage.setItem('auth', JSON.stringify(stored))
        } catch {
          /* ignore corrupted session */
        }
      }
      toast.success('Password changed successfully.')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">My Profile</h1>
          <p className="text-slate-500 text-sm font-sans mt-1">Your account details and security</p>
        </div>
        <LoadingSkeleton type="table" count={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-900">My Profile</h1>
        <p className="text-slate-500 text-sm font-sans mt-1">
          <span className="font-medium text-brand-800">{me?.username}</span> ·{' '}
          {me?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Captain / Coach'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Contact details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg font-semibold text-brand-900 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-accent" />
              Contact Details
            </CardTitle>
            <CardDescription className="font-sans text-xs text-slate-500">
              Update the name, email and phone shown across the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="profileName" className="text-xs font-sans text-slate-700">Full Name *</Label>
                <Input
                  id="profileName"
                  placeholder="e.g. Alex Morgan"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="profileEmail" className="text-xs font-sans text-slate-700">Email</Label>
                <Input
                  id="profileEmail"
                  type="email"
                  placeholder="alex@example.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="profilePhone" className="text-xs font-sans text-slate-700">Phone</Label>
                <Input
                  id="profilePhone"
                  placeholder="07xxxxxxxx"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="bg-accent hover:bg-accent-light text-white font-sans text-xs"
              >
                {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg font-semibold text-brand-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              Change Password
            </CardTitle>
            <CardDescription className="font-sans text-xs text-slate-500">
              Verify your current password, then set a new one (min 6 characters).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentPassword" className="text-xs font-sans text-slate-700">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newPassword" className="text-xs font-sans text-slate-700">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 6 characters"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-sans text-slate-700">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={changePassword.isPending}
                variant="outline"
                className="font-sans text-xs"
              >
                {changePassword.isPending ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}