// src/components/client/ClientMenu.tsx
import React, { useState } from 'react';
import { 
  FaTachometerAlt,
  FaFileContract, 
  FaTruck, 
  FaFileInvoiceDollar,
  FaCreditCard,
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

const ClientMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: <FaTachometerAlt className="h-5 w-5" />,
      path: '/client/dashboard'
    },
    {
      id: 'contracts',
      label: 'Mis Contratos',
      icon: <FaFileContract className="h-5 w-5" />,
      path: '/client/contracts'
    },
    {
      id: 'orders',
      label: 'Órdenes de Servicio',
      icon: <FaTruck className="h-5 w-5" />,
      path: '/client/orders'
    },
    {
      id: 'invoices',
      label: 'Mis Facturas',
      icon: <FaFileInvoiceDollar className="h-5 w-5" />,
      path: '/client/invoices'
    },
    {
      id: 'payments',
      label: 'Mis Pagos',
      icon: <FaCreditCard className="h-5 w-5" />,
      path: '/client/payments'
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
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            <span className="ml-2 text-sm">Menú</span>
          </button>
        </div>
      </div>

      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive(item.path)
                    ? 'border-blue-500 text-blue-600'
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

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium
                  ${isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ClientMenu;