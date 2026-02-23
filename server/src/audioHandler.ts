/**
 * Audio Handler - Manages audio file storage and retrieval
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { AudioData, AudioFormat } from './types.js';

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// In-memory audio metadata storage
const audioStorage: Map<string, AudioData> = new Map();

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw new Error('Failed to initialize audio storage');
  }
}

/**
 * Get file extension for audio format
 */
function getFileExtension(format: AudioFormat): string {
  switch (format) {
    case 'webm': return '.webm';
    case 'mp3': return '.mp3';
    case 'wav': return '.wav';
    default: return '.webm';
  }
}

/**
 * Get MIME type for audio format
 */
export function getMimeType(format: AudioFormat): string {
  switch (format) {
    case 'webm': return 'audio/webm';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    default: return 'audio/webm';
  }
}

/**
 * Save audio blob to storage
 */
export async function saveAudio(
  audioBuffer: Buffer,
  duration: number,
  format: AudioFormat
): Promise<AudioData> {
  const audioId = uuidv4();
  const fileName = `${audioId}${getFileExtension(format)}`;
  const filePath = join(UPLOAD_DIR, fileName);
  
  try {
    // Write file to disk
    await fs.writeFile(filePath, audioBuffer);
    
    // Create audio metadata
    const audioData: AudioData = {
      id: audioId,
      url: `/api/audio/${audioId}`,
      duration,
      format,
      size: audioBuffer.length,
      recordedAt: new Date().toISOString(),
    };
    
    // Store metadata
    audioStorage.set(audioId, audioData);
    
    return audioData;
  } catch (error) {
    console.error('Failed to save audio:', error);
    throw new Error('Failed to save audio recording');
  }
}

/**
 * Get audio data by ID
 */
export function getAudioData(audioId: string): AudioData | undefined {
  return audioStorage.get(audioId);
}

/**
 * Get audio file path
 */
export function getAudioFilePath(audioId: string): string | null {
  const audioData = audioStorage.get(audioId);
  if (!audioData) {
    return null;
  }
  
  const fileName = `${audioId}${getFileExtension(audioData.format)}`;
  return join(UPLOAD_DIR, fileName);
}

/**
 * Get audio file as buffer
 */
export async function getAudioBuffer(audioId: string): Promise<{ buffer: Buffer; format: AudioFormat } | null> {
  const filePath = getAudioFilePath(audioId);
  if (!filePath) {
    return null;
  }
  
  try {
    const buffer = await fs.readFile(filePath);
    const audioData = audioStorage.get(audioId);
    return { buffer, format: audioData?.format || 'webm' };
  } catch (error) {
    console.error('Failed to read audio file:', error);
    return null;
  }
}

/**
 * Delete audio file
 */
export async function deleteAudio(audioId: string): Promise<boolean> {
  const filePath = getAudioFilePath(audioId);
  if (!filePath) {
    return false;
  }
  
  try {
    await fs.unlink(filePath);
    audioStorage.delete(audioId);
    return true;
  } catch (error) {
    console.error('Failed to delete audio file:', error);
    return false;
  }
}

/**
 * Clean up old audio files (call periodically)
 */
export async function cleanupOldAudio(maxAgeHours: number = 24): Promise<number> {
  const now = new Date();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  let deletedCount = 0;
  
  for (const [audioId, audioData] of audioStorage.entries()) {
    const recordedAt = new Date(audioData.recordedAt);
    if (now.getTime() - recordedAt.getTime() > maxAgeMs) {
      const deleted = await deleteAudio(audioId);
      if (deleted) {
        deletedCount++;
      }
    }
  }
  
  return deletedCount;
}

/**
 * Get storage stats
 */
export function getStorageStats(): { count: number; totalSize: number } {
  let totalSize = 0;
  for (const audioData of audioStorage.values()) {
    totalSize += audioData.size;
  }
  
  return {
    count: audioStorage.size,
    totalSize,
  };
}

/**
 * Validate audio buffer
 */
export function validateAudioBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  // Minimum size check (100 bytes)
  if (buffer.length < 100) {
    return { valid: false, error: 'Audio file too small' };
  }
  
  // Maximum size check (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { valid: false, error: 'Audio file too large (max 10MB)' };
  }
  
  return { valid: true };
}
