import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaSearch,
  FaSync,
  FaEdit,
  FaEye,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaShieldAlt,
  FaExclamationTriangle,
  FaDollarSign,
  FaFileContract,
} from 'react-icons/fa';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useClientes, type Cliente } from '../../services/Logistico/hooks/useClientes';
import { useValidarCliente } from '../../services/Logistico/hooks/useValidarCliente';
import { useRiesgo, type RiesgoCliente } from '../../services/Logistico/hooks/useRiesgo';
import { formatDate, formatMoney } from '../../services/Logistico/Logistico';

interface FilterOptions {
  searchTerm: string;
  tipo_usuario: string;
  estado: string;
}

const ClientesList: React.FC = () => {
  const { clientes, loading, error, listarClientes, modificarCliente, crearCliente, cambiarEstadoCliente, limpiarError } = useClientes();
  const { validarCliente, validacion, loading: validationLoading, error: validationError, limpiarError: limpiarErrorValidacion } = useValidarCliente();
  const { error: riesgoError, limpiarError: limpiarErrorRiesgo, crearRiesgo, obtenerRiesgo } = useRiesgo();
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    tipo_usuario: '',
    estado: '', // Vacío para traer todos los estados (PENDIENTE_ACEPTACION, ACTIVO, etc)
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRiesgoModal, setShowRiesgoModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [riesgoFormData, setRiesgoFormData] = useState<Omit<RiesgoCliente, 'id' | 'usuario_id' | 'evaluado_por' | 'fecha_evaluacion' | 'evaluado_por_nombre'> | null>(null);
  const [riesgoFormLoading, setRiesgoFormLoading] = useState(false);
  const [riesgoDetalle, setRiesgoDetalle] = useState<RiesgoCliente | null>(null);
  const [newCliente, setNewCliente] = useState<Partial<Cliente> & { password?: string }>({
    nombre: '',
    email: '',
    nit: '',
    telefono: '',
    pais: '',
    tipo_usuario: 'CLIENTE_CORPORATIVO',
    estado: 'ACTIVO',
    password: '',
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    await listarClientes({
      tipo_usuario: filters.tipo_usuario || undefined,
      estado: filters.estado || undefined,
      nombre: filters.searchTerm || undefined,
    });
  };

  // Cuando cambian los filtros principales, recargar
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarClientes();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.tipo_usuario, filters.estado]);

  // Filtrar clientes por búsqueda local
  const clientesFiltrados = clientes.filter(cliente => {
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.nit?.toLowerCase().includes(searchLower)
    );
  });

  // Dividir clientes en tres secciones
  const clientesPendientes = clientesFiltrados.filter(c => c.tipo_usuario === 'CLIENTE_CORPORATIVO' && c.estado === 'PENDIENTE_ACEPTACION');
  const clientesCorporativos = clientesFiltrados.filter(c => c.tipo_usuario === 'CLIENTE_CORPORATIVO' && c.estado !== 'PENDIENTE_ACEPTACION');
  const clientesOtros = clientesFiltrados.filter(c => c.tipo_usuario !== 'CLIENTE_CORPORATIVO');

  const tiposUsuario = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CLIENTE_CORPORATIVO', label: 'Cliente Corporativo' },
    { value: 'AGENTE_OPERATIVO', label: 'Agente Operativo' },
    { value: 'AGENTE_LOGISTICO', label: 'Agente Logistico' },
    { value: 'AGENTE_FINANCIERO', label: 'Agente Financiero' },
    { value: 'ENCARGADO_PATIO', label: 'Encargado de Patio' },
    { value: 'AREA_CONTABLE', label: 'Area Contable' },
    { value: 'GERENCIA', label: 'Gerencia' },
    { value: 'PILOTO', label: 'Piloto' },
  ];

  const estadosCliente = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDIENTE_ACEPTACION', label: 'Pendiente Aceptacion' },
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'INACTIVO', label: 'Inactivo' },
  ];

  const handleViewDetail = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetailModal(true);
    // Cargar riesgo del cliente si existe
    try {
      const riesgo = await obtenerRiesgo(cliente.id);
      setRiesgoDetalle(riesgo);
    } catch (err) {
      // Si no tiene riesgo aún, queda null
      setRiesgoDetalle(null);
    }
  };

  const handleEditClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setEditingCliente({ ...cliente });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditingCliente(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveEdit = async () => {
    if (!selectedCliente?.id || !editingCliente) return;
    
    setEditLoading(true);
    setEditError(null);
    try {
      const estadoChanged = editingCliente.estado !== selectedCliente.estado;
      
      if (estadoChanged) {
        // Si cambio el estado, usar el endpoint especifico
        await cambiarEstadoCliente(selectedCliente.id, editingCliente.estado || 'ACTIVO', 'Cambio de estado desde edicion');
      }
      
      // Guardar otros cambios
      const datosActualizacion = { ...editingCliente };
      delete datosActualizacion.estado; // No incluir estado en el PUT si ya lo manejamos con PATCH
      
      if (Object.keys(datosActualizacion).some(key => datosActualizacion[key as keyof typeof datosActualizacion] !== selectedCliente[key as keyof typeof selectedCliente])) {
        await modificarCliente(selectedCliente.id, datosActualizacion);
      }
      
      await cargarClientes();
      setShowEditModal(false);
      setSelectedCliente(null);
      setEditingCliente(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleValidarCliente = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowValidationModal(true);
    limpiarErrorValidacion();
    await validarCliente(cliente.id);
  };

  const handleCreateChange = (field: string, value: string) => {
    setNewCliente(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCreate = async () => {
    if (!newCliente.nombre || !newCliente.email || !newCliente.nit || !newCliente.tipo_usuario || !(newCliente as any).password) {
      setEditError('Por favor completa todos los campos requeridos, incluyendo la contraseña');
      return;
    }
    if ((newCliente as any).password.length < 6) {
      setEditError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      // Si es cliente corporativo, crear con PENDIENTE_ACEPTACION
      const estadoInicial = newCliente.tipo_usuario === 'CLIENTE_CORPORATIVO' ? 'PENDIENTE_ACEPTACION' : 'ACTIVO';
      await crearCliente({ ...newCliente, estado: estadoInicial });
      await cargarClientes();
      setShowCreateModal(false);
      setNewCliente({
        nombre: '',
        email: '',
        nit: '',
        telefono: '',
        pais: '',
        tipo_usuario: 'CLIENTE_CORPORATIVO',
        estado: 'ACTIVO',
        password: '',
      });
    } catch (err) {
      let errorMessage = 'Error al crear usuario';
      
      if (err instanceof Error) {
        // Si el error tiene la propiedad mensaje (del backend)
        if ((err as any).mensaje) {
          errorMessage = (err as any).mensaje;
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        if (errorObj.mensaje) {
          errorMessage = errorObj.mensaje;
        }
      }
      
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenRiesgoModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    // Abrir modal con valores por defecto (no intentar cargar riesgo anterior)
    setRiesgoFormData({
      riesgo_capacidad_pago: 'BAJO',
      riesgo_lavado_dinero: 'BAJO',
      riesgo_aduanas: 'BAJO',
      riesgo_mercancia: 'BAJO',
    });
    setShowRiesgoModal(true);
    limpiarErrorRiesgo();
  };

  const handleRiesgoFormChange = (field: string, value: string) => {
    setRiesgoFormData(prev => ({
      ...prev!,
      [field]: value as 'BAJO' | 'MEDIO' | 'ALTO',
    }));
  };

  const handleSaveRiesgo = async () => {
    if (!selectedCliente || !riesgoFormData) return;

    setRiesgoFormLoading(true);
    try {
      // Crear evaluación de riesgo
      // El backend cambia automáticamente de PENDIENTE_ACEPTACION a ACTIVO si aplica
      await crearRiesgo(selectedCliente.id, riesgoFormData);
      
      setShowRiesgoModal(false);
      setRiesgoFormData(null);
      setSelectedCliente(null);
      limpiarErrorRiesgo();
      
      // Recargar lista de clientes para ver los cambios de estado
      await cargarClientes();
    } catch (err) {
      console.error('Error al guardar riesgo:', err);
    } finally {
      setRiesgoFormLoading(false);
    }
  };


  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      PENDIENTE_ACEPTACION: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaExclamationTriangle /> },
      ACTIVO: { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle /> },
      INACTIVO: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaTimesCircle /> },
      BLOQUEADO: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaLock /> },
    };

    const badge = badges[estado] || badges['INACTIVO'];
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        <span>{estado}</span>
      </span>
    );
  };

  const getTipoUsuarioBadge = (tipo: string) => {
    const badges: Record<string, { bg: string; label: string }> = {
      CLIENTE_CORPORATIVO: { bg: 'bg-blue-100 text-blue-800', label: 'Cliente Corporativo' },
      AGENTE_OPERATIVO: { bg: 'bg-green-100 text-green-800', label: 'Agente Operativo' },
      AGENTE_LOGISTICO: { bg: 'bg-indigo-100 text-indigo-800', label: 'Agente Logístico' },
      AGENTE_FINANCIERO: { bg: 'bg-yellow-100 text-yellow-800', label: 'Agente Financiero' },
      ENCARGADO_PATIO: { bg: 'bg-orange-100 text-orange-800', label: 'Encargado de Patio' },
      AREA_CONTABLE: { bg: 'bg-cyan-100 text-cyan-800', label: 'Área Contable' },
      GERENCIA: { bg: 'bg-red-100 text-red-800', label: 'Gerencia' },
      PILOTO: { bg: 'bg-purple-100 text-purple-800', label: 'Piloto' },
    };

    const badge = badges[tipo] || { bg: 'bg-gray-100 text-gray-800', label: tipo };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  const getEstadoEvaluacion = (estado: string) => {
    if (estado === 'ACTIVO') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="h-3 w-3" />
          <span>Evaluado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <FaExclamationTriangle className="h-3 w-3" />
        <span>Sin evaluar</span>
      </span>
    );
  };

  return (
    <>
      <LogisticHeader />
      <LogisticMenu />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Encabezado */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion de Clientes y Usuarios</h1>
                <p className="text-gray-600 mt-1">
                  Total: {clientesFiltrados.length} usuario(s) - {clientesPendientes.length} Pendiente(s) | {clientesCorporativos.length} Corporativo(s) | {clientesOtros.length} Staff
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button
                onClick={limpiarError}
                className="ml-4 underline hover:no-underline"
              >
                Descartar
              </button>
            </div>
          )}

          {/* Busqueda y Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-4">
              {/* Busqueda */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, NIT..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    showFilters
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaFilter />
                  <span>Filtros</span>
                </button>

                <button
                  onClick={cargarClientes}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                  <span>Recargar</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
                >
                  <span>+</span>
                  <span>Crear Usuario</span>
                </button>
              </div>
            </div>

            {/* Filtros expandibles */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cliente
                  </label>
                  <select
                    value={filters.tipo_usuario}
                    onChange={(e) =>
                      setFilters({ ...filters, tipo_usuario: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tiposUsuario.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) =>
                      setFilters({ ...filters, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {estadosCliente.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECCION 0: CLIENTES PENDIENTES DE ACEPTACION */}
          {clientesPendientes.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FaExclamationTriangle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Clientes Pendientes de Aceptacion</h2>
                  <p className="text-gray-600 text-sm">Nuevos clientes corporativos que requieren aceptacion y evaluacion de riesgo</p>
                </div>
                <span className="ml-auto text-3xl font-bold text-purple-600">{clientesPendientes.length}</span>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50 border-b border-purple-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                          NIT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientesPendientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-purple-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <a
                                href={`mailto:${cliente.email}`}
                                className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FaEnvelope className="h-4 w-4" />
                                <span>{cliente.email}</span>
                              </a>
                              {cliente.telefono && (
                                <a
                                  href={`tel:${cliente.telefono}`}
                                  className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  <FaPhone className="h-4 w-4" />
                                  <span>{cliente.telefono}</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-600">{cliente.nit}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleOpenRiesgoModal(cliente)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                title="Aceptar y Evaluar Riesgo"
                              >
                                Aceptar y Evaluar
                              </button>
                              <button
                                onClick={() => handleViewDetail(cliente)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ver detalle"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECCION 1: CLIENTES CORPORATIVOS (con bloqueo automático) */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaCheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Clientes Corporativos</h2>
                <p className="text-gray-600 text-sm">Clientes con contratos y validacion de bloqueo automatico</p>
              </div>
              <span className="ml-auto text-3xl font-bold text-blue-600">{clientesCorporativos.length}</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading && clientesCorporativos.length === 0 ? (
                <div className="p-8 text-center">
                  <FaSync className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Cargando clientes corporativos...</p>
                </div>
              ) : clientesCorporativos.length === 0 ? (
                <div className="p-8 text-center">
                  <FaUsers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay clientes corporativos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50 border-b border-blue-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          NIT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Riesgo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientesCorporativos.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <a
                                href={`mailto:${cliente.email}`}
                                className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FaEnvelope className="h-4 w-4" />
                                <span>{cliente.email}</span>
                              </a>
                              {cliente.telefono && (
                                <a
                                  href={`tel:${cliente.telefono}`}
                                  className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  <FaPhone className="h-4 w-4" />
                                  <span>{cliente.telefono}</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-600">{cliente.nit}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              {cliente.pais || 'No registrado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoBadge(cliente.estado)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoEvaluacion(cliente.estado)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1 flex-wrap">
                              <button
                                onClick={() => handleViewDetail(cliente)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ver detalle"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleValidarCliente(cliente)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                title="Validar bloqueo automatico"
                              >
                                <FaShieldAlt className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditClick(cliente)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="Editar"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SECCION 2: OTROS USUARIOS (STAFF) */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <FaUsers className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Otros Usuarios (Staff)</h2>
                <p className="text-gray-600 text-sm">Agentes, pilotos, personal interno y administrativo</p>
              </div>
              <span className="ml-auto text-3xl font-bold text-gray-600">{clientesOtros.length}</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading && clientesOtros.length === 0 ? (
                <div className="p-8 text-center">
                  <FaSync className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Cargando usuarios...</p>
                </div>
              ) : clientesOtros.length === 0 ? (
                <div className="p-8 text-center">
                  <FaUsers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay otros usuarios</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientesOtros.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <a
                                href={`mailto:${cliente.email}`}
                                className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FaEnvelope className="h-4 w-4" />
                                <span>{cliente.email}</span>
                              </a>
                              {cliente.telefono && (
                                <a
                                  href={`tel:${cliente.telefono}`}
                                  className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  <FaPhone className="h-4 w-4" />
                                  <span>{cliente.telefono}</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTipoUsuarioBadge(cliente.tipo_usuario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoBadge(cliente.estado)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDetail(cliente)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ver detalle"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditClick(cliente)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="Editar"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {showDetailModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detalle del Cliente</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setRiesgoDetalle(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <p className="text-gray-900">
                    {selectedCliente.nombre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT / Documento
                  </label>
                  <p className="text-gray-900 font-mono">{selectedCliente.nit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 break-all">{selectedCliente.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <p className="text-gray-900">{selectedCliente.telefono || 'No registrado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <p>{getTipoUsuarioBadge(selectedCliente.tipo_usuario)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <p>{getEstadoBadge(selectedCliente.estado)}</p>
                </div>
              </div>

              {selectedCliente.fecha_creacion && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Creacion
                    </label>
                    <p className="text-gray-900">{formatDate(selectedCliente.fecha_creacion)}</p>
                  </div>
                  {selectedCliente.fecha_actualizacion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ultima Actualizacion
                      </label>
                      <p className="text-gray-900">{formatDate(selectedCliente.fecha_actualizacion)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sección de Riesgo Evaluado */}
              {riesgoDetalle && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluación de Riesgo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Riesgo Capacidad de Pago
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        riesgoDetalle.riesgo_capacidad_pago === 'BAJO' ? 'bg-green-100 text-green-800' :
                        riesgoDetalle.riesgo_capacidad_pago === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riesgoDetalle.riesgo_capacidad_pago}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Riesgo Lavado de Dinero
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        riesgoDetalle.riesgo_lavado_dinero === 'BAJO' ? 'bg-green-100 text-green-800' :
                        riesgoDetalle.riesgo_lavado_dinero === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riesgoDetalle.riesgo_lavado_dinero}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Riesgo Aduanas
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        riesgoDetalle.riesgo_aduanas === 'BAJO' ? 'bg-green-100 text-green-800' :
                        riesgoDetalle.riesgo_aduanas === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riesgoDetalle.riesgo_aduanas}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Riesgo Mercancía
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        riesgoDetalle.riesgo_mercancia === 'BAJO' ? 'bg-green-100 text-green-800' :
                        riesgoDetalle.riesgo_mercancia === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riesgoDetalle.riesgo_mercancia}
                      </span>
                    </div>
                  </div>
                  {riesgoDetalle.fecha_evaluacion && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Evaluación
                      </label>
                      <p className="text-gray-900">{formatDate(riesgoDetalle.fecha_evaluacion)}</p>
                    </div>
                  )}
                  {riesgoDetalle.evaluado_por_nombre && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Evaluado por
                      </label>
                      <p className="text-gray-900">{riesgoDetalle.evaluado_por_nombre}</p>
                    </div>
                  )}
                </div>
              )}

              {!riesgoDetalle && selectedCliente.estado !== 'PENDIENTE_ACEPTACION' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm italic">No hay evaluación de riesgo registrada</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setRiesgoDetalle(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setRiesgoDetalle(null);
                  handleEditClick(selectedCliente!);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {editError && (
              <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {editError}
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editingCliente.nombre || ''}
                    onChange={(e) => handleEditChange('nombre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT
                  </label>
                  <input
                    type="text"
                    value={editingCliente.nit || ''}
                    onChange={(e) => handleEditChange('nit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingCliente.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editingCliente.telefono || ''}
                    onChange={(e) => handleEditChange('telefono', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  value={editingCliente.pais || ''}
                  onChange={(e) => handleEditChange('pais', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un país</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value="El Salvador">El Salvador</option>
                  <option value="Honduras">Honduras</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Usuario
                  </label>
                  <select
                    value={editingCliente.tipo_usuario || ''}
                    onChange={(e) => handleEditChange('tipo_usuario', e.target.value)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-600 cursor-not-allowed"
                  >
                    {tiposUsuario.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">No se puede cambiar el rol de un usuario</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={editingCliente.estado || ''}
                    onChange={(e) => handleEditChange('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {estadosCliente.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {editLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación de Cliente (Bloqueo Automático) */}
      {showValidationModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaShieldAlt className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Validacion de Cliente</h2>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Loading State */}
            {validationLoading && (
              <div className="p-12 text-center">
                <FaSync className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Validando cliente...</p>
              </div>
            )}

            {/* Error State */}
            {validationError && !validationLoading && (
              <div className="p-6 bg-red-50 border-b border-red-200">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Error en la validación</h3>
                    <p className="text-red-700 text-sm mt-1">{validationError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Result */}
            {validacion && !validationLoading && (
              <div className="p-6 space-y-6">
                {/* Cliente Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Informacion del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nombre:</span>
                      <p className="font-medium text-gray-900">{validacion.cliente?.nombre}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estado:</span>
                      <p className="font-medium text-gray-900">{validacion.cliente?.estado}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo de Cliente:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          validacion.cliente?.tipo_usuario === 'CLIENTE_CORPORATIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {validacion.cliente?.tipo_usuario === 'CLIENTE_CORPORATIVO' ? 'Cliente Corporativo' : validacion.cliente?.tipo_usuario}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Habilitado / Bloqueado */}
                {validacion.habilitado ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FaCheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900">Cliente Habilitado</h4>
                        <p className="text-green-700 text-sm mt-1">El cliente puede crear ordenes de transporte</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FaLock className="h-6 w-6 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Cliente Bloqueado</h4>
                        <p className="text-red-700 text-sm mt-2 font-medium">Motivo:</p>
                        <p className="text-red-700 text-sm">{validacion.motivo}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contratos Vigentes - CONSOLIDADO CON CRÉDITO */}
                {(validacion.contratos_resumen?.contratos && validacion.contratos_resumen.contratos.length > 0) || validacion.contrato ? (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-5">
                    <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center space-x-2">
                      <FaFileContract className="h-5 w-5" />
                      <span>
                        Contratos Vigentes 
                        {validacion.contratos_resumen && validacion.contratos_resumen.cantidad_contratos > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">
                            {validacion.contratos_resumen.cantidad_contratos}
                          </span>
                        )}
                      </span>
                    </h3>
                    
                    {/* Mostrar todos los contratos del resumen CON CRÉDITO INTEGRADO */}
                    {validacion.contratos_resumen?.contratos && validacion.contratos_resumen.contratos.length > 0 ? (
                      <div className="space-y-4">
                        {validacion.contratos_resumen.contratos.map((contrato, idx) => {
                          const porcentaje = Math.round((contrato.saldo_usado / contrato.limite_credito) * 100);
                          const estaBloqueado = contrato.saldo_usado >= contrato.limite_credito;
                          return (
                            <div key={idx} className="border-l-4 border-blue-500 bg-white rounded-lg p-4 shadow-sm">
                              {/* Fila 1: Número, Vencimiento, Plazo, Moneda */}
                              <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Número</p>
                                  <p className="text-lg font-mono font-bold text-blue-900 break-all">{contrato.numero_contrato}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Vencimiento</p>
                                  <p className={`text-lg font-bold ${new Date(contrato.fecha_fin || new Date()) < new Date() ? 'text-red-700' : 'text-green-700'}`}>
                                    {contrato.fecha_fin ? new Date(contrato.fecha_fin).toLocaleDateString('es-GT') : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Plazo de Pago</p>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-200 text-blue-800">
                                      {contrato.plazo_pago || 'N/A'}
                                    </span>
                                    <span className="text-xs text-gray-600">días</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Moneda</p>
                                  <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-purple-200 text-purple-800">
                                    <FaDollarSign className="h-4 w-4" />
                                    <span>{contrato.simbolo_moneda || contrato.nombre_moneda || 'Q'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Fila 2: Crédito individual */}
                              <div>
                                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                                  <div>
                                    <p className="text-blue-600 text-xs font-semibold">LÍMITE</p>
                                    <p className="text-lg font-bold text-blue-900">{formatMoney(contrato.limite_credito, contrato.nombre_moneda || 'GTQ')}</p>
                                  </div>
                                  <div>
                                    <p className="text-red-600 text-xs font-semibold">UTILIZADO</p>
                                    <p className="text-lg font-bold text-red-700">{formatMoney(contrato.saldo_usado, contrato.nombre_moneda || 'GTQ')}</p>
                                  </div>
                                  <div>
                                    <p className="text-green-600 text-xs font-semibold">DISPONIBLE</p>
                                    <p className="text-lg font-bold text-green-700">{formatMoney(contrato.saldo_disponible || (contrato.limite_credito - contrato.saldo_usado), contrato.nombre_moneda || 'GTQ')}</p>
                                  </div>
                                </div>
                                
                                {/* Barra de progreso y porcentaje */}
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 bg-gray-300 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-3 transition-all ${
                                        estaBloqueado ? 'bg-red-600' : porcentaje > 75 ? 'bg-orange-600' : 'bg-green-600'
                                      }`}
                                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2 min-w-fit">
                                    {estaBloqueado ? (
                                      <>
                                        <FaTimesCircle className="h-5 w-5 text-red-600" />
                                        <span className="text-sm font-bold text-red-700">{porcentaje}%</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaCheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-sm font-bold text-green-700">{porcentaje}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : validacion.contrato ? (
                      // Fallback si solo hay un contrato
                      <div className="border-l-4 border-blue-500 bg-white rounded-lg p-4 shadow-sm">
                        {/* Fila 1: Número, Vencimiento, Plazo, Moneda */}
                        <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Número</p>
                            <p className="text-lg font-mono font-bold text-blue-900 break-all">{validacion.contrato.numero_contrato}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Vencimiento</p>
                            <p className={`text-lg font-bold ${new Date(validacion.contrato.fecha_fin) < new Date() ? 'text-red-700' : 'text-green-700'}`}>
                              {new Date(validacion.contrato.fecha_fin).toLocaleDateString('es-GT')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Plazo de Pago</p>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-200 text-blue-800">
                                {validacion.contrato.plazo_pago}
                              </span>
                              <span className="text-xs text-gray-600">días</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Moneda</p>
                            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-purple-200 text-purple-800">
                              <FaDollarSign className="h-4 w-4" />
                              <span>{(validacion.contrato as any).simbolo_moneda || (validacion.contrato as any).nombre_moneda || 'Q'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Fila 2: Crédito individual */}
                        <div>
                          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-blue-600 text-xs font-semibold">LÍMITE</p>
                              <p className="text-lg font-bold text-blue-900">{formatMoney(validacion.contrato.limite_credito, validacion.contrato.nombre_moneda || 'GTQ')}</p>
                            </div>
                            <div>
                              <p className="text-red-600 text-xs font-semibold">UTILIZADO</p>
                              <p className="text-lg font-bold text-red-700">{formatMoney(validacion.contrato.saldo_usado, validacion.contrato.nombre_moneda || 'GTQ')}</p>
                            </div>
                            <div>
                              <p className="text-green-600 text-xs font-semibold">DISPONIBLE</p>
                              <p className="text-lg font-bold text-green-700">{formatMoney(validacion.contrato.saldo_disponible || (validacion.contrato.limite_credito - validacion.contrato.saldo_usado), validacion.contrato.nombre_moneda || 'GTQ')}</p>
                            </div>
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-300 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 transition-all ${
                                  validacion.contrato.saldo_usado >= validacion.contrato.limite_credito ? 'bg-red-600' : validacion.contrato.saldo_usado > validacion.contrato.limite_credito * 0.75 ? 'bg-orange-600' : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min((validacion.contrato.saldo_usado / validacion.contrato.limite_credito) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center space-x-2 min-w-fit">
                              {validacion.contrato.saldo_usado >= validacion.contrato.limite_credito ? (
                                <>
                                  <FaTimesCircle className="h-5 w-5 text-red-600" />
                                  <span className="text-sm font-bold text-red-700">{Math.round((validacion.contrato.saldo_usado / validacion.contrato.limite_credito) * 100)}%</span>
                                </>
                              ) : (
                                <>
                                  <FaCheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="text-sm font-bold text-green-700">{Math.round((validacion.contrato.saldo_usado / validacion.contrato.limite_credito) * 100)}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* TOTAL AGREGADO - Al final de la sección */}
                    {validacion.contratos_resumen && validacion.contratos_resumen.cantidad_contratos > 1 && (
                      <div className="mt-6 pt-6 border-t-2 border-blue-300 bg-blue-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase mb-3 flex items-center space-x-2">
                          <FaDollarSign className="h-4 w-4" />
                          <span>Total Agregado (Todos los Contratos)</span>
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-blue-600 text-xs font-semibold">TOTAL LÍMITE</p>
                            <p className="text-lg font-bold text-blue-900">Q{validacion.contratos_resumen.total_limite_credito?.toLocaleString('es-GT')}</p>
                          </div>
                          <div>
                            <p className="text-red-600 text-xs font-semibold">TOTAL UTILIZADO</p>
                            <p className="text-lg font-bold text-red-700">Q{validacion.contratos_resumen.total_saldo_usado?.toLocaleString('es-GT')}</p>
                          </div>
                          <div>
                            <p className="text-green-600 text-xs font-semibold">TOTAL DISPONIBLE</p>
                            <p className="text-lg font-bold text-green-700">Q{validacion.contratos_resumen.total_saldo_disponible?.toLocaleString('es-GT')}</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all font-bold text-xs flex items-center justify-center text-white ${
                              validacion.contratos_resumen.total_saldo_usado >= validacion.contratos_resumen.total_limite_credito
                                ? 'bg-red-600'
                                : validacion.contratos_resumen.total_saldo_usado > validacion.contratos_resumen.total_limite_credito * 0.75
                                ? 'bg-orange-600'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min((validacion.contratos_resumen.total_saldo_usado / validacion.contratos_resumen.total_limite_credito) * 100, 100)}%`, minWidth: validacion.contratos_resumen.total_saldo_usado > 0 ? '40px' : '0' }}
                          >
                            {validacion.contratos_resumen.total_saldo_usado > validacion.contratos_resumen.total_limite_credito * 0.3 &&
                              `${Math.round((validacion.contratos_resumen.total_saldo_usado / validacion.contratos_resumen.total_limite_credito) * 100)}%`
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Facturas Pendientes */}
                {validacion.facturas_pendientes && validacion.facturas_pendientes.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-3">Facturas Certificadas (Sin Pagar)</h3>
                    <div className="space-y-2">
                      {validacion.facturas_pendientes.map((factura) => (
                        <div key={factura.id} className="flex justify-between items-center text-sm bg-red-100 p-2 rounded">
                          <span className="text-red-900">{factura.numero_factura}</span>
                          <span className="font-semibold text-red-900">Q{factura.total_factura?.toLocaleString('es-GT')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cuentas Vencidas */}
                {validacion.cuentas_vencidas && validacion.cuentas_vencidas.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-3">Cuentas por Cobrar (Vencidas)</h3>
                    <div className="space-y-2">
                      {validacion.cuentas_vencidas.map((cuenta) => (
                        <div key={cuenta.id} className="flex justify-between items-center text-sm bg-orange-100 p-2 rounded">
                          <div>
                            <span className="text-orange-900">Vencidas desde:</span>
                            <p className="text-xs text-orange-700">{new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-GT')}</p>
                          </div>
                          <span className="font-semibold text-orange-900">Q{cuenta.saldo_pendiente?.toLocaleString('es-GT')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarifa Info */}
                {validacion.tarifa && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="font-semibold text-indigo-900 mb-3">Tarifa Negociada</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-indigo-600">Tipo de Unidad:</span>
                        <p className="font-medium text-gray-900">{validacion.tarifa.tipo_unidad}</p>
                      </div>
                      <div>
                        <span className="text-indigo-600">Costo/KM:</span>
                        <p className="font-medium text-gray-900">Q{validacion.tarifa.costo_km_negociado?.toLocaleString('es-GT')}</p>
                      </div>
                      <div>
                        <span className="text-indigo-600">Límite de Peso:</span>
                        <p className="font-medium text-gray-900">{validacion.tarifa.limite_peso_ton} ton</p>
                      </div>
                      {validacion.descuento && (
                        <div>
                          <span className="text-indigo-600">Descuento:</span>
                          <p className="font-medium text-green-700">{validacion.descuento.porcentaje_descuento}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-green-600">+</span>
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditError(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newCliente.nombre || ''}
                    onChange={(e) => handleCreateChange('nombre', e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newCliente.email || ''}
                    onChange={(e) => handleCreateChange('email', e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIT / Documento *
                    </label>
                    <input
                      type="text"
                      value={newCliente.nit || ''}
                      onChange={(e) => handleCreateChange('nit', e.target.value)}
                      placeholder="1234567890101"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={newCliente.telefono || ''}
                      onChange={(e) => handleCreateChange('telefono', e.target.value)}
                      placeholder="2222-2222"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <select
                    value={newCliente.pais || ''}
                    onChange={(e) => handleCreateChange('pais', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecciona un país</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="Honduras">Honduras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={(newCliente as any).password || ''}
                    onChange={(e) => handleCreateChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Usuario *
                    </label>
                    <select
                      value={newCliente.tipo_usuario || ''}
                      onChange={(e) => handleCreateChange('tipo_usuario', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="CLIENTE_CORPORATIVO">Cliente Corporativo</option>
                      <option value="AGENTE_OPERATIVO">Agente Operativo</option>
                      <option value="AGENTE_LOGISTICO">Agente Logistico</option>
                      <option value="AGENTE_FINANCIERO">Agente Financiero</option>
                      <option value="ENCARGADO_PATIO">Encargado de Patio</option>
                      <option value="AREA_CONTABLE">Area Contable</option>
                      <option value="GERENCIA">Gerencia</option>
                      <option value="PILOTO">Piloto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={newCliente.estado || 'ACTIVO'}
                      onChange={(e) => handleCreateChange('estado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditError(null);
                  setNewCliente({
                    nombre: '',
                    email: '',
                    nit: '',
                    telefono: '',
                    tipo_usuario: 'CLIENTE_CORPORATIVO',
                    estado: 'ACTIVO',
                    password: '',
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCreate}
                disabled={editLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {editLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Evaluacion de Riesgo */}
      {showRiesgoModal && selectedCliente && riesgoFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaExclamationTriangle className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Evaluacion de Riesgo</h2>
              </div>
              <button
                onClick={() => {
                  setShowRiesgoModal(false);
                  setRiesgoFormData(null);
                  setSelectedCliente(null);
                  limpiarErrorRiesgo();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {riesgoError && (
              <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {riesgoError}
              </div>
            )}

            {riesgoFormLoading ? (
              <div className="p-12 text-center">
                <FaSync className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Cargando datos...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">Cliente</h3>
                  <p className="text-gray-700">{selectedCliente.nombre}</p>
                  <p className="text-sm text-gray-600">NIT: {selectedCliente.nit}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Riesgo - Capacidad de Pago
                    </label>
                    <select
                      value={riesgoFormData.riesgo_capacidad_pago}
                      onChange={(e) => handleRiesgoFormChange('riesgo_capacidad_pago', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="BAJO">Bajo - Capacidad de pago garantizada</option>
                      <option value="MEDIO">Medio - Capacidad de pago moderada</option>
                      <option value="ALTO">Alto - Capacidad de pago limitada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Riesgo - Lavado de Dinero
                    </label>
                    <select
                      value={riesgoFormData.riesgo_lavado_dinero}
                      onChange={(e) => handleRiesgoFormChange('riesgo_lavado_dinero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="BAJO">Bajo - Bajo riesgo AML/CFT</option>
                      <option value="MEDIO">Medio - Riesgo moderado AML/CFT</option>
                      <option value="ALTO">Alto - Riesgo elevado AML/CFT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Riesgo - Aduanas
                    </label>
                    <select
                      value={riesgoFormData.riesgo_aduanas}
                      onChange={(e) => handleRiesgoFormChange('riesgo_aduanas', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="BAJO">Bajo - Historial aduanal limpio</option>
                      <option value="MEDIO">Medio - Algunos inconvenientes aduanales</option>
                      <option value="ALTO">Alto - Riesgo aduanal significativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Riesgo - Mercancia
                    </label>
                    <select
                      value={riesgoFormData.riesgo_mercancia}
                      onChange={(e) => handleRiesgoFormChange('riesgo_mercancia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="BAJO">Bajo - Mercancias de bajo riesgo</option>
                      <option value="MEDIO">Medio - Mercancias de riesgo moderado</option>
                      <option value="ALTO">Alto - Mercancias de alto riesgo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRiesgoModal(false);
                  setRiesgoFormData(null);
                  setSelectedCliente(null);
                  limpiarErrorRiesgo();
                }}
                disabled={riesgoFormLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRiesgo}
                disabled={riesgoFormLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {riesgoFormLoading ? 'Guardando...' : 'Guardar Evaluacion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientesList;
