// Web Audio API Synthesizer for 100% Offline & Instant Card Sound Effects & Haptics

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isHapticsEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    // Automatically attach one-time user gesture listeners to unlock Web Audio on mobile
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
      };

      const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlock, { capture: true, passive: true });
      });
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  /**
   * Unlocks the Web Audio pipeline on first user interaction.
   * Plays a 1-sample silent buffer to transition AudioContext out of 'suspended' on iOS & Android.
   */
  public unlockAudio() {
    if (typeof window === 'undefined') return;

    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Play 1 silent sample to warm up audio hardware
      if (this.ctx && !this.isUnlocked) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn('Audio unlock warning', e);
    }
  }

  /**
   * Executes audio synthesis safely, awaiting resume if the context was momentarily suspended.
   */
  private runWithContext(fn: (ctx: AudioContext) => void) {
    if (this.isMuted) return;
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      this.unlockAudio();
    }

    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (this.ctx && this.ctx.state === 'running') {
            try {
              fn(this.ctx);
            } catch (err) {
              console.warn('Audio run error', err);
            }
          }
        })
        .catch(() => {});
      return;
    }

    try {
      fn(this.ctx);
    } catch (err) {
      console.warn('Audio run error', err);
    }
  }

  /**
   * Crisp, short card slide/flip sound (white noise burst with fast decay)
   */
  public playCardFlip() {
    this.runWithContext((ctx) => {
      const bufferSize = Math.floor(ctx.sampleRate * 0.05); // 50ms burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
    });
  }

  /**
   * Solid, gentle card snap / placement tap
   */
  public playCardPlace() {
    this.runWithContext((ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    });
  }

  /**
   * Victory Fanfare: ascending arpeggio chimes on win!
   */
  public playWinFanfare() {
    this.runWithContext((ctx) => {
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.5);
      });
    });
  }

  /**
   * Grand Record Fanfare: extra triumphant harmonic fanfare when breaking all-time high score!
   */
  public playRecordFanfare() {
    this.runWithContext((ctx) => {
      const chords = [
        { time: 0.0, notes: [261.63, 329.63, 392.0] }, // C major
        { time: 0.22, notes: [349.23, 440.0, 523.25] }, // F major
        { time: 0.44, notes: [392.0, 493.88, 587.33] }, // G major
        { time: 0.7, notes: [523.25, 659.25, 783.99, 1046.5] }, // High C major hold!
      ];

      chords.forEach(({ time: startOffset, notes }) => {
        notes.forEach((freq) => {
          const time = ctx.currentTime + startOffset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          const duration = startOffset >= 0.7 ? 0.8 : 0.28;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + duration + 0.05);
        });
      });
    });
  }

  /**
   * Crisp, rapid card dealing sound for snappy deal animation.
   * Only plays if the AudioContext is already unlocked and running.
   */
  public playCardDeal() {
    if (!this.ctx || this.ctx.state !== 'running') {
      return;
    }

    this.runWithContext((ctx) => {
      const bufferSize = Math.floor(ctx.sampleRate * 0.035); // 35ms quick burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.035);
      filter.Q.value = 2.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
    });
  }

  /**
   * Mobile haptic feedback with device-tested pulse lengths for Android & Web
   */
  public triggerHaptic(duration = 25) {
    if (!this.isHapticsEnabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        const ms = Math.max(25, duration);
        navigator.vibrate(ms);
      } catch {
        // Ignored if browser blocks vibration without direct gesture
      }
    }
  }
}

export const sounds = new SoundEngine();
