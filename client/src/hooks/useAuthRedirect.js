import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function useAuthRedirect(path = '/feed') {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(path, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, path]);
}