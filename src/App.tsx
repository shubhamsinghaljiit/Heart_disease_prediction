// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your pages
import Index from "./pages/Index";
import DoctorLogin from "./pages/DoctorLogin";          // <-- add this file
import DoctorDashboard from "./pages/DoctorDashboard";  // <-- add this fil
const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Patient home page */}
      <Route path="/" element={<Index />} />

      {/* Doctor login page */}
      <Route path="/doctorlogin" element={<DoctorLogin />} />

      {/* Doctor dashboard page */}
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;
