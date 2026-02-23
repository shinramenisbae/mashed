import styled, { keyframes } from 'styled-components';
import { useState, useEffect, useRef } from 'react';
import { Container, Title, Card, Button, theme, Submission } from './shared';

const revealAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const ResultsContainer = styled.div`
  padding-top: 40px;
`;

const ProgressIndicator = styled.div`
  text-align: center;
  margin-bottom: 24px;
  color: ${theme.gray};
  font-size: 14px;
`;

const SubmissionCard = styled(Card)`
  animation: ${revealAnimation} 0.5s ease-out;
  position: relative;
  overflow: hidden;
`;

const AudioPlayer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  
  .play-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: ${theme.gradientPink};
    color: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
    }
  }
  
  .waveform {
    flex: 1;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 3px;
    
    .bar {
      flex: 1;
      background: ${theme.gradient};
      border-radius: 2px;
      opacity: 0.7;
    }
  }
  
  .duration {
    font-size: 14px;
    color: ${theme.gray};
  }
`;

const GifDisplay = styled.div`
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 120px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Caption = styled.div`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: ${theme.light};
  margin-bottom: 16px;
  line-height: 1.4;
  
  .quote {
    color: ${theme.primary};
  }
`;

const Attribution = styled.div`
  text-align: center;
  color: ${theme.gray};
  font-size: 14px;
  font-style: italic;
  margin-bottom: 20px;
`;

const ReactionsBar = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ReactionButton = styled.button<{ active?: boolean; count?: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid ${props => props.active ? theme.primary : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.active ? 'rgba(255, 0, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${theme.light};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: ${theme.primary};
  }
  
  .count {
    font-size: 14px;
    font-weight: 700;
    color: ${theme.secondary};
  }
`;

const NavigationDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
`;

const Dot = styled.div<{ active?: boolean }>`
  width: ${props => props.active ? '24px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props => props.active ? theme.gradient : 'rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;
`;

const AutoAdvanceProgress = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  
  .progress {
    height: 100%;
    background: ${theme.gradient};
    transition: width 0.1s linear;
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

const REACTIONS = ['😂', '😱', '🔥', '💀', '👀'];

interface ResultsProps {
  roundNumber: number;
  totalRounds: number;
  submissions: Submission[];
  autoAdvanceDelay?: number;
  onComplete: () => void;
  onReaction?: (submissionId: string, emoji: string) => void;
}

export function Results({
  roundNumber,
  totalRounds,
  submissions,
  autoAdvanceDelay = 8000,
  onComplete,
  onReaction,
}: ResultsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCaption, setShowCaption] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSubmission = submissions[currentIndex] || MOCK_SUBMISSIONS[currentIndex];
  const totalSubmissions = submissions.length || MOCK_SUBMISSIONS.length;

  // Auto-advance through submissions
  useEffect(() => {
    if (!currentSubmission) return;

    // Reset state for new submission
    setShowCaption(false);
    setProgress(0);
    setIsPlaying(true);

    // Start playing audio
    if (audioRef.current) {
      audioRef.current.src = currentSubmission.audioUrl || '';
      audioRef.current.play().catch(() => {});
    }

    // Show caption after audio plays a bit
    const captionTimer = setTimeout(() => {
      setShowCaption(true);
    }, 1000);

    // Progress bar
    const progressStart = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStart;
      const newProgress = Math.min(100, (elapsed / autoAdvanceDelay) * 100);
      setProgress(newProgress);
    }, 100);

    // Auto advance
    autoAdvanceTimerRef.current = setTimeout(() => {
      if (currentIndex < totalSubmissions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }, autoAdvanceDelay);

    return () => {
      clearTimeout(captionTimer);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, currentSubmission, totalSubmissions, autoAdvanceDelay, onComplete]);

  const handleReaction = (emoji: string) => {
    const submissionId = currentSubmission.id;
    
    setMyReactions(prev => ({
      ...prev,
      [submissionId]: prev[submissionId] === emoji ? '' : emoji
    }));
    
    setReactions(prev => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [emoji]: ((prev[submissionId]?.[emoji] || 0) + 1)
      }
    }));
    
    onReaction?.(submissionId, emoji);
  };

  const handleSkip = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (currentIndex < totalSubmissions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!currentSubmission) {
    return <Container><Title>Loading...</Title></Container>;
  }

  return (
    <Container>
      <ResultsContainer>
        <ProgressIndicator>
          Round {roundNumber} of {totalRounds} • Revealing {currentIndex + 1} of {totalSubmissions}
        </ProgressIndicator>

        <SubmissionCard>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(255, 0, 80, 0.1)',
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '24px' }}>🔊</span>
            <span style={{ fontWeight: 700 }}>NOW PLAYING</span>
          </div>

          <AudioPlayer>
            <button 
              className="play-btn"
              onClick={() => {
                if (isPlaying) {
                  audioRef.current?.pause();
                } else {
                  audioRef.current?.play();
                }
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <div className="waveform">
              {Array.from({ length: 30 }).map((_, i) => (
                <div 
                  key={i}
                  className="bar"
                  style={{ 
                    height: `${Math.random() * 30 + 10}px`,
                    opacity: isPlaying ? 0.7 + Math.random() * 0.3 : 0.3
                  }}
                />
              ))}
            </div>
            <span className="duration">{currentSubmission.audioDuration.toFixed(1)}s</span>
          </AudioPlayer>

          <GifDisplay>
            <span>🦭✨</span>
          </GifDisplay>

          <Caption>
            <span className="quote">"{showCaption ? currentSubmission.caption : ''}"</span>
          </Caption>

          <Attribution>
            — Anonymous GIF Selector
          </Attribution>

          <ReactionsBar>
            {REACTIONS.map(emoji => (
              <ReactionButton
                key={emoji}
                active={myReactions[currentSubmission.id] === emoji}
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
                <span className="count">
                  {reactions[currentSubmission.id]?.[emoji] || 0}
                </span>
              </ReactionButton>
            ))}
          </ReactionsBar>
        </SubmissionCard>

        <NavigationDots>
          {Array.from({ length: totalSubmissions }).map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </NavigationDots>

        <Button 
          variant="outline" 
          onClick={handleSkip}
          style={{ marginTop: '24px' }}
        >
          {currentIndex < totalSubmissions - 1 ? 'Skip →' : 'Start Voting →'}
        </Button>
      </ResultsContainer>

      <AutoAdvanceProgress>
        <div className="progress" style={{ width: `${progress}%` }} />
      </AutoAdvanceProgress>

      <audio ref={audioRef} />
    </Container>
  );
}
