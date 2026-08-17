import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface MenuPrincipalProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ onLoginClick, onRegisterClick }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <nav className="bg-blue-900 shadow-lg w-full z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y nombre de la empresa - Clickable */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
              <FaTruck className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">LogiTrans</h1>
              <p className="text-xs text-gray-300">Guatemala, S.A.</p>
            </div>
          </button>

          {/* Botones de autenticación */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onLoginClick}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition duration-300"
            >
              <FaSignInAlt />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </button>
            <button
              onClick={onRegisterClick}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition duration-300"
            >
              <FaUserPlus />
              <span className="hidden sm:inline">Registrarse</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuPrincipal;