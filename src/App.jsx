import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddUnit from './pages/AddUnit';
import P2hService from './pages/P2hService';
import WeeklyService from './pages/WeeklyService';
import PmService from './pages/PmService';
import WorkOrder from './pages/WorkOrder';
import ReportPerbaikan from './pages/ReportPerbaikan';
import SparePartManager from './pages/SparePartManager';
import AddUser from './pages/AddUser';
import TimesheetOperator from './pages/TimesheetOperator';
import UaReport from './pages/UaReport';

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Maintenance Access Guard Component (Admin, Leading Hand Maintenance, Mechanic/Mekanik)
const MaintenanceRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const jabatan = user?.jabatan?.toLowerCase() || '';
  
  const isAuthorized = 
    jabatan.includes('admin') || 
    jabatan.includes('leading hand maintenance') || 
    jabatan.includes('mechanic') || 
    jabatan.includes('mekanik');

  if (!isAuthorized) {
    return <Navigate to="/p2h/create" replace />;
  }

  return children;
};


// Super Admin Only Guard
const SuperAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const jabatan = user?.jabatan?.toLowerCase() || '';
  
  if (!jabatan.includes('admin')) {
    return <Navigate to="/p2h/create" replace />;
  }

  return children;
};

// Index route dynamic redirect
const IndexRedirect = () => {
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-unit" element={<MaintenanceRoute><AddUnit /></MaintenanceRoute>} />
          <Route path="p2h" element={<Navigate to="/p2h/create" replace />} />
          <Route path="p2h/:tab" element={<P2hService />} />
          <Route path="weekly-service" element={<Navigate to="/weekly-service/create" replace />} />
          <Route path="weekly-service/:tab" element={<MaintenanceRoute><WeeklyService /></MaintenanceRoute>} />
          <Route path="pm-service" element={<Navigate to="/pm-service/create" replace />} />
          <Route path="pm-service/:tab" element={<MaintenanceRoute><PmService /></MaintenanceRoute>} />
          <Route path="work-order" element={<Navigate to="/work-order/create" replace />} />
          <Route path="work-order/:tab" element={<MaintenanceRoute><WorkOrder /></MaintenanceRoute>} />
          <Route path="report" element={<Navigate to="/report/create" replace />} />
          <Route path="report/:tab" element={<MaintenanceRoute><ReportPerbaikan /></MaintenanceRoute>} />
          <Route path="spare-part" element={<Navigate to="/spare-part/list" replace />} />
          <Route path="spare-part/:tab" element={<MaintenanceRoute><SparePartManager /></MaintenanceRoute>} />
          <Route path="timesheet" element={<Navigate to="/timesheet/create" replace />} />
          <Route path="timesheet/report" element={<UaReport />} />
          <Route path="timesheet/:tab" element={<TimesheetOperator />} />
          <Route path="add-user" element={<SuperAdminRoute><AddUser /></SuperAdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
