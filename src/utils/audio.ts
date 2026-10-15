// Web Audio API Synthesizer for tactile game feedback

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play subtle UI button click
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // Morning Church Bell / Rooster Chime
  public playMorningBell() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.8);
    });
  }

  // Solemn Night Fall
  public playNightTone() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  }

  // Gavel Strike for daytime voting & trial
  public playGavelStrike() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // Holy Blessing harp arpeggio (Pastor / Evangelista / Conversion)
  public playHolyBlessing() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const chord = [392.0, 493.88, 587.33, 783.99, 987.77]; // G, B, D, G, B
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.7);
    });
  }

  // Victory fanfare
  public playVictoryFanfare() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
    });
  }

  // Alerta sonoro de 30 segundos restantes na Assembleia
  public playWarningAlert() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const beeps = [660, 880, 880];
    beeps.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.11);
    });
  }

  // Toques de relógio (tick-tock) nos últimos 10 segundos
  public playClockTick(isUrgent: boolean = false) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = isUrgent ? 1150 : 880;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // Galo cantando ao amanhecer (Cocorocó / Rooster Crow)
  public playRoosterCrow() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Master filter to shape the brassy throat of a rooster
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, t);
    filter.Q.setValueAtTime(2.2, t);
    filter.connect(ctx.destination);

    // Call syllables: "Co - co - ro - CÓOOOO"
    const calls = [
      { start: 0.00, dur: 0.14, startFreq: 460, endFreq: 520, vol: 0.14 },
      { start: 0.18, dur: 0.12, startFreq: 420, endFreq: 460, vol: 0.16 },
      { start: 0.34, dur: 0.22, startFreq: 540, endFreq: 680, vol: 0.22 },
      { start: 0.60, dur: 0.95, startFreq: 780, endFreq: 890, vol: 0.28 },
    ];

    calls.forEach(({ start, dur, startFreq, endFreq, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const noteTime = t + start;
      osc.frequency.setValueAtTime(startFreq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, noteTime + dur * 0.7);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.95, noteTime + dur);

      // Pitch vibrato for the sustained last syllable
      if (dur > 0.5) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(6.5, noteTime);
        lfoGain.gain.setValueAtTime(14, noteTime);
        lfo.connect(osc.frequency);
        lfo.start(noteTime);
        lfo.stop(noteTime + dur);
      }

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(vol, noteTime + 0.03);
      gain.gain.setValueAtTime(vol, noteTime + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });

    // Gentle church bell backdrop at morning
    setTimeout(() => {
      this.playMorningBell();
    }, 450);
  }

  // Lobo uivando ao cair da noite ("Auuuuuuuu" / Wolf Howl)
  public playWolfHowl() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const duration = 2.6;

    // Filter to give a hollow, echoing nocturnal outdoor body
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + duration);

    // Main howl oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // Howl pitch contour: starts low, rises high into a sustained cry, then gently dips
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(430, t + 0.55); // Rise up
    osc.frequency.setValueAtTime(440, t + 1.4); // Sustain
    osc.frequency.exponentialRampToValueAtTime(240, t + duration - 0.2); // Taper down
    osc.frequency.exponentialRampToValueAtTime(140, t + duration);

    // LFO for mournful vibrato on the long howl
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(4.2, t);
    lfoGain.gain.setValueAtTime(9, t);
    lfo.connect(osc.frequency);
    lfo.start(t + 0.4);
    lfo.stop(t + duration);

    // Smooth envelope
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.24, t + 0.45);
    gain.gain.setValueAtTime(0.22, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + duration);

    // Sub-bass atmospheric wind
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, t);
    subOsc.frequency.exponentialRampToValueAtTime(50, t + 1.8);
    subGain.gain.setValueAtTime(0.12, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 2.0);
  }

  // Suspense da abertura das urnas da assembleia (rolo de tensão e destrave)
  public playUrnSuspense() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Pulsos rápidos acelerados de tensão (batimentos misteriosos)
    const beats = 14;
    for (let i = 0; i < beats; i++) {
      const beatTime = t + (i * 0.16) * (1 - i * 0.025);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + i * 6, beatTime);
      osc.frequency.exponentialRampToValueAtTime(35, beatTime + 0.12);
      const vol = 0.04 + (i / beats) * 0.15;
      gain.gain.setValueAtTime(vol, beatTime);
      gain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(beatTime);
      osc.stop(beatTime + 0.12);
    }
  }

  // Som do destrave e abertura luminosa da urna sagrada
  public playUrnOpen() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Impacto do cadeado abrindo (clique metálico)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1400, t);
    clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
    clickGain.gain.setValueAtTime(0.2, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.08);

    // Ressonância mística / acorde sagrado da abertura
    const chord = [330.0, 440.0, 554.37, 659.25]; // E, A, C#, E
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.06 + idx * 0.04);
      gain.gain.setValueAtTime(0.12, t + 0.06 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2 + idx * 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + 0.06 + idx * 0.04);
      osc.stop(t + 1.2 + idx * 0.04);
    });
  }
}

export const sounds = new SoundEffectsManager();
