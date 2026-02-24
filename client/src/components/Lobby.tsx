import styled from 'styled-components';
import { Container, Card, Button, Badge, Avatar, Divider, theme, Player } from './shared';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  
  .room-code {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .code {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 4px;
      background: ${theme.gradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
`;

const PlayerList = styled.div`
  margin-bottom: 24px;
`;

const PlayerItem = styled.div<{ isYou?: boolean; isReady?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: ${props => props.isYou ? 'rgba(255, 0, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 16px;
  border: 2px solid ${props => props.isYou ? theme.primary : 'transparent'};
  transition: all 0.3s ease;
  
  .player-info {
    flex: 1;
    
    .name {
      font-weight: 700;
      font-size: 16px;
      color: ${theme.light};
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status {
      font-size: 12px;
      color: ${theme.gray};
      margin-top: 4px;
    }
  }
  
  .ready-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    background: ${props => props.isReady ? 'rgba(0, 242, 234, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.isReady ? theme.secondary : theme.gray};
  }
`;

const SettingsCard = styled(Card)`
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    &:last-child {
      border-bottom: none;
    }
    
    label {
      color: ${theme.gray};
      font-size: 14px;
    }
    
    .value {
      display: flex;
      align-items: center;
      gap: 12px;
      
      span {
        font-weight: 700;
        min-width: 40px;
        text-align: center;
      }
      
      button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: ${theme.light};
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background: ${theme.primary};
        }
        
        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
    }
  }
`;

const WaitingText = styled.p`
  text-align: center;
  color: ${theme.gray};
  font-size: 14px;
  margin-top: 16px;
  
  .dots::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
  }
  
  @keyframes dots {
    0% { content: ''; }
    25% { content: '.'; }
    50% { content: '..'; }
    75% { content: '...'; }
    100% { content: ''; }
  }
`;

interface LobbyProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  settings: {
    totalRounds: number;
    recordingTime: number;
    captioningTime: number;
    votingTime: number;
    bonusCategories: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onReady: () => void;
  onStart: () => void;
  onNicknameChange?: (nickname: string) => void;
  onAvatarChange?: (avatar: string) => void;
}

export function Lobby({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  settings,
  onSettingsChange,
  onReady,
  onStart,
}: LobbyProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  const readyPlayers = players.filter(p => p.isReady).length;
  const canStart = isHost && readyPlayers === players.length && players.length >= 2;

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const copyRoomCode = () => {
    copyToClipboard(roomCode);
  };

  const updateSetting = (key: string, delta: number, min: number, max: number) => {
    const newValue = Math.max(min, Math.min(max, settings[key as keyof typeof settings] as number + delta));
    onSettingsChange({ ...settings, [key]: newValue });
  };

  return (
    <Container>
      <Header>
        <div className="room-code">
          <span>🎭 MASHED</span>
          <span className="code">{roomCode}</span>
        </div>
        <Button variant="outline" onClick={copyRoomCode} style={{ width: 'auto', padding: '12px 20px' }}>
          🔗 Copy
        </Button>
      </Header>

      <PlayerList>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>Players ({players.length}/8)</span>
          </div>
          
          {players.map(player => (
            <PlayerItem 
              key={player.id} 
              isYou={player.id === currentPlayerId}
              isReady={player.isReady}
            >
              <Avatar size="small">{player.avatar}</Avatar>
              <div className="player-info">
                <div className="name">
                  {player.nickname}
                  {player.isHost && <Badge style={{ fontSize: '10px' }}>HOST</Badge>}
                  {player.id === currentPlayerId && <span style={{ color: theme.secondary, fontSize: '12px' }}>[YOU]</span>}
                </div>
                <div className="status">
                  {player.isReady ? 'Ready to mash!' : 'Getting ready...'}
                </div>
              </div>
              <div className="ready-indicator">
                {player.isReady ? '✅' : '⏳'}
              </div>
            </PlayerItem>
          ))}
        </Card>
      </PlayerList>

      {!isHost && (
        <Button 
          onClick={onReady}
          variant={currentPlayer?.isReady ? 'secondary' : 'primary'}
        >
          {currentPlayer?.isReady ? "✅ I'M READY" : "🚀 I'M READY"}
        </Button>
      )}

      {isHost && (
        <>
          <Button 
            onClick={onStart}
            disabled={!canStart}
          >
            {players.length >= 4 
              ? (canStart ? '🚀 START GAME' : `WAITING FOR ${players.length - readyPlayers} MORE...`) 
              : `WAITING FOR ${4 - players.length} MORE...`}
          </Button>
          
          <WaitingText>
            {readyPlayers < players.length && `Waiting for ${players.length - readyPlayers} players to be ready`}
            {readyPlayers === players.length && players.length < 4 && `Need ${4 - players.length} more player${4 - players.length === 1 ? '' : 's'} to start`}
            <span className="dots"></span>
          </WaitingText>
        </>
      )}

      <Divider />

      <SettingsCard>
        <div style={{ fontWeight: 700, marginBottom: '16px' }}>
          {isHost ? '⚙️ Game Settings' : '📋 Game Settings (Host Controlled)'}
        </div>
        
        <div className="setting-row">
          <label>Rounds</label>
          <div className="value">
            <button 
              onClick={() => updateSetting('totalRounds', -1, 4, 10)}
              disabled={!isHost || settings.totalRounds <= 4}
            >−</button>
            <span>{settings.totalRounds}</span>
            <button 
              onClick={() => updateSetting('totalRounds', 1, 4, 10)}
              disabled={!isHost || settings.totalRounds >= 10}
            >+</button>
          </div>
        </div>

        <div className="setting-row">
          <label>Recording Time</label>
          <div className="value">
            <button 
              onClick={() => updateSetting('recordingTime', -5, 15, 60)}
              disabled={!isHost || settings.recordingTime <= 15}
            >−</button>
            <span>{settings.recordingTime}s</span>
            <button 
              onClick={() => updateSetting('recordingTime', 5, 15, 60)}
              disabled={!isHost || settings.recordingTime >= 60}
            >+</button>
          </div>
        </div>

        <div className="setting-row">
          <label>Captioning Time</label>
          <div className="value">
            <button 
              onClick={() => updateSetting('captioningTime', -5, 45, 120)}
              disabled={!isHost || settings.captioningTime <= 45}
            >−</button>
            <span>{settings.captioningTime}s</span>
            <button 
              onClick={() => updateSetting('captioningTime', 5, 45, 120)}
              disabled={!isHost || settings.captioningTime >= 120}
            >+</button>
          </div>
        </div>

        <div className="setting-row">
          <label>Voting Time</label>
          <div className="value">
            <button 
              onClick={() => updateSetting('votingTime', -5, 30, 90)}
              disabled={!isHost || settings.votingTime <= 30}
            >−</button>
            <span>{settings.votingTime}s</span>
            <button 
              onClick={() => updateSetting('votingTime', 5, 30, 90)}
              disabled={!isHost || settings.votingTime >= 90}
            >+</button>
          </div>
        </div>

        <div className="setting-row">
          <label>Bonus Categories</label>
          <div className="value">
            <button
              onClick={() => isHost && onSettingsChange({ ...settings, bonusCategories: !settings.bonusCategories })}
              disabled={!isHost}
              style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px' }}
            >
              {settings.bonusCategories ? '✅ ON' : '❌ OFF'}
            </button>
          </div>
        </div>
      </SettingsCard>
    </Container>
  );
}
