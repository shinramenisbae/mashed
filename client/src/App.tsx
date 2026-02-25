import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import styled, { createGlobalStyle } from 'styled-components';
import {
  Home,
  Lobby,
  JoiningRoom,
  AudioRecorder,
  CaptionScreen,
  Results,
  Voting,
  Scoring,
  GameOver,
  Player,
  Submission,
  LeaderboardEntry,
  theme,
} from './components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
    background: ${theme.dark};
    color: ${theme.light};
    min-height: 100vh;
    overflow-x: hidden;
  }
  
  #root {
    min-height: 100vh;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${theme.darker};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${theme.primary};
    border-radius: 4px;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${theme.dark};
`;

const ConnectionStatus = styled.div<{ connected: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: ${props => props.connected ? theme.secondary : theme.primary};
  z-index: 1000;
  transition: background 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.connected 
      ? 'transparent' 
      : 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)'};
    animation: ${props => !props.connected ? 'slide 1s linear infinite' : 'none'};
  }
  
  @keyframes slide {
    from { transform: translateX(0); }
    to { transform: translateX(-20px); }
  }
`;

const ErrorToast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${theme.primary};
  color: white;
  padding: 16px 32px;
  border-radius: 50px;
  font-weight: 700;
  box-shadow: 0 10px 40px rgba(255, 0, 80, 0.4);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
`;

// Game phases
type GamePhase = 
  | 'home' 
  | 'joining'
  | 'lobby' 
  | 'recording' 
  | 'captioning' 
  | 'results' 
  | 'voting' 
  | 'scoring' 
  | 'gameOver';

function App() {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [phase, setPhase] = useState<GamePhase>('home');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState({
    totalRounds: 5,
    recordingTime: 30,
    captioningTime: 60,
    votingTime: 45,
    bonusCategories: true,
  });

  // Game progress
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentAudio, setCurrentAudio] = useState<{ url: string; duration: number }>({ url: '', duration: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [votesCast, setVotesCast] = useState(0);
  const [currentAssignmentId, setCurrentAssignmentId] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || window.location.origin;
    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    });

    // Game state updates
    newSocket.on('game:state', (state) => {
      setPlayers(state.room?.players || []);
      setCurrentPlayerId(state.currentPlayer?.id || '');
      setIsHost(state.currentPlayer?.isHost || false);
      setCurrentRound(state.room?.currentRound || 1);
      setTotalRounds(state.room?.totalRounds || 5);
      setSettings(state.room?.settings || settings);

      // Update phase based on server state
      const serverPhase = state.phase;
      if (serverPhase && serverPhase !== phase) {
        setPhase(serverPhase);
      }
    });

    // Room state updates (when players join/leave)
    newSocket.on('room:updated', (data) => {
      if (data.room?.players) {
        setPlayers(data.room.players);
      }
    });

    // Player joined - add to players list
    newSocket.on('player:joined', (data) => {
      if (data.player) {
        setPlayers(prev => {
          // Avoid duplicates
          const exists = prev.find(p => p.id === data.player.id);
          if (exists) return prev;
          return [...prev, data.player];
        });
      }
    });

    // Player left - remove from players list
    newSocket.on('player:left', (data) => {
      if (data.playerId) {
        setPlayers(prev => prev.filter(p => p.id !== data.playerId));
      }
    });

    // Player updated (ready status, nickname, avatar)
    newSocket.on('player:updated', (data) => {
      if (data.playerId) {
        setPlayers(prev => prev.map(p => {
          if (p.id === data.playerId) {
            return { ...p, ...data };
          }
          return p;
        }));
      }
    });

    newSocket.on('game:phaseChange', (data) => {
      setPhase(data.phase);
      if (data.round) {
        setCurrentRound(data.round);
      }
    });

    newSocket.on('round:started', (data) => {
      setPhase(data.role === 'soundMaker' ? 'recording' : 'captioning');
      if (data.assignment?.id) {
        setCurrentAssignmentId(data.assignment.id);
      }
    });

    newSocket.on('round:assignment', (data) => {
      if (data.assignmentId) {
        setCurrentAssignmentId(data.assignmentId);
      }
      if (data.audio) {
        setCurrentAudio({
          url: data.audio.url,
          duration: data.audio.duration,
        });
      }
    });

    newSocket.on('submission:allReceived', () => {
      setPhase('results');
    });

    newSocket.on('voting:started', (data) => {
      setSubmissions(data.submissions || []);
      setPhase('voting');
    });

    newSocket.on('vote:received', () => {
      setVotesCast(prev => prev + 1);
    });

    newSocket.on('voting:ended', (data) => {
      setLeaderboard(data.leaderboard || []);
      setPhase('scoring');
    });

    newSocket.on('game:ended', (data) => {
      setLeaderboard(data.leaderboard || []);
      setPhase('gameOver');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Actions
  const handleCreateRoom = useCallback(() => {
    socket?.emit('room:create', {}, (response: { roomCode: string; room?: { players?: Player[] }; error?: string }) => {
      if (response.error) {
        setError(response.error);
      } else {
        setRoomCode(response.roomCode);
        setIsHost(true);
        // Set players from response if available
        if (response.room?.players) {
          setPlayers(response.room.players);
        }
        setPhase('joining');
      }
    });
  }, [socket]);

  const handleJoinRoom = useCallback((code: string) => {
    socket?.emit('room:join', { roomCode: code }, (response: { success: boolean; room?: { players?: Player[] }; error?: string }) => {
      if (response.error) {
        setError(response.error);
      } else {
        setRoomCode(code);
        setIsHost(false);
        // Set players from response if available
        if (response.room?.players) {
          setPlayers(response.room.players);
        }
        setPhase('joining');
      }
    });
  }, [socket]);

  const handleEnterRoom = useCallback(() => {
    setPhase('lobby');
  }, []);

  const handleReady = useCallback(() => {
    // Find current player and toggle ready state
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const newReadyState = !(currentPlayer?.isReady ?? false);
    socket?.emit('player:ready', newReadyState);
  }, [socket, players, currentPlayerId]);

  const handleStartGame = useCallback(() => {
    socket?.emit('game:start');
  }, [socket]);

  const handleSettingsChange = useCallback((newSettings: typeof settings) => {
    setSettings(newSettings);
    socket?.emit('game:settings', newSettings);
  }, [socket]);

  const handleNicknameChange = useCallback((nickname: string) => {
    socket?.emit('player:nickname', nickname);
  }, [socket]);

  const handleAvatarChange = useCallback((avatar: string) => {
    socket?.emit('player:avatar', avatar);
  }, [socket]);

  const handleAudioSubmit = useCallback((audioBlob: Blob, duration: number) => {
    socket?.emit('audio:record', { audio: audioBlob, duration });
    // Show waiting screen or move to next phase
  }, [socket]);

  const handleCaptionSubmit = useCallback((_gifId: string, _gifUrl: string, caption: string) => {
    if (!currentAssignmentId) {
      console.error('No assignment ID available');
      return;
    }
    // First submit the caption
    socket?.emit('submission:caption', { assignmentId: currentAssignmentId, caption });
    // Then finalize the submission
    socket?.emit('submission:submit', { assignmentId: currentAssignmentId });
  }, [socket, currentAssignmentId]);

  const handleVote = useCallback((submissionId: string, bonusVotes?: { bestMisinterpretation?: string; madeMeCryLaugh?: string }) => {
    socket?.emit('vote:cast', { submissionId, bonusVotes });
  }, [socket]);

  const handleNextRound = useCallback(() => {
    socket?.emit('game:nextRound');
  }, [socket]);

  const handleRematch = useCallback(() => {
    socket?.emit('game:rematch');
    setPhase('lobby');
  }, [socket]);

  const handleLobby = useCallback(() => {
    setPhase('lobby');
  }, []);

  const handleResultsComplete = useCallback(() => {
    // Auto-advance handled by server
  }, []);

  // Render current phase
  const renderPhase = () => {
    switch (phase) {
      case 'home':
        return (
          <Home
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={error || undefined}
          />
        );

      case 'joining':
        return (
          <JoiningRoom
            roomCode={roomCode}
            isHost={isHost}
            onEnterRoom={handleEnterRoom}
            onNicknameChange={handleNicknameChange}
            onAvatarChange={handleAvatarChange}
          />
        );

      case 'lobby':
        return (
          <Lobby
            roomCode={roomCode}
            players={players}
            currentPlayerId={currentPlayerId}
            isHost={isHost}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onReady={handleReady}
            onStart={handleStartGame}
            onNicknameChange={handleNicknameChange}
            onAvatarChange={handleAvatarChange}
          />
        );

      case 'recording':
        return (
          <AudioRecorder
            roundNumber={currentRound}
            totalRounds={totalRounds}
            timeLimit={settings.recordingTime}
            onSubmit={handleAudioSubmit}
          />
        );

      case 'captioning':
        return (
          <CaptionScreen
            roundNumber={currentRound}
            totalRounds={totalRounds}
            timeLimit={settings.captioningTime}
            audioUrl={currentAudio.url}
            audioDuration={currentAudio.duration}
            onSubmit={handleCaptionSubmit}
          />
        );

      case 'results':
        return (
          <Results
            roundNumber={currentRound}
            totalRounds={totalRounds}
            submissions={submissions}
            onComplete={handleResultsComplete}
          />
        );

      case 'voting':
        return (
          <Voting
            roundNumber={currentRound}
            totalRounds={totalRounds}
            timeLimit={settings.votingTime}
            submissions={submissions}
            myPlayerId={currentPlayerId}
            totalPlayers={players.length}
            votesCast={votesCast}
            bonusCategories={settings.bonusCategories}
            onVote={handleVote}
          />
        );

      case 'scoring':
        return (
          <Scoring
            roundNumber={currentRound}
            totalRounds={totalRounds}
            winner={submissions[0]}
            leaderboard={leaderboard}
            awards={[]}
            myPlayerId={currentPlayerId}
            onNextRound={handleNextRound}
          />
        );

      case 'gameOver':
        return (
          <GameOver
            leaderboard={leaderboard}
            awards={[]}
            stats={{
              totalSounds: submissions.length,
              totalGifs: submissions.length,
              mostUsedSearch: 'confused',
              longestSound: 28.5,
              funniestMoment: 'Round 3',
            }}
            myPlayerId={currentPlayerId}
            roomCode={roomCode}
            onRematch={handleRematch}
            onLobby={handleLobby}
          />
        );

      default:
        return <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }
  };

  return (
    <AppContainer>
      <GlobalStyle />
      <ConnectionStatus connected={connected} />
      
      {renderPhase()}
      
      {error && (
        <ErrorToast onClick={() => setError(null)}>
          ⚠️ {error}
        </ErrorToast>
      )}
    </AppContainer>
  );
}

export default App;
