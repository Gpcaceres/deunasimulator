import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, DollarSign, CheckCircle, AlertCircle, Plus, History, LogOut } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function ClientApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, home, recharge, payment, history
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Estados de pago
  const [step, setStep] = useState('input');
  const [paymentCode, setPaymentCode] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  // Estados de recarga
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Cargar usuario del localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('deuna_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setView('home');
      refreshUserBalance(userData.userId);
    }
  }, []);

  const refreshUserBalance = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...user, balance: data.balance };
        setUser(updatedUser);
        localStorage.setItem('deuna_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error actualizando saldo:', err);
    }
  };

  const handleLogin = async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data);
        localStorage.setItem('deuna_user', JSON.stringify(data));
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
      const response = await fetch(`${API_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data);
        localStorage.setItem('deuna_user', JSON.stringify(data));
        setView('home');
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  const handleRecharge = async () => {
    setError('');
    const amount = parseFloat(rechargeAmount);
    
    if (!amount || amount <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${user.userId}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser({ ...user, balance: data.newBalance });
        localStorage.setItem('deuna_user', JSON.stringify({ ...user, balance: data.newBalance }));
        setRechargeAmount('');
        setView('home');
        alert(`¡Recarga exitosa! Nuevo saldo: $${data.newBalance.toFixed(2)}`);
      } else {
        setError(data.error || 'Error al recargar');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${user.userId}/transactions`);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setView('history');
    } catch (err) {
      setError('Error al cargar historial');
    }
  };

  const queryPaymentCode = async () => {
    if (paymentCode.length !== 8) {
      setError('El código debe tener 8 dígitos');
      return;
    }

    setError('');
    setStep('processing');

    try {
      const response = await fetch(`${API_URL}/payments/query/${paymentCode}`);
      const data = await response.json();

      if (response.ok) {
        setOrderData(data);
        setStep('confirm');
      } else {
        setError(data.error || 'Código no encontrado');
        setStep('input');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setStep('input');
    }
  };

  const processPayment = async () => {
    setStep('processing');
    setError('');

    try {
      const response = await fetch(`${API_URL}/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentCode,
          userId: user.userId,
          userName: user.name,
          paymentMethod: 'wallet'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentResult(data);
        setUser({ ...user, balance: data.newBalance });
        localStorage.setItem('deuna_user', JSON.stringify({ ...user, balance: data.newBalance }));
        setStep('success');
      } else {
        setError(data.error || 'Error al procesar el pago');
        setStep('error');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setStep('error');
    }
  };

  const resetPaymentFlow = () => {
    setStep('input');
    setPaymentCode('');
    setOrderData(null);
    setError('');
    setPaymentResult(null);
    setView('home');
  };

  const formatCode = (value) => {
    return value.replace(/\D/g, '').slice(0, 8);
  };

  const logout = () => {
    localStorage.removeItem('deuna_user');
    setUser(null);
    setView('login');
  };

  // ============ VISTA LOGIN ============
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 p-3 rounded-xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Deuna Pay</h1>
              <p className="text-gray-500">Tu billetera digital</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre (solo para registro)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="Tu nombre"
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleRegister}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
            >
              Crear Cuenta
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            💡 Cuenta demo: cliente@demo.com
          </p>
        </div>
      </div>
    );
  }

  // ============ VISTA HOME ============
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hola,</p>
                  <p className="font-bold text-gray-800">{user.name}</p>
                </div>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-gray-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90 mb-1">Saldo disponible</p>
              <p className="text-4xl font-bold">${user.balance.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setView('recharge')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-semibold text-gray-800">Recargar</p>
            </button>

            <button
              onClick={loadTransactions}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <History className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-semibold text-gray-800">Historial</p>
            </button>
          </div>

          <button
            onClick={() => setView('payment')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Realizar Pago
          </button>
        </div>
      </div>
    );
  }

  // ============ VISTA RECARGA ============
  if (view === 'recharge') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button onClick={() => setView('home')} className="text-gray-500 mb-4">← Volver</button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recargar Saldo</h2>

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-700 mb-1">Saldo actual</p>
              <p className="text-2xl font-bold text-purple-900">${user.balance.toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Monto a recargar</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[10, 25, 50, 100, 200, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setRechargeAmount(amount.toString())}
                  className="bg-gray-100 hover:bg-purple-100 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleRecharge}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Confirmar Recarga
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA HISTORIAL ============
  if (view === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => setView('home')} className="text-gray-500 mb-4">← Volver</button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial</h2>

            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.transactionId} className="border-2 border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <p className={`font-bold ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'recharge' ? '+' : ''}{tx.amount.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Saldo: ${tx.balanceBefore.toFixed(2)} → ${tx.balanceAfter.toFixed(2)}
                  </p>
                </div>
              ))}

              {transactions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay transacciones</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA PAGO ============
  if (view === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {step === 'input' && (
              <>
                <button onClick={() => setView('home')} className="text-gray-500 mb-4">← Volver</button>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Realizar Pago</h2>
                <p className="text-gray-500 mb-6">Saldo: ${user.balance.toFixed(2)}</p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código de pago (8 dígitos)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={paymentCode}
                    onChange={(e) => setPaymentCode(formatCode(e.target.value))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-2xl font-mono text-center tracking-wider"
                    placeholder="00000000"
                    maxLength={8}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <button
                  onClick={queryPaymentCode}
                  disabled={paymentCode.length !== 8}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl transition-colors"
                >
                  Consultar Pago
                </button>
              </>
            )}

            {step === 'confirm' && orderData && (
              <div className="space-y-6">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <p className="text-sm text-purple-700 font-medium mb-2">Comercio</p>
                  <p className="text-xl font-bold text-gray-800 mb-4">{orderData.merchantName}</p>
                  
                  <p className="text-sm text-purple-700 font-medium mb-2">Descripción</p>
                  <p className="text-gray-700 mb-4">{orderData.description}</p>

                  <p className="text-sm text-purple-700 font-medium mb-2">Monto a pagar</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-800">
                      ${orderData.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Tu saldo actual</p>
                  <p className="text-xl font-bold text-gray-800">${user.balance.toFixed(2)}</p>
                  {user.balance < orderData.amount && (
                    <p className="text-sm text-red-600 mt-2">⚠️ Saldo insuficiente</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetPaymentFlow}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={user.balance < orderData.amount}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Pagar Ahora
                  </button>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Procesando pago...</p>
              </div>
            )}

            {step === 'success' && paymentResult && (
              <div className="text-center space-y-6">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h2>
                  <p className="text-gray-600">Tu pago ha sido procesado</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto</span>
                    <span className="font-bold text-gray-800">${paymentResult.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nuevo saldo</span>
                    <span className="font-bold text-green-600">${paymentResult.newBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID</span>
                    <span className="font-mono text-xs text-gray-700">
                      {paymentResult.paymentId.slice(0, 12)}...
                    </span>
                  </div>
                </div>

                <button
                  onClick={resetPaymentFlow}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center space-y-6">
                <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Error en el Pago</h2>
                  <p className="text-gray-600">{error}</p>
                </div>

                <button
                  onClick={resetPaymentFlow}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}