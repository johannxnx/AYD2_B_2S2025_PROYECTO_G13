// src/components/finanzas/FinanzasHeader.tsx
import React from 'react';
import { FaUser, FaSignOutAlt, FaChartBar, FaBell, FaDollarSign } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface FinanzasHeaderProps {
  userName?: string;
  userRole?: string;
}

const FinanzasHeader: React.FC<FinanzasHeaderProps> = ({
  userName = "Agente Financiero",
  userRole = "Finanzas"
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaDollarSign className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">LogiTrans</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Finanzas
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-baseline">
                <FaChartBar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">Panel de Control Financiero</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="relative text-gray-500 hover:text-gray-700">
              <FaBell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* Info de usuario */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="h-4 w-4 text-blue-600" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-50"
            >
              <FaSignOutAlt className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FinanzasHeader;