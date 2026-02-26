import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import SurgeonDashboard from "./pages/SurgeonDashboard";
import PatientPage from "./pages/PatientPage";
import PatientCardPage from "./pages/PatientCardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patient/:id" element={<PatientCardPage />} />
        <Route path="/surgeon" element={<SurgeonDashboard />} />
        <Route path="/patient/:id" element={<PatientPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;