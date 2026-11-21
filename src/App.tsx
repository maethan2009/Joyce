import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CookieBanner } from './components/CookieBanner';
import { Analytics } from './components/Analytics';
import { useAppStore } from './store/useAppStore';
import { ToastContainer } from './components/ui/Toast';

const LandingPage = lazy(() =>
  import('./features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const DashboardView = lazy(() =>
  import('./features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })),
);
const EventsPage = lazy(() => import('./features/events/EventsPage').then((m) => ({ default: m.EventsPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const EnrollPage = lazy(() => import('./features/auth/EnrollPage').then((m) => ({ default: m.EnrollPage })));
const ForbiddenPage = lazy(() =>
  import('./features/auth/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);
const NotFoundPage = lazy(() =>
  import('./features/auth/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ElectionListPage = lazy(() =>
  import('./features/elections/ElectionListPage').then((m) => ({ default: m.ElectionListPage })),
);
const ElectionDetailPage = lazy(() =>
  import('./features/elections/ElectionDetailPage').then((m) => ({ default: m.ElectionDetailPage })),
);
const ElectionResultsPage = lazy(() =>
  import('./features/elections/ElectionResultsPage').then((m) => ({ default: m.ElectionResultsPage })),
);
const StudentCardPage = lazy(() =>
  import('./features/student-card/StudentCardPage').then((m) => ({ default: m.StudentCardPage })),
);
const AcademicHubPage = lazy(() =>
  import('./features/academic-hub/AcademicHubPage').then((m) => ({ default: m.AcademicHubPage })),
);
const SkillLinkPage = lazy(() =>
  import('./features/skilllink/SkillLinkPage').then((m) => ({ default: m.SkillLinkPage })),
);
const MentorshipPage = lazy(() =>
  import('./features/mentorship/MentorshipPage').then((m) => ({ default: m.MentorshipPage })),
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const OrientationPage = lazy(() =>
  import('./features/orientation/OrientationPage').then((m) => ({ default: m.OrientationPage })),
);
const EduAmisPage = lazy(() =>
  import('./features/eduamis/EduAmisPage').then((m) => ({ default: m.EduAmisPage })),
);
const MessagingPage = lazy(() =>
  import('./features/messaging/MessagingPage').then((m) => ({ default: m.MessagingPage })),
);
const SuperAdminPage = lazy(() =>
  import('./features/admin/SuperAdminPage').then((m) => ({ default: m.SuperAdminPage })),
);
const SchoolAdminPage = lazy(() =>
  import('./features/school/SchoolAdminPage').then((m) => ({ default: m.SchoolAdminPage })),
);
const ProPortalPage = lazy(() =>
  import('./features/pro/ProPortalPage').then((m) => ({ default: m.ProPortalPage })),
);
const LegalPage = lazy(() => import('./features/legal/LegalPage').then((m) => ({ default: m.LegalPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">Chargement…</div>
  );
}

export function App() {
  const user = useAppStore((s) => s.user);
  const bootstrapSession = useAppStore((s) => s.bootstrapSession);
  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  return (
    <BrowserRouter>
      <CookieBanner />
      <Analytics />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/enroll" element={<EnrollPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardView />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route
                        path="/elections"
                        element={
                          <ProtectedRoute roles={['student_verified', 'student', 'school_admin', 'super_admin', 'election_admin', 'campus_admin']}>
                            <ElectionListPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/elections/:id" element={<ElectionDetailPage />} />
                      <Route path="/elections/:id/results" element={<ElectionResultsPage />} />
                      <Route
                        path="/student-card"
                        element={
                          <ProtectedRoute roles={['student_verified', 'student', 'super_admin', 'campus_admin']}>
                            <StudentCardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hub"
                        element={
                          <ProtectedRoute roles={['student_verified', 'student', 'school_admin', 'super_admin', 'campus_admin']}>
                            <AcademicHubPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/skilllink" element={<SkillLinkPage />} />
                      <Route path="/mentorship" element={<Navigate to="/events" replace />} />
                      <Route path="/orientation" element={<OrientationPage />} />
                      <Route path="/eduamis" element={<EduAmisPage />} />
                      <Route path="/messaging" element={<MessagingPage />} />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute roles={['super_admin']}>
                            <SuperAdminPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/school"
                        element={
                          <ProtectedRoute roles={['school_admin', 'super_admin']}>
                            <SchoolAdminPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/pro"
                        element={
                          <ProtectedRoute roles={['pro_recruiter', 'super_admin']}>
                            <ProPortalPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
