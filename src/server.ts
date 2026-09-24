import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 VendorQuery Backend Engine is active!
📡 Listening on: http://localhost:${PORT}
⚙️  Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

const gracefulShutdown = () => {
  console.log('🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server;
