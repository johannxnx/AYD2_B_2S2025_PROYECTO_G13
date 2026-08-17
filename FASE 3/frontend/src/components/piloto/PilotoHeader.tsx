// src/components/piloto/PilotoHeader.tsx
import React from 'react';
import { FaUser, FaSignOutAlt, FaTruck, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface PilotoHeaderProps {
  pilotoNombre?: string;
  pilotoIdentificacion?: string;
}

const PilotoHeader: React.FC<PilotoHeaderProps> = ({ 
  pilotoNombre = "Piloto", 
  pilotoIdentificacion = ""
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaTruck className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">LogiTrans</span>
              <span className="ml-2 text-sm text-blue-200">| Piloto</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-baseline">
                <span className="text-sm text-blue-200">Bienvenido,</span>
                <span className="ml-1 text-sm font-semibold text-white">{pilotoNombre}</span>
                {pilotoIdentificacion && (
                  <span className="ml-2 text-xs text-blue-300">ID: {pilotoIdentificacion}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-blue-200 hover:text-white transition-colors">
              <FaBell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                2
              </span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <FaUser className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white hidden md:block">{pilotoNombre}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-blue-200 hover:text-white transition-colors"
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

export default PilotoHeader;