import styled from 'styled-components';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Button, Timer, theme, useCountdown } from './shared';

const RecordingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const RoleBanner = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  .icon {
    font-size: 64px;
    margin-bottom: 16px;
    animation: bounce 1s ease-in-out infinite;
  }
  
  .text {
    font-size: 24px;
    font-weight: 900;
    background: ${theme.gradientPink};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .subtext {
    color: ${theme.gray};
    margin-top: 8px;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;

const WaveformContainer = styled.div<{ isRecording?: boolean }>`
  width: 100%;
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px 0;
  position: relative;
  overflow: hidden;
  border: 2px solid ${props => props.isRecording ? theme.primary : 'rgba(255, 255, 255, 0.1)'};
  box-shadow: ${props => props.isRecording ? `0 0 30px rgba(255, 0, 80, 0.3)` : 'none'};
  transition: all 0.3s ease;
`;

const WaveformBars = styled.div<{ isRecording?: boolean; audioData?: number[] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  padding: 20px;
  
  .bar {
    width: 8px;
    background: ${theme.gradient};
    border-radius: 4px;
    transition: height 0.05s ease;
  }
  
  .placeholder {
    color: ${theme.gray};
    font-size: 14px;
    
    ${props => props.isRecording && `
      animation: pulse 1s ease-in-out infinite;
    `}
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

const RecordButton = styled.button<{ isRecording?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: ${props => props.isRecording ? theme.light : theme.gradientPink};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.isRecording 
    ? '0 0 0 20px rgba(255, 255, 255, 0.1)' 
    : '0 10px 40px rgba(255, 0, 80, 0.5)'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: ${theme.gradient};
    z-index: -1;
    animation: ${props => props.isRecording ? 'spin 2s linear infinite' : 'none'};
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.isRecording 
      ? '0 0 0 25px rgba(255, 255, 255, 0.15)' 
      : '0 15px 50px rgba(255, 0, 80, 0.6)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const DurationDisplay = styled.div`
  position: absolute;
  bottom: 16px;
  font-size: 14px;
  font-weight: 700;
  color: ${theme.primary};
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: 12px;
`;

const TipsContainer = styled.div`
  margin-top: 32px;
  text-align: center;
  
  .label {
    font-size: 12px;
    color: ${theme.gray};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  
  .tips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  
  .tip {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    color: ${theme.light};
  }
`;

const PlaybackControls = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
  width: 100%;
`;

const AudioProgress = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 16px;
  overflow: hidden;
  
  .progress {
    height: 100%;
    background: ${theme.gradient};
    border-radius: 2px;
    transition: width 0.1s linear;
  }
`;

const SOUND_EFFECTS = [
  { emoji: '🎺', name: 'Trumpet', freq: 523, type: 'square' as OscillatorType },
  { emoji: '🥁', name: 'Drum', freq: 150, type: 'sawtooth' as OscillatorType },
  { emoji: '🎸', name: 'Guitar', freq: 330, type: 'triangle' as OscillatorType },
  { emoji: '🔔', name: 'Bell', freq: 880, type: 'sine' as OscillatorType },
  { emoji: '👾', name: 'Retro', freq: 440, type: 'square' as OscillatorType },
  { emoji: '🚨', name: 'Siren', freq: 660, type: 'sawtooth' as OscillatorType },
  { emoji: '🐱', name: 'Meow', freq: 700, type: 'triangle' as OscillatorType },
  { emoji: '💥', name: 'Boom', freq: 80, type: 'sawtooth' as OscillatorType },
  { emoji: '🎵', name: 'Melody', freq: 392, type: 'sine' as OscillatorType },
];

const SoundEffectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 24px 0;
`;

const SoundEffectButton = styled.button<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 16px;
  border: 2px solid ${props => props.selected ? theme.primary : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.selected ? 'rgba(255, 0, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${theme.light};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 36px;
  
  .name {
    font-size: 12px;
    color: ${theme.gray};
  }
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MicWarning = styled.div`
  background: rgba(255, 165, 0, 0.15);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
  font-size: 14px;
  color: #ffa500;
`;

const SOUND_TIPS = [
  'Beatbox', 'Impressions', 'Nonsense words', 
  'Sound effects', 'Animal noises', 'Whistling',
  'Drum sounds', 'Vocal chops', 'Synth sounds'
];

interface AudioRecorderProps {
  roundNumber: number;
  totalRounds: number;
  timeLimit: number;
  onSubmit: (audioBlob: Blob, duration: number) => void;
}

export function AudioRecorder({ roundNumber, totalRounds, timeLimit, onSubmit }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioData, setAudioData] = useState<number[]>(new Array(20).fill(10));
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [micAvailable, setMicAvailable] = useState(true);
  const [micError, setMicError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { formatted: timerFormatted } = useCountdown(timeLimit);

  // Check mic availability
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicAvailable(false);
      setMicError(isSecure ? 'Microphone API not available in this browser.' : 'Microphone requires HTTPS. Use the sound effect picker below instead!');
    } else if (!isSecure) {
      // Some browsers block getUserMedia on HTTP even if the API exists
      setMicAvailable(false);
      setMicError('Microphone requires HTTPS. Use the sound effect picker below instead!');
    }
  }, []);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % SOUND_TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const bars = 20;
    const step = Math.floor(dataArray.length / bars);
    const newData = [];
    
    for (let i = 0; i < bars; i++) {
      const value = dataArray[i * step];
      const normalized = (value / 255) * 150 + 10;
      newData.push(normalized);
    }
    
    setAudioData(newData);
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = async () => {
    if (!micAvailable) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioDuration(recordingDuration);
        setHasRecorded(true);
        
        // Create audio element for playback
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        
        audio.addEventListener('timeupdate', () => {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
        });
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackProgress(0);
        });
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      
      // Start visualizer
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
      
      // Update recording duration
      recordingIntervalRef.current = setInterval(() => {
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(duration);
        
        // Auto-stop at 30 seconds
        if (duration >= 30) {
          stopRecording();
        }
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setMicAvailable(false);
      setMicError('Could not access microphone. Please check permissions or use the sound effect picker below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      // Stop visualizer
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Stop duration interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      // Reset waveform
      setAudioData(new Array(20).fill(10));
    }
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRedo = () => {
    setHasRecorded(false);
    setAudioBlob(null);
    setAudioDuration(0);
    setRecordingDuration(0);
    setPlaybackProgress(0);
    if (audioElementRef.current) {
      URL.revokeObjectURL(audioElementRef.current.src);
      audioElementRef.current = null;
    }
  };

  const generateSoundEffect = async (effect: typeof SOUND_EFFECTS[0]) => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const duration = 3.5;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a fun sound pattern
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freqMod = effect.freq * (1 + 0.3 * Math.sin(t * 5));
      let sample = 0;
      switch (effect.type) {
        case 'sine': sample = Math.sin(2 * Math.PI * freqMod * t); break;
        case 'square': sample = Math.sin(2 * Math.PI * freqMod * t) > 0 ? 0.5 : -0.5; break;
        case 'sawtooth': sample = 2 * ((freqMod * t) % 1) - 1; break;
        case 'triangle': sample = Math.abs(4 * ((freqMod * t) % 1) - 2) - 1; break;
      }
      // Envelope
      const env = Math.min(1, t * 10) * Math.max(0, 1 - (t - duration + 0.5) * 2);
      data[i] = sample * env * 0.5;
    }

    // Encode to WAV
    const numChannels = 1;
    const bitsPerSample = 16;
    const wavBuffer = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(wavBuffer);
    const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + data.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, 'data');
    view.setUint32(40, data.length * 2, true);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(44 + i * 2, s * 0x7FFF, true);
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    setAudioBlob(blob);
    setAudioDuration(duration);
    setHasRecorded(true);

    // Play preview
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;
    audio.addEventListener('timeupdate', () => setPlaybackProgress((audio.currentTime / audio.duration) * 100));
    audio.addEventListener('ended', () => { setIsPlaying(false); setPlaybackProgress(0); });
    audio.play();
    setIsPlaying(true);

    await ctx.close();
  };

  const handleSubmit = () => {
    if (audioBlob && audioDuration >= 3) {
      onSubmit(audioBlob, audioDuration);
    }
  };

  return (
    <Container>
      <Timer>⏱️ {timerFormatted}</Timer>
      
      <div style={{ marginTop: '60px', textAlign: 'center' }}>
        <span style={{ color: theme.gray, fontSize: '14px' }}>Round {roundNumber} of {totalRounds}</span>
      </div>

      <RecordingContainer>
        {!hasRecorded ? (
          <>
            <RoleBanner>
              <div className="icon">🎤</div>
              <div className="text">YOUR TURN!</div>
              <div className="subtext">{micAvailable ? 'Make a sound. Any sound.' : 'Pick a sound effect!'}</div>
            </RoleBanner>

            {!micAvailable && (
              <>
                <MicWarning>⚠️ {micError}</MicWarning>
                <SoundEffectGrid>
                  {SOUND_EFFECTS.map((effect) => (
                    <SoundEffectButton
                      key={effect.name}
                      onClick={() => generateSoundEffect(effect)}
                    >
                      {effect.emoji}
                      <span className="name">{effect.name}</span>
                    </SoundEffectButton>
                  ))}
                </SoundEffectGrid>
              </>
            )}

            {micAvailable && (
              <>
                <WaveformContainer isRecording={isRecording}>
                  <WaveformBars isRecording={isRecording}>
                    {isRecording ? (
                      audioData.map((height, i) => (
                        <div 
                          key={i} 
                          className="bar" 
                          style={{ height: `${height}px` }}
                        />
                      ))
                    ) : (
                      <span className="placeholder">Tap to start recording</span>
                    )}
                  </WaveformBars>
                  {isRecording && (
                    <DurationDisplay>
                      ◉ REC ({recordingDuration.toFixed(1)}s)
                    </DurationDisplay>
                  )}
                </WaveformContainer>

                <RecordButton 
                  isRecording={isRecording}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? '⏹️' : '🎙️'}
                </RecordButton>

                <TipsContainer>
                  <div className="label">Try these</div>
                  <div className="tips">
                    {SOUND_TIPS.map((tip, i) => (
                      <span 
                        key={tip}
                        className="tip"
                        style={{ 
                          opacity: i === currentTip ? 1 : 0.5,
                          transform: i === currentTip ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {tip}
                      </span>
                    ))}
                  </div>
                </TipsContainer>
              </>
            )}
          </>
        ) : (
          <>
            <RoleBanner>
              <div className="icon">✅</div>
              <div className="text">RECORDED!</div>
            </RoleBanner>

            <WaveformContainer>
              <WaveformBars>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
                  <div style={{ color: theme.light, fontWeight: 700 }}>
                    {audioDuration.toFixed(1)} seconds
                  </div>
                </div>
              </WaveformBars>
            </WaveformContainer>

            <AudioProgress>
              <div className="progress" style={{ width: `${playbackProgress}%` }} />
            </AudioProgress>

            <PlaybackControls>
              <Button variant="outline" onClick={handleRedo}>
                🔄 Redo
              </Button>
              <Button onClick={togglePlayback}>
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </Button>
            </PlaybackControls>

            <Button 
              onClick={handleSubmit}
              disabled={audioDuration < 3}
              style={{ marginTop: '16px' }}
            >
              {audioDuration < 3 ? `Need ${(3 - audioDuration).toFixed(1)}s more` : '✅ Submit Sound'}
            </Button>
          </>
        )}
      </RecordingContainer>
    </Container>
  );
}
