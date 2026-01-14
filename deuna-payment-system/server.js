const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const orders = new Map();
const payments = new Map();

function generatePaymentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

app.post('/api/orders/create', (req, res) => {
  const { merchantId, amount, description, merchantName } = req.body;

  if (!merchantId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const orderId = generateId();
  const paymentCode = generatePaymentCode();
  
  const order = {
    orderId,
    paymentCode,
    merchantId,
    merchantName: merchantName || 'Comercio',
    amount,
    description: description || 'Pago',
    status: 'pending', 
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), 
    paymentId: null
  };

  orders.set(orderId, order);

  res.json({
    success: true,
    orderId,
    paymentCode,
    amount,
    expiresAt: order.expiresAt
  });
});

app.get('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  if (order.status === 'pending' && new Date() > new Date(order.expiresAt)) {
    order.status = 'expired';
  }

  res.json({
    orderId: order.orderId,
    status: order.status,
    amount: order.amount,
    paymentId: order.paymentId,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt
  });
});

app.get('/api/payments/query/:paymentCode', (req, res) => {
  const { paymentCode } = req.params;
  
  let foundOrder = null;
  for (const order of orders.values()) {
    if (order.paymentCode === paymentCode) {
      foundOrder = order;
      break;
    }
  }

  if (!foundOrder) {
    return res.status(404).json({ error: 'Código de pago no encontrado' });
  }

  if (foundOrder.status === 'pending' && new Date() > new Date(foundOrder.expiresAt)) {
    foundOrder.status = 'expired';
  }

  if (foundOrder.status !== 'pending') {
    return res.status(400).json({ 
      error: `La orden está ${foundOrder.status === 'expired' ? 'expirada' : 'ya procesada'}` 
    });
  }

  res.json({
    orderId: foundOrder.orderId,
    merchantName: foundOrder.merchantName,
    amount: foundOrder.amount,
    description: foundOrder.description,
    expiresAt: foundOrder.expiresAt
  });
});

app.post('/api/payments/process', (req, res) => {
  const { paymentCode, userId, userName, paymentMethod } = req.body;

  if (!paymentCode || !userId || !paymentMethod) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  let foundOrder = null;
  for (const order of orders.values()) {
    if (order.paymentCode === paymentCode) {
      foundOrder = order;
      break;
    }
  }

  if (!foundOrder) {
    return res.status(404).json({ error: 'Código de pago no encontrado' });
  }

  if (foundOrder.status !== 'pending') {
    return res.status(400).json({ error: 'La orden ya fue procesada o expiró' });
  }

  if (new Date() > new Date(foundOrder.expiresAt)) {
    foundOrder.status = 'expired';
    return res.status(400).json({ error: 'El código de pago ha expirado' });
  }

  const paymentId = generateId();
  const payment = {
    paymentId,
    orderId: foundOrder.orderId,
    userId,
    userName: userName || 'Usuario',
    amount: foundOrder.amount,
    paymentMethod,
    status: 'completed',
    processedAt: new Date().toISOString()
  };

  payments.set(paymentId, payment);

  foundOrder.status = 'completed';
  foundOrder.paymentId = paymentId;

  res.json({
    success: true,
    paymentId,
    orderId: foundOrder.orderId,
    amount: foundOrder.amount,
    status: 'completed',
    processedAt: payment.processedAt
  });
});

app.get('/api/payments/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  const payment = payments.get(paymentId);

  if (!payment) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  res.json(payment);
});
app.post('/api/webhooks/payment-status', (req, res) => {
  console.log('Webhook recibido:', req.body);
  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});

module.exports = app;