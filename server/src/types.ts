/**
 * TypeScript types for Mashed game server
 * Matches data-models.json specification
 */

// Enums
export type RoomStatus = 
  | 'waiting' 
  | 'recording' 
  | 'matching' 
  | 'captioning' 
  | 'results' 
  | 'voting' 
  | 'scoring' 
  | 'finished';

export type RoundStatus = 'recording' | 'captioning' | 'voting' | 'completed';

export type GamePhase = 
  | 'lobby' 
  | 'recording' 
  | 'captioning' 
  | 'results' 
  | 'voting' 
  | 'scoring' 
  | 'gameOver';

export type PlayerRole = 'soundMaker' | 'gifSelector' | 'voter' | 'observer';

export type AudioFormat = 'webm' | 'mp3' | 'wav';

export type GifSource = 'giphy' | 'tenor';

export type VoteCategory = 'standard' | 'bestMisinterpretation' | 'madeMeCryLaugh';

// Player related
export interface PlayerStats {
  soundsCreated: number;
  captionsWritten: number;
  roundsWon: number;
  votesReceived: number;
  soundVotesReceived: number;
  bestMisinterpretationVotes: number;
  madeMeCryLaughVotes: number;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  socketId: string;
  roomId: string | null;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  joinedAt: string;
  score: number;
  stats: PlayerStats;
}

// Game settings
export interface GameSettings {
  recordingTimeLimit: number;
  captioningTimeLimit: number;
  votingTimeLimit: number;
  pointsPerVote: number;
  bonusPointsEnabled: boolean;
  roundWinnerBonus: number;
  soundMakerVotePoints: number;
  participationPoints: number;
}

// Round related
export interface Assignment {
  id: string;
  soundMakerId: string;
  gifSelectorId: string;
  roundNumber: number;
}

export interface AudioData {
  id: string;
  url: string;
  duration: number;
  format: AudioFormat;
  size: number;
  recordedAt: string;
}

export interface GifData {
  id: string;
  url: string;
  previewUrl: string;
  source: GifSource;
  title: string;
  width: number;
  height: number;
}

export interface Vote {
  id: string;
  playerId: string;
  submissionId: string;
  category: VoteCategory;
  points: number;
  votedAt: string;
}

export interface Reaction {
  playerId: string;
  emoji: string;
  reactedAt: string;
}

export interface Submission {
  id: string;
  roundNumber: number;
  assignmentId: string;
  soundMakerId: string;
  gifSelectorId: string;
  audio: AudioData | null;
  gif: GifData | null;
  caption: string;
  votes: Vote[];
  reactions: Reaction[];
  score: number;
  submittedAt: string | null;
}

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  soundMakers: string[];
  gifSelectors: string[];
  assignments: Assignment[];
  submissions: Submission[];
  startedAt: string;
  recordingEndedAt: string | null;
  captioningEndedAt: string | null;
  votingEndedAt: string | null;
}

// Room
export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  status: RoomStatus;
  settings: GameSettings;
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  scoreChange: number;
  isTied: boolean;
}

// Game state sent to clients
export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  phase: GamePhase;
  phaseEndsAt: string | null;
  myRole: PlayerRole;
  myAssignment: Assignment | null;
  mySubmission: Submission | null;
  currentRoundData: Round | null;
  submissionsForVoting: Submission[] | null;
  hasVoted: boolean;
  leaderboard: LeaderboardEntry[];
}

// Socket.IO event payloads
export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  avatar?: string;
}

export interface CreateRoomPayload {
  nickname: string;
  avatar?: string;
}

export interface UpdateSettingsPayload {
  recordingTimeLimit?: number;
  captioningTimeLimit?: number;
  votingTimeLimit?: number;
  totalRounds?: number;
  bonusPointsEnabled?: boolean;
}

export interface AudioRecordPayload {
  audioData: Buffer;
  duration: number;
  format: AudioFormat;
}

export interface GifSelectPayload {
  gifId: string;
  gifData: GifData;
}

export interface CaptionPayload {
  caption: string;
}

export interface SubmitPayload {
  assignmentId: string;
}

export interface VotePayload {
  submissionId: string;
  category?: VoteCategory;
}

export interface ReactionPayload {
  submissionId: string;
  emoji: string;
}

// API Response types
export interface GifSearchResult {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}
