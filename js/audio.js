// Web Audio API による8bitレトロRPG風 SE & 簡易BGM合成エンジン

const NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99,
  G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99,
  G5: 783.99, Ab5: 830.61, A5: 880.0, Bb5: 932.33, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.mode = 'all'; // 'all' | 'se' | 'mute'
    this.bgmTimer = null;
    this.currentBgm = null;
    this.bgmStep = 0;
  }

  setMode(mode) {
    this.mode = mode;
    if (mode !== 'all') {
      this.stopBgm();
    }
  }

  unlock() {
    if (this.mode === 'mute') return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _playTone({ freq, endFreq = null, duration = 0.1, type = 'square', volume = 0.12, delay = 0 }) {
    if (this.mode === 'mute') return;
    const ctx = this.unlock();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  _playNoise({ duration = 0.15, volume = 0.12, delay = 0 }) {
    if (this.mode === 'mute') return;
    const ctx = this.unlock();
    if (!ctx) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playSe(name) {
    if (this.mode === 'mute') return;
    switch (name) {
      case 'cursor':
        this._playTone({ freq: 880, duration: 0.045, type: 'square', volume: 0.08 });
        break;
      case 'confirm':
        this._playTone({ freq: 660, duration: 0.06, type: 'square', volume: 0.1 });
        this._playTone({ freq: 990, duration: 0.09, type: 'square', volume: 0.1, delay: 0.05 });
        break;
      case 'blip':
        this._playTone({ freq: 520 + Math.random() * 140, duration: 0.03, type: 'square', volume: 0.045 });
        break;
      case 'step':
        this._playNoise({ duration: 0.045, volume: 0.05 });
        break;
      case 'upgrade':
        this._playTone({ freq: 440, duration: 0.08, type: 'square', volume: 0.1, delay: 0 });
        this._playTone({ freq: 554.37, duration: 0.08, type: 'square', volume: 0.1, delay: 0.07 });
        this._playTone({ freq: 659.25, duration: 0.08, type: 'square', volume: 0.1, delay: 0.14 });
        this._playTone({ freq: 880, duration: 0.18, type: 'square', volume: 0.12, delay: 0.21 });
        break;
      case 'chest':
        this._playTone({ freq: 392, duration: 0.09, type: 'triangle', volume: 0.14, delay: 0 });
        this._playTone({ freq: 523.25, duration: 0.09, type: 'triangle', volume: 0.14, delay: 0.09 });
        this._playTone({ freq: 783.99, duration: 0.22, type: 'square', volume: 0.12, delay: 0.18 });
        break;
      case 'encounter':
        for (let i = 0; i < 6; i++) {
          this._playTone({
            freq: 220 + i * 95,
            duration: 0.055,
            type: 'sawtooth',
            volume: 0.1,
            delay: i * 0.045,
          });
        }
        break;
      case 'attack':
        this._playNoise({ duration: 0.09, volume: 0.14 });
        this._playTone({ freq: 340, endFreq: 110, duration: 0.11, type: 'sawtooth', volume: 0.12, delay: 0.02 });
        break;
      case 'miss':
        this._playTone({ freq: 360, endFreq: 190, duration: 0.12, type: 'triangle', volume: 0.09 });
        break;
      case 'critical':
        this._playNoise({ duration: 0.18, volume: 0.18 });
        this._playTone({ freq: 980, endFreq: 220, duration: 0.2, type: 'sawtooth', volume: 0.16 });
        this._playTone({ freq: 1318.5, duration: 0.18, type: 'square', volume: 0.15, delay: 0.08 });
        break;
      case 'flee':
        this._playTone({ freq: 740, endFreq: 240, duration: 0.25, type: 'square', volume: 0.1 });
        break;
      case 'wipeout':
        this._playTone({ freq: 293.66, duration: 0.2, type: 'sawtooth', volume: 0.1, delay: 0 });
        this._playTone({ freq: 261.63, duration: 0.2, type: 'sawtooth', volume: 0.1, delay: 0.22 });
        this._playTone({ freq: 220, duration: 0.45, type: 'sawtooth', volume: 0.11, delay: 0.44 });
        break;
      case 'revive':
        [392, 493.88, 587.33, 783.99, 987.77].forEach((f, idx) => {
          this._playTone({ freq: f, duration: 0.14, type: 'triangle', volume: 0.13, delay: idx * 0.08 });
        });
        break;
      case 'cutin':
        this._playNoise({ duration: 0.12, volume: 0.16 });
        this._playTone({ freq: 880, duration: 0.08, type: 'square', volume: 0.14, delay: 0 });
        this._playTone({ freq: 1174.66, duration: 0.22, type: 'square', volume: 0.14, delay: 0.06 });
        break;
      case 'freeze':
        this._playTone({ freq: 90, endFreq: 45, duration: 0.65, type: 'sawtooth', volume: 0.14 });
        break;
      case 'reelTick':
        this._playTone({ freq: 620, duration: 0.025, type: 'square', volume: 0.05 });
        break;
      case 'reelStop':
        this._playTone({ freq: 440, duration: 0.08, type: 'square', volume: 0.12 });
        this._playTone({ freq: 220, duration: 0.08, type: 'triangle', volume: 0.12, delay: 0.03 });
        break;
      case 'fanfare':
        [
          { f: NOTE_FREQ.C5, d: 0.12, t: 0 },
          { f: NOTE_FREQ.C5, d: 0.12, t: 0.13 },
          { f: NOTE_FREQ.C5, d: 0.12, t: 0.26 },
          { f: NOTE_FREQ.C5, d: 0.34, t: 0.39 },
          { f: NOTE_FREQ.Ab4, d: 0.3, t: 0.76 },
          { f: NOTE_FREQ.Bb4, d: 0.3, t: 1.08 },
          { f: NOTE_FREQ.C5, d: 0.22, t: 1.4 },
          { f: NOTE_FREQ.Bb4, d: 0.12, t: 1.64 },
          { f: NOTE_FREQ.C5, d: 0.65, t: 1.78 },
        ].forEach((n) => {
          this._playTone({ freq: n.f, duration: n.d, type: 'square', volume: 0.13, delay: n.t });
          this._playTone({ freq: n.f / 2, duration: n.d, type: 'triangle', volume: 0.1, delay: n.t });
        });
        break;
      case 'safe':
        [
          { f: NOTE_FREQ.E4, d: 0.12, t: 0 },
          { f: NOTE_FREQ.G4, d: 0.12, t: 0.13 },
          { f: NOTE_FREQ.C5, d: 0.35, t: 0.26 },
        ].forEach((n) => {
          this._playTone({ freq: n.f, duration: n.d, type: 'triangle', volume: 0.13, delay: n.t });
        });
        break;
      default:
        break;
    }
  }

  startBgm(theme = 'field') {
    if (this.mode !== 'all') return;
    if (this.currentBgm === theme && this.bgmTimer) return;
    this.stopBgm();
    this.unlock();

    const patterns = {
      field: {
        tempoMs: 220,
        notes: [
          NOTE_FREQ.C4, NOTE_FREQ.E4, NOTE_FREQ.G4, NOTE_FREQ.C5,
          NOTE_FREQ.B4, NOTE_FREQ.G4, NOTE_FREQ.E4, NOTE_FREQ.G4,
          NOTE_FREQ.F4, NOTE_FREQ.A4, NOTE_FREQ.C5, NOTE_FREQ.A4,
          NOTE_FREQ.G4, NOTE_FREQ.F4, NOTE_FREQ.D4, NOTE_FREQ.G4,
        ],
        type: 'triangle',
      },
      battle: {
        tempoMs: 145,
        notes: [
          NOTE_FREQ.E4, NOTE_FREQ.E4, NOTE_FREQ.G4, NOTE_FREQ.E4,
          NOTE_FREQ.A4, NOTE_FREQ.G4, NOTE_FREQ.Fs4, NOTE_FREQ.D4,
          NOTE_FREQ.E4, NOTE_FREQ.G4, NOTE_FREQ.B4, NOTE_FREQ.A4,
          NOTE_FREQ.G4, NOTE_FREQ.Fs4, NOTE_FREQ.E4, NOTE_FREQ.B3,
        ],
        type: 'square',
      },
      casino: {
        tempoMs: 170,
        notes: [
          NOTE_FREQ.C5, NOTE_FREQ.Eb5, NOTE_FREQ.G5, NOTE_FREQ.Eb5,
          NOTE_FREQ.F5, NOTE_FREQ.Eb5, NOTE_FREQ.D5, NOTE_FREQ.B4,
          NOTE_FREQ.C5, NOTE_FREQ.G4, NOTE_FREQ.Ab4, NOTE_FREQ.Bb4,
          NOTE_FREQ.C5, NOTE_FREQ.D5, NOTE_FREQ.Eb5, NOTE_FREQ.G5,
        ],
        type: 'square',
      },
    };

    const pat = patterns[theme] || patterns.field;
    this.currentBgm = theme;
    this.bgmStep = 0;

    const tick = () => {
      if (this.mode !== 'all' || this.currentBgm !== theme) return;
      const freq = pat.notes[this.bgmStep % pat.notes.length];
      this._playTone({
        freq,
        duration: (pat.tempoMs / 1000) * 0.8,
        type: pat.type,
        volume: 0.045,
      });
      this.bgmStep++;
    };

    tick();
    this.bgmTimer = setInterval(tick, pat.tempoMs);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgm = null;
  }
}

export const audio = new RetroAudioEngine();
