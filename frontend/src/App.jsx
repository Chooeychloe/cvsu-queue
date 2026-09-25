import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import QueueTicket from './pages/QueueTicket.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PublicDisplay from './pages/PublicDisplay.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ticket/:id" element={<QueueTicket />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff" element={<StaffDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/display" element={<PublicDisplay />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
