const express = require('express');
const prisma = require('../config/database');

const router = express.Router();

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, search } = req.query;

    const where = { restaurantId, isAvailable: true };

    if (category) {
      where.categoryId = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
    });

    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: { category: true, restaurant: true },
    });

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

module.exports = router;
