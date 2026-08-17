import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = user.role?.toLowerCase();
    const hasAllowedRole = allowedRoles.some(
      role => role.toLowerCase() === userRole
    );

    if (!hasAllowedRole) {
      // Redirigir según el rol del usuario
      if (userRole === 'client' || userRole === 'cliente') {
        return <Navigate to="/client/dashboard" replace />;
      } else if (userRole === 'logistic' || userRole === 'logistico' || userRole === 'agente_logistico' ) {
        return <Navigate to="/logistico/dashboard" replace />;
      } else if (userRole === 'piloto') {
        return <Navigate to="/piloto/dashboard" replace />;
      } else if (userRole === 'operativo') {
        return <Navigate to="/operativo/dashboard" replace />;
      } else if (userRole === 'patio') {
        return <Navigate to="/patio/dashboard" replace />;
      } else if (userRole === 'finanzas') {
        return <Navigate to="/finanzas/facturacion" replace />;
      } else if (userRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;