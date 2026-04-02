const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, latitude, longitude } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, avatar: true, address: true,
        latitude: true, longitude: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
