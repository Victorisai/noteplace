require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { ensureMessagesSchema } = require('./services/messages.service');

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await ensureMessagesSchema();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to boot server:', error);
  process.exit(1);
});
