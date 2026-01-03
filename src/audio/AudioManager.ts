import type { SFXType } from '@/types';

/**
 * Менеджер аудио - SYNTHWAVE/RETROWAVE стиль
 * Дисторшн, глитчи, реверб, энергия!
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Эффекты
  private reverb: ConvolverNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  /** Аудио запущено */
  public isStarted = false;

  /** Звук включён */
  public isMuted = false;

  /** Запустить аудио */
  public start(): void {
    if (this.isStarted) return;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Компрессор для панча
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.ctx.destination);

    // Мастер громкость
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.compressor);

    // Дисторшн
    this.distortion = this.createDistortion(20);
    this.distortion.connect(this.masterGain);

    // Реверб
    this.reverb = this.createReverb(2.5);
    this.reverb.connect(this.masterGain);

    // Музыка
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    // Звуковые эффекты
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.distortion);

    this.isStarted = true;

    // Запускаем музыку
    this.startSynthwaveMusic();
  }

  /** Создать дисторшн */
  private createDistortion(amount: number): WaveShaperNode {
    const distortion = this.ctx!.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    distortion.curve = curve;
    distortion.oversample = '4x';
    return distortion;
  }

  /** Создать реверб */
  private createReverb(duration: number): ConvolverNode {
    const convolver = this.ctx!.createConvolver();
    const rate = this.ctx!.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx!.createBuffer(2, length, rate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Экспоненциальное затухание с модуляцией
        const decay = Math.exp(-3 * i / length);
        const mod = Math.sin(i * 0.001) * 0.3 + 0.7;
        data[i] = (Math.random() * 2 - 1) * decay * mod;
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /** Переключить звук */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
    }
  }

  // Звук приближения врага
  private proximityOsc: OscillatorNode | null = null;
  private proximityGain: GainNode | null = null;
  private proximityFilter: BiquadFilterNode | null = null;

  /** Воспроизвести звуковой эффект */
  public playSFX(type: SFXType): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    switch (type) {
      case 'gunshot':
        this.playKatanaSwing();
        break;
      case 'reload':
        this.playGlitch();
        break;
      case 'footstep':
        this.playFootstep();
        break;
      case 'jump':
        this.playJump();
        break;
      case 'land':
        this.playLand();
        break;
      case 'hit':
        this.playBanelingExplosion(); // Взрыв бейнлинга!
        break;
      case 'phantom_pass':
        this.playPhantomPass(); // Фантом пролетел сквозь!
        break;
      case 'kill':
        this.playKill();
        break;
    }
  }

  /** Обновить звук приближения врага (0-1, где 1 = очень близко) */
  public updateProximitySound(proximity: number): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Создаём осциллятор если нет
    if (!this.proximityOsc) {
      this.proximityOsc = this.ctx.createOscillator();
      this.proximityGain = this.ctx.createGain();
      this.proximityFilter = this.ctx.createBiquadFilter();

      this.proximityOsc.type = 'sawtooth';
      this.proximityFilter!.type = 'lowpass';
      this.proximityFilter!.Q.value = 5;

      this.proximityOsc.connect(this.proximityFilter!);
      this.proximityFilter!.connect(this.proximityGain!);
      this.proximityGain!.connect(this.sfxGain);

      this.proximityOsc.start();
    }

    // Частота и громкость зависят от близости
    const freq = 80 + proximity * 200; // 80-280 Hz
    const volume = proximity * 0.25; // 0-0.25
    const filterFreq = 200 + proximity * 1500; // 200-1700 Hz

    this.proximityOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.proximityGain!.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    this.proximityFilter!.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.1);

    // Добавляем вибрато при высокой близости
    if (proximity > 0.6) {
      const vibrato = Math.sin(this.ctx.currentTime * 20) * 20 * proximity;
      this.proximityOsc.frequency.setTargetAtTime(freq + vibrato, this.ctx.currentTime, 0.02);
    }
  }

  /** Взрыв бейнлинга! */
  private playBanelingExplosion(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Мощный низкочастотный взрыв
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();

    boom.type = 'sine';
    boom.frequency.setValueAtTime(100, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.3);

    boomGain.gain.setValueAtTime(0.7, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boomGain.connect(this.reverb!);

    boom.start(now);
    boom.stop(now + 0.5);

    // Звук разбрызгивания кислоты
    const acidNoise = this.createNoise(0.4);
    const acidGain = this.ctx.createGain();
    const acidFilter = this.ctx.createBiquadFilter();
    const acidFilter2 = this.ctx.createBiquadFilter();

    acidFilter.type = 'bandpass';
    acidFilter.frequency.setValueAtTime(3000, now);
    acidFilter.frequency.exponentialRampToValueAtTime(500, now + 0.3);
    acidFilter.Q.value = 3;

    acidFilter2.type = 'highpass';
    acidFilter2.frequency.value = 1000;

    acidGain.gain.setValueAtTime(0.5, now);
    acidGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    acidNoise.connect(acidFilter);
    acidFilter.connect(acidFilter2);
    acidFilter2.connect(acidGain);
    acidGain.connect(this.sfxGain);

    // Булькающий звук
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.04;
      const bubble = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();

      bubble.type = 'sine';
      bubble.frequency.setValueAtTime(400 + Math.random() * 600, now + delay);
      bubble.frequency.exponentialRampToValueAtTime(100 + Math.random() * 100, now + delay + 0.08);

      bubbleGain.gain.setValueAtTime(0.15, now + delay);
      bubbleGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

      bubble.connect(bubbleGain);
      bubbleGain.connect(this.sfxGain);

      bubble.start(now + delay);
      bubble.stop(now + delay + 0.15);
    }

    // Шипение кислоты (затухающее)
    const hiss = this.createNoise(0.8);
    const hissGain = this.ctx.createGain();
    const hissFilter = this.ctx.createBiquadFilter();

    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 4000;

    hissGain.gain.setValueAtTime(0.2, now + 0.1);
    hissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.sfxGain);
  }

  /** Фантом пролетает сквозь игрока */
  private playPhantomPass(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Жуткий низкий свист (доплер эффект)
    const swoosh = this.ctx.createOscillator();
    const swooshGain = this.ctx.createGain();
    const swooshFilter = this.ctx.createBiquadFilter();

    swoosh.type = 'sawtooth';
    // Частота падает как будто пролетает мимо
    swoosh.frequency.setValueAtTime(400, now);
    swoosh.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    swooshFilter.type = 'lowpass';
    swooshFilter.frequency.setValueAtTime(2000, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(300, now + 0.3);
    swooshFilter.Q.value = 2;

    swooshGain.gain.setValueAtTime(0.3, now);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    swoosh.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(this.sfxGain);
    swooshGain.connect(this.reverb!);

    swoosh.start(now);
    swoosh.stop(now + 0.5);

    // Тёмный резонанс
    const dark = this.ctx.createOscillator();
    const darkGain = this.ctx.createGain();

    dark.type = 'sine';
    dark.frequency.setValueAtTime(60, now);
    dark.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    darkGain.gain.setValueAtTime(0.4, now);
    darkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    dark.connect(darkGain);
    darkGain.connect(this.sfxGain);

    dark.start(now);
    dark.stop(now + 0.7);

    // Шёпот/шорох (высокочастотный шум)
    const whisper = this.createNoise(0.3);
    const whisperGain = this.ctx.createGain();
    const whisperFilter = this.ctx.createBiquadFilter();

    whisperFilter.type = 'bandpass';
    whisperFilter.frequency.value = 3000;
    whisperFilter.Q.value = 5;

    whisperGain.gain.setValueAtTime(0.15, now);
    whisperGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    whisper.connect(whisperFilter);
    whisperFilter.connect(whisperGain);
    whisperGain.connect(this.sfxGain);
  }

  /** Звук взмаха катаны - свист + энергия */
  private playKatanaSwing(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Свист (высокочастотный sweep)
    const swoosh = this.ctx.createOscillator();
    const swooshGain = this.ctx.createGain();
    const swooshFilter = this.ctx.createBiquadFilter();

    swoosh.type = 'sawtooth';
    swoosh.frequency.setValueAtTime(2000, now);
    swoosh.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    swooshFilter.type = 'bandpass';
    swooshFilter.frequency.setValueAtTime(3000, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    swooshFilter.Q.value = 2;

    swooshGain.gain.setValueAtTime(0, now);
    swooshGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    swoosh.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(this.sfxGain);
    swooshGain.connect(this.reverb!);

    swoosh.start(now);
    swoosh.stop(now + 0.25);

    // Шум ветра
    const noise = this.createNoise(0.2);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Энергетический удар
    const impact = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();

    impact.type = 'sine';
    impact.frequency.setValueAtTime(150, now + 0.05);
    impact.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    impactGain.gain.setValueAtTime(0, now);
    impactGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    impact.connect(impactGain);
    impactGain.connect(this.sfxGain);

    impact.start(now);
    impact.stop(now + 0.25);
  }

  /** Глитч эффект */
  private playGlitch(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Случайные частоты и длительности
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.03 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
      osc.frequency.value = 100 + Math.random() * 2000;

      filter.type = 'bandpass';
      filter.frequency.value = 500 + Math.random() * 3000;
      filter.Q.value = 5 + Math.random() * 10;

      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.setValueAtTime(0, now + delay + 0.02 + Math.random() * 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      gain.connect(this.reverb!);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    }
  }

  /** Шаг с басовым ударом */
  private playFootstep(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Низкий удар
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();

    kick.type = 'sine';
    kick.frequency.setValueAtTime(80, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    kickGain.gain.setValueAtTime(0.2, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);

    kick.start(now);
    kick.stop(now + 0.12);

    // Шум поверхности
    const noise = this.createNoise(0.06);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 300 + Math.random() * 200;

    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
  }

  /** Прыжок - восходящий синт */
  private playJump(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(155, now);
    osc2.frequency.exponentialRampToValueAtTime(605, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    gain.connect(this.reverb!);

    osc.start(now);
    osc.stop(now + 0.15);
    osc2.start(now);
    osc2.stop(now + 0.15);
  }

  /** Приземление - удар + реверб */
  private playLand(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Тяжёлый удар
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();

    kick.type = 'sine';
    kick.frequency.setValueAtTime(100, now);
    kick.frequency.exponentialRampToValueAtTime(20, now + 0.15);

    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);
    kickGain.connect(this.reverb!);

    kick.start(now);
    kick.stop(now + 0.25);

    // Шум удара
    const noise = this.createNoise(0.15);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;

    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
  }

  /** Убийство врага - ЭПИЧНЫЙ взрыв! */
  private playKill(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Мощный басовый взрыв
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();

    boom.type = 'sine';
    boom.frequency.setValueAtTime(150, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    boomGain.gain.setValueAtTime(0.6, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boomGain.connect(this.reverb!);

    boom.start(now);
    boom.stop(now + 0.6);

    // Восходящий синт (сатисфакция)
    const synth = this.ctx.createOscillator();
    const synth2 = this.ctx.createOscillator();
    const synthGain = this.ctx.createGain();
    const synthFilter = this.ctx.createBiquadFilter();

    synth.type = 'sawtooth';
    synth.frequency.setValueAtTime(200, now);
    synth.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    synth2.type = 'square';
    synth2.frequency.setValueAtTime(203, now);
    synth2.frequency.exponentialRampToValueAtTime(806, now + 0.2);

    synthFilter.type = 'lowpass';
    synthFilter.frequency.setValueAtTime(500, now);
    synthFilter.frequency.exponentialRampToValueAtTime(4000, now + 0.15);
    synthFilter.Q.value = 3;

    synthGain.gain.setValueAtTime(0.25, now);
    synthGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    synth.connect(synthFilter);
    synth2.connect(synthFilter);
    synthFilter.connect(synthGain);
    synthGain.connect(this.sfxGain);
    synthGain.connect(this.reverb!);

    synth.start(now);
    synth.stop(now + 0.35);
    synth2.start(now);
    synth2.stop(now + 0.35);

    // Глитч-хвост
    for (let i = 0; i < 4; i++) {
      const delay = 0.1 + i * 0.05;
      const glitch = this.ctx.createOscillator();
      const glitchGain = this.ctx.createGain();

      glitch.type = 'square';
      glitch.frequency.value = 400 + Math.random() * 1000;

      glitchGain.gain.setValueAtTime(0.1, now + delay);
      glitchGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.03);

      glitch.connect(glitchGain);
      glitchGain.connect(this.distortion!);

      glitch.start(now + delay);
      glitch.stop(now + delay + 0.05);
    }

    // Шум взрыва
    const noise = this.createNoise(0.3);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    noiseFilter.Q.value = 1;

    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
  }

  /** Создать источник шума */
  private createNoise(duration: number): AudioBufferSourceNode {
    if (!this.ctx) throw new Error('AudioContext not initialized');

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.start();

    return source;
  }

  // ==================== SYNTHWAVE МУЗЫКА ====================

  private arpInterval: number | null = null;

  /** Запустить synthwave музыку */
  private startSynthwaveMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // Бас-линия
    this.playBassline();

    // Арпеджио
    this.playArpeggio();

    // Пэд
    this.playPad();

    // Драм-машина
    this.playDrums();
  }

  /** Бас-линия */
  private playBassline(): void {
    if (!this.ctx || !this.musicGain) return;

    const bassNotes = [55, 55, 73.4, 82.4]; // A1, A1, D2, E2
    let noteIndex = 0;

    const playBassNote = () => {
      if (!this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = bassNotes[noteIndex];

      osc2.type = 'square';
      osc2.frequency.value = bassNotes[noteIndex] * 1.005; // Детюн

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(150, now + 0.8);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + 0.9);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 1);
      osc2.start(now);
      osc2.stop(now + 1);

      noteIndex = (noteIndex + 1) % bassNotes.length;

      setTimeout(playBassNote, 1000);
    };

    playBassNote();
  }

  /** Арпеджио */
  private playArpeggio(): void {
    if (!this.ctx || !this.musicGain) return;

    // A minor pentatonic: A, C, D, E, G
    const arpNotes = [440, 523, 587, 659, 784, 659, 587, 523];
    let noteIndex = 0;

    const playArpNote = () => {
      if (!this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const delay = this.ctx.createDelay();
      const delayGain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = arpNotes[noteIndex];

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      // Дилей для глубины
      delay.delayTime.value = 0.25;
      delayGain.gain.value = 0.3;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.musicGain!);
      delayGain.connect(this.reverb!);

      osc.start(now);
      osc.stop(now + 0.15);

      noteIndex = (noteIndex + 1) % arpNotes.length;

      setTimeout(playArpNote, 125); // 16th notes at 120 BPM
    };

    setTimeout(playArpNote, 2000);
  }

  /** Атмосферный пэд */
  private playPad(): void {
    if (!this.ctx || !this.musicGain) return;

    const padChords = [
      [220, 261.6, 329.6], // Am
      [196, 246.9, 293.7], // G
      [174.6, 220, 261.6], // F
      [164.8, 196, 246.9], // Em
    ];
    let chordIndex = 0;

    const playPadChord = () => {
      if (!this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;
      const chord = padChords[chordIndex];

      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        osc2.type = 'triangle';
        osc2.frequency.value = freq * 1.002;

        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        // Медленное нарастание
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 1);
        gain.gain.linearRampToValueAtTime(0.03, now + 3);
        gain.gain.linearRampToValueAtTime(0, now + 4);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        gain.connect(this.reverb!);

        osc.start(now + i * 0.1);
        osc.stop(now + 4.5);
        osc2.start(now + i * 0.1);
        osc2.stop(now + 4.5);
      });

      chordIndex = (chordIndex + 1) % padChords.length;

      setTimeout(playPadChord, 4000);
    };

    setTimeout(playPadChord, 500);
  }

  /** Драм-машина */
  private playDrums(): void {
    if (!this.ctx || !this.musicGain) return;

    let beat = 0;

    const playBeat = () => {
      if (!this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;

      // Кик на 1 и 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, now);
        kick.frequency.exponentialRampToValueAtTime(40, now + 0.1);

        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        kick.connect(kickGain);
        kickGain.connect(this.musicGain!);

        kick.start(now);
        kick.stop(now + 0.2);
      }

      // Снэйр на 2 и 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        const snare = this.createNoise(0.15);
        const snareGain = this.ctx.createGain();
        const snareFilter = this.ctx.createBiquadFilter();

        snareFilter.type = 'highpass';
        snareFilter.frequency.value = 1000;

        snareGain.gain.setValueAtTime(0.15, now);
        snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        snare.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGain!);

        // Тональная часть снэйра
        const snareTone = this.ctx.createOscillator();
        const snareToneGain = this.ctx.createGain();

        snareTone.type = 'triangle';
        snareTone.frequency.value = 180;

        snareToneGain.gain.setValueAtTime(0.1, now);
        snareToneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        snareTone.connect(snareToneGain);
        snareToneGain.connect(this.musicGain!);

        snareTone.start(now);
        snareTone.stop(now + 0.1);
      }

      // Хай-хэт на каждый бит
      const hihat = this.createNoise(0.03);
      const hihatGain = this.ctx.createGain();
      const hihatFilter = this.ctx.createBiquadFilter();

      hihatFilter.type = 'highpass';
      hihatFilter.frequency.value = 8000;

      hihatGain.gain.setValueAtTime(beat % 2 === 0 ? 0.08 : 0.04, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      hihat.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(this.musicGain!);

      beat = (beat + 1) % 16;

      setTimeout(playBeat, 250); // 120 BPM
    };

    setTimeout(playBeat, 1000);
  }

  /** Остановить аудио */
  public stop(): void {
    if (this.arpInterval) {
      clearInterval(this.arpInterval);
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isStarted = false;
  }
}
