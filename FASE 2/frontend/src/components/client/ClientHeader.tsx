// src/components/client/ClientHeader.tsx
import React from 'react';
import { FaUser, FaSignOutAlt, FaBuilding, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface ClientHeaderProps {
  companyName?: string;
  userName?: string;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ 
  companyName = "Mi Empresa", 
  userName = "Cliente" 
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
              <FaBuilding className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">LogiTrans</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-baseline">
                <span className="text-sm text-gray-500">Bienvenido,</span>
                <span className="ml-1 text-sm font-medium text-gray-900">{companyName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <FaBell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{userName}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
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

export default ClientHeader;