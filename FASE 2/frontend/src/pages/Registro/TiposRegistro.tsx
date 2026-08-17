// src/pages/Registro/TiposRegistro.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRequest } from '../../services/auth/authApi';
import MenuPrincipal from '../../components/principal/MenuPrincipal';

const TiposRegistro: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nit: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerRequest({
        nit: formData.nit,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'cliente',
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
      });

      setSuccess(`${response.mensaje} Ahora puedes iniciar sesión.`);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
      setFormData({
        nit: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo completar el registro.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/registro/tipos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* MenuPrincipal at the top with dark blue background */}
      <div className="bg-blue-900 shadow-lg">
        <MenuPrincipal onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      </div>
      
      {/* Main content with registration form */}
      <div className="flex justify-center items-center">
        {/* Left: Image */}
        <div className="w-1/2 h-screen hidden lg:block relative">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Camión de carga en carretera" 
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 flex flex-col justify-center items-center p-12">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">LogiTrans</h2>
              <p className="text-xl mb-6">Tu socio estratégico en logística</p>
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Transporte seguro y eficiente</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Seguimiento en tiempo real</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cobertura nacional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Registration Form */}
        <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2 bg-white/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8 mt-16">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear Cuenta</h1>
              <p className="text-gray-600">Únete a LogiTrans y optimiza tu logística</p>
            </div>
            
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="nit" className="block text-gray-700 font-medium mb-2">NIT</label>
                <input 
                  type="text" 
                  id="nit" 
                  name="nit"
                  required
                  value={formData.nit}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                  placeholder="Ingresa tu NIT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombres" className="block text-gray-700 font-medium mb-2">Nombres</label>
                  <input 
                    type="text" 
                    id="nombres" 
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label htmlFor="apellidos" className="block text-gray-700 font-medium mb-2">Apellidos</label>
                  <input 
                    type="text" 
                    id="apellidos" 
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefono" className="block text-gray-700 font-medium mb-2">Teléfono</label>
                <input 
                  type="tel" 
                  id="telefono" 
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                  placeholder="1234-5678"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                  placeholder="juan.perez@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                    placeholder="********"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                    placeholder="********"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg py-3 px-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : 'Registrarse'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={handleLoginClick}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-300"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-500">24/7 Disponible</p>
                </div>
                <div className="text-center">
                  <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-gray-500">100% Seguro</p>
                </div>
                <div className="text-center">
                  <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-xs text-gray-500">Soporte Especializado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiposRegistro;