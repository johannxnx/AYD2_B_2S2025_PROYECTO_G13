// src/components/finanzas/FinanzasMenu.tsx
import React, { useState } from 'react';
import {
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaChartBar,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const FinanzasMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Gerencial',
      icon: <FaChartBar className="h-5 w-5" />,
      path: '/finanzas/dashboard'
    },
    {
      id: 'facturacion',
      label: 'Facturación',
      icon: <FaFileInvoiceDollar className="h-5 w-5" />,
      path: '/finanzas/facturacion'
    },
    {
      id: 'pagos',
      label: 'Pagos',
      icon: <FaMoneyCheckAlt className="h-5 w-5" />,
      path: '/finanzas/pagos'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Botón de menú móvil */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            <span className="ml-2 text-sm font-medium">Menú Finanzas</span>
          </button>
        </div>
      </div>

      {/* Menú desktop */}
      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive(item.path)
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center w-full px-3 py-3 rounded-md text-base font-medium
                  ${isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default FinanzasMenu;