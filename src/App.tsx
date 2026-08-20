import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom"

import { AuthProvider, useAuth } from "./context/AuthContext"

import { ThemeProvider } from "./context/ThemeContext"

import Layout from "./components/layout/Layout"

import { ErrorBoundary } from "./components/common/ErrorBoundary"

import { CLIENT_HOME, homePathForRole, isClientRoute } from "./lib/clientAccess"

import Login from "./pages/Login"

import Dashboard from "./pages/Dashboard"

import Tasks from "./pages/Tasks"

import Projects from "./pages/Projects"

import Team from "./pages/Team"

import Reports from "./pages/Reports"

import ActivityLog from "./pages/ActivityLog"

import Notifications from "./pages/Notifications"

import Settings from "./pages/Settings"

import Calendar from "./pages/Calendar"

import AIAssistant from "./pages/AIAssistant"

import AnnouncementCenter from "./pages/AnnouncementCenter"

import ApprovalCenter from "./pages/ApprovalCenter"

import CampaignManagement from "./pages/CampaignManagement"

import ClientManagement from "./pages/ClientManagement"

import ImportExport from "./pages/ImportExport"

import MeetingManagement from "./pages/MeetingManagement"

import RecycleBin from "./pages/RecycleBin"

import SystemMonitoring from "./pages/SystemMonitoring"

import WorkflowAutomation from "./pages/WorkflowAutomation"

import LeaveManagement from "./pages/LeaveManagement"

import ResetPassword from "./pages/ResetPassword"

import Finance from "./pages/Finance"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "transparent" }}
      >
        <div className="text-sm" style={{ color: "#6b7280" }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

function ClientRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const location = useLocation()

  if (user?.role === "client" && !isClientRoute(location.pathname)) {
    return <Navigate to={CLIENT_HOME} replace />
  }

  return <>{children}</>
}

function SuperAdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user?.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth()

  const homePath = homePathForRole(user?.role)

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "transparent" }}
      >
        <div className="text-sm" style={{ color: "#6b7280" }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={homePath} replace /> : <Login />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={homePath} replace />} />

        {/* Core & Work */}
        <Route
          path="dashboard"
          element={
            <ClientRouteGuard>
              <Dashboard />
            </ClientRouteGuard>
          }
        />
        <Route
          path="tasks"
          element={
            <ClientRouteGuard>
              <Tasks />
            </ClientRouteGuard>
          }
        />
        <Route
          path="projects"
          element={
            <ClientRouteGuard>
              <Projects />
            </ClientRouteGuard>
          }
        />
        <Route
          path="calendar"
          element={
            <ClientRouteGuard>
              <Calendar />
            </ClientRouteGuard>
          }
        />
        <Route
          path="team"
          element={
            <ClientRouteGuard>
              <Team />
            </ClientRouteGuard>
          }
        />

        {/* Reports & Activity */}
        <Route
          path="reports"
          element={
            <ClientRouteGuard>
              <Reports />
            </ClientRouteGuard>
          }
        />
        <Route
          path="activity"
          element={
            <ClientRouteGuard>
              <ActivityLog />
            </ClientRouteGuard>
          }
        />
        <Route
          path="notifications"
          element={
            <ClientRouteGuard>
              <Notifications />
            </ClientRouteGuard>
          }
        />

        {/* Folder 1 Pages (Merged) */}
        <Route
          path="clients"
          element={
            <ClientRouteGuard>
              <ClientManagement />
            </ClientRouteGuard>
          }
        />
        <Route
          path="campaigns"
          element={
            <ClientRouteGuard>
              <CampaignManagement />
            </ClientRouteGuard>
          }
        />
        <Route
          path="workflows"
          element={
            <ClientRouteGuard>
              <WorkflowAutomation />
            </ClientRouteGuard>
          }
        />
        <Route
          path="approvals"
          element={
            <ClientRouteGuard>
              <ApprovalCenter />
            </ClientRouteGuard>
          }
        />
        <Route
          path="meetings"
          element={
            <ClientRouteGuard>
              <MeetingManagement />
            </ClientRouteGuard>
          }
        />
        <Route
          path="ai"
          element={
            <ClientRouteGuard>
              <AIAssistant />
            </ClientRouteGuard>
          }
        />
        <Route
          path="recycle"
          element={
            <ClientRouteGuard>
              <RecycleBin />
            </ClientRouteGuard>
          }
        />
        <Route
          path="importexport"
          element={
            <ClientRouteGuard>
              <ImportExport />
            </ClientRouteGuard>
          }
        />
        <Route
          path="monitoring"
          element={
            <SuperAdminRouteGuard>
              <SystemMonitoring />
            </SuperAdminRouteGuard>
          }
        />
        <Route
          path="finance"
          element={
            <SuperAdminRouteGuard>
              <Finance />
            </SuperAdminRouteGuard>
          }
        />
        <Route
          path="leave-management"
          element={
            <ClientRouteGuard>
              <LeaveManagement />
            </ClientRouteGuard>
          }
        />
        <Route
          path="announcements"
          element={
            <ClientRouteGuard>
              <AnnouncementCenter />
            </ClientRouteGuard>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <ClientRouteGuard>
              <Settings />
            </ClientRouteGuard>
          }
        />
      </Route>
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
