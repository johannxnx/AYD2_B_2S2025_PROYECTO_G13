// src/pages/Principal/Principal.tsx
import React from 'react';
import { 
  FaTruck, FaMapMarkerAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import MenuPrincipal from '../../components/principal/MenuPrincipal';

const Principal: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/registro/tipos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900">
      <MenuPrincipal onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Logística Inteligente
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-2">
              para Guatemala
            </span>
          </h1>
          
          <p className="text-gray-400 text-xl mb-8 max-w-3xl mx-auto">
            Centraliza tus operaciones de transporte, elimina la fragmentación con hojas de cálculo 
            y lleva el control en tiempo real de tus envíos en todo el país.
          </p>

          {/* Estadísticas rápidas */}
          <div className="flex justify-center space-x-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-sm text-gray-400">Sedes Operativas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-400">Clientes Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">15K+</div>
              <div className="text-sm text-gray-400">Envíos Realizados</div>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-24">
            <button
              onClick={handleLoginClick}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg transition transform hover:scale-105"
            >
              <FaTruck />
              <span>Acceder al Sistema</span>
            </button>
            <button
              onClick={handleRegisterClick}
              className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg border border-white/30 transition transform hover:scale-105"
            >
              <FaTruck />
              <span>Solicitar Registro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Sedes */}
      <div className="container mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Sedes</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Guatemala */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-blue-400 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white">Guatemala</h3>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-2">Sede Central</p>
            <p className="text-gray-400 text-sm mb-3">Km 15.5 Carretera a El Salvador</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Operaciones</span>
              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Administración</span>
            </div>
          </div>

          {/* Quetzaltenango */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-purple-400 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white">Quetzaltenango</h3>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-2">Sede Occidente</p>
            <p className="text-gray-400 text-sm mb-3">Zona 3, 4a. Calle 15-20</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">Distribución</span>
              <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">Regional</span>
            </div>
          </div>

          {/* Puerto Barrios */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-cyan-500/20 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-cyan-400 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-white">Puerto Barrios</h3>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-2">Sede Atlántico</p>
            <p className="text-gray-400 text-sm mb-3">Santo Tomás de Castilla</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">Operaciones</span>
              <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">Portuarias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Principal;