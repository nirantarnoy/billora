const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set io instance globally
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // เริ่มต้น Backup Scheduler
  const backupScheduler = require('./src/services/BackupScheduler');
  backupScheduler.init().then(() => {
    console.log('✓ Backup Scheduler initialized');
  }).catch(err => {
    console.error('✗ Backup Scheduler initialization failed:', err.message);
  });
});