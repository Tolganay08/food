const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { emitOrderUpdate, emitNewOrder } = require('../sockets/socketManager');

const router = express.Router();

let orderCounter = 100001;

// Create order
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      paymentMethod,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get menu items and validate
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'Some menu items are invalid' });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
      };
    });

    // Get next order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const orderNum = lastOrder
      ? parseInt(lastOrder.orderNumber.split('-')[1]) + 1
      : orderCounter;

    const order = await prisma.order.create({
      data: {
        orderNumber: `FD-${orderNum}`,
        status: 'PENDING',
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        deliveryFee: restaurant.deliveryFee,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        notes: notes || null,
        paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
        estimatedTime: restaurant.deliveryTime,
        customerId: req.user.id,
        restaurantId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        customer: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
    });

    // Emit new order to admins and couriers
    emitNewOrder(order);

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { id: true, name: true, image: true } },
        courier: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, address: true },
        },
        courier: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      req.user.role === 'CUSTOMER' &&
      order.customerId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'PENDING', 'ACCEPTED', 'COOKING', 'READY_FOR_PICKUP',
      'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };

    if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
    if (status === 'PICKED_UP') updateData.pickedUpAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        courier: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    // Update courier stats on delivery
    if (status === 'DELIVERED' && order.courierId) {
      await prisma.courier.update({
        where: { id: order.courierId },
        data: {
          totalDeliveries: { increment: 1 },
          isAvailable: true,
        },
      });
    }

    // Emit real-time update
    emitOrderUpdate(order.id, {
      orderId: order.id,
      status: order.status,
      order,
    });

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Assign courier to order
router.patch('/:id/assign-courier', authenticate, async (req, res) => {
  try {
    const { courierId } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        courierId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        courier: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    // Mark courier as unavailable
    await prisma.courier.update({
      where: { id: courierId },
      data: { isAvailable: false },
    });

    emitOrderUpdate(order.id, {
      orderId: order.id,
      status: order.status,
      order,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign courier' });
  }
});

module.exports = router;
