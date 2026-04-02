const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get courier profile
router.get('/profile', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const courier = await prisma.courier.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            firstName: true, lastName: true, email: true, phone: true, avatar: true,
          },
        },
      },
    });

    if (!courier) {
      return res.status(404).json({ error: 'Courier profile not found' });
    }

    res.json(courier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courier profile' });
  }
});

// Update courier location
router.patch('/location', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const courier = await prisma.courier.update({
      where: { userId: req.user.id },
      data: { currentLat: latitude, currentLng: longitude },
    });

    res.json({ success: true, latitude, longitude });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Toggle availability
router.patch('/availability', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const { isOnline } = req.body;

    const courier = await prisma.courier.update({
      where: { userId: req.user.id },
      data: {
        isOnline,
        isAvailable: isOnline,
      },
    });

    res.json(courier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Get available orders for courier
router.get('/available-orders', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED', 'COOKING', 'READY_FOR_PICKUP'] },
        courierId: null,
      },
      include: {
        restaurant: {
          select: { name: true, address: true, latitude: true, longitude: true },
        },
        customer: {
          select: { firstName: true, lastName: true, phone: true },
        },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// Get courier's active orders
router.get('/my-deliveries', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const courier = await prisma.courier.findUnique({
      where: { userId: req.user.id },
    });

    const orders = await prisma.order.findMany({
      where: {
        courierId: courier.id,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: {
        restaurant: true,
        customer: {
          select: { firstName: true, lastName: true, phone: true, address: true },
        },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Accept an order
router.patch('/accept-order/:orderId', authenticate, authorize('COURIER'), async (req, res) => {
  try {
    const courier = await prisma.courier.findUnique({
      where: { userId: req.user.id },
    });

    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: {
        courierId: courier.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        restaurant: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, address: true },
        },
        courier: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    await prisma.courier.update({
      where: { id: courier.id },
      data: { isAvailable: false },
    });

    const { emitOrderUpdate } = require('../sockets/socketManager');
    emitOrderUpdate(order.id, { orderId: order.id, status: order.status, order });

    res.json(order);
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Get all couriers (admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const couriers = await prisma.courier.findMany({
      include: {
        user: {
          select: {
            firstName: true, lastName: true, email: true, phone: true, avatar: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });

    res.json(couriers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch couriers' });
  }
});

module.exports = router;
