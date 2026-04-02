const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const DEFAULT_USD_TO_KZT_RATE = 491.29;
const parsedExchangeRate = Number.parseFloat(process.env.USD_TO_KZT_RATE);
const USD_TO_KZT_RATE = Number.isFinite(parsedExchangeRate)
  ? parsedExchangeRate
  : DEFAULT_USD_TO_KZT_RATE;

const toNumber = (value) => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const convertUsdToKzt = (amount) => Number((toNumber(amount) * USD_TO_KZT_RATE).toFixed(2));

// Initialize Stripe (conditionally)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Create payment intent
router.post('/create-intent', authenticate, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const amountInKzt = convertUsdToKzt(amount);

    if (!stripe) {
      // Fallback: create payment record without Stripe
      const payment = await prisma.payment.create({
        data: {
          amount: amountInKzt,
          method: 'ONLINE',
          status: 'COMPLETED',
          orderId,
          userId: req.user.id,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentMethod: 'ONLINE' },
      });

      return res.json({
        success: true,
        payment,
        message: 'Payment processed (Stripe not configured - using test mode)',
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountInKzt * 100),
      currency: 'kzt',
      metadata: { orderId, userId: req.user.id, usdToKztRate: String(USD_TO_KZT_RATE) },
    });

    const payment = await prisma.payment.create({
      data: {
        amount: amountInKzt,
        method: 'ONLINE',
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        orderId,
        userId: req.user.id,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    const payment = await prisma.payment.update({
      where: { id: paymentId || undefined, orderId: orderId || undefined },
      data: { status: 'COMPLETED' },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentMethod: 'ONLINE' },
    });

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Cash on delivery
router.post('/cash', authenticate, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const amountInKzt = convertUsdToKzt(amount);

    const payment = await prisma.payment.create({
      data: {
        amount: amountInKzt,
        method: 'CASH_ON_DELIVERY',
        status: 'PENDING',
        orderId,
        userId: req.user.id,
      },
    });

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment record' });
  }
});

module.exports = router;
