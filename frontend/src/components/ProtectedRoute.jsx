import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-ink-400">Carregando…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
