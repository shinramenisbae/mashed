import styled from 'styled-components';
import { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Input, Timer, theme, useCountdown } from './shared';

const CaptionContainer = styled.div`
  padding-top: 60px;
`;

const SoundPlayer = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  margin-bottom: 24px;
  
  .sound-info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${theme.gradientPink};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    
    .text {
      .label {
        font-size: 12px;
        color: ${theme.gray};
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .value {
        font-weight: 700;
        font-size: 16px;
        color: ${theme.light};
      }
    }
  }
  
  .controls {
    display: flex;
    gap: 12px;
  }
`;

const GifSearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
  
  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
  }
  
  input {
    padding-left: 56px;
    text-align: left;
  }
`;

const TrendingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const TrendingItem = styled.button`
  aspect-ratio: 1;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  font-size: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.2);
  }
`;

const CategoryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
`;

const Chip = styled.button<{ selected?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: ${props => props.selected ? theme.gradientPink : 'rgba(255, 255, 255, 0.1)'};
  color: ${theme.light};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: ${props => props.selected ? theme.gradientPink : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const GifResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  margin-bottom: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${theme.primary};
    border-radius: 3px;
  }
`;

const GifItem = styled.div<{ selected?: boolean }>`
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 3px solid ${props => props.selected ? theme.primary : 'transparent'};
  transition: all 0.2s ease;
  
  img, .placeholder {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .placeholder {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
  
  &:hover {
    transform: scale(1.05);
  }
  
  ${props => props.selected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: ${theme.primary};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
  `}
`;

const SelectedGifPreview = styled(Card)`
  position: relative;
  padding: 0;
  overflow: hidden;
  margin-bottom: 20px;
  
  .gif-container {
    aspect-ratio: 16 / 10;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .change-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 20px;
    color: white;
    font-size: 12px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: ${theme.primary};
    }
  }
`;

const CaptionInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 16px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: ${theme.light};
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: ${theme.primary};
    box-shadow: 0 0 20px rgba(255, 0, 80, 0.3);
  }
  
  &::placeholder {
    color: ${theme.gray};
  }
`;

const CharCounter = styled.div<{ isNearLimit?: boolean }>`
  text-align: right;
  font-size: 12px;
  color: ${props => props.isNearLimit ? theme.primary : theme.gray};
  margin-bottom: 20px;
`;

const TRENDING_EMOJIS = ['🎉', '😂', '🎊', '🔥', '💀', '👀', '😭', '🤔', '😱', '🤩', '🥳', '🤯'];

const CATEGORIES = [
  'confused', 'celebration', 'disappointed', 
  'excited', 'dramatic', 'animals', 'reactions', 'vibes'
];

interface GifItem {
  id: string;
  url: string;
  emoji: string;
  title: string;
}

// Mock GIF data - in real app, fetch from Giphy/Tenor API
const MOCK_GIFS: GifItem[] = [
  { id: '1', url: '', emoji: '🦭', title: 'Excited Seal' },
  { id: '2', url: '', emoji: '🐱', title: 'Confused Cat' },
  { id: '3', url: '', emoji: '🐶', title: 'Happy Dog' },
  { id: '4', url: '', emoji: '🦥', title: 'Lazy Sloth' },
  { id: '5', url: '', emoji: '🐼', title: 'Surprised Panda' },
  { id: '6', url: '', emoji: '🦊', title: 'Sly Fox' },
  { id: '7', url: '', emoji: '🦁', title: 'Roaring Lion' },
  { id: '8', url: '', emoji: '🐸', title: 'Dancing Frog' },
  { id: '9', url: '', emoji: '🐙', title: 'Waving Octopus' },
];

interface CaptionScreenProps {
  roundNumber: number;
  totalRounds: number;
  timeLimit: number;
  audioUrl: string;
  audioDuration: number;
  onSubmit: (gifId: string, gifUrl: string, caption: string) => void;
}

export function CaptionScreen({ 
  roundNumber, 
  totalRounds, 
  timeLimit, 
  audioUrl, 
  audioDuration,
  onSubmit 
}: CaptionScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGif, setSelectedGif] = useState<GifItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gifs, setGifs] = useState<GifItem[]>(MOCK_GIFS);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { formatted: timerFormatted } = useCountdown(timeLimit, () => {
    if (selectedGif && caption.trim()) {
      onSubmit(selectedGif.id, selectedGif.url, caption);
    }
  });

  // Initialize audio
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        // Mock search - shuffle and filter
        const shuffled = [...MOCK_GIFS].sort(() => Math.random() - 0.5);
        setGifs(shuffled);
      } else {
        setGifs(MOCK_GIFS);
      }
    }, 300);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    // Mock filter by category
    const shuffled = [...MOCK_GIFS].sort(() => Math.random() - 0.5);
    setGifs(shuffled.slice(0, 6));
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSubmit = () => {
    if (selectedGif && caption.trim()) {
      onSubmit(selectedGif.id || '', selectedGif.url || '', caption);
    }
  };

  const captionNearLimit = caption.length > 120;

  return (
    <Container>
      <Timer>⏱️ {timerFormatted}</Timer>
      
      <div style={{ marginTop: '60px', textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ color: theme.gray, fontSize: '14px' }}>Round {roundNumber} of {totalRounds}</span>
        <div style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginTop: '8px', background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🎨 CREATE THE PERFECT MATCH</div>
      </div>

      <CaptionContainer>
        <SoundPlayer>
          <div className="sound-info">
            <div className="icon">🔊</div>
            <div className="text">
              <div className="label">Sound from Anonymous</div>
              <div className="value">{audioDuration.toFixed(1)}s audio</div>
            </div>
          </div>
          <div className="controls">
            <Button variant="outline" onClick={togglePlayback} style={{ width: 'auto', padding: '12px 24px' }}>
              {isPlaying ? '⏸️' : '▶️'} {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </SoundPlayer>

        {!selectedGif ? (
          <>
            <GifSearchContainer>
              <span className="search-icon">🔍</span>
              <Input
                type="text"
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </GifSearchContainer>

            <Card>
              <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>TRENDING</div>
              <TrendingGrid>
                {TRENDING_EMOJIS.map(emoji => (
                  <TrendingItem 
                    key={emoji}
                    onClick={() => handleSearchChange(emoji)}
                  >
                    {emoji}
                  </TrendingItem>
                ))}
              </TrendingGrid>
            </Card>

            <CategoryChips>
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  selected={selectedCategory === cat}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </CategoryChips>

            <GifResultsGrid>
              {gifs.map((gif: GifItem) => (
                <GifItem
                  key={gif.id}
                  selected={Boolean(selectedGif) && (selectedGif as GifItem | null)?.id === gif.id}
                  onClick={() => setSelectedGif(gif)}
                >
                  <div className="placeholder">{gif.emoji}</div>
                </GifItem>
              ))}
            </GifResultsGrid>
          </>
        ) : (
          <>
            <SelectedGifPreview>
              <div className="gif-container">
                <span>{selectedGif.emoji}</span>
              </div>
              <button 
                className="change-btn"
                onClick={() => setSelectedGif(null)}
              >
                ❌ Change GIF
              </button>
            </SelectedGifPreview>

            <Card>
              <div style={{ fontWeight: 700, marginBottom: '12px' }}>Write a caption (max 140):</div>
              <CaptionInput
                placeholder="When you check your bank account on Monday morning..."
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 140))}
                maxLength={140}
              />
              <CharCounter isNearLimit={captionNearLimit}>
                {caption.length}/140
              </CharCounter>
            </Card>

            <Button 
              onClick={handleSubmit}
              disabled={!caption.trim()}
            >
              {caption.trim() ? '✅ SUBMIT CAPTION' : 'Write a caption first...'}
            </Button>
          </>
        )}
      </CaptionContainer>
    </Container>
  );
}
