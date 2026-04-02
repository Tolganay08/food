require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./sockets/socketManager');

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 FoodDash API running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
