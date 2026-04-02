const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const recalculateRestaurantRating = async (tx, restaurantId) => {
  const [ratingAggregate, reviewCount] = await Promise.all([
    tx.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
    }),
    tx.review.count({
      where: { restaurantId },
    }),
  ]);

  return tx.restaurant.update({
    where: { id: restaurantId },
    data: {
      rating: parseFloat((ratingAggregate._avg.rating || 0).toFixed(1)),
      reviewCount,
    },
  });
};

router.post('/', authenticate, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const parsedRating = Number.parseInt(rating, 10);

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only review your own orders' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Only delivered orders can be reviewed' });
    }

    if (order.review) {
      return res.status(409).json({ error: 'Review already exists for this order' });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          rating: parsedRating,
          comment: trimmedComment || null,
          orderId: order.id,
          userId: req.user.id,
          restaurantId: order.restaurantId,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      await recalculateRestaurantRating(tx, order.restaurantId);

      return createdReview;
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { restaurantId: req.params.restaurantId },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
