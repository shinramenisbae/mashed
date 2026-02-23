import styled from 'styled-components';
import { useState } from 'react';
import { Container, Title, Subtitle, Button, Input, Divider, Card, theme } from './shared';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const LogoContainer = styled.div`
  margin-bottom: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 0, 80, 0.3) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
  }
`;

const LogoText = styled.h1`
  font-size: 64px;
  font-weight: 900;
  text-align: center;
  margin: 0;
  background: ${theme.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 4px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 480px) {
    font-size: 48px;
  }
`;

const Tagline = styled.p`
  text-align: center;
  color: ${theme.gray};
  font-size: 16px;
  margin-top: 8px;
  max-width: 300px;
  line-height: 1.5;
`;

const EmojiRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 20px 0;
  font-size: 24px;
`;

const ExampleCard = styled(Card)`
  padding: 16px;
  margin-bottom: 32px;
  text-align: center;
  
  .example-gif {
    width: 100%;
    max-width: 280px;
    height: 160px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    margin: 0 auto 12px;
    border: 2px dashed rgba(255, 255, 255, 0.1);
  }
  
  .example-caption {
    color: ${theme.light};
    font-size: 14px;
    font-style: italic;
    opacity: 0.8;
  }
`;

const RoomCodeInput = styled(Input)`
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 8px;
  text-transform: uppercase;
  padding: 20px;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  color: ${theme.primary};
  text-align: center;
  font-size: 14px;
  margin-top: 8px;
  animation: shake 0.5s ease-in-out;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 32px;
  
  a {
    color: ${theme.gray};
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;
    
    &:hover {
      color: ${theme.secondary};
    }
  }
`;

interface HomeProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  error?: string;
}

export function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [roomCode, setRoomCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(value);
  };

  const handleJoin = () => {
    if (roomCode.length === 6) {
      onJoinRoom(roomCode);
    }
  };

  return (
    <HomeContainer>
      <LogoContainer>
        <LogoText>🎭 MASHED 🎭</LogoText>
        <Tagline>The Party Game of Absurd Sounds and Perfect GIFs</Tagline>
      </LogoContainer>

      {!showJoin ? (
        <>
          <ExampleCard>
            <div className="example-gif">🦭✨</div>
            <p className="example-caption">"When you check your bank account on Monday morning"</p>
          </ExampleCard>

          <Button onClick={onCreateRoom}>
            🎮 Create New Room
          </Button>

          <Divider>OR</Divider>

          <Button variant="outline" onClick={() => setShowJoin(true)}>
            👥 Join Room
          </Button>
        </>
      ) : (
        <>
          <Card>
            <Subtitle>Enter Room Code</Subtitle>
            <RoomCodeInput
              type="text"
              placeholder="______"
              value={roomCode}
              onChange={handleRoomCodeChange}
              autoFocus
              maxLength={6}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </Card>

          <Button 
            onClick={handleJoin}
            disabled={roomCode.length !== 6}
          >
            🚀 Join Room
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              setShowJoin(false);
              setRoomCode('');
            }}
            style={{ marginTop: '12px' }}
          >
            ← Back
          </Button>
        </>
      )}

      <FooterLinks>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('How to Play: 1. Create/join a room 2. Record funny sounds 3. Match GIFs to sounds 4. Vote for the best!'); }}>How to Play</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Mashed v0.1.0 - The ultimate party game!'); }}>About</a>
      </FooterLinks>

      <EmojiRow>
        🎵 🎬 🤪 🎊
      </EmojiRow>
    </HomeContainer>
  );
}
