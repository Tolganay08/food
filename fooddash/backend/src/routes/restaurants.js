const express = require('express');
const prisma = require('../config/database');

const router = express.Router();

// Get all restaurants (with filters)
router.get('/', async (req, res) => {
  try {
    const { cuisine, search, sortBy, minRating } = req.query;

    const where = { isActive: true };

    if (cuisine) {
      where.cuisine = cuisine;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cuisine: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    let orderBy = { rating: 'desc' };
    if (sortBy === 'deliveryTime') orderBy = { deliveryTime: 'asc' };
    if (sortBy === 'deliveryFee') orderBy = { deliveryFee: 'asc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };

    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { menuItems: true } },
      },
    });

    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get distinct cuisines
router.get('/cuisines', async (req, res) => {
  try {
    const cuisines = await prisma.restaurant.findMany({
      where: { isActive: true, cuisine: { not: null } },
      select: { cuisine: true },
      distinct: ['cuisine'],
    });
    res.json(cuisines.map((c) => c.cuisine).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cuisines' });
  }
});

// Get single restaurant with full menu
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        reviews: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

module.exports = router;
