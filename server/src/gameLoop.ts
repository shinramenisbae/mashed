/**
 * Game Loop - Manages game state machine and round flow
 * Phases: lobby → recording → matching → captioning → results → voting → scoring → gameOver
 */

import { v4 as uuidv4 } from 'uuid';
import type { 
  Room, 
  Player, 
  Round, 
  Assignment, 
  Submission,
  AudioData,
  GifData,
  GamePhase,
  PlayerRole,
  Vote,
  LeaderboardEntry,
  RoomStatus
} from './types.js';
import { getRoom, getPlayer } from './roomManager.js';

// Active timers for each room
const roomTimers: Map<string, NodeJS.Timeout> = new Map();

// Callbacks for socket events
interface GameCallbacks {
  broadcastToRoom: (roomId: string, event: string, data: unknown) => void;
  emitToPlayer: (playerId: string, event: string, data: unknown) => void;
}

let callbacks: GameCallbacks | null = null;

/**
 * Initialize game loop with socket callbacks
 */
export function initializeGameLoop(gameCallbacks: GameCallbacks): void {
  callbacks = gameCallbacks;
}

/**
 * Generate a unique assignment ID
 */
function generateAssignmentId(): string {
  return `assign_${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a unique submission ID
 */
function generateSubmissionId(): string {
  return `sub_${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a unique vote ID
 */
function generateVoteId(): string {
  return `vote_${uuidv4().slice(0, 8)}`;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Start a new game
 */
export function startGame(roomId: string): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  if (room.status !== 'waiting') {
    return { success: false, error: 'Game already in progress' };
  }
  
  const connectedPlayers = room.players.filter(p => p.isConnected);
  if (connectedPlayers.length < 4) {
    return { success: false, error: 'Need at least 4 players' };
  }
  
  room.status = 'recording';
  room.startedAt = new Date().toISOString();
  room.currentRound = 1;
  
  // Start first round
  startRound(room);
  
  // Notify all players
  if (callbacks) {
    callbacks.broadcastToRoom(roomId, 'game:started', {
      room: getSanitizedRoom(room),
      phase: 'recording',
    });
  }
  
  return { success: true };
}

/**
 * Start a new round
 */
function startRound(room: Room): void {
  const connectedPlayers = room.players.filter(p => p.isConnected);
  const playerIds = connectedPlayers.map(p => p.id);
  
  // Calculate sound makers (50% rounded up)
  const numSoundMakers = Math.ceil(playerIds.length / 2);
  
  // Shuffle players and assign roles
  const shuffled = shuffle([...playerIds]);
  const soundMakers = shuffled.slice(0, numSoundMakers);
  const gifSelectors = shuffled.slice(numSoundMakers);
  
  // Create assignments (pair sound makers with gif selectors)
  const assignments: Assignment[] = [];
  const usedSelectors = new Set<string>();
  
  for (const soundMakerId of soundMakers) {
    // Find a gif selector who hasn't been assigned yet
    const availableSelectors = gifSelectors.filter(id => !usedSelectors.has(id));
    
    if (availableSelectors.length > 0) {
      const selectorIndex = Math.floor(Math.random() * availableSelectors.length);
      const gifSelectorId = availableSelectors[selectorIndex];
      usedSelectors.add(gifSelectorId);
      
      assignments.push({
        id: generateAssignmentId(),
        soundMakerId,
        gifSelectorId,
        roundNumber: room.currentRound,
      });
    }
  }
  
  // Create round
  const round: Round = {
    roundNumber: room.currentRound,
    status: 'recording',
    soundMakers,
    gifSelectors,
    assignments,
    submissions: [],
    startedAt: new Date().toISOString(),
    recordingEndedAt: null,
    captioningEndedAt: null,
    votingEndedAt: null,
  };
  
  room.rounds.push(round);
  
  // Create empty submissions for each assignment
  for (const assignment of assignments) {
    round.submissions.push({
      id: generateSubmissionId(),
      roundNumber: room.currentRound,
      assignmentId: assignment.id,
      soundMakerId: assignment.soundMakerId,
      gifSelectorId: assignment.gifSelectorId,
      audio: null,
      gif: null,
      caption: '',
      votes: [],
      reactions: [],
      score: 0,
      submittedAt: null,
    });
  }
  
  // Start recording timer
  schedulePhaseEnd(room, 'recording', room.settings.recordingTimeLimit);
  
  // Notify players of their roles
  if (callbacks) {
    for (const player of connectedPlayers) {
      const role = getPlayerRole(player.id, round);
      const assignment = round.assignments.find(a => a.gifSelectorId === player.id);
      
      callbacks.emitToPlayer(player.id, 'round:started', {
        roundNumber: room.currentRound,
        role,
        assignment,
        timeLimit: room.settings.recordingTimeLimit,
        phaseEndsAt: getPhaseEndTime(room.settings.recordingTimeLimit),
      });
    }
    
    callbacks.broadcastToRoom(room.id, 'game:phaseChange', {
      phase: 'recording',
      roundNumber: room.currentRound,
      phaseEndsAt: getPhaseEndTime(room.settings.recordingTimeLimit),
    });
  }
}

/**
 * Get player's role in current round
 */
function getPlayerRole(playerId: string, round: Round): PlayerRole {
  if (round.soundMakers.includes(playerId)) {
    return 'soundMaker';
  }
  if (round.gifSelectors.includes(playerId)) {
    return 'gifSelector';
  }
  return 'observer';
}

/**
 * Get phase end time
 */
function getPhaseEndTime(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * Schedule phase end
 */
function schedulePhaseEnd(room: Room, phase: RoomStatus, seconds: number): void {
  // Clear existing timer
  clearRoomTimer(room.id);
  
  const timer = setTimeout(() => {
    handlePhaseTimeout(room, phase);
  }, seconds * 1000 + 1000); // Add 1 second buffer
  
  roomTimers.set(room.id, timer);
}

/**
 * Clear room timer
 */
function clearRoomTimer(roomId: string): void {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(roomId);
  }
}

/**
 * Handle phase timeout
 */
function handlePhaseTimeout(room: Room, phase: RoomStatus): void {
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== phase) {
    return;
  }
  
  switch (phase) {
    case 'recording':
      endRecordingPhase(room);
      break;
    case 'captioning':
      endCaptioningPhase(room);
      break;
    case 'voting':
      endVotingPhase(room);
      break;
    default:
      break;
  }
}

/**
 * End recording phase and start captioning
 */
function endRecordingPhase(room: Room): void {
  const round = room.rounds[room.rounds.length - 1];
  round.status = 'captioning';
  round.recordingEndedAt = new Date().toISOString();
  room.status = 'captioning';
  
  // Generate placeholder audio for any missing submissions
  for (const submission of round.submissions) {
    if (!submission.audio) {
      submission.audio = {
        id: `placeholder_${uuidv4().slice(0, 8)}`,
        url: '',
        duration: 3,
        format: 'webm',
        size: 0,
        recordedAt: new Date().toISOString(),
      };
    }
  }
  
  // Start captioning timer
  schedulePhaseEnd(room, 'captioning', room.settings.captioningTimeLimit);
  
  // Notify players
  if (callbacks) {
    callbacks.broadcastToRoom(room.id, 'game:phaseChange', {
      phase: 'captioning',
      phaseEndsAt: getPhaseEndTime(room.settings.captioningTimeLimit),
    });
    
    // Send audio to gif selectors
    for (const submission of round.submissions) {
      if (submission.audio) {
        callbacks.emitToPlayer(submission.gifSelectorId, 'audio:received', {
          assignmentId: submission.assignmentId,
          audio: submission.audio,
        });
      }
    }
  }
}

/**
 * End captioning phase and start results/voting
 */
function endCaptioningPhase(room: Room): void {
  const round = room.rounds[room.rounds.length - 1];
  round.status = 'voting';
  round.captioningEndedAt = new Date().toISOString();
  room.status = 'results';
  
  // Auto-submit any incomplete submissions
  for (const submission of round.submissions) {
    if (!submission.submittedAt) {
      submission.submittedAt = new Date().toISOString();
      
      // Add default GIF if missing
      if (!submission.gif) {
        submission.gif = {
          id: 'default',
          url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
          previewUrl: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/200w_s.gif',
          source: 'giphy',
          title: 'Default GIF',
          width: 480,
          height: 270,
        };
      }
      
      // Add default caption if missing
      if (!submission.caption) {
        submission.caption = 'No caption provided';
      }
    }
  }
  
  // Wait a moment for results reveal, then start voting
  setTimeout(() => {
    startVotingPhase(room);
  }, 3000);
  
  // Notify players
  if (callbacks) {
    callbacks.broadcastToRoom(room.id, 'game:phaseChange', {
      phase: 'results',
      submissions: round.submissions.map(s => ({
        id: s.id,
        gif: s.gif,
        caption: s.caption,
        soundMakerId: s.soundMakerId,
      })),
    });
  }
}

/**
 * Start voting phase
 */
function startVotingPhase(room: Room): void {
  const round = room.rounds[room.rounds.length - 1];
  round.status = 'voting';
  room.status = 'voting';
  
  // Start voting timer
  schedulePhaseEnd(room, 'voting', room.settings.votingTimeLimit);
  
  // Notify players
  if (callbacks) {
    callbacks.broadcastToRoom(room.id, 'game:phaseChange', {
      phase: 'voting',
      phaseEndsAt: getPhaseEndTime(room.settings.votingTimeLimit),
    });
    
    // Send submissions for voting (anonymized)
    callbacks.broadcastToRoom(room.id, 'voting:started', {
      submissions: round.submissions.map((s, index) => ({
        id: s.id,
        displayId: `Submission #${index + 1}`,
        gif: s.gif,
        caption: s.caption,
        audio: s.audio,
      })),
    });
  }
}

/**
 * End voting phase and calculate scores
 */
function endVotingPhase(room: Room): void {
  const round = room.rounds[room.rounds.length - 1];
  round.status = 'completed';
  round.votingEndedAt = new Date().toISOString();
  room.status = 'scoring';
  
  // Calculate scores
  calculateScores(room, round);
  
  // Update player stats
  updatePlayerStats(room, round);
  
  // Get leaderboard
  const leaderboard = getLeaderboard(room);
  
  // Notify players
  if (callbacks) {
    callbacks.broadcastToRoom(room.id, 'game:phaseChange', {
      phase: 'scoring',
    });
    
    // Send detailed results
    callbacks.broadcastToRoom(room.id, 'scoring:update', {
      roundNumber: room.currentRound,
      submissions: round.submissions.map(s => ({
        id: s.id,
        soundMakerId: s.soundMakerId,
        gifSelectorId: s.gifSelectorId,
        score: s.score,
        votes: s.votes.length,
        gif: s.gif,
        caption: s.caption,
      })),
      leaderboard,
    });
  }
  
  // Check if game is over
  if (room.currentRound >= room.totalRounds) {
    setTimeout(() => endGame(room), 5000);
  } else {
    setTimeout(() => {
      room.currentRound++;
      room.status = 'recording';
      startRound(room);
    }, 5000);
  }
}

/**
 * Calculate scores for a round
 */
function calculateScores(room: Room, round: Round): void {
  const settings = room.settings;
  
  // Count votes for each submission
  const voteCounts = new Map<string, number>();
  for (const submission of round.submissions) {
    voteCounts.set(submission.id, submission.votes.length);
  }
  
  // Find max votes
  const maxVotes = Math.max(...voteCounts.values(), 0);
  const winners: Submission[] = [];
  
  for (const submission of round.submissions) {
    const votes = voteCounts.get(submission.id) || 0;
    let score = 0;
    
    // Points for votes received
    score += votes * settings.pointsPerVote;
    
    // Participation points
    score += settings.participationPoints;
    
    // Round winner bonus
    if (votes > 0 && votes === maxVotes) {
      score += settings.roundWinnerBonus;
      winners.push(submission);
    }
    
    submission.score = score;
    
    // Update gif selector's score
    const gifSelector = room.players.find(p => p.id === submission.gifSelectorId);
    if (gifSelector) {
      gifSelector.score += score;
    }
    
    // Sound maker points if their sound won
    if (votes === maxVotes && votes > 0) {
      const soundMaker = room.players.find(p => p.id === submission.soundMakerId);
      if (soundMaker) {
        soundMaker.score += settings.soundMakerVotePoints;
      }
    }
  }
}

/**
 * Update player statistics
 */
function updatePlayerStats(room: Room, round: Round): void {
  for (const submission of round.submissions) {
    // Sound maker stats
    const soundMaker = room.players.find(p => p.id === submission.soundMakerId);
    if (soundMaker) {
      soundMaker.stats.soundsCreated++;
      soundMaker.stats.soundVotesReceived += submission.votes.length;
    }
    
    // GIF selector stats
    const gifSelector = room.players.find(p => p.id === submission.gifSelectorId);
    if (gifSelector) {
      gifSelector.stats.captionsWritten++;
      gifSelector.stats.votesReceived += submission.votes.length;
    }
    
    // Track round winners
    const maxVotes = Math.max(...round.submissions.map(s => s.votes.length), 0);
    if (submission.votes.length === maxVotes && maxVotes > 0) {
      if (gifSelector) {
        gifSelector.stats.roundsWon++;
      }
    }
  }
}

/**
 * Get current leaderboard
 */
export function getLeaderboard(room: Room): LeaderboardEntry[] {
  const sorted = [...room.players]
    .filter(p => p.isConnected)
    .sort((a, b) => b.score - a.score);
  
  const entries: LeaderboardEntry[] = [];
  let currentRank = 1;
  let previousScore: number | null = null;
  
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const isTied = previousScore !== null && player.score === previousScore;
    
    if (!isTied) {
      currentRank = i + 1;
    }
    
    entries.push({
      rank: currentRank,
      playerId: player.id,
      nickname: player.nickname,
      avatar: player.avatar,
      score: player.score,
      scoreChange: 0, // Calculated per round
      isTied,
    });
    
    previousScore = player.score;
  }
  
  return entries;
}

/**
 * End the game
 */
function endGame(room: Room): void {
  room.status = 'finished';
  room.endedAt = new Date().toISOString();
  
  clearRoomTimer(room.id);
  
  const leaderboard = getLeaderboard(room);
  
  // Calculate awards
  const awards = calculateAwards(room);
  
  if (callbacks) {
    callbacks.broadcastToRoom(room.id, 'game:ended', {
      leaderboard,
      awards,
      totalRounds: room.totalRounds,
      gameStats: {
        totalSounds: room.players.reduce((sum, p) => sum + p.stats.soundsCreated, 0),
        totalCaptions: room.players.reduce((sum, p) => sum + p.stats.captionsWritten, 0),
        totalVotes: room.rounds.reduce((sum, r) => 
          sum + r.submissions.reduce((s, sub) => s + sub.votes.length, 0), 0),
      },
    });
  }
}

/**
 * Calculate end-game awards
 */
function calculateAwards(room: Room): Array<{ type: string; playerId: string; nickname: string }> {
  const awards: Array<{ type: string; playerId: string; nickname: string }> = [];
  const connected = room.players.filter(p => p.isConnected);
  
  if (connected.length === 0) return awards;
  
  // Champion - highest score
  const champion = connected.reduce((max, p) => p.score > max.score ? p : max, connected[0]);
  awards.push({ type: '🏆 Champion', playerId: champion.id, nickname: champion.nickname });
  
  // Best Actor - most sound votes
  const bestActor = connected.reduce((max, p) => 
    p.stats.soundVotesReceived > max.stats.soundVotesReceived ? p : max, connected[0]);
  if (bestActor.stats.soundVotesReceived > 0) {
    awards.push({ type: '🎭 Best Actor', playerId: bestActor.id, nickname: bestActor.nickname });
  }
  
  // Most Creative - most rounds won
  const mostCreative = connected.reduce((max, p) => 
    p.stats.roundsWon > max.stats.roundsWon ? p : max, connected[0]);
  if (mostCreative.stats.roundsWon > 0) {
    awards.push({ type: '🎨 Most Creative', playerId: mostCreative.id, nickname: mostCreative.nickname });
  }
  
  return awards;
}

/**
 * Submit audio for a sound maker
 */
export function submitAudio(
  playerId: string, 
  roomId: string, 
  audio: AudioData
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== 'recording') {
    return { success: false, error: 'Not in recording phase' };
  }
  
  const submission = round.submissions.find(s => s.soundMakerId === playerId);
  if (!submission) {
    return { success: false, error: 'You are not a sound maker this round' };
  }
  
  submission.audio = audio;
  
  // Notify gif selector
  if (callbacks) {
    callbacks.emitToPlayer(submission.gifSelectorId, 'submission:received', {
      assignmentId: submission.assignmentId,
      audioReceived: true,
    });
  }
  
  return { success: true };
}

/**
 * Submit GIF selection
 */
export function submitGif(
  playerId: string,
  roomId: string,
  assignmentId: string,
  gif: GifData
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== 'captioning') {
    return { success: false, error: 'Not in captioning phase' };
  }
  
  const submission = round.submissions.find(s => s.assignmentId === assignmentId);
  if (!submission || submission.gifSelectorId !== playerId) {
    return { success: false, error: 'Invalid assignment' };
  }
  
  submission.gif = gif;
  
  return { success: true };
}

/**
 * Submit caption
 */
export function submitCaption(
  playerId: string,
  roomId: string,
  assignmentId: string,
  caption: string
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== 'captioning') {
    return { success: false, error: 'Not in captioning phase' };
  }
  
  const submission = round.submissions.find(s => s.assignmentId === assignmentId);
  if (!submission || submission.gifSelectorId !== playerId) {
    return { success: false, error: 'Invalid assignment' };
  }
  
  submission.caption = caption.slice(0, 140);
  
  return { success: true };
}

/**
 * Finalize submission
 */
export function finalizeSubmission(
  playerId: string,
  roomId: string,
  assignmentId: string
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== 'captioning') {
    return { success: false, error: 'Not in captioning phase' };
  }
  
  const submission = round.submissions.find(s => s.assignmentId === assignmentId);
  if (!submission || submission.gifSelectorId !== playerId) {
    return { success: false, error: 'Invalid assignment' };
  }
  
  submission.submittedAt = new Date().toISOString();
  
  // Check if all submissions are in
  const allSubmitted = round.submissions.every(s => s.submittedAt);
  if (allSubmitted) {
    // Cancel timer and move to results
    clearRoomTimer(roomId);
    endCaptioningPhase(room);
  }
  
  return { success: true };
}

/**
 * Cast a vote
 */
export function castVote(
  playerId: string,
  roomId: string,
  submissionId: string,
  category: string = 'standard'
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== 'voting') {
    return { success: false, error: 'Not in voting phase' };
  }
  
  const submission = round.submissions.find(s => s.id === submissionId);
  if (!submission) {
    return { success: false, error: 'Submission not found' };
  }
  
  // Can't vote for your own submission
  if (submission.gifSelectorId === playerId || submission.soundMakerId === playerId) {
    return { success: false, error: 'Cannot vote for your own submission' };
  }
  
  // Remove existing vote from this player
  for (const sub of round.submissions) {
    sub.votes = sub.votes.filter(v => v.playerId !== playerId);
  }
  
  // Add new vote
  const vote: Vote = {
    id: generateVoteId(),
    playerId,
    submissionId,
    category: category as 'standard' | 'bestMisinterpretation' | 'madeMeCryLaugh',
    points: room.settings.pointsPerVote,
    votedAt: new Date().toISOString(),
  };
  
  submission.votes.push(vote);
  
  // Check if all players have voted
  const connectedPlayers = room.players.filter(p => p.isConnected);
  const totalVotes = round.submissions.reduce((sum, s) => sum + s.votes.length, 0);
  
  // Each player can vote once
  if (totalVotes >= connectedPlayers.length) {
    clearRoomTimer(roomId);
    endVotingPhase(room);
  }
  
  return { success: true };
}

/**
 * Add reaction to submission
 */
export function addReaction(
  playerId: string,
  roomId: string,
  submissionId: string,
  emoji: string
): { success: boolean; error?: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  const round = room.rounds[room.rounds.length - 1];
  if (!round) {
    return { success: false, error: 'No active round' };
  }
  
  const submission = round.submissions.find(s => s.id === submissionId);
  if (!submission) {
    return { success: false, error: 'Submission not found' };
  }
  
  // Remove existing reaction from this player
  submission.reactions = submission.reactions.filter(r => r.playerId !== playerId);
  
  // Add new reaction
  submission.reactions.push({
    playerId,
    emoji,
    reactedAt: new Date().toISOString(),
  });
  
  // Broadcast reaction
  if (callbacks) {
    callbacks.broadcastToRoom(roomId, 'reaction:added', {
      submissionId,
      emoji,
      count: submission.reactions.length,
    });
  }
  
  return { success: true };
}

/**
 * Get sanitized room data (for client)
 */
export function getSanitizedRoom(room: Room): Partial<Room> {
  return {
    id: room.id,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      score: p.score,
    })),
    status: room.status,
    settings: room.settings,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
  };
}

/**
 * Get current game state for a player
 */
export function getGameState(playerId: string, roomId: string): Partial<Room> | null {
  const room = getRoom(roomId);
  const player = getPlayer(playerId);
  
  if (!room || !player) {
    return null;
  }
  
  return getSanitizedRoom(room);
}
