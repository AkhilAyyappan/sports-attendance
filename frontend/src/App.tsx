import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { RoleGuard } from '@/components/shared/RoleGuard'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const RosterPage = lazy(() => import('@/pages/RosterPage'))
const AttendancePage = lazy(() => import('@/pages/AttendancePage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoading) setReady(true)
  }, [isLoading])

  if (!ready) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSkeleton type="stat" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoading) setReady(true)
  }, [isLoading])

  if (!ready) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSkeleton type="stat" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <LoadingSkeleton type="stat" count={4} />
            <LoadingSkeleton type="table" count={5} />
          </div>
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          element={
            <AuthRoute>
              <AppLayout />
            </AuthRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="roster"
            element={
              <RoleGuard requiredRole={ROLES.CAPTAIN}>
                <RosterPage />
              </RoleGuard>
            }
          />
          <Route
            path="attendance"
            element={
              <RoleGuard requiredRole={ROLES.CAPTAIN}>
                <AttendancePage />
              </RoleGuard>
            }
          />
          <Route
            path="admin"
            element={
              <RoleGuard requiredRole={ROLES.ADMIN}>
                <AdminPage />
              </RoleGuard>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

