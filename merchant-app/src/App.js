import React, { useState, useEffect } from 'react';
import { Store, DollarSign, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function MerchantApp() {
  const [merchant, setMerchant] = useState(null);
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedMerchant = localStorage.getItem('deuna_merchant');
    if (savedMerchant) {
      const merchantData = JSON.parse(savedMerchant);
      setMerchant(merchantData);
      setView('home');
    }
  }, []);

  useEffect(() => {
    if (!currentOrder) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/orders/${currentOrder.orderId}/status`);
        const data = await response.json();
        setOrderStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error al consultar estado:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentOrder]);

  const handleLogin = async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/merchants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMerchant(data);
        localStorage.setItem('deuna_merchant', JSON.stringify(data));
        setView('home');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email) {
      setError('Completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/merchants/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMerchant(data);
        localStorage.setItem('deuna_merchant', JSON.stringify(data));
        setView('home');
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  const createPaymentOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.merchantId,
          merchantName: merchant.name,
          amount: parseFloat(amount),
          description: description || 'Compra en tienda'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentOrder(data);
        setOrderStatus({ status: 'pending' });
      } else {
        alert('Error al crear orden');
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetOrder = () => {
    setCurrentOrder(null);
    setOrderStatus(null);
    setAmount('');
    setDescription('');
  };

  const logout = () => {
    localStorage.removeItem('deuna_merchant');
    setMerchant(null);
    setView('login');
    resetOrder();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-600';
      case 'expired': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Pago Completado';
      case 'expired': return 'Expirado';
      case 'pending': return 'Esperando Pago';
      default: return status;
    }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-3 rounded-xl">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Deuna Business</h1>
              <p className="text-gray-500">Panel de comercio</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                placeholder="comercio@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Comercio (solo para registro)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                placeholder="Mi Tienda"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleRegister}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
            >
              Registrar Comercio
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            💡 Cuenta demo: comercio@demo.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{merchant.name}</h1>
                <p className="text-gray-500">Sistema de cobro Deuna</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          {!currentOrder ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto a cobrar (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  placeholder="Ej: Compra de productos"
                />
              </div>

              <button
                onClick={createPaymentOrder}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl transition-colors"
              >
                {loading ? 'Generando...' : 'Generar Código de Pago'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
                <p className="text-sm font-medium mb-2 opacity-90">Código de Pago</p>
                <div className="text-6xl font-bold tracking-wider mb-4 font-mono">
                  {currentOrder.paymentCode}
                </div>
                <p className="text-sm opacity-75">El cliente debe ingresar este código</p>
              </div>

              <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monto</span>
                  <span className="text-2xl font-bold text-gray-800">
                    ${currentOrder.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado</span>
                  <div className="flex items-center gap-2">
                    {orderStatus?.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {orderStatus?.status === 'expired' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {orderStatus?.status === 'pending' && (
                      <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                    )}
                    <span className={`font-semibold ${getStatusColor(orderStatus?.status)}`}>
                      {getStatusText(orderStatus?.status)}
                    </span>
                  </div>
                </div>

                {orderStatus?.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold">Esperando pago del cliente</p>
                      <p className="text-yellow-700 mt-1">
                        El código expira en 15 minutos
                      </p>
                    </div>
                  </div>
                )}

                {orderStatus?.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold">¡Pago recibido exitosamente!</p>
                      <p className="text-green-700 mt-1">
                        ID de pago: {orderStatus.paymentId}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetOrder}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
              >
                Nuevo Pago
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>💡 El cliente ingresa el código de 8 dígitos en su app de pago</p>
        </div>
      </div>
    </div>
  );
}