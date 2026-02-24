import styled from 'styled-components';
import { useState } from 'react';
import { Container, Title, Card, Button, Input, Subtitle, theme, RANDOM_NAMES, AVATAR_OPTIONS } from './shared';

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin: 16px 0;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const AvatarOption = styled.button<{ selected?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid ${props => props.selected ? theme.primary : 'transparent'};
  background: ${props => props.selected ? 'rgba(255, 0, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.2);
  }
`;

const NicknameContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  
  input {
    flex: 1;
    text-align: left;
    letter-spacing: 0;
  }
`;

interface JoiningRoomProps {
  roomCode: string;
  isHost: boolean;
  onEnterRoom: () => void;
  onNicknameChange: (nickname: string) => void;
  onAvatarChange: (avatar: string) => void;
}

export function JoiningRoom({ roomCode, isHost, onEnterRoom, onNicknameChange, onAvatarChange }: JoiningRoomProps) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    onNicknameChange(value);
  };

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onAvatarChange(avatar);
  };

  const randomizeNickname = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    handleNicknameChange(randomName);
  };

  return (
    <Container>
      <Title>{isHost ? '🎉 Room Created' : '🚪 Joining Room'}</Title>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{
          fontSize: '32px',
          fontWeight: 900,
          letterSpacing: '4px',
          background: theme.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {roomCode}
        </span>
      </div>

      <Card>
        <Subtitle style={{ marginBottom: '16px' }}>Choose Your Avatar</Subtitle>
        <AvatarGrid>
          {AVATAR_OPTIONS.map(avatar => (
            <AvatarOption
              key={avatar}
              selected={selectedAvatar === avatar}
              onClick={() => handleAvatarSelect(avatar)}
            >
              {avatar}
            </AvatarOption>
          ))}
        </AvatarGrid>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: '16px' }}>Who are you?</Subtitle>
        <NicknameContainer>
          <Input
            type="text"
            placeholder="Enter nickname"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            maxLength={20}
          />
          <Button variant="secondary" onClick={randomizeNickname} style={{ width: 'auto', padding: '16px' }}>
            🎲
          </Button>
        </NicknameContainer>
      </Card>

      <Button
        onClick={onEnterRoom}
        disabled={!nickname.trim()}
      >
        🚀 Enter Room
      </Button>
    </Container>
  );
}
