import { Audio } from 'expo-av';

type SoundMap = { [key: string]: Audio.Sound };

class AudioManager {
  private static instance: AudioManager;
  private sounds: SoundMap = {};
  private music: Audio.Sound | null = null;
  private isSoundEnabled = true;
  private isMusicEnabled = true;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async loadSounds(soundFiles: { [key: string]: any }) {
    // ✅ FIX: Add null check for soundFiles parameter
    if (!soundFiles || typeof soundFiles !== 'object') {
      console.warn('AudioManager: soundFiles is null, undefined, or not an object');
      return;
    }

    for (const key in soundFiles) {
      try {
        const { sound } = await Audio.Sound.createAsync(soundFiles[key]);
        this.sounds[key] = sound;
      } catch (error) {
        console.error(`Error loading sound ${key}:`, error);
      }
    }
  }

  async playSound(key: string) {
    if (this.isSoundEnabled && this.sounds[key]) {
      try {
        await this.sounds[key].replayAsync();
      } catch (error) {
        console.error(`Error playing sound ${key}:`, error);
      }
    }
  }

  async playMusic(soundFile: any, loop = true) {
    // ✅ FIX: Add null check for soundFile parameter
    if (!soundFile) {
      console.warn('AudioManager: soundFile is null or undefined');
      return;
    }

    if (this.music) {
      await this.music.stopAsync();
      await this.music.unloadAsync();
      this.music = null;
    }
    try {
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        isLooping: loop,
      });
      this.music = sound;
      if (this.isMusicEnabled) {
        await this.music.playAsync();
      }
    } catch (error) {
      console.error('Error playing music:', error);
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (this.music) {
      if (enabled) {
        this.music.playAsync();
      } else {
        this.music.stopAsync();
      }
    }
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  toggleSound(): boolean {
    this.isSoundEnabled = !this.isSoundEnabled;
    return this.isSoundEnabled;
  }

  toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    if (this.music) {
      if (this.isMusicEnabled) {
        this.music.playAsync();
      } else {
        this.music.stopAsync();
      }
    }
    return this.isMusicEnabled;
  }
}

export const audioManager = AudioManager.getInstance();