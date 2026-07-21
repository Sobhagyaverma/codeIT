import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider, ToastViewport } from "./components/toast/ToastProvider";
import NavBar from "./components/NavBar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProblemList from "./pages/ProblemList";
import ProblemDetail from "./pages/ProblemDetail";
import DSASheet from "./pages/DSASheet";
import SubmissionHistory from "./pages/SubmissionHistory";
import CompetitionList from "./pages/CompetitionList";
import CompetitionRoom from "./pages/CompetitionRoom";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Help, Privacy, Terms } from "./pages/Legal";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <NavBar />
            <ToastViewport />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/help" element={<Help />} />
              <Route path="/dsa-sheet" element={<DSASheet />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/users/:username" element={<Profile />} />
              <Route
                path="/settings/profile"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute>
                    <SubmissionHistory />
                  </ProtectedRoute>
                }
              />
              <Route path="/competitions" element={<CompetitionList />} />
              <Route
                path="/competitions/:id"
                element={
                  <ProtectedRoute>
                    <CompetitionRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
