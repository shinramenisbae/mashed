/**
 * Mashed Game Server
 * Express + Socket.IO server for real-time party game
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import type { 
  Player, 
  Room,
  GameState,
  CreateRoomPayload,
  JoinRoomPayload,
  UpdateSettingsPayload,
  AudioRecordPayload,
  GifData,
  CaptionPayload,
  VotePayload,
  ReactionPayload
} from './types.js';

import {
  createRoom,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  updateNickname,
  updateAvatar,
  updateSettings,
  updateTotalRounds,
  canStartGame,
  getRoom,
  getPlayer,
  updatePlayerSocket,
  getAllRooms,
  cleanupDisconnectedPlayers,
} from './roomManager.js';

import {
  ensureUploadDir,
  saveAudio,
  getAudioData,
  getAudioBuffer,
  getMimeType,
  validateAudioBuffer,
  cleanupOldAudio,
} from './audioHandler.js';

import {
  searchGifs,
  getTrendingGifs,
  toGifData,
  isGifApiConfigured,
} from './gifIntegration.js';

import {
  initializeGameLoop,
  startGame,
  submitAudio,
  submitGif,
  submitCaption,
  finalizeSubmission,
  castVote,
  addReaction,
  getSanitizedRoom,
  getLeaderboard,
  getGameState,
} from './gameLoop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Track socket to player mapping
const socketToPlayer = new Map<string, { playerId: string; roomId: string }>();

// Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../../client/dist')));

// Initialize upload directory
await ensureUploadDir();

// Initialize game loop with socket callbacks
initializeGameLoop({
  broadcastToRoom: (roomId: string, event: string, data: unknown) => {
    io.to(roomId).emit(event, data);
  },
  emitToPlayer: (playerId: string, event: string, data: unknown) => {
    const player = getPlayer(playerId);
    if (player) {
      io.to(player.socketId).emit(event, data);
    }
  },
});

// ==================== HTTP API Routes ====================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rooms: getAllRooms().length,
    gifApi: isGifApiConfigured(),
  });
});

// GIF search endpoint
app.get('/api/gifs/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 50);
    
    const results = await searchGifs(query, limit);
    res.json({ results });
  } catch (error) {
    console.error('GIF search error:', error);
    res.status(500).json({ error: 'Failed to search GIFs' });
  }
});

// Get trending GIFs
app.get('/api/gifs/trending', async (_req, res) => {
  try {
    const results = await getTrendingGifs(20);
    res.json({ results });
  } catch (error) {
    console.error('Trending GIFs error:', error);
    res.status(500).json({ error: 'Failed to get trending GIFs' });
  }
});

// Audio upload endpoint
app.post('/api/audio/upload', async (req, res) => {
  try {
    const { audioData, duration, format } = req.body;
    
    if (!audioData || !duration || !format) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audioData, 'base64');
    
    // Validate
    const validation = validateAudioBuffer(buffer);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    
    // Save audio
    const audioInfo = await saveAudio(buffer, duration, format);
    
    res.json({ 
      success: true,
      audio: audioInfo,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Audio download endpoint
app.get('/api/audio/:audioId', async (req, res) => {
  try {
    const { audioId } = req.params;
    const audioData = getAudioData(audioId);
    
    if (!audioData) {
      res.status(404).json({ error: 'Audio not found' });
      return;
    }
    
    const result = await getAudioBuffer(audioId);
    if (!result) {
      res.status(404).json({ error: 'Audio file not found' });
      return;
    }
    
    res.setHeader('Content-Type', getMimeType(result.format));
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    console.error('Audio download error:', error);
    res.status(500).json({ error: 'Failed to download audio' });
  }
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId.toUpperCase());
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  
  res.json({ room: getSanitizedRoom(room) });
});

// Serve React app (catch-all)
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../../client/dist/index.html'));
});

// ==================== Socket.IO Handlers ====================

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Send initial connection acknowledgment
  socket.emit('connected', { socketId: socket.id });
  
  // ==================== Room Management ====================
  
  // Create room
  socket.on('room:create', (payload: CreateRoomPayload, callback) => {
    try {
      const { room, player } = createRoom(payload, socket.id);
      
      socket.join(room.id);
      socketToPlayer.set(socket.id, { playerId: player.id, roomId: room.id });
      
      callback({
        success: true,
        room: getSanitizedRoom(room),
        playerId: player.id,
        roomCode: room.id,
      });
      
      console.log(`Room created: ${room.id} by ${player.nickname}`);
    } catch (error) {
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create room',
      });
    }
  });
  
  // Join room
  socket.on('room:join', (payload: JoinRoomPayload, callback) => {
    try {
      const { room, player } = joinRoom(payload, socket.id);
      
      socket.join(room.id);
      socketToPlayer.set(socket.id, { playerId: player.id, roomId: room.id });
      
      // Notify other players
      socket.to(room.id).emit('player:joined', {
        player: {
          id: player.id,
          nickname: player.nickname,
          avatar: player.avatar,
          isHost: player.isHost,
          isReady: player.isReady,
          score: player.score,
        },
      });
      
      callback({
        success: true,
        room: getSanitizedRoom(room),
        playerId: player.id,
      });
      
      console.log(`Player ${player.nickname} joined room ${room.id}`);
    } catch (error) {
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join room',
      });
    }
  });
  
  // Leave room
  socket.on('room:leave', () => {
    const info = socketToPlayer.get(socket.id);
    if (!info) return;
    
    const { playerId, roomId } = info;
    const room = leaveRoom(playerId);
    
    socket.leave(roomId);
    socketToPlayer.delete(socket.id);
    
    if (room) {
      socket.to(roomId).emit('player:left', { playerId });
    }
    
    console.log(`Player left room ${roomId}`);
  });
  
  // Set ready status
  socket.on('player:ready', (isReady: boolean, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const { player, room } = setPlayerReady(info.playerId, isReady);
      
      // Notify all players in room
      io.to(room.id).emit('player:updated', {
        playerId: player.id,
        isReady: player.isReady,
      });
      
      callback?.({ success: true, isReady: player.isReady });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set ready',
      });
    }
  });
  
  // Update nickname
  socket.on('player:nickname', (nickname: string, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const { player, room } = updateNickname(info.playerId, nickname);
      
      io.to(room.id).emit('player:updated', {
        playerId: player.id,
        nickname: player.nickname,
      });
      
      callback?.({ success: true, nickname: player.nickname });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update nickname',
      });
    }
  });
  
  // Update avatar
  socket.on('player:avatar', (avatar: string, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const { player, room } = updateAvatar(info.playerId, avatar);
      
      io.to(room.id).emit('player:updated', {
        playerId: player.id,
        avatar: player.avatar,
      });
      
      callback?.({ success: true, avatar: player.avatar });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update avatar',
      });
    }
  });
  
  // Update game settings (host only)
  socket.on('game:settings', (settings: UpdateSettingsPayload, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const { room } = updateSettings(info.playerId, settings);
      
      io.to(room.id).emit('game:settingsUpdated', {
        settings: room.settings,
        totalRounds: room.totalRounds,
      });
      
      callback?.({ success: true, settings: room.settings });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      });
    }
  });
  
  // Update total rounds
  socket.on('game:totalRounds', (totalRounds: number, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const { room } = updateTotalRounds(info.playerId, totalRounds);
      
      io.to(room.id).emit('game:settingsUpdated', {
        settings: room.settings,
        totalRounds: room.totalRounds,
      });
      
      callback?.({ success: true, totalRounds: room.totalRounds });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update rounds',
      });
    }
  });
  
  // Start game (host only)
  socket.on('game:start', (callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const player = getPlayer(info.playerId);
      if (!player?.isHost) {
        callback?.({ success: false, error: 'Only host can start game' });
        return;
      }
      
      // Check if can start
      const check = canStartGame(info.roomId);
      if (!check.canStart) {
        callback?.({ success: false, error: check.reason });
        return;
      }
      
      const result = startGame(info.roomId);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start game',
      });
    }
  });
  
  // ==================== Game Actions ====================
  
  // Submit audio recording
  socket.on('audio:submit', (payload: { audioId: string; duration: number; format: string }, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const audioData = getAudioData(payload.audioId);
      if (!audioData) {
        callback?.({ success: false, error: 'Audio not found' });
        return;
      }
      
      const result = submitAudio(info.playerId, info.roomId, audioData);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit audio',
      });
    }
  });
  
  // Select GIF
  socket.on('submission:gifSelect', (payload: { assignmentId: string; gif: GifData }, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = submitGif(info.playerId, info.roomId, payload.assignmentId, payload.gif);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select GIF',
      });
    }
  });
  
  // Update caption
  socket.on('submission:caption', (payload: { assignmentId: string; caption: string }, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = submitCaption(info.playerId, info.roomId, payload.assignmentId, payload.caption);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update caption',
      });
    }
  });
  
  // Finalize submission
  socket.on('submission:submit', (payload: { assignmentId: string }, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = finalizeSubmission(info.playerId, info.roomId, payload.assignmentId);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit',
      });
    }
  });
  
  // Cast vote
  socket.on('vote:cast', (payload: VotePayload, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = castVote(info.playerId, info.roomId, payload.submissionId, payload.category);
      
      if (result.success) {
        io.to(info.roomId).emit('vote:received', {
          playerId: info.playerId,
          submissionId: payload.submissionId,
        });
      }
      
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast vote',
      });
    }
  });
  
  // Add reaction
  socket.on('reaction:add', (payload: ReactionPayload, callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = addReaction(info.playerId, info.roomId, payload.submissionId, payload.emoji);
      callback?.(result);
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add reaction',
      });
    }
  });
  
  // Get full game state
  socket.on('game:state', (callback) => {
    try {
      const info = socketToPlayer.get(socket.id);
      if (!info) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const room = getRoom(info.roomId);
      const player = getPlayer(info.playerId);
      
      if (!room || !player) {
        callback?.({ success: false, error: 'Room or player not found' });
        return;
      }
      
      const gameState: Partial<GameState> = {
        room: getSanitizedRoom(room),
        currentPlayer: player,
        phase: room.status as GameState['phase'],
        leaderboard: getLeaderboard(room),
      };
      
      callback?.({ success: true, gameState });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get game state',
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    const info = socketToPlayer.get(socket.id);
    if (info) {
      // Mark player as disconnected but keep in room
      const player = getPlayer(info.playerId);
      if (player) {
        player.isConnected = false;
      }
      
      socket.to(info.roomId).emit('player:disconnected', {
        playerId: info.playerId,
      });
      
      socketToPlayer.delete(socket.id);
    }
  });
  
  // Handle reconnection
  socket.on('player:reconnect', (payload: { playerId: string; roomId: string }, callback) => {
    try {
      const room = getRoom(payload.roomId);
      const player = getPlayer(payload.playerId);
      
      if (!room || !player) {
        callback?.({ success: false, error: 'Room or player not found' });
        return;
      }
      
      // Update socket ID
      updatePlayerSocket(payload.playerId, socket.id);
      socketToPlayer.set(socket.id, { playerId: payload.playerId, roomId: payload.roomId });
      
      socket.join(payload.roomId);
      
      callback?.({
        success: true,
        room: getSanitizedRoom(room),
        player,
      });
      
      // Notify others
      socket.to(payload.roomId).emit('player:reconnected', {
        playerId: payload.playerId,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reconnect',
      });
    }
  });
});

// ==================== Periodic Cleanup ====================

// Clean up old audio files every hour
setInterval(() => {
  cleanupOldAudio(24).then((count) => {
    if (count > 0) {
      console.log(`Cleaned up ${count} old audio files`);
    }
  });
}, 60 * 60 * 1000);

// Clean up disconnected players every 5 minutes
setInterval(() => {
  cleanupDisconnectedPlayers(30);
}, 5 * 60 * 1000);

// ==================== Start Server ====================

httpServer.listen(PORT, () => {
  console.log(`🎮 Mashed Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`);
  console.log(`🔊 Upload directory: ${process.env.UPLOAD_DIR || './uploads'}`);
  console.log(`🎬 GIF API configured: ${isGifApiConfigured()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
