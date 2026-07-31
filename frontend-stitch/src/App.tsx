import { BrowserRouter, Route, Routes } from "react-router-dom";
import ComingSoon from "./pages/ComingSoon";
import DSASheet from "./pages/DSASheet";
import Home from "./pages/Home";
import LessonPage from "./pages/LessonPage";
import Login from "./pages/Login";
import Problems from "./pages/Problems";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import Register from "./pages/Register";
import ScreenIndex from "./pages/ScreenIndex";

/**
 * Route shell for Stitch screens.
 * Add a Route + page under src/pages/ as each screen is pasted.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:id" element={<ProblemWorkspace />} />
        <Route path="/dsa-sheet" element={<DSASheet />} />
        <Route path="/dsa-sheet/:sectionId/:slug" element={<LessonPage />} />
        <Route path="/screens" element={<ScreenIndex />} />
        {/* More Stitch screens go here */}
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  );
}
