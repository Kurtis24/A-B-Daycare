import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { USER_ROLES } from './constants/roles';

// Auth Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ChildrenManagement from './pages/admin/ChildrenManagement';

// Parent Pages
import ParentGallery from './pages/parent/ParentGallery';

// Teacher Pages
import TeacherGallery from './pages/teacher/TeacherGallery';
import PhotoUpload from './pages/teacher/PhotoUpload';
import TeacherChildren from './pages/teacher/TeacherChildren';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - Dashboard redirector */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/children"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <ChildrenManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/photos"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPER_TEACHER]}>
                <TeacherGallery />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/children"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SUPER_TEACHER, USER_ROLES.ADMIN]}
              >
                <TeacherChildren />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/gallery"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SUPER_TEACHER, USER_ROLES.ADMIN]}
              >
                <TeacherGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/upload"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.SUPER_TEACHER, USER_ROLES.ADMIN]}
              >
                <PhotoUpload />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent/gallery"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                <ParentGallery />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
