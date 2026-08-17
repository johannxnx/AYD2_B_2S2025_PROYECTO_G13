import React, { useState } from 'react';
import { FaTruck, FaEye, FaEyeSlash, FaMapMarkerAlt, FaShieldAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../../services/auth/authApi';
import { useAuth } from '../../context/AuthContext';
import MenuPrincipal from '../../components/principal/MenuPrincipal';




const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginRequest({
        email: formData.email,
        password: formData.password,
      });

      setSession(response.data.token, {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        nombres: response.data.user.nombres,
        apellidos: response.data.user.apellidos,
      });

      const userRole = response.data.user.role?.toLowerCase();
      
      // Redirigir según el rol del usuario
      if (userRole === 'client' || userRole === 'cliente') {
        navigate('/client/dashboard');
      } else if (['logistic', 'logistico', 'operativo'].includes(userRole)) {
        navigate('/logistico/dashboard');
      } else if (userRole === 'piloto') {
        navigate('/piloto/dashboard');
      } else if (userRole === 'finanzas' || userRole === 'gerencia') {
        navigate('/finanzas/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/panel');
      } 
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error de conexión. Por favor, intenta nuevamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/registro/tipos');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* MenuPrincipal at the top with dark blue background */}
      <div className="bg-blue-900 shadow-lg">
        <MenuPrincipal onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      </div>
      
      {/* Main content - Login Form and Image */}
      <div className="grid grid-cols-1 md:grid-cols-12 relative">
        {/* Columna izquierda - Formulario */}
        <div className="col-span-1 md:col-span-5 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 text-white p-8 md:p-12 relative min-h-[calc(100vh-72px)]">
          <div className="absolute top-0 right-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-blue-900 via-blue-900/80 to-transparent z-10"></div>
          <div className="absolute top-0 right-0 bottom-0 w-64 md:w-96 bg-gradient-to-l from-blue-900/60 via-blue-900/20 to-transparent z-5 blur-sm"></div>

          <div className="h-full flex flex-col justify-center max-w-md mx-auto relative z-20">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <FaTruck className="w-7 h-7 text-blue-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">LogiTrans</h1>
                  <p className="text-sm text-blue-200">Guatemala, S.A.</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold mt-8">Iniciar Sesión</h2>
              <p className="text-blue-200 mt-3">Accede al sistema de gestión logística</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-100">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-3 text-blue-100">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-blue-800/40 border-2 border-blue-700/60 py-4 pl-10 pr-4 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition placeholder-blue-300/60 shadow-inner text-white"
                    placeholder="tucorreo@logitrans.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-blue-100">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-blue-800/40 border-2 border-blue-700/60 py-4 pl-10 pr-12 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition placeholder-blue-300/60 shadow-inner text-white"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition"
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-blue-900 hover:bg-blue-100 font-bold rounded-xl transition duration-300 shadow-lg hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900 mr-3"></div>
                    Ingresando...
                  </>
                ) : (
                  'INGRESAR'
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-blue-700/50">
              <p className="text-center text-blue-200">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="font-bold text-white hover:text-blue-100 underline transition hover:scale-105 inline-block"
                  disabled={isLoading}
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha - Imagen */}
        <div className="col-span-1 md:col-span-7 relative min-h-[calc(100vh-72px)]">
          <div className="absolute top-0 left-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-blue-900/90 via-blue-900/70 to-transparent z-10"></div>
          <div className="absolute top-0 left-0 bottom-0 w-64 md:w-96 bg-gradient-to-r from-blue-900/60 via-blue-900/30 to-transparent z-5 blur-sm"></div>

          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-blue-900/30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12 text-white">
            <div className="max-w-xl">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-2xl">
                Gestiona tu flota en tiempo real
              </h3>
              <p className="text-lg md:text-xl text-blue-100 drop-shadow-lg mb-6">
                Control total de tus operaciones logísticas. Órdenes, facturación y reportes en un solo lugar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">3 Sedes</p>
                    <p className="text-sm text-blue-100 mt-1">Guatemala, Xela, Pto. Barrios</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <FaShieldAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Control de Crédito</p>
                    <p className="text-sm text-blue-100 mt-1">Bloqueo automático</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <FaClock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Tiempo Real</p>
                    <p className="text-sm text-blue-100 mt-1">Seguimiento de envíos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">FEL</p>
                    <p className="text-sm text-blue-100 mt-1">Facturación electrónica</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="w-4 h-4 rounded-full bg-white shadow-lg animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-white/60"></div>
              <div className="w-3 h-3 rounded-full bg-white/60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;