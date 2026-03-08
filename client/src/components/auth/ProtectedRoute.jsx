import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../common/PageLoader';

function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <PageLoader text="Validando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;