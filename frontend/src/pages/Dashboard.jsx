import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../constants/roles';

const Dashboard = () => {
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userRole) {
      // Redirect based on user role
      switch (userRole.role) {
        case USER_ROLES.ADMIN:
          navigate('/admin/dashboard', { replace: true });
          break;
        case USER_ROLES.SUPER_TEACHER:
        case USER_ROLES.TEACHER:
          navigate('/teacher/gallery', { replace: true });
          break;
        case USER_ROLES.PARENT:
          navigate('/parent/gallery', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    }
  }, [userRole, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
};

export default Dashboard;
