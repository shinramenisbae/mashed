import styled, { keyframes } from 'styled-components';
import { useState, useEffect } from 'react';
import { Container, Card, Button, theme, LeaderboardEntry, Submission } from './shared';

const countUpAnimation = keyframes`
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const glowAnimation = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
`;

const ScoringContainer = styled.div`
  padding-top: 40px;
`;

const RoundCompleteBanner = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  .title {
    font-size: 32px;
    font-weight: 900;
    background: ${theme.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  
  .round {
    color: ${theme.gray};
    font-size: 16px;
  }
`;

const WinnerCard = styled(Card)`
  text-align: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  animation: ${glowAnimation} 2s ease-in-out infinite;
  margin-bottom: 32px;
`;

const WinnerGif = styled.div`
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
    justify-content: center;
  font-size: 80px;
  margin-bottom: 20px;
`;

const WinnerCaption = styled.div`
  font-size: 18px;
  font-style: italic;
  color: ${theme.light};
  margin-bottom: 16px;
  
  &::before, &::after {
    content: '"';
    color: ${theme.primary};
  }
`;

const WinnerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .players {
    font-size: 20px;
    font-weight: 700;
    color: ${theme.accent};
  }
  
  .votes {
    font-size: 16px;
    color: ${theme.gray};
  }
  
  .points {
    font-size: 32px;
    font-weight: 900;
    background: ${theme.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const StandingsCard = styled(Card)`
  margin-bottom: 24px;
`;

const StandingsHeader = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
`;

const StandingsRow = styled.div<{ rank: number; isMe?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 8px;
  background: ${props => props.isMe ? 'rgba(255, 0, 80, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 16px;
  border: 2px solid ${props => props.isMe ? theme.primary : 'transparent'};
  animation: ${countUpAnimation} 0.5s ease-out;
  animation-delay: ${props => props.rank * 0.1}s;
  animation-fill-mode: both;
  
  .rank {
    font-size: 24px;
    font-weight: 900;
    width: 40px;
    text-align: center;
    color: ${props => {
      switch(props.rank) {
        case 1: return '#FFD700';
        case 2: return '#C0C0C0';
        case 3: return '#CD7F32';
        default: return theme.gray;
      }
    }};
  }
  
  .avatar {
    font-size: 32px;
  }
  
  .player-info {
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
    text-align: right;
    
    .total {
      font-size: 20px;
      font-weight: 900;
      color: ${theme.light};
    }
    
    .change {
      font-size: 14px;
      color: ${theme.secondary};
      font-weight: 700;
    }
  }
`;

const AwardsSection = styled.div`
  margin-bottom: 24px;
`;

const AwardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  .icon {
    font-size: 24px;
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

const NextRoundTimer = styled.div`
  text-align: center;
  margin: 24px 0;
  
  .text {
    color: ${theme.gray};
    margin-bottom: 8px;
  }
  
  .count {
    font-size: 48px;
    font-weight: 900;
    background: ${theme.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerId: '1', nickname: 'SoundNinja', avatar: '🎭', score: 450, scoreChange: 150 },
  { rank: 2, playerId: '2', nickname: 'GifMaster', avatar: '🎸', score: 380, scoreChange: 120 },
  { rank: 3, playerId: '3', nickname: 'NoisyPenguin', avatar: '🎪', score: 320, scoreChange: 80 },
  { rank: 4, playerId: '4', nickname: 'MemeLord', avatar: '🎬', score: 290, scoreChange: 95 },
  { rank: 5, playerId: '5', nickname: 'AudioPhile', avatar: '🎯', score: 250, scoreChange: 60 },
  { rank: 6, playerId: '6', nickname: 'SoundNinja2', avatar: '🎲', score: 180, scoreChange: 40 },
];

const MOCK_WINNER: Submission = {
  id: '1',
  audioUrl: '',
  audioDuration: 4.2,
  gifUrl: '',
  gifTitle: 'Excited Seal',
  caption: 'When you check your bank account on Monday morning',
  soundMakerId: '1',
  gifSelectorId: '2',
  votes: 4,
};

const MOCK_AWARDS = [
  { category: '🎭 Best Actor', winner: 'SoundNinja' },
  { category: '🎨 Most Creative', winner: 'MemeLord' },
  { category: '😂 Comedian', winner: 'SoundNinja' },
];

interface ScoringProps {
  roundNumber: number;
  totalRounds: number;
  winner: Submission;
  leaderboard: LeaderboardEntry[];
  awards: { category: string; winner: string }[];
  myPlayerId: string;
  nextRoundDelay?: number;
  onNextRound: () => void;
}

export function Scoring({
  roundNumber,
  totalRounds,
  winner,
  leaderboard,
  awards,
  myPlayerId,
  nextRoundDelay = 5000,
  onNextRound,
}: ScoringProps) {
  const [timer, setTimer] = useState(Math.ceil(nextRoundDelay / 1000));
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

  const displayWinner = winner.id ? winner : MOCK_WINNER;
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : MOCK_LEADERBOARD;
  const displayAwards = awards.length > 0 ? awards : MOCK_AWARDS;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRoundDelay, onNextRound]);

  // Animate scores
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    displayLeaderboard.forEach(entry => {
      initialScores[entry.playerId] = entry.score - entry.scoreChange;
    });
    setAnimatedScores(initialScores);

    // Animate up to final scores
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedScores(_prev => {
        const newScores: Record<string, number> = {};
        displayLeaderboard.forEach(entry => {
          const start = entry.score - entry.scoreChange;
          const end = entry.score;
          newScores[entry.playerId] = Math.round(start + (end - start) * progress);
        });
        return newScores;
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [displayLeaderboard]);

  const winnerNickname = displayLeaderboard.find(p => p.playerId === displayWinner.soundMakerId)?.nickname || 'SoundNinja';
  const selectorNickname = displayLeaderboard.find(p => p.playerId === displayWinner.gifSelectorId)?.nickname || 'GifMaster';

  return (
    <Container>
      <ScoringContainer>
        <RoundCompleteBanner>
          <div className="title">🎉 ROUND {roundNumber} COMPLETE! 🎉</div>
          <div className="round">{roundNumber} of {totalRounds}</div>
        </RoundCompleteBanner>

        <WinnerCard>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            color: theme.accent,
            letterSpacing: '2px',
            marginBottom: '16px'
          }}>
            🏆 ROUND WINNER 🏆
          </div>
          
          <WinnerGif>🦭✨</WinnerGif>
          
          <WinnerCaption>{displayWinner.caption}</WinnerCaption>
          
          <WinnerInfo>
            <div className="players">🎭 {winnerNickname} + {selectorNickname}</div>
            <div className="votes">{displayWinner.votes || 4} votes • 300 points</div>
          </WinnerInfo>
        </WinnerCard>

        <StandingsCard>
          <StandingsHeader>📊 STANDINGS</StandingsHeader>
          
          {displayLeaderboard.map((entry) => (
            <StandingsRow 
              key={entry.playerId}
              rank={entry.rank}
              isMe={entry.playerId === myPlayerId}
            >
              <div className="rank">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </div>
              <div className="avatar">{entry.avatar}</div>
              <div className="player-info">
                <div className="name">
                  {entry.nickname}
                  {entry.playerId === myPlayerId && <span className="tag">YOU</span>}
                </div>
              </div>
              <div className="score">
                <div className="total">{animatedScores[entry.playerId] || entry.score}</div>
                {entry.scoreChange > 0 && (
                  <div className="change">▲ +{entry.scoreChange}</div>
                )}
              </div>
            </StandingsRow>
          ))}
        </StandingsCard>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>🏅 AWARDS CEREMONY 🏅</div>
          
          <AwardsSection>
            {displayAwards.map((award, i) => (
              <AwardRow key={i}>
                <span className="icon">{award.category.split(' ')[0]}</span>
                <span className="category">{award.category.split(' ').slice(1).join(' ')}</span>
                <span className="winner">{award.winner}</span>
              </AwardRow>
            ))}
          </AwardsSection>
        </Card>

        <NextRoundTimer>
          <div className="text">{roundNumber < totalRounds ? 'Next round starts in' : 'Final results coming up'}</div>
          <div className="count">{timer}...</div>
        </NextRoundTimer>

        <Button variant="outline" onClick={onNextRound}>
          Skip →
        </Button>
      </ScoringContainer>
    </Container>
  );
}
