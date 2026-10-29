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

  // Galo cantando ao amanhecer (Cocorocó / Rooster Crow exclusivo no celular do host)
  public playRoosterCrow() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Filtro ressonante bandpass para dar o timbre estridente e natural da garganta de um galo
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1050, t);
    filter.Q.setValueAtTime(2.8, t);
    filter.connect(ctx.destination);

    // Estrutura rítmica clássica: "Co - co - ro - CÓOOOO!"
    const calls = [
      { start: 0.00, dur: 0.15, startFreq: 460, endFreq: 540, vol: 0.22 },
      { start: 0.19, dur: 0.13, startFreq: 430, endFreq: 480, vol: 0.24 },
      { start: 0.36, dur: 0.24, startFreq: 550, endFreq: 700, vol: 0.30 },
      { start: 0.64, dur: 1.10, startFreq: 800, endFreq: 940, vol: 0.36 },
    ];

    calls.forEach(({ start, dur, startFreq, endFreq, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const noteTime = t + start;
      osc.frequency.setValueAtTime(startFreq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, noteTime + dur * 0.65);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.90, noteTime + dur);

      // Vibrato natural na sílaba final longa ("CÓOOOO")
      if (dur > 0.5) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(7.2, noteTime);
        lfoGain.gain.setValueAtTime(20, noteTime);
        lfo.connect(osc.frequency);
        lfo.start(noteTime + 0.08);
        lfo.stop(noteTime + dur);
      }

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(vol, noteTime + 0.035);
      gain.gain.setValueAtTime(vol, noteTime + dur * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }

  // Lobo uivando ao cair da noite ("Auuuuuuuu" / Wolf Howl exclusivo no celular do host)
  public playWolfHowl() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const duration = 2.8;

    // Filtro ressonante com corte gradual para criar o eco lúgubre noturno
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(650, t + duration);

    // Oscilador principal do uivo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // Curva de pitch do uivo: surge grave, sobe alto para o clamor prolongado e desce suavemente
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.6); // Subida
    osc.frequency.setValueAtTime(450, t + 1.5); // Sustentação
    osc.frequency.exponentialRampToValueAtTime(220, t + duration - 0.25); // Queda
    osc.frequency.exponentialRampToValueAtTime(130, t + duration);

    // LFO para o trêmulo doloroso no uivo longo
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(4.5, t);
    lfoGain.gain.setValueAtTime(12, t);
    lfo.connect(osc.frequency);
    lfo.start(t + 0.4);
    lfo.stop(t + duration);

    // Envelope dinâmico suave
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.5);
    gain.gain.setValueAtTime(0.28, t + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + duration);

    // Vento atmosférico noturno sub-grave
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 2.2);
    subGain.gain.setValueAtTime(0.15, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 2.4);
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

  // Balido cômico e expressivo de ovelha ("MÉÉÉH!" / "BÉÉÉH!")
  public playSheepBaa(pitchOffset: number = 0) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const baseFreq = Math.max(160, Math.min(380, 240 + pitchOffset));
    const duration = 0.55;

    // Oscilador principal rico em harmônicos (sawtooth suavizado)
    const voiceOsc = ctx.createOscillator();
    voiceOsc.type = 'sawtooth';
    voiceOsc.frequency.setValueAtTime(baseFreq, t);
    voiceOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, t + duration);

    // LFO de Vibrato (balido trêmulo natural de ovelha ~6.8Hz)
    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoOsc.frequency.setValueAtTime(6.8, t);
    vibratoGain.gain.setValueAtTime(18, t);
    vibratoOsc.connect(voiceOsc.frequency);

    // Filtro formante vocal (enfatiza a cavidade bucal da ovelha "eeh")
    const formantFilter = ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(baseFreq * 3.2, t);
    formantFilter.Q.setValueAtTime(3.5, t);

    // Envelope de ganho do balido
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, t);
    voiceGain.gain.linearRampToValueAtTime(0.22, t + 0.06);
    voiceGain.gain.setValueAtTime(0.22, t + duration * 0.65);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Segundo oscilador para corpo acústico aveludado
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq * 0.5, t);
    subGain.gain.setValueAtTime(0.08, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Conexões
    voiceOsc.connect(formantFilter);
    formantFilter.connect(voiceGain);
    voiceGain.connect(ctx.destination);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    // Início e parada
    vibratoOsc.start(t);
    voiceOsc.start(t);
    subOsc.start(t);

    vibratoOsc.stop(t + duration);
    voiceOsc.stop(t + duration);
    subOsc.stop(t + duration);
  }
}

export const sounds = new SoundEffectsManager();

