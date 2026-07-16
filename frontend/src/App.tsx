import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProblemList from "./pages/ProblemList";
import ProblemDetail from "./pages/ProblemDetail";
import SubmissionHistory from "./pages/SubmissionHistory";
import CompetitionList from "./pages/CompetitionList";
import CompetitionRoom from "./pages/CompetitionRoom";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
          
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
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
            <Route path="*" element={<NotFound />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
