import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Save current path so we can redirect back after login
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  return children;
}