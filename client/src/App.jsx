import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

function HomePlaceholder() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Ripple</h1>
        <p className="mt-2 text-slate-600">Your project planner is ready.</p>
      </div>
    </div>
  );
}

function ProjectsPlaceholder() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Projects</h2>
        <p className="mt-2 text-slate-600">Project management screens will appear in later parts.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPlaceholder />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
