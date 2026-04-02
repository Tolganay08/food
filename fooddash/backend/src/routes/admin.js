const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const adminRestaurantDetailInclude = {
  categories: {
    orderBy: { sortOrder: 'asc' },
    include: {
      menuItems: {
        orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
      },
    },
  },
  _count: {
    select: {
      categories: true,
      menuItems: true,
      reviews: true,
    },
  },
};

const createHttpError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeString = (value, fieldName) => {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw createHttpError(400, `${fieldName} is required`);
  }
  return normalized;
};

const parseNumber = (value, fieldName) => {
  const parsedValue = Number.parseFloat(value);
  if (!Number.isFinite(parsedValue)) {
    throw createHttpError(400, `${fieldName} must be a valid number`);
  }
  return parsedValue;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const sanitizeRestaurantPayload = (body) => ({
  name: normalizeString(body.name, 'Restaurant name'),
  description: normalizeOptionalString(body.description),
  address: normalizeString(body.address, 'Restaurant address'),
  latitude: parseNumber(body.latitude, 'Latitude'),
  longitude: parseNumber(body.longitude, 'Longitude'),
  image: normalizeOptionalString(body.image),
  coverImage: normalizeOptionalString(body.coverImage),
  deliveryTime: normalizeOptionalString(body.deliveryTime) || '25-35 min',
  deliveryFee: parseNumber(body.deliveryFee ?? 2.99, 'Delivery fee'),
  minOrder: parseNumber(body.minOrder ?? 10, 'Minimum order'),
  cuisine: normalizeOptionalString(body.cuisine),
  isActive: body.isActive === undefined ? true : normalizeBoolean(body.isActive, true),
  openingTime: normalizeOptionalString(body.openingTime) || '09:00',
  closingTime: normalizeOptionalString(body.closingTime) || '22:00',
});

const sanitizeMenuPayload = (categories) =>
  categories.map((category, categoryIndex) => {
    const categoryName = normalizeString(
      category?.name,
      `Category #${categoryIndex + 1} name`
    );
    const menuItems = Array.isArray(category?.menuItems) ? category.menuItems : [];

    return {
      id: normalizeOptionalString(category?.id),
      name: categoryName,
      sortOrder: categoryIndex + 1,
      menuItems: menuItems.map((item, itemIndex) => {
        const itemName = normalizeString(
          item?.name,
          `Menu item #${itemIndex + 1} in ${categoryName}`
        );

        return {
          id: normalizeOptionalString(item?.id),
          name: itemName,
          description: normalizeOptionalString(item?.description),
          price: parseNumber(item?.price, `Price for ${itemName}`),
          image: normalizeOptionalString(item?.image),
          isAvailable:
            item?.isAvailable === undefined
              ? true
              : normalizeBoolean(item.isAvailable, true),
          isPopular: normalizeBoolean(item?.isPopular, false),
        };
      }),
    };
  });

const syncRestaurantMenu = async (tx, restaurantId, categories) => {
  const existingRestaurant = await tx.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      categories: {
        include: { menuItems: true },
      },
    },
  });

  if (!existingRestaurant) {
    throw createHttpError(404, 'Restaurant not found');
  }

  const existingCategoryIds = new Set(existingRestaurant.categories.map((category) => category.id));
  const existingMenuItemIds = new Set(
    existingRestaurant.categories.flatMap((category) =>
      category.menuItems.map((item) => item.id)
    )
  );

  const finalCategoryIds = [];
  const finalMenuItemIds = [];

  for (const category of categories) {
    let savedCategory;

    if (category.id) {
      if (!existingCategoryIds.has(category.id)) {
        throw createHttpError(400, `Invalid category id: ${category.id}`);
      }

      savedCategory = await tx.category.update({
        where: { id: category.id },
        data: {
          name: category.name,
          sortOrder: category.sortOrder,
        },
      });
    } else {
      savedCategory = await tx.category.create({
        data: {
          name: category.name,
          sortOrder: category.sortOrder,
          restaurantId,
        },
      });
    }

    finalCategoryIds.push(savedCategory.id);

    for (const item of category.menuItems) {
      const itemData = {
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        isAvailable: item.isAvailable,
        isPopular: item.isPopular,
        categoryId: savedCategory.id,
        restaurantId,
      };

      let savedItem;

      if (item.id) {
        if (!existingMenuItemIds.has(item.id)) {
          throw createHttpError(400, `Invalid menu item id: ${item.id}`);
        }

        savedItem = await tx.menuItem.update({
          where: { id: item.id },
          data: itemData,
        });
      } else {
        savedItem = await tx.menuItem.create({ data: itemData });
      }

      finalMenuItemIds.push(savedItem.id);
    }
  }

  if (finalMenuItemIds.length > 0) {
    await tx.menuItem.deleteMany({
      where: {
        restaurantId,
        id: { notIn: finalMenuItemIds },
      },
    });
  } else {
    await tx.menuItem.deleteMany({
      where: { restaurantId },
    });
  }

  if (finalCategoryIds.length > 0) {
    await tx.category.deleteMany({
      where: {
        restaurantId,
        id: { notIn: finalCategoryIds },
      },
    });
  } else {
    await tx.category.deleteMany({
      where: { restaurantId },
    });
  }
};

const saveRestaurant = async ({ restaurantId = null, body }) => {
  const restaurantData = sanitizeRestaurantPayload(body);
  const categories = Array.isArray(body.categories)
    ? sanitizeMenuPayload(body.categories)
    : null;

  return prisma.$transaction(async (tx) => {
    let savedRestaurant;

    if (restaurantId) {
      const existingRestaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true },
      });

      if (!existingRestaurant) {
        throw createHttpError(404, 'Restaurant not found');
      }

      savedRestaurant = await tx.restaurant.update({
        where: { id: restaurantId },
        data: restaurantData,
      });
    } else {
      savedRestaurant = await tx.restaurant.create({
        data: restaurantData,
      });
    }

    if (categories !== null) {
      await syncRestaurantMenu(tx, savedRestaurant.id, categories);
    }

    return tx.restaurant.findUnique({
      where: { id: savedRestaurant.id },
      include: adminRestaurantDetailInclude,
    });
  });
};

// Dashboard analytics
router.get('/analytics', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      activeOrders,
      totalCustomers,
      totalCouriers,
      onlineCouriers,
      popularItems,
      recentOrders,
      dailyRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'DELIVERED', createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.courier.count(),
      prisma.courier.count({ where: { isOnline: true } }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
          courier: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, 
               COUNT(*)::int as orders, 
               COALESCE(SUM(total_amount), 0)::float as revenue
        FROM orders 
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at) 
        ORDER BY date DESC 
        LIMIT 30
      `,
    ]);

    const popularItemIds = popularItems.map((item) => item.menuItemId);
    const itemDetails = await prisma.menuItem.findMany({
      where: { id: { in: popularItemIds } },
      include: { restaurant: { select: { name: true } } },
    });

    const popularDishes = popularItems.map((popularItem) => {
      const item = itemDetails.find((detail) => detail.id === popularItem.menuItemId);
      return {
        ...item,
        totalOrdered: popularItem._sum.quantity,
      };
    });

    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      activeOrders,
      totalCustomers,
      totalCouriers,
      onlineCouriers,
      popularDishes,
      recentOrders,
      dailyRevenue,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get all orders (admin)
router.get('/orders', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          restaurant: { select: { name: true, image: true } },
          customer: { select: { firstName: true, lastName: true, phone: true } },
          courier: { include: { user: { select: { firstName: true, lastName: true } } } },
          items: { include: { menuItem: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        take: parseInt(limit, 10),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, pages: Math.ceil(total / parseInt(limit, 10)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all restaurants (admin)
router.get('/restaurants', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            categories: true,
            menuItems: true,
            reviews: true,
          },
        },
      },
    });

    res.json(restaurants);
  } catch (error) {
    console.error('Get admin restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get single restaurant with editable menu (admin)
router.get('/restaurants/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: adminRestaurantDetailInclude,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Get admin restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

// Create restaurant (admin)
router.post('/restaurants', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const restaurant = await saveRestaurant({ body: req.body });
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Create restaurant error:', error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || 'Failed to create restaurant' });
  }
});

// Update restaurant (admin)
router.put('/restaurants/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const restaurant = await saveRestaurant({
      restaurantId: req.params.id,
      body: req.body,
    });
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant error:', error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || 'Failed to update restaurant' });
  }
});

// Delete restaurant (admin)
router.delete('/restaurants/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// Create menu item (admin)
router.post('/menu-items', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const menuItem = await prisma.menuItem.create({ data: req.body });
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item (admin)
router.put('/menu-items/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const menuItem = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Create category (admin)
router.post('/categories', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get all users (admin)
router.get('/users', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
