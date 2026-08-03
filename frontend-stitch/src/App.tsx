import { BrowserRouter, Route, Routes } from "react-router-dom";
import SoftPageFade from "./components/SoftPageFade";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import CodeRoomHub from "./pages/CodeRoomHub";
import CodeRoomWorkspace from "./pages/CodeRoomWorkspace";
import CompetitionRoom from "./pages/CompetitionRoom";
import Competitions from "./pages/Competitions";
import Contact from "./pages/Contact";
import DSASheet from "./pages/DSASheet";
import Help from "./pages/Help";
import Home from "./pages/Home";
import LessonPage from "./pages/LessonPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import ProblemCollabRoom from "./pages/ProblemCollabRoom";
import Problems from "./pages/Problems";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import Register from "./pages/Register";
import ScreenIndex from "./pages/ScreenIndex";
import SubmissionHistory from "./pages/SubmissionHistory";
import Terms from "./pages/Terms";

/**
 * Route shell for Stitch screens.
 * Add a Route + page under src/pages/ as each screen is pasted.
 */
export default function App() {
  return (
    <BrowserRouter>
      <SoftPageFade>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<ProblemWorkspace />} />
          <Route
            path="/problems/:id/room/:roomId"
            element={<ProblemCollabRoom />}
          />
          <Route path="/dsa-sheet" element={<DSASheet />} />
          <Route path="/dsa-sheet/:sectionId/:slug" element={<LessonPage />} />
          <Route path="/coderoom" element={<CodeRoomHub />} />
          <Route path="/coderoom/:roomId" element={<CodeRoomWorkspace />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/:id" element={<CompetitionRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:username" element={<Profile />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/competitions" element={<AdminDashboard />} />
          <Route
            path="/admin/competitions/create"
            element={<AdminDashboard />}
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/submissions" element={<SubmissionHistory />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/screens" element={<ScreenIndex />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SoftPageFade>
    </BrowserRouter>
  );
}
