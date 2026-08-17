import React, { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaTruck, FaBell, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface LogisticHeaderProps {
  userName?: string;
  userRole?: string;
}

interface Notificacion {
  tipo: 'clientes' | 'ordenes' | 'contratos' | 'bloqueados';
  titulo: string;
  cantidad: number;
  icono: string;
}

const LogisticHeader: React.FC<LogisticHeaderProps> = ({ 
  userName = "Operador Logístico",
  userRole = "Logística"
}) => {
  const navigate = useNavigate();
  const { token, logout: logoutAuth } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!token) {
          console.warn('No token available for notifications');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/notificaciones`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notificaciones || []);
          setNotificationCount(data.total || 0);
        } else if (response.status === 401) {
          console.warn('Token unauthorized, refreshing...');
          logoutAuth();
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [token, logoutAuth]);

  const handleLogout = () => {
    logoutAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaTruck className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">LogiTrans</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Logística
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-baseline">
                <FaChartLine className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">Panel de Control Operativo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaBell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <div
                          key={index}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0"
                          onClick={() => {
                            if (notif.tipo === 'clientes') navigate('/logistico/clientes');
                            else if (notif.tipo === 'ordenes') navigate('/logistico/ordenes');
                            else if (notif.tipo === 'contratos') navigate('/logistico/contratos');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl pt-1">{notif.icono}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{notif.titulo}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notif.cantidad} {notif.cantidad === 1 ? 'elemento' : 'elementos'} pendiente{notif.cantidad !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">Sin notificaciones</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info de usuario */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FaUser className="h-4 w-4 text-orange-600" />
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

export default LogisticHeader;