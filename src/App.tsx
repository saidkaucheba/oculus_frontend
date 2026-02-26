import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, RequireAuth } from "./AuthContext";

import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import SurgeonDashboard from "./pages/SurgeonDashboard";
import PatientPage from "./pages/PatientPage";
import PatientCardPage from "./pages/PatientCardPage";

// Redirect to the right dashboard based on role after login
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "surgeon") return <Navigate to="/surgeon" replace />;
  if (user.role === "district_doctor" || user.role === "admin")
    return <Navigate to="/doctor" replace />;
  // patient role
  return <Navigate to={`/patient/${user.id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Doctor routes */}
        <Route
          path="/doctor"
          element={
            <RequireAuth roles={["district_doctor", "admin"]} fallback={<Navigate to="/login" replace />}>
              <DoctorDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patient/:id"
          element={
            <RequireAuth roles={["district_doctor", "admin", "surgeon"]} fallback={<Navigate to="/login" replace />}>
              <PatientCardPage />
            </RequireAuth>
          }
        />

        {/* Surgeon routes */}
        <Route
          path="/surgeon"
          element={
            <RequireAuth roles={["surgeon", "admin"]} fallback={<Navigate to="/login" replace />}>
              <SurgeonDashboard />
            </RequireAuth>
          }
        />

        {/* Patient self-view */}
        <Route
          path="/patient/:id"
          element={
            <RequireAuth fallback={<Navigate to="/login" replace />}>
              <PatientPage />
            </RequireAuth>
          }
        />

        {/* Root: redirect based on role */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
