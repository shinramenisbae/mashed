import styled from 'styled-components';
import { useState, useEffect, useRef } from 'react';

// Types
export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  status: string;
  currentRound: number;
  totalRounds: number;
}

export interface Submission {
  id: string;
  audioUrl: string;
  audioDuration: number;
  gifUrl: string;
  gifTitle: string;
  caption: string;
  soundMakerId: string;
  gifSelectorId: string;
  votes: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  scoreChange: number;
}

// Theme colors - Gen Z TikTok aesthetic
export const theme = {
  primary: '#FF0050',      // TikTok red
  secondary: '#00F2EA',    // TikTok cyan
  accent: '#FFD700',       // Gold
  dark: '#121212',         // Dark background
  darker: '#0a0a0a',       // Darker background
  light: '#ffffff',        // White
  gray: '#888888',         // Gray
  purple: '#8B5CF6',       // Purple
  pink: '#EC4899',         // Pink
  gradient: 'linear-gradient(135deg, #FF0050 0%, #8B5CF6 50%, #00F2EA 100%)',
  gradientPink: 'linear-gradient(135deg, #FF0050 0%, #EC4899 100%)',
  gradientCyan: 'linear-gradient(135deg, #00F2EA 0%, #8B5CF6 100%)',
};

// Styled Components - Global styles
export const Container = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: ${theme.dark};
  color: ${theme.light};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${theme.gradient};
    z-index: 100;
  }
`;

export const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  margin: 16px 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${theme.gradient};
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  width: 100%;
  padding: 18px 32px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  
  background: ${props => 
    props.variant === 'outline' 
      ? 'transparent' 
      : props.variant === 'secondary'
      ? theme.gradientCyan
      : theme.gradientPink};
  
  color: ${props => props.variant === 'outline' ? theme.light : theme.light};
  border: ${props => props.variant === 'outline' ? `2px solid rgba(255,255,255,0.3)` : 'none'};

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${props => 
      props.variant === 'outline'
        ? '0 10px 30px rgba(255,255,255,0.1)'
        : '0 10px 30px rgba(255, 0, 80, 0.4)'};
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: ${theme.light};
  font-size: 16px;
  transition: all 0.3s ease;
  text-align: center;
  letter-spacing: 2px;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
    box-shadow: 0 0 20px rgba(255, 0, 80, 0.3);
  }

  &::placeholder {
    color: ${theme.gray};
  }
`;

export const Title = styled.h1`
  font-size: ${props => props.size === 'small' ? '24px' : props.size === 'large' ? '48px' : '36px'};
  font-weight: 900;
  text-align: center;
  margin: 0 0 8px 0;
  background: ${theme.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: glow 2s ease-in-out infinite alternate;

  @keyframes glow {
    from { filter: drop-shadow(0 0 10px rgba(255, 0, 80, 0.5)); }
    to { filter: drop-shadow(0 0 20px rgba(0, 242, 234, 0.5)); }
  }
`;

export const Subtitle = styled.p`
  text-align: center;
  color: ${theme.gray};
  font-size: 16px;
  margin: 0 0 32px 0;
`;

export const Timer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${theme.gradientPink};
  color: white;
  padding: 12px 20px;
  border-radius: 50px;
  font-weight: 900;
  font-size: 20px;
  z-index: 50;
  box-shadow: 0 4px 20px rgba(255, 0, 80, 0.5);
  animation: pulse 1s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

export const Badge = styled.span<{ color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => props.color || theme.gradient};
  color: white;
`;

export const Avatar = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  width: ${props => props.size === 'small' ? '40px' : props.size === 'large' ? '80px' : '56px'};
  height: ${props => props.size === 'small' ? '40px' : props.size === 'large' ? '80px' : '56px'};
  border-radius: 50%;
  background: ${theme.gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.size === 'small' ? '20px' : props.size === 'large' ? '40px' : '28px'};
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 3px solid transparent;
  background-clip: padding-box;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: ${theme.gradient};
    z-index: -1;
  }
`;

export const Waveform = styled.div<{ isRecording?: boolean }>`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 20px 0;

  .bar {
    width: 6px;
    background: ${theme.gradient};
    border-radius: 3px;
    transition: height 0.1s ease;
    animation: ${props => props.isRecording ? 'wave 0.5s ease-in-out infinite alternate' : 'none'};
  }

  @keyframes wave {
    0% { height: 20%; }
    100% { height: 100%; }
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: ${theme.gray};
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  &::before { margin-right: 16px; }
  &::after { margin-left: 16px; }
`;

// Utility hook for countdown timer
export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [seconds, onComplete]);

  const formatted = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  return { seconds, formatted, setSeconds };
}

// Random name generator
export const RANDOM_NAMES = [
  'SoundNinja', 'GifMaster', 'NoisyPenguin', 'MemeLord', 
  'AudioPhile', 'BassDrop', 'VibeCheck', 'ChaosAgent',
  'DripGod', 'SillyGoose', 'ViralKing', 'MoodSetter',
  'BrainRot', 'SlayQueen', 'BasedGamer', 'SusImposter'
];

// Avatar options
export const AVATAR_OPTIONS = [
  '🎭', '🎨', '🎸', '🎪', '🎬', '🎯', '🎲',
  '🎺', '🎻', '🎮', '🎳', '🎰', '🎢', '🎡',
  '👻', '🤡', '👽', '🤖', '🦄', '🐸', '🦑'
];
