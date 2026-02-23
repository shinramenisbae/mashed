import styled, { keyframes } from 'styled-components';
import { useState, useEffect } from 'react';
import { Container, Title, Card, Button, Timer, theme, useCountdown, Submission } from './shared';

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const VotingContainer = styled.div`
  padding-top: 60px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
  
  .subtitle {
    color: ${theme.gray};
    font-size: 16px;
    margin-top: 8px;
  }
`;

const SubmissionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const SubmissionCard = styled(Card)<{ selected?: boolean; disabled?: boolean }>`
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  border: 3px solid ${props => props.selected ? theme.primary : 'transparent'};
  background: ${props => props.selected ? 'rgba(255, 0, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.selected && `
    animation: ${pulseAnimation} 2s ease-in-out infinite;
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.selected ? theme.gradient : 'transparent'};
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(255, 0, 80, 0.2);
  }
`;

const MatchNumber = styled.div`
  position: absolute;
  top: -12px;
  left: 20px;
  background: ${theme.gradient};
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: ${theme.primary};
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const GifPreview = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  
  .gif-thumb {
    width: 100px;
    height: 75px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    flex-shrink: 0;
  }
  
  .caption {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    color: ${theme.light};
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const CardControls = styled.div`
  display: flex;
  gap: 12px;
  
  button {
    flex: 1;
  }
`;

const BonusVotesSection = styled(Card)`
  margin-top: 24px;
  
  .title {
    font-size: 14px;
    color: ${theme.gray};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
    text-align: center;
  }
`;

const BonusVoteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }
  
  select {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px 16px;
    color: ${theme.light};
    font-size: 14px;
    cursor: pointer;
    min-width: 140px;
    
    &:focus {
      outline: none;
      border-color: ${theme.primary};
    }
    
    option {
      background: ${theme.dark};
    }
  }
`;

const VoteStatus = styled.div`
  text-align: center;
  margin-top: 16px;
  color: ${theme.gray};
  font-size: 14px;
  
  .count {
    color: ${theme.secondary};
    font-weight: 700;
  }
`;

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: '1',
    audioUrl: '',
    audioDuration: 4.2,
    gifUrl: '',
    gifTitle: 'Excited Seal',
    caption: 'When you check your bank account on Monday morning',
    soundMakerId: 'p1',
    gifSelectorId: 'p2',
    votes: 0,
  },
  {
    id: '2',
    audioUrl: '',
    audioDuration: 3.8,
    gifUrl: '',
    gifTitle: 'Confused Cat',
    caption: 'Me pretending to understand the meeting',
    soundMakerId: 'p3',
    gifSelectorId: 'p4',
    votes: 0,
  },
  {
    id: '3',
    audioUrl: '',
    audioDuration: 5.1,
    gifUrl: '',
    gifTitle: 'Happy Dog',
    caption: 'When the delivery arrives early',
    soundMakerId: 'p5',
    gifSelectorId: 'p6',
    votes: 0,
  },
];

interface VotingProps {
  roundNumber: number;
  totalRounds: number;
  timeLimit: number;
  submissions: Submission[];
  myPlayerId: string;
  totalPlayers: number;
  votesCast: number;
  bonusCategories: boolean;
  onVote: (submissionId: string, bonusVotes?: { bestMisinterpretation?: string; madeMeCryLaugh?: string }) => void;
}

export function Voting({
  roundNumber,
  totalRounds,
  timeLimit,
  submissions,
  myPlayerId,
  totalPlayers,
  votesCast,
  bonusCategories,
  onVote,
}: VotingProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [bonusVotes, setBonusVotes] = useState({
    bestMisinterpretation: '',
    madeMeCryLaugh: '',
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { formatted: timerFormatted } = useCountdown(timeLimit, () => {
    if (selectedSubmission && !hasSubmitted) {
      handleSubmit();
    }
  });

  const handleSelect = (submissionId: string) => {
    if (hasSubmitted) return;
    
    // Don't allow voting for own submission
    const submission = (submissions.length > 0 ? submissions : MOCK_SUBMISSIONS).find(s => s.id === submissionId);
    if (submission?.soundMakerId === myPlayerId || submission?.gifSelectorId === myPlayerId) {
      return;
    }
    
    setSelectedSubmission(submissionId);
  };

  const handlePreview = (submissionId: string) => {
    // Toggle audio playback
    if (playingAudio === submissionId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(submissionId);
      // Auto stop after duration
      const submission = (submissions.length > 0 ? submissions : MOCK_SUBMISSIONS).find(s => s.id === submissionId);
      if (submission) {
        setTimeout(() => setPlayingAudio(null), submission.audioDuration * 1000);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedSubmission) {
      onVote(
        selectedSubmission,
        bonusCategories ? {
          bestMisinterpretation: bonusVotes.bestMisinterpretation || undefined,
          madeMeCryLaugh: bonusVotes.madeMeCryLaugh || undefined,
        } : undefined
      );
      setHasSubmitted(true);
    }
  };

  const displaySubmissions = submissions.length > 0 ? submissions : MOCK_SUBMISSIONS;

  return (
    <Container>
      <Timer>⏱️ {timerFormatted}</Timer>

      <VotingContainer>
        <Header>
          <Title size="small">VOTING</Title>
          <div className="subtitle">Pick your favorite match!</div>
        </Header>

        <SubmissionGrid>
          {displaySubmissions.map((submission, index) => {
            const isOwn = submission.soundMakerId === myPlayerId || submission.gifSelectorId === myPlayerId;
            const isSelected = selectedSubmission === submission.id;
            const isPlaying = playingAudio === submission.id;

            return (
              <SubmissionCard
                key={submission.id}
                selected={isSelected}
                disabled={isOwn || hasSubmitted}
                onClick={() => handleSelect(submission.id)}
              >
                <MatchNumber>Match #{index + 1}</MatchNumber>
                
                {isSelected && <SelectedBadge>✓ SELECTED</SelectedBadge>}
                
                {isOwn && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    background: theme.gray,
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    YOURS
                  </div>
                )}

                <GifPreview>
                  <div className="gif-thumb">🦭</div>
                  <div className="caption">"{submission.caption}"</div>
                </GifPreview>

                <CardControls>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(submission.id);
                    }}
                    style={{ width: 'auto', flex: '0 0 auto', padding: '12px 20px' }}
                  >
                    {isPlaying ? '🔊 Playing...' : '🔊 Preview'}
                  </Button>
                  
                  <Button
                    variant={isSelected ? 'primary' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(submission.id);
                    }}
                    disabled={isOwn || hasSubmitted}
                  >
                    {isOwn ? "Can't vote for own" : isSelected ? '👆 TAP TO UNSELECT' : '👆 TAP TO VOTE'}
                  </Button>
                </CardControls>
              </SubmissionCard>
            );
          })}
        </SubmissionGrid>

        {bonusCategories && (
          <BonusVotesSection>
            <div className="title">────────── BONUS VOTES ──────────</div>
            
            <BonusVoteRow>
              <div className="label">🎭 Best Misinterpretation</div>
              <select
                value={bonusVotes.bestMisinterpretation}
                onChange={(e) => setBonusVotes(prev => ({ ...prev, bestMisinterpretation: e.target.value }))}
                disabled={hasSubmitted}
              >
                <option value="">Select...</option>
                {displaySubmissions.map((s, i) => (
                  <option key={s.id} value={s.id}>Match #{i + 1}</option>
                ))}
              </select>
            </BonusVoteRow>

            <BonusVoteRow>
              <div className="label">😂 Made Me Cry Laugh</div>
              <select
                value={bonusVotes.madeMeCryLaugh}
                onChange={(e) => setBonusVotes(prev => ({ ...prev, madeMeCryLaugh: e.target.value }))}
                disabled={hasSubmitted}
              >
                <option value="">Select...</option>
                {displaySubmissions.map((s, i) => (
                  <option key={s.id} value={s.id}>Match #{i + 1}</option>
                ))}
              </select>
            </BonusVoteRow>
          </BonusVotesSection>
        )}

        {!hasSubmitted ? (
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubmission}
            style={{ marginTop: '24px' }}
          >
            {selectedSubmission ? '✅ SUBMIT VOTES' : 'Pick a match first'}
          </Button>
        ) : (
          <Card style={{ marginTop: '24px', textAlign: 'center', background: 'rgba(0, 242, 234, 0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: theme.secondary }}>VOTES SUBMITTED!</div>
            <div style={{ color: theme.gray, marginTop: '8px' }}>Waiting for others...</div>
          </Card>
        )}

        <VoteStatus>
          <span className="count">{votesCast}</span> of <span className="count">{totalPlayers}</span> players have voted
        </VoteStatus>
      </VotingContainer>
    </Container>
  );
}
