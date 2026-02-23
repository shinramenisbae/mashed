import styled, { keyframes } from 'styled-components';
import { useState, useEffect, useRef } from 'react';
import { Container, Title, Card, Button, theme, LeaderboardEntry } from './shared';

const confettiAnimation = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const shineAnimation = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const GameOverContainer = styled.div`
  padding-top: 20px;
  position: relative;
`;

const Confetti = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;

const ConfettiPiece = styled.div<{ delay: number; color: string; left: number }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${props => props.color};
  left: ${props => props.left}%;
  top: -10px;
  animation: ${confettiAnimation} 3s ease-out forwards;
  animation-delay: ${props => props.delay}s;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  .title {
    font-size: 48px;
    font-weight: 900;
    background: ${theme.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
    animation: ${floatAnimation} 3s ease-in-out infinite;
  }
  
  .subtitle {
    color: ${theme.gray};
    font-size: 18px;
  }
`;

const Podium = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
  padding: 0 20px;
`;

const PodiumPlace = styled.div<{ place: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  order: ${props => props.place === 1 ? 2 : props.place === 2 ? 1 : 3};
  transform: ${props => props.place === 1 ? 'scale(1.2)' : 'scale(1)'};
  z-index: ${props => props.place === 1 ? 3 : 1};
  
  .avatar {
    width: ${props => props.place === 1 ? '80px' : '60px'};
    height: ${props => props.place === 1 ? '80px' : '60px'};
    border-radius: 50%;
    background: ${props => {
      switch(props.place) {
        case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
        case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)';
        case 3: return 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)';
        default: return theme.gradient;
      }
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${props => props.place === 1 ? '40px' : '30px'};
    margin-bottom: 12px;
    box-shadow: ${props => props.place === 1 
      ? '0 10px 40px rgba(255, 215, 0, 0.5)' 
      : '0 5px 20px rgba(0, 0, 0, 0.3)'};
    animation: ${props => props.place === 1 ? `${floatAnimation} 2s ease-in-out infinite` : 'none'};
  }
  
  .name {
    font-weight: 700;
    font-size: ${props => props.place === 1 ? '18px' : '14px'};
    margin-bottom: 4px;
    text-align: center;
  }
  
  .score {
    font-size: ${props => props.place === 1 ? '24px' : '18px'};
    font-weight: 900;
    background: ${props => {
      switch(props.place) {
        case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
        case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)';
        case 3: return 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)';
        default: return theme.gradient;
      }
    }};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .place {
    font-size: 36px;
    margin-top: 8px;
  }
`;

const LeaderboardCard = styled(Card)`
  margin-bottom: 24px;
`;

const LeaderboardRow = styled.div<{ rank: number; isMe?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 8px;
  background: ${props => props.isMe ? 'rgba(255, 0, 80, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 16px;
  border: 2px solid ${props => props.isMe ? theme.primary : 'transparent'};
  
  .rank {
    font-size: 20px;
    font-weight: 900;
    width: 36px;
    text-align: center;
    color: ${theme.gray};
  }
  
  .avatar {
    font-size: 28px;
  }
  
  .info {
    flex: 1;
    
    .name {
      font-weight: 700;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tag {
      font-size: 11px;
      background: ${theme.primary};
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
  
  .score {
    font-size: 20px;
    font-weight: 900;
    color: ${theme.light};
  }
`;

const AwardsCard = styled(Card)`
  margin-bottom: 24px;
`;

const AwardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  .emoji {
    font-size: 24px;
    width: 40px;
    text-align: center;
  }
  
  .category {
    flex: 1;
    font-size: 14px;
    color: ${theme.gray};
  }
  
  .winner {
    font-weight: 700;
    color: ${theme.light};
  }
`;

const StatsCard = styled(Card)`
  margin-bottom: 24px;
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      color: ${theme.gray};
      font-size: 14px;
    }
    
    .value {
      font-weight: 700;
      color: ${theme.light};
    }
  }
`;

const ShareCard = styled(Card)`
  text-align: center;
  background: ${theme.gradient};
  padding: 32px;
  margin-bottom: 24px;
  
  .preview {
    background: white;
    border-radius: 16px;
    padding: 24px;
    color: ${theme.dark};
    margin-bottom: 16px;
    
    .logo {
      font-size: 24px;
      font-weight: 900;
      margin-bottom: 12px;
    }
    
    .text {
      font-size: 16px;
      margin-bottom: 12px;
    }
    
    .result {
      font-size: 20px;
      font-weight: 900;
    }
    
    .url {
      font-size: 12px;
      color: ${theme.gray};
      margin-top: 12px;
    }
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
  
  button {
    flex: 1;
  }
`;

const CONFEETI_COLORS = ['#FF0050', '#00F2EA', '#FFD700', '#8B5CF6', '#EC4899'];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerId: '1', nickname: 'SoundNinja', avatar: '🎭', score: 1240, scoreChange: 0 },
  { rank: 2, playerId: '2', nickname: 'GifMaster', avatar: '🎸', score: 1080, scoreChange: 0 },
  { rank: 3, playerId: '3', nickname: 'NoisyPenguin', avatar: '🎪', score: 920, scoreChange: 0 },
  { rank: 4, playerId: '4', nickname: 'MemeLord', avatar: '🎬', score: 850, scoreChange: 0 },
  { rank: 5, playerId: '5', nickname: 'AudioPhile', avatar: '🎯', score: 720, scoreChange: 0 },
  { rank: 6, playerId: '6', nickname: 'SoundNinja2', avatar: '🎲', score: 640, scoreChange: 0 },
];

const MOCK_AWARDS = [
  { emoji: '🎭', category: 'Best Actor', winner: 'SoundNinja' },
  { emoji: '🎨', category: 'Most Creative', winner: 'MemeLord' },
  { emoji: '😂', category: 'Comedian', winner: 'GifMaster' },
  { emoji: '🔊', category: 'Loudest Sound', winner: 'NoisyPenguin' },
  { emoji: '📝', category: 'Wordiest Caption', winner: 'AudioPhile' },
];

const MOCK_STATS = {
  totalSounds: 18,
  totalGifs: 18,
  mostUsedSearch: 'confused',
  longestSound: 28.5,
  funniestMoment: 'Round 3, Match 2',
};

interface GameOverProps {
  leaderboard: LeaderboardEntry[];
  awards: { emoji: string; category: string; winner: string }[];
  stats: {
    totalSounds: number;
    totalGifs: number;
    mostUsedSearch: string;
    longestSound: number;
    funniestMoment: string;
  };
  myPlayerId: string;
  roomCode: string;
  onRematch: () => void;
  onLobby: () => void;
}

export function GameOver({
  leaderboard,
  awards,
  stats,
  myPlayerId,
  roomCode,
  onRematch,
  onLobby,
}: GameOverProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; delay: number; color: string; left: number }[]>([]);
  
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : MOCK_LEADERBOARD;
  const displayAwards = awards.length > 0 ? awards : MOCK_AWARDS;
  const displayStats = stats.totalSounds ? stats : MOCK_STATS;
  
  const winner = displayLeaderboard[0];
  const isWinner = winner.playerId === myPlayerId;
  const myEntry = displayLeaderboard.find(p => p.playerId === myPlayerId);

  // Generate confetti
  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      color: CONFEETI_COLORS[Math.floor(Math.random() * CONFEETI_COLORS.length)],
      left: Math.random() * 100,
    }));
    setConfettiPieces(pieces);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = () => {
    const text = isWinner 
      ? `🎉 I just WON a game of MASHED with ${displayLeaderboard.length} friends! ${winner.score} points! 🏆`
      : `🎭 Just played MASHED with ${displayLeaderboard.length} friends! ${myEntry?.score || 0} points! 🎉`;
    
    if (navigator.share) {
      navigator.share({
        title: 'MASHED - Party Game',
        text,
        url: `https://playmashed.game/${roomCode}`,
      });
    } else {
      navigator.clipboard.writeText(`${text}\nhttps://playmashed.game/${roomCode}`);
      alert('Results copied to clipboard!');
    }
  };

  return (
    <Container>
      {showConfetti && (
        <Confetti>
          {confettiPieces.map(piece => (
            <ConfettiPiece
              key={piece.id}
              delay={piece.delay}
              color={piece.color}
              left={piece.left}
            />
          ))}
        </Confetti>
      )}

      <GameOverContainer>
        <Header>
          <div className="title">🎉 GAME OVER! 🎉</div>
          <div className="subtitle">{isWinner ? 'You are the CHAMPION! 🏆' : 'Great game everyone!'}</div>
        </Header>

        <Podium>
          {displayLeaderboard.slice(0, 3).map((entry) => (
            <PodiumPlace key={entry.playerId} place={entry.rank}>
              <div className="avatar">{entry.avatar}</div>
              <div className="name">{entry.nickname}</div>
              <div className="score">{entry.score.toLocaleString()} pts</div>
              <div className="place">
                {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : '🥉'}
              </div>
            </PodiumPlace>
          ))}
        </Podium>

        <LeaderboardCard>
          <div style={{ fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>📊 FINAL LEADERBOARD 📊</div>
          
          {displayLeaderboard.map((entry) => (
            <LeaderboardRow 
              key={entry.playerId}
              rank={entry.rank}
              isMe={entry.playerId === myPlayerId}
            >
              <div className="rank">{entry.rank}</div>
              <div className="avatar">{entry.avatar}</div>
              <div className="info">
                <div className="name">
                  {entry.nickname}
                  {entry.playerId === myPlayerId && <span className="tag">YOU</span>}
                </div>
              </div>
              <div className="score">{entry.score.toLocaleString()}</div>
            </LeaderboardRow>
          ))}
        </LeaderboardCard>

        <AwardsCard>
          <div style={{ fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>🏅 AWARDS CEREMONY 🏅</div>
          
          {displayAwards.map((award, i) => (
            <AwardItem key={i}>
              <span className="emoji">{award.emoji}</span>
              <span className="category">{award.category}</span>
              <span className="winner">{award.winner}</span>
            </AwardItem>
          ))}
        </AwardsCard>

        <StatsCard>
          <div style={{ fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>📈 GAME STATS 📈</div>
          
          <div className="stat-row">
            <span className="label">Total sounds</span>
            <span className="value">{displayStats.totalSounds}</span>
          </div>
          <div className="stat-row">
            <span className="label">Total GIFs</span>
            <span className="value">{displayStats.totalGifs}</span>
          </div>
          <div className="stat-row">
            <span className="label">Most used search</span>
            <span className="value">"{displayStats.mostUsedSearch}"</span>
          </div>
          <div className="stat-row">
            <span className="label">Longest sound</span>
            <span className="value">{displayStats.longestSound}s</span>
          </div>
          <div className="stat-row">
            <span className="label">Funniest moment</span>
            <span className="value">{displayStats.funniestMoment}</span>
          </div>
        </StatsCard>

        <ShareCard>
          <div className="preview">
            <div className="logo">🎭 MASHED 🎭</div>
            <div className="text">
              {isWinner 
                ? `I played Mashed with ${displayLeaderboard.length} friends and WON!`
                : `I played Mashed with ${displayLeaderboard.length} friends!`}
            </div>
            <div className="result">
              {isWinner ? '👑 CHAMPION 👑' : `🥉 ${myEntry?.rank || 4}th Place`}
              <br />
              {myEntry?.score?.toLocaleString() || 0} points
            </div>
            <div className="url">playmashed.game/{roomCode}</div>
          </div>
          
          <Button variant="outline" onClick={handleShare} style={{ background: 'white', color: theme.dark }}>
            📸 Share Results
          </Button>
        </ShareCard>

        <ButtonRow>
          <Button onClick={onRematch}>
            🔄 Rematch
          </Button>
          <Button variant="secondary" onClick={onLobby}>
            🏠 Lobby
          </Button>
        </ButtonRow>
      </GameOverContainer>
    </Container>
  );
}
