const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
      } catch (err) {
        // Allow unauthenticated connections for public tracking
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId || 'anonymous'})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-based rooms
    if (socket.userRole === 'COURIER') {
      socket.join('couriers');
    }
    if (socket.userRole === 'ADMIN') {
      socket.join('admins');
    }

    // Join order tracking room
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`👁️ Socket ${socket.id} watching order ${orderId}`);
    });

    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Courier location updates
    socket.on('courier:location', (data) => {
      const { orderId, latitude, longitude } = data;
      if (orderId) {
        io.to(`order:${orderId}`).emit('courier:location:update', {
          orderId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
      }
      // Also notify admins
      io.to('admins').emit('courier:location:update', {
        courierId: socket.userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    });

    // Courier availability toggle
    socket.on('courier:availability', (data) => {
      io.to('admins').emit('courier:availability:update', {
        courierId: socket.userId,
        ...data,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper to emit order status updates
const emitOrderUpdate = (orderId, data) => {
  const socketIO = getIO();
  socketIO.to(`order:${orderId}`).emit('order:status:update', data);
  socketIO.to('admins').emit('order:status:update', data);
  socketIO.to('couriers').emit('order:status:update', data);
};

// Helper to emit new order notification
const emitNewOrder = (order) => {
  const socketIO = getIO();
  socketIO.to('admins').emit('order:new', order);
  socketIO.to('couriers').emit('order:new', order);
};

module.exports = { initializeSocket, getIO, emitOrderUpdate, emitNewOrder };
