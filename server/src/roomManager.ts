/**
 * Room Manager - Handles room creation, joining, and player management
 */

import { v4 as uuidv4 } from 'uuid';
import type { 
  Room, 
  Player, 
  GameSettings, 
  PlayerStats,
  CreateRoomPayload,
  JoinRoomPayload
} from './types.js';

// In-memory storage for rooms
const rooms: Map<string, Room> = new Map();
const players: Map<string, Player> = new Map();

// Default game settings
const defaultSettings: GameSettings = {
  recordingTimeLimit: 30,
  captioningTimeLimit: 60,
  votingTimeLimit: 45,
  pointsPerVote: 50,
  bonusPointsEnabled: true,
  roundWinnerBonus: 100,
  soundMakerVotePoints: 25,
  participationPoints: 10,
};

// Default player stats
const defaultStats: PlayerStats = {
  soundsCreated: 0,
  captionsWritten: 0,
  roundsWon: 0,
  votesReceived: 0,
  soundVotesReceived: 0,
  bestMisinterpretationVotes: 0,
  madeMeCryLaughVotes: 0,
};

/**
 * Generate a random 4-letter room code
 */
function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

/**
 * Generate a unique room code that doesn't exist
 */
function generateUniqueRoomCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  
  if (attempts >= 100) {
    throw new Error('Unable to generate unique room code');
  }
  
  return code;
}

/**
 * Create a new room
 */
export function createRoom(payload: CreateRoomPayload, socketId: string): { room: Room; player: Player } {
  const roomCode = generateUniqueRoomCode();
  const playerId = uuidv4();
  const now = new Date().toISOString();
  const defaultNicknames = ['Viber', 'Bestie', 'Slay', 'NPC', 'Goat', 'Legend', 'Chaos', 'Menace', 'Icon', 'MainChar'];
  const randomNick = defaultNicknames[Math.floor(Math.random() * defaultNicknames.length)] + Math.floor(Math.random() * 100);
  
  const player: Player = {
    id: playerId,
    nickname: (payload?.nickname || randomNick).slice(0, 20),
    avatar: payload?.avatar || '🎮',
    socketId,
    roomId: roomCode,
    isHost: true,
    isReady: false,
    isConnected: true,
    joinedAt: now,
    score: 0,
    stats: { ...defaultStats },
  };
  
  const room: Room = {
    id: roomCode,
    hostId: playerId,
    players: [player],
    status: 'waiting',
    settings: { ...defaultSettings },
    currentRound: 0,
    totalRounds: 5,
    rounds: [],
    createdAt: now,
    startedAt: null,
    endedAt: null,
  };
  
  rooms.set(roomCode, room);
  players.set(playerId, player);
  
  return { room, player };
}

/**
 * Join an existing room
 */
export function joinRoom(payload: JoinRoomPayload, socketId: string): { room: Room; player: Player } {
  const roomCode = payload.roomCode.toUpperCase();
  const room = rooms.get(roomCode);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.status !== 'waiting') {
    throw new Error('Game already in progress');
  }
  
  if (room.players.length >= 8) {
    throw new Error('Room is full (max 8 players)');
  }
  
  // Check for duplicate nickname
  const normalizedNickname = payload.nickname.trim().toLowerCase();
  const existingPlayer = room.players.find(
    p => p.nickname.trim().toLowerCase() === normalizedNickname && p.isConnected
  );
  
  if (existingPlayer) {
    throw new Error('Nickname already taken in this room');
  }
  
  const playerId = uuidv4();
  const now = new Date().toISOString();
  const joinNicknames = ['Viber', 'Bestie', 'Slay', 'NPC', 'Goat', 'Legend', 'Chaos', 'Menace', 'Icon', 'MainChar'];
  const randomJoinNick = joinNicknames[Math.floor(Math.random() * joinNicknames.length)] + Math.floor(Math.random() * 100);
  
  const player: Player = {
    id: playerId,
    nickname: (payload?.nickname || randomJoinNick).slice(0, 20),
    avatar: payload?.avatar || '🎮',
    socketId,
    roomId: roomCode,
    isHost: false,
    isReady: false,
    isConnected: true,
    joinedAt: now,
    score: 0,
    stats: { ...defaultStats },
  };
  
  room.players.push(player);
  players.set(playerId, player);
  
  return { room, player };
}

/**
 * Leave a room
 */
export function leaveRoom(playerId: string): Room | null {
  const player = players.get(playerId);
  if (!player || !player.roomId) {
    return null;
  }
  
  const room = rooms.get(player.roomId);
  if (!room) {
    return null;
  }
  
  // Mark player as disconnected
  player.isConnected = false;
  player.roomId = null;
  
  // Remove from room's player list
  room.players = room.players.filter(p => p.id !== playerId);
  
  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(room.id);
    return null;
  }
  
  // If host left, assign new host
  if (playerId === room.hostId && room.players.length > 0) {
    const newHost = room.players.find(p => p.isConnected);
    if (newHost) {
      newHost.isHost = true;
      room.hostId = newHost.id;
    }
  }
  
  return room;
}

/**
 * Set player ready status
 */
export function setPlayerReady(playerId: string, isReady: boolean): { player: Player; room: Room } {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  player.isReady = isReady;
  
  const room = player.roomId ? rooms.get(player.roomId) : undefined;
  if (!room) {
    throw new Error('Room not found');
  }
  
  return { player, room };
}

/**
 * Update player nickname
 */
export function updateNickname(playerId: string, nickname: string): { player: Player; room: Room } {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  const trimmedNickname = nickname.trim().slice(0, 20);
  if (!trimmedNickname) {
    throw new Error('Nickname cannot be empty');
  }
  
  player.nickname = trimmedNickname;
  
  const room = player.roomId ? rooms.get(player.roomId) : undefined;
  if (!room) {
    throw new Error('Room not found');
  }
  
  return { player, room };
}

/**
 * Update player avatar
 */
export function updateAvatar(playerId: string, avatar: string): { player: Player; room: Room } {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  player.avatar = avatar;
  
  const room = player.roomId ? rooms.get(player.roomId) : undefined;
  if (!room) {
    throw new Error('Room not found');
  }
  
  return { player, room };
}

/**
 * Update game settings (host only)
 */
export function updateSettings(
  playerId: string, 
  settings: Partial<GameSettings>
): { room: Room } {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (!player.isHost) {
    throw new Error('Only host can update settings');
  }
  
  const room = player.roomId ? rooms.get(player.roomId) : undefined;
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.status !== 'waiting') {
    throw new Error('Cannot change settings during game');
  }
  
  // Validate and update settings
  if (settings.recordingTimeLimit !== undefined) {
    room.settings.recordingTimeLimit = Math.max(15, Math.min(60, settings.recordingTimeLimit));
  }
  if (settings.captioningTimeLimit !== undefined) {
    room.settings.captioningTimeLimit = Math.max(45, Math.min(120, settings.captioningTimeLimit));
  }
  if (settings.votingTimeLimit !== undefined) {
    room.settings.votingTimeLimit = Math.max(30, Math.min(90, settings.votingTimeLimit));
  }
  if (settings.bonusPointsEnabled !== undefined) {
    room.settings.bonusPointsEnabled = settings.bonusPointsEnabled;
  }
  
  return { room };
}

/**
 * Update total rounds (host only)
 */
export function updateTotalRounds(playerId: string, totalRounds: number): { room: Room } {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (!player.isHost) {
    throw new Error('Only host can update rounds');
  }
  
  const room = player.roomId ? rooms.get(player.roomId) : undefined;
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.status !== 'waiting') {
    throw new Error('Cannot change rounds during game');
  }
  
  room.totalRounds = Math.max(4, Math.min(10, totalRounds));
  
  return { room };
}

/**
 * Check if all players are ready and minimum 4 players
 */
export function canStartGame(roomId: string): { canStart: boolean; reason?: string } {
  const room = rooms.get(roomId);
  if (!room) {
    return { canStart: false, reason: 'Room not found' };
  }
  
  const connectedPlayers = room.players.filter(p => p.isConnected);
  
  if (connectedPlayers.length < 4) {
    return { canStart: false, reason: 'Need at least 4 players to start' };
  }
  
  const allReady = connectedPlayers.every(p => p.isReady);
  if (!allReady) {
    return { canStart: false, reason: 'Not all players are ready' };
  }
  
  return { canStart: true };
}

/**
 * Get a room by ID
 */
export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

/**
 * Get a player by ID
 */
export function getPlayer(playerId: string): Player | undefined {
  return players.get(playerId);
}

/**
 * Update player's socket ID (for reconnection)
 */
export function updatePlayerSocket(playerId: string, socketId: string): void {
  const player = players.get(playerId);
  if (player) {
    player.socketId = socketId;
    player.isConnected = true;
  }
}

/**
 * Get all rooms (for debugging)
 */
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

/**
 * Clean up disconnected players (call periodically)
 */
export function cleanupDisconnectedPlayers(maxAgeMinutes: number = 30): void {
  const now = new Date();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  for (const [playerId, player] of players.entries()) {
    if (!player.isConnected && player.roomId) {
      const joinedAt = new Date(player.joinedAt);
      if (now.getTime() - joinedAt.getTime() > maxAgeMs) {
        leaveRoom(playerId);
        players.delete(playerId);
      }
    }
  }
}
