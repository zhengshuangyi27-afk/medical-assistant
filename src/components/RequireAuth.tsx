import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '@/src/lib/auth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  if (!getAuthToken()) {
    return <Navigate to="/profile" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
