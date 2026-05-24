import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: AppRole;
  redirectTo?: string;
}

export function ProtectedRoute({ children, requireRole, redirectTo = "/auth" }: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // super_admin tem acesso a tudo
  if (requireRole && !roles.includes(requireRole) && !roles.includes("super_admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Acesso negado</h1>
        <p className="text-muted-foreground mb-6">Você não tem permissão para acessar esta área.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
}
