import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    console.log('Received:', data.toString());
    // Echo back for now
    ws.send(JSON.stringify({ type: 'echo', data: data.toString() }));
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to Mashed!' }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
