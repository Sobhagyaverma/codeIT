import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SoftPageFade from "./components/SoftPageFade";
import RequireAdmin from "./components/RequireAdmin";
import { NotificationsProvider } from "./context/NotificationsContext";
import { ToastProvider } from "./context/ToastContext";
import About from "./pages/About";
import CodeRoomHub from "./pages/CodeRoomHub";
import Competitions from "./pages/Competitions";
import Contact from "./pages/Contact";
import DSASheet from "./pages/DSASheet";
import ForgotPassword from "./pages/ForgotPassword";
import Friends from "./pages/Friends";
import Help from "./pages/Help";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import LessonPage from "./pages/LessonPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Problems from "./pages/Problems";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import QuickContestCreate from "./pages/QuickContestCreate";
import QuickContestLobby from "./pages/QuickContestLobby";
import QuickContestLive from "./pages/QuickContestLive";
import Register from "./pages/Register";
import SubmissionHistory from "./pages/SubmissionHistory";
import Terms from "./pages/Terms";
import VerifyEmail from "./pages/VerifyEmail";

/** Monaco / admin-heavy screens — code-split to keep initial bundle smaller. */
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProblemWorkspace = lazy(() => import("./pages/ProblemWorkspace"));
const ProblemCollabRoom = lazy(() => import("./pages/ProblemCollabRoom"));
const CodeRoomWorkspace = lazy(() => import("./pages/CodeRoomWorkspace"));
const CompetitionRoom = lazy(() => import("./pages/CompetitionRoom"));
const QuickContestProblem = lazy(() => import("./pages/QuickContestProblem"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface-variant">
      Loading…
    </div>
  );
}

/**
 * Route shell for the Stitch UI.
 * Static assets are same-origin with /api, /ws, /sync behind Nginx in production.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <NotificationsProvider>
          <SoftPageFade>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/problems" element={<Problems />} />
                <Route path="/problems/:id" element={<ProblemWorkspace />} />
                <Route
                  path="/problems/:id/room/:roomId"
                  element={<ProblemCollabRoom />}
                />
                <Route path="/dsa-sheet" element={<DSASheet />} />
                <Route
                  path="/dsa-sheet/:sectionId/:slug"
                  element={<LessonPage />}
                />
                <Route path="/coderoom" element={<CodeRoomHub />} />
                <Route path="/coderoom/:roomId" element={<CodeRoomWorkspace />} />
                <Route path="/competitions" element={<Competitions />} />
                <Route
                  path="/competitions/quick"
                  element={<QuickContestCreate />}
                />
                <Route
                  path="/competitions/quick/:id"
                  element={<QuickContestLobby />}
                />
                <Route
                  path="/competitions/quick/:id/live"
                  element={<QuickContestLive />}
                />
                <Route
                  path="/competitions/quick/:id/problems/:problemId"
                  element={<QuickContestProblem />}
                />
                <Route path="/competitions/:id" element={<CompetitionRoom />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/users/:username" element={<Profile />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminDashboard />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/competitions"
                  element={
                    <RequireAdmin>
                      <AdminDashboard />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/competitions/create"
                  element={
                    <RequireAdmin>
                      <AdminDashboard />
                    </RequireAdmin>
                  }
                />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/submissions" element={<SubmissionHistory />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SoftPageFade>
        </NotificationsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
