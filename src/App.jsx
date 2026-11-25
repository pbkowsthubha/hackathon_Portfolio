import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
import RouteFallback from './components/RouteFallback'
import MaintenanceBanner from './components/MaintenanceBanner'

// Eagerly loaded entry & auth routes for fast initial render
import PlatformHome from './pages/PlatformHome'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Lazy-loaded public portfolio & blog routes
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'))
const PublicBlog = lazy(() => import('./pages/PublicBlog'))
const PublicBlogArticle = lazy(() => import('./pages/PublicBlogArticle'))

// Lazy-loaded creator dashboard & editor routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProfileEditor = lazy(() => import('./pages/ProfileEditor'))
const ProjectsManager = lazy(() => import('./pages/ProjectsManager'))
const SkillsManager = lazy(() => import('./pages/SkillsManager'))
const EducationManager = lazy(() => import('./pages/EducationManager'))
const AchievementsManager = lazy(() => import('./pages/AchievementsManager'))
const CertificationsManager = lazy(() => import('./pages/CertificationsManager'))
const BlogManager = lazy(() => import('./pages/BlogManager'))
const DesignStudio = lazy(() => import('./pages/DesignStudio'))
const PublishingManager = lazy(() => import('./pages/PublishingManager'))
const PortfolioPreview = lazy(() => import('./pages/PortfolioPreview'))

// Lazy-loaded administrator control center routes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPortfolios = lazy(() => import('./pages/admin/AdminPortfolios'))
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'))
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminBackup = lazy(() => import('./pages/admin/AdminBackup'))

function withRouteBoundary(element, scope, homeTo = '/', homeLabel = 'Return Home', fallbackLabel) {
  return (
    <ErrorBoundary scope={scope} homeTo={homeTo} homeLabel={homeLabel}>
      <Suspense fallback={<RouteFallback label={fallbackLabel} />}>{element}</Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MaintenanceBanner />
        <ErrorBoundary scope="Portfolio Studio">
          <Routes>
            {/* Public Platform Routes */}
            <Route path="/" element={<PlatformHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />

            {/* Portfolio Viewer Routes */}
            <Route
              path="/p/kowsthuba"
              element={withRouteBoundary(<PublicPortfolio />, 'Public Portfolio', '/', 'Return Home', 'Loading portfolio...')}
            />
            <Route
              path="/p/:username/blog/:slug"
              element={withRouteBoundary(<PublicBlogArticle />, 'Blog Article', '/', 'Return Home', 'Loading article...')}
            />
            <Route
              path="/p/:username/blog"
              element={withRouteBoundary(<PublicBlog />, 'Public Blog', '/', 'Return Home', 'Loading blog...')}
            />
            <Route
              path="/p/:username"
              element={withRouteBoundary(<PublicPortfolio />, 'Public Portfolio', '/', 'Return Home', 'Loading portfolio...')}
            />

            {/* Protected Creator Workspace Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<Dashboard />, 'Creator Dashboard', '/', 'Return Home', 'Loading dashboard...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<ProfileEditor />, 'Profile Editor', '/dashboard', 'Back to Dashboard', 'Loading profile editor...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/projects"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<ProjectsManager />, 'Projects Manager', '/dashboard', 'Back to Dashboard', 'Loading projects...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/skills"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<SkillsManager />, 'Skills Manager', '/dashboard', 'Back to Dashboard', 'Loading skills...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/education"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<EducationManager />, 'Education Manager', '/dashboard', 'Back to Dashboard', 'Loading education...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/achievements"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<AchievementsManager />, 'Achievements Manager', '/dashboard', 'Back to Dashboard', 'Loading achievements...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/certifications"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<CertificationsManager />, 'Certifications Manager', '/dashboard', 'Back to Dashboard', 'Loading certifications...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/blog"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<BlogManager />, 'Blog Manager', '/dashboard', 'Back to Dashboard', 'Loading blog manager...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/design-studio"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<DesignStudio />, 'Design Studio', '/dashboard', 'Back to Dashboard', 'Loading Design Studio...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/publishing"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<PublishingManager />, 'Publishing Manager', '/dashboard', 'Back to Dashboard', 'Loading publishing...')}
                </ProtectedRoute>
              }
            />
            <Route
              path="/preview/:username"
              element={
                <ProtectedRoute>
                  {withRouteBoundary(<PortfolioPreview />, 'Portfolio Preview', '/dashboard', 'Back to Dashboard', 'Loading preview...')}
                </ProtectedRoute>
              }
            />

            {/* Protected Administrator Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminDashboard />, 'Admin Control Center', '/', 'Return Home', 'Loading admin center...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminUsers />, 'User Management', '/admin', 'Back to Admin', 'Loading users...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/portfolios"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminPortfolios />, 'Portfolio Moderation', '/admin', 'Back to Admin', 'Loading portfolios...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/blogs"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminBlogs />, 'Blog Moderation', '/admin', 'Back to Admin', 'Loading blogs...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminLogs />, 'Activity Logs', '/admin', 'Back to Admin', 'Loading logs...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminSettings />, 'Platform Settings', '/admin', 'Back to Admin', 'Loading settings...')}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/backup"
              element={
                <AdminRoute>
                  {withRouteBoundary(<AdminBackup />, 'Data Backup & Restore', '/admin', 'Back to Admin', 'Loading backup tools...')}
                </AdminRoute>
              }
            />

            {/* 404 Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
