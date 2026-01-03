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

    // Мастер громкость (уменьшена в 2 раза)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.compressor);

    // Дисторшн
    this.distortion = this.createDistortion(20);
    this.distortion.connect(this.masterGain);

    // Реверб
    this.reverb = this.createReverb(2.5);
    this.reverb.connect(this.masterGain);

    // Музыка
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.12;
    this.musicGain.connect(this.masterGain);

    // Звуковые эффекты
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.3;
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
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
  }

  /** Громкость (0-1) */
  private volume = 0.5;

  /** Установить громкость */
  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = this.volume;
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
        this.playPhantomPass();
        break;
      case 'runner_hit':
        this.playRunnerHit();
        break;
      case 'hopper_hit':
        this.playHopperHit();
        break;
      case 'kill':
        this.playKill();
        break;
      case 'katana_swing':
        this.playKatanaSwing();
        break;
      case 'splash_wave':
        this.playSplashWave();
        break;
      case 'charge_pickup':
        this.playChargePickup();
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

  /** Runner врезался - быстрый огненный удар */
  private playRunnerHit(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Быстрый свист
    const swoosh = this.ctx.createOscillator();
    const swooshGain = this.ctx.createGain();

    swoosh.type = 'sawtooth';
    swoosh.frequency.setValueAtTime(800, now);
    swoosh.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    swooshGain.gain.setValueAtTime(0.3, now);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    swoosh.connect(swooshGain);
    swooshGain.connect(this.sfxGain);

    swoosh.start(now);
    swoosh.stop(now + 0.25);

    // Огненный треск
    for (let i = 0; i < 4; i++) {
      const crackle = this.ctx.createOscillator();
      const crackleGain = this.ctx.createGain();

      crackle.type = 'square';
      crackle.frequency.value = 1000 + Math.random() * 2000;

      const t = now + i * 0.03;
      crackleGain.gain.setValueAtTime(0.15, t);
      crackleGain.gain.setValueAtTime(0, t + 0.02);

      crackle.connect(crackleGain);
      crackleGain.connect(this.sfxGain);

      crackle.start(t);
      crackle.stop(t + 0.03);
    }

    // Низкий удар
    const impact = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();

    impact.type = 'sine';
    impact.frequency.setValueAtTime(120, now);
    impact.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    impactGain.gain.setValueAtTime(0.4, now);
    impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    impact.connect(impactGain);
    impactGain.connect(this.sfxGain);

    impact.start(now);
    impact.stop(now + 0.25);
  }

  /** Hopper приземлился на игрока - электрический удар сверху */
  private playHopperHit(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Электрический разряд (высокий → низкий)
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    const zapFilter = this.ctx.createBiquadFilter();

    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(2000, now);
    zap.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    zapFilter.type = 'bandpass';
    zapFilter.frequency.value = 1500;
    zapFilter.Q.value = 3;

    zapGain.gain.setValueAtTime(0.35, now);
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    zap.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(this.sfxGain);
    zapGain.connect(this.reverb!);

    zap.start(now);
    zap.stop(now + 0.3);

    // Тяжёлый удар сверху
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();

    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now + 0.05);
    thud.frequency.exponentialRampToValueAtTime(25, now + 0.3);

    thudGain.gain.setValueAtTime(0.5, now + 0.05);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);

    thud.start(now + 0.05);
    thud.stop(now + 0.4);

    // Искры (шум)
    const sparks = this.createNoise(0.25);
    const sparksGain = this.ctx.createGain();
    const sparksFilter = this.ctx.createBiquadFilter();

    sparksFilter.type = 'highpass';
    sparksFilter.frequency.value = 3000;

    sparksGain.gain.setValueAtTime(0.2, now);
    sparksGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    sparks.connect(sparksFilter);
    sparksFilter.connect(sparksGain);
    sparksGain.connect(this.sfxGain);
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

  /** Взмах катаной */
  private playKatanaSwing(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Свист лезвия
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    const whooshFilter = this.ctx.createBiquadFilter();

    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(600, now);
    whoosh.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.setValueAtTime(800, now);
    whooshFilter.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    whooshFilter.Q.value = 4;

    whooshGain.gain.setValueAtTime(0.25, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.sfxGain);

    whoosh.start(now);
    whoosh.stop(now + 0.2);

    // Лёгкий металлический звон
    const metal = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();

    metal.type = 'sine';
    metal.frequency.value = 1800;

    metalGain.gain.setValueAtTime(0.08, now + 0.03);
    metalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    metal.connect(metalGain);
    metalGain.connect(this.sfxGain);

    metal.start(now + 0.03);
    metal.stop(now + 0.15);
  }

  /** Сплеш-волна энергии - МОЩНАЯ! */
  private playSplashWave(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Волна энергии - нарастает и расходится
    const wave = this.ctx.createOscillator();
    const waveGain = this.ctx.createGain();
    const waveFilter = this.ctx.createBiquadFilter();

    wave.type = 'sawtooth';
    wave.frequency.setValueAtTime(200, now);
    wave.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(2000, now);
    waveFilter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    waveFilter.Q.value = 10;

    waveGain.gain.setValueAtTime(0.5, now);
    waveGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    wave.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(this.sfxGain);
    waveGain.connect(this.reverb!);

    wave.start(now);
    wave.stop(now + 0.5);

    // Электрический треск
    const noiseSource = this.createNoise(0.3);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 5;

    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Высокий тон резонанса
    const resonance = this.ctx.createOscillator();
    const resonanceGain = this.ctx.createGain();

    resonance.type = 'sine';
    resonance.frequency.setValueAtTime(800, now);
    resonance.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    resonanceGain.gain.setValueAtTime(0.15, now);
    resonanceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    resonance.connect(resonanceGain);
    resonanceGain.connect(this.sfxGain);

    resonance.start(now);
    resonance.stop(now + 0.4);

    // Суб-бас удар
    const subBass = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subBass.type = 'sine';
    subBass.frequency.setValueAtTime(60, now);
    subBass.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    subBass.connect(subGain);
    subGain.connect(this.sfxGain);

    subBass.start(now);
    subBass.stop(now + 0.45);
  }

  /** Подбор заряда катаны - электрический эффект */
  private playChargePickup(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Нарастающий электрический звук
    const charge = this.ctx.createOscillator();
    const charge2 = this.ctx.createOscillator();
    const chargeGain = this.ctx.createGain();
    const chargeFilter = this.ctx.createBiquadFilter();

    charge.type = 'sawtooth';
    charge.frequency.setValueAtTime(150, now);
    charge.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    charge2.type = 'square';
    charge2.frequency.setValueAtTime(152, now);
    charge2.frequency.exponentialRampToValueAtTime(810, now + 0.3);

    chargeFilter.type = 'bandpass';
    chargeFilter.frequency.setValueAtTime(500, now);
    chargeFilter.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
    chargeFilter.Q.value = 8;

    chargeGain.gain.setValueAtTime(0.15, now);
    chargeGain.gain.linearRampToValueAtTime(0.35, now + 0.2);
    chargeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    charge.connect(chargeFilter);
    charge2.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(this.sfxGain);
    chargeGain.connect(this.reverb!);

    charge.start(now);
    charge.stop(now + 0.5);
    charge2.start(now);
    charge2.stop(now + 0.5);

    // Высокий блеск энергии
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();

    shimmer.type = 'sine';
    shimmer.frequency.value = 2500;

    shimmerGain.gain.setValueAtTime(0.12, now + 0.15);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.reverb!);

    shimmer.start(now + 0.15);
    shimmer.stop(now + 0.55);

    // Электрический треск
    const noiseSource2 = this.createNoise(0.2);
    const noiseGain2 = this.ctx.createGain();
    const noiseFilter2 = this.ctx.createBiquadFilter();

    noiseFilter2.type = 'highpass';
    noiseFilter2.frequency.value = 4000;

    noiseGain2.gain.setValueAtTime(0.1, now + 0.1);
    noiseGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noiseSource2.connect(noiseFilter2);
    noiseFilter2.connect(noiseGain2);
    noiseGain2.connect(this.sfxGain);
  }

  // ==================== SYNTHWAVE МУЗЫКА ====================

  private arpInterval: number | null = null;

  /** Текущий режим музыки */
  private currentMusicMode: 'normal' | 'low_hp' | 'boss_green' | 'boss_black' | 'boss_blue' = 'normal';
  
  /** Интервалы музыки для остановки */
  private musicIntervals: number[] = [];

  /** Флаг тревожного режима */
  private isLowHpMode = false;

  /** Текущая эпоха (1-3) */
  private currentEra = 1;

  /** Звук дождя и грома */
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private isRainPlaying = false;
  private thunderInterval: number | null = null;

  /** Установить эпоху музыки */
  public setEra(wave: number): void {
    let newEra = 1;
    if (wave > 10) newEra = 3;
    else if (wave > 5) newEra = 2;

    // Включаем дождь на волне 15+
    if (wave >= 15 && !this.isRainPlaying) {
      this.startRain();
    } else if (wave < 15 && this.isRainPlaying) {
      this.stopRain();
    }

    if (newEra !== this.currentEra && this.currentMusicMode === 'normal') {
      this.currentEra = newEra;
      // Перезапускаем музыку для новой эпохи
      for (const interval of this.musicIntervals) {
        clearInterval(interval);
        clearTimeout(interval);
      }
      this.musicIntervals = [];
      this.startSynthwaveMusic();
    } else {
      this.currentEra = newEra;
    }
  }

  /** Запуск звука дождя */
  private startRain(): void {
    if (!this.ctx || !this.masterGain || this.isRainPlaying) return;

    this.isRainPlaying = true;

    // Создаём gain для дождя
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.masterGain);

    // Создаём буфер с шумом дождя (белый шум + фильтр)
    const sampleRate = this.ctx.sampleRate;
    const duration = 4; // 4 секунды зациклированного шума
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    // Заполняем буфер шумом капель
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // Базовый шум
        let sample = (Math.random() * 2 - 1) * 0.3;
        
        // Добавляем случайные "капли" - короткие щелчки
        if (Math.random() < 0.001) {
          sample += (Math.random() * 2 - 1) * 0.8;
        }
        
        // Добавляем низкочастотный гул ветра
        sample += Math.sin(i / sampleRate * 2 * Math.PI * 0.5) * 0.05;
        
        data[i] = sample;
      }
    }

    // Создаём источник
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    // Низкочастотный фильтр для реалистичного звука дождя
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000;
    lowpass.Q.value = 0.5;

    // Highpass для убирания низкого гула
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;
    highpass.Q.value = 0.5;

    this.rainSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.rainGain);

    this.rainSource.start();

    // Плавное нарастание громкости
    this.rainGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 2);

    // Запускаем периодические раскаты грома
    this.startThunder();
  }

  /** Запуск звуков грома */
  private startThunder(): void {
    if (!this.ctx || !this.masterGain) return;

    const playThunder = () => {
      if (!this.ctx || !this.masterGain || !this.isRainPlaying) return;

      const now = this.ctx.currentTime;

      // Создаём gain для грома
      const thunderGain = this.ctx.createGain();
      thunderGain.gain.value = 0;
      thunderGain.connect(this.masterGain);

      // === НИЗКИЙ РАСКАТ ГРОМА ===
      // Шум для грома
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.8));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Низкочастотный фильтр для грома
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 150 + Math.random() * 100;
      lowpass.Q.value = 1;

      noiseSource.connect(lowpass);
      lowpass.connect(thunderGain);

      // === ТРЕСК МОЛНИИ ===
      const crackOsc = this.ctx.createOscillator();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.value = 80 + Math.random() * 40;

      const crackGain = this.ctx.createGain();
      crackGain.gain.value = 0;

      const crackFilter = this.ctx.createBiquadFilter();
      crackFilter.type = 'bandpass';
      crackFilter.frequency.value = 2000;
      crackFilter.Q.value = 2;

      crackOsc.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(thunderGain);

      // Огибающая грома - нарастание и долгий спад
      thunderGain.gain.setValueAtTime(0, now);
      thunderGain.gain.linearRampToValueAtTime(0.6, now + 0.1);
      thunderGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

      // Огибающая треска - короткий резкий
      crackGain.gain.setValueAtTime(0, now);
      crackGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noiseSource.start(now);
      crackOsc.start(now);
      noiseSource.stop(now + 3);
      crackOsc.stop(now + 0.3);
    };

    // Первый гром через 2-4 секунды
    setTimeout(playThunder, 2000 + Math.random() * 2000);

    // Периодические раскаты каждые 3-6 секунд
    this.thunderInterval = setInterval(() => {
      if (this.isRainPlaying) {
        playThunder();
      }
    }, 3000 + Math.random() * 3000) as unknown as number;
  }

  /** Остановка звука дождя */
  private stopRain(): void {
    if (!this.ctx || !this.isRainPlaying) return;

    this.isRainPlaying = false;

    // Останавливаем грозу
    if (this.thunderInterval) {
      clearInterval(this.thunderInterval);
      this.thunderInterval = null;
    }

    // Плавное затухание
    if (this.rainGain) {
      this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }

    // Останавливаем источник через секунду
    setTimeout(() => {
      if (this.rainSource) {
        try {
          this.rainSource.stop();
        } catch (e) {
          // Уже остановлен
        }
        this.rainSource = null;
      }
      this.rainGain = null;
    }, 1100);
  }

  /** Запустить synthwave музыку */
  private startSynthwaveMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    switch (this.currentEra) {
      case 1:
        this.playEra1Music(); // Кислотная
        break;
      case 2:
        this.playEra2Music(); // Чёрная дыра
        break;
      case 3:
        this.playEra3Music(); // Космическая
        break;
    }
  }

  /** ЭПОХА 1: Кислотная (волны 1-5) */
  private playEra1Music(): void {
    if (!this.ctx || !this.musicGain) return;

    // Агрессивный acid бас
    const bassNotes = [55, 55, 73.4, 55, 82.4, 55, 73.4, 65.4];
    let noteIndex = 0;

    const playBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 1) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = bassNotes[noteIndex];

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      filter.Q.value = 10;

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.3);

      noteIndex = (noteIndex + 1) % bassNotes.length;
    };

    this.musicIntervals.push(setInterval(playBass, 250) as unknown as number);

    // Кислотное арпеджио
    const arpNotes = [220, 277, 330, 440, 330, 277];
    let arpIndex = 0;

    const playArp = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 1) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = arpNotes[arpIndex];

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.12);

      arpIndex = (arpIndex + 1) % arpNotes.length;
    };

    this.musicIntervals.push(setInterval(playArp, 125) as unknown as number);

    // Кик
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 1) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.15);
    };

    this.musicIntervals.push(setInterval(playKick, 500) as unknown as number);
  }

  /** ЭПОХА 2: Чёрная дыра (волны 6-10) */
  private playEra2Music(): void {
    if (!this.ctx || !this.musicGain) return;

    // Глубокий мрачный дрон
    const playDrone = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 2) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = 41; // E1 - очень низкий

      osc2.type = 'triangle';
      osc2.frequency.value = 41.2; // Биения

      lfo.type = 'sine';
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 20;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.value = 150;

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 4);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      lfo.start(now);
      osc.start(now);
      osc2.start(now);
      lfo.stop(now + 4);
      osc.stop(now + 4);
      osc2.stop(now + 4);
    };

    playDrone();
    this.musicIntervals.push(setInterval(playDrone, 4000) as unknown as number);

    // Медленный тяжёлый бит
    let beat = 0;
    const playBeat = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 2) return;

      const now = this.ctx.currentTime;

      if (beat % 2 === 0) {
        // Глухой удар
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.4);
      }

      beat++;
    };

    this.musicIntervals.push(setInterval(playBeat, 600) as unknown as number);

    // Жуткие высокие тона
    const playEerie = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 2) return;

      const now = this.ctx.currentTime;
      const freq = 600 + Math.random() * 400;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      gain.gain.linearRampToValueAtTime(0, now + 2);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 2);
    };

    this.musicIntervals.push(setInterval(playEerie, 3000 + Math.random() * 2000) as unknown as number);

    // Гравитационный шум
    const playGravity = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 2) return;

      const now = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      noise.start(now);
      noise.stop(now + 0.5);
    };

    this.musicIntervals.push(setInterval(playGravity, 1500) as unknown as number);
  }

  /** ЭПОХА 3: Космическая технологическая (волны 11-15) */
  private playEra3Music(): void {
    if (!this.ctx || !this.musicGain) return;

    // Быстрый синтвейв бас
    const bassNotes = [110, 110, 146.8, 110, 130.8, 110, 164.8, 146.8];
    let noteIndex = 0;

    const playBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 3) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = bassNotes[noteIndex];

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.22);

      noteIndex = (noteIndex + 1) % bassNotes.length;
    };

    this.musicIntervals.push(setInterval(playBass, 200) as unknown as number);

    // Космическое арпеджио (высокое)
    const arpNotes = [880, 1046, 1318, 1760, 1318, 1046, 880, 659];
    let arpIndex = 0;

    const playArp = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 3) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const delayGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = arpNotes[arpIndex];

      delay.delayTime.value = 0.15;
      delayGain.gain.value = 0.3;

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      osc.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.musicGain!);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.12);

      arpIndex = (arpIndex + 1) % arpNotes.length;
    };

    this.musicIntervals.push(setInterval(playArp, 100) as unknown as number);

    // Техно кик
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 3) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.12);
    };

    this.musicIntervals.push(setInterval(playKick, 400) as unknown as number);

    // Космический пэд
    const playPad = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 3) return;

      const now = this.ctx.currentTime;
      const chord = [220, 277, 330, 440]; // Am7

      for (const freq of chord) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
        gain.gain.linearRampToValueAtTime(0.02, now + 2);
        gain.gain.linearRampToValueAtTime(0, now + 3);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 3.5);
      }
    };

    playPad();
    this.musicIntervals.push(setInterval(playPad, 4000) as unknown as number);

    // Электрические разряды
    const playZap = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal' || this.currentEra !== 3) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1500 + Math.random() * 1000, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.1);
    };

    this.musicIntervals.push(setInterval(playZap, 800 + Math.random() * 600) as unknown as number);
  }

  /** Включить/выключить режим низкого HP */
  public setLowHpMode(enabled: boolean): void {
    if (!this.ctx || !this.musicGain) return;
    
    // Не переключаем если сейчас босс
    if (this.currentMusicMode !== 'normal' && this.currentMusicMode !== 'low_hp') return;
    
    if (enabled && !this.isLowHpMode) {
      // Включаем тревожный режим
      this.isLowHpMode = true;
      this.currentMusicMode = 'low_hp';
      
      // Останавливаем обычную музыку
      for (const interval of this.musicIntervals) {
        clearInterval(interval);
        clearTimeout(interval);
      }
      this.musicIntervals = [];
      
      this.playLowHpMusic();
      
    } else if (!enabled && this.isLowHpMode) {
      // Выключаем тревожный режим
      this.isLowHpMode = false;
      this.currentMusicMode = 'normal';
      
      // Останавливаем тревожную музыку
      for (const interval of this.musicIntervals) {
        clearInterval(interval);
        clearTimeout(interval);
      }
      this.musicIntervals = [];
      
      this.startSynthwaveMusic();
    }
  }

  /** Тревожная музыка при низком HP */
  private playLowHpMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // === ТРЕВОЖНЫЙ ПУЛЬС ===
    const playHeartbeat = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'low_hp') return;

      const now = this.ctx.currentTime;

      // Двойной удар сердца
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 40;

        const offset = i * 0.15;
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      }
    };

    this.musicIntervals.push(setInterval(playHeartbeat, 800) as unknown as number);

    // === ТРЕВОЖНЫЙ ДРОН ===
    const playDrone = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'low_hp') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Низкий тревожный тон
      osc.type = 'sawtooth';
      osc.frequency.value = 55;

      osc2.type = 'sawtooth';
      osc2.frequency.value = 55.5; // Биения для тревожности

      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 1);
      gain.gain.linearRampToValueAtTime(0.05, now + 2);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 2.5);
      osc2.start(now);
      osc2.stop(now + 2.5);
    };

    playDrone();
    this.musicIntervals.push(setInterval(playDrone, 2500) as unknown as number);

    // === ИСКРЫ ===
    const playSpark = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'low_hp') return;

      const now = this.ctx.currentTime;

      // Случайные искры
      const sparkCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < sparkCount; i++) {
        const bufferSize = Math.floor(this.ctx.sampleRate * (0.02 + Math.random() * 0.03));
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000 + Math.random() * 5000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05 + Math.random() * 0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        noise.start(now + i * 0.05);
        noise.stop(now + i * 0.05 + 0.05);
      }
    };

    this.musicIntervals.push(setInterval(playSpark, 500 + Math.random() * 500) as unknown as number);

    // === ТРЕВОЖНЫЕ НОТЫ ===
    const playWarning = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'low_hp') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      // Тревожная секунда (минорный интервал)
      const notes = [220, 233.1]; // A3, Bb3
      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.value = note;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.5);
    };

    this.musicIntervals.push(setInterval(playWarning, 1500 + Math.random() * 1000) as unknown as number);

    // === СТАТИЧЕСКИЕ ПОМЕХИ ===
    const playStatic = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'low_hp') return;

      const now = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        // Прерывистый шум
        data[i] = Math.random() > 0.7 ? (Math.random() * 2 - 1) * 0.5 : 0;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 3;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      noise.start(now);
      noise.stop(now + 0.1);
    };

    this.musicIntervals.push(setInterval(playStatic, 300 + Math.random() * 400) as unknown as number);
  }

  /** Фаза Зелёного Босса */
  private bossGreenPhase = 1;

  /** Переключить музыку для босса */
  public setBossMusic(bossType: 'boss_green' | 'boss_black' | 'boss_blue' | null): void {
    if (!this.ctx || !this.musicGain) return;

    // Останавливаем все текущие интервалы
    for (const interval of this.musicIntervals) {
      clearInterval(interval);
      clearTimeout(interval);
    }
    this.musicIntervals = [];
    this.bossGreenPhase = 1; // Сброс фазы

    if (bossType === null) {
      // Обычная музыка
      this.currentMusicMode = 'normal';
      this.startSynthwaveMusic();
    } else {
      this.currentMusicMode = bossType;
      
      switch (bossType) {
        case 'boss_green':
          this.playBossGreenMusic();
          break;
        case 'boss_black':
          this.playBossBlackMusic();
          break;
        case 'boss_blue':
          this.playBossBlueMusic();
          break;
      }
    }
  }

  /** Переход в фазу 2 для Зелёного Босса - добавляем БОЧКУ! */
  public setBossGreenPhase2(): void {
    if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;
    if (this.bossGreenPhase === 2) return; // Уже во второй фазе

    this.bossGreenPhase = 2;

    // === ТЯЖЁЛАЯ БОЧКА (808 стиль) ===
    const playHeavyKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      // Основной кик
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const distortion = this.ctx.createWaveShaper();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(100, now);
      osc2.frequency.exponentialRampToValueAtTime(20, now + 0.2);

      // Дисторшн для грязи
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 5);
      }
      distortion.curve = curve;

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(distortion);
      osc2.connect(distortion);
      distortion.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.25);
      osc2.start(now);
      osc2.stop(now + 0.25);
    };

    // Тяжёлая бочка на каждую восьмую - агрессивнее!
    this.musicIntervals.push(setInterval(playHeavyKick, 207) as unknown as number);

    // === СИРЕНА ТРЕВОГИ ===
    const playAlarm = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.2);
      osc.frequency.linearRampToValueAtTime(600, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
      gain.gain.linearRampToValueAtTime(0.0, now + 0.4);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.4);
    };

    // Сирена каждые 2 секунды
    this.musicIntervals.push(setInterval(playAlarm, 2000) as unknown as number);
  }

  /** Музыка Зелёного Босса - КИСЛОТНОЕ ТЕХНО (Acid Techno) */
  private playBossGreenMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // === TB-303 ACID BASSLINE ===
    // Классические кислотные ноты
    const acidNotes = [55, 55, 82.4, 55, 73.4, 55, 98, 73.4]; // A1, A1, E2, A1, D2, A1, G2, D2
    let noteIndex = 0;
    let filterMod = 0;

    const playAcidBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      const distortion = this.ctx.createWaveShaper();

      // Классический 303 sawtooth
      osc.type = 'sawtooth';
      osc.frequency.value = acidNotes[noteIndex];

      // КИСЛОТНЫЙ ФИЛЬТР - высокий резонанс!
      filter.type = 'lowpass';
      filter.Q.value = 15; // Высокий резонанс для "квакающего" звука
      
      // Модуляция фильтра - главная фишка acid
      const filterBase = 200 + Math.sin(filterMod) * 150;
      filter.frequency.setValueAtTime(filterBase, now);
      filter.frequency.exponentialRampToValueAtTime(800 + Math.random() * 600, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(filterBase * 0.5, now + 0.15);

      // Дисторшн для грязи
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 4);
      }
      distortion.curve = curve;

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(filter);
      filter.connect(distortion);
      distortion.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.2);

      noteIndex = (noteIndex + 1) % acidNotes.length;
      filterMod += 0.3;
    };

    // 145 BPM - быстрый acid темп
    this.musicIntervals.push(setInterval(playAcidBass, 103) as unknown as number);

    // === ТЕХНО КИК ===
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.2);
    };

    // Кик на каждую четверть
    this.musicIntervals.push(setInterval(playKick, 414) as unknown as number);

    // === ХАЙХЭТ ===
    const playHihat = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      noise.start(now);
      noise.stop(now + 0.05);
    };

    // Хайхэт на каждую восьмую
    this.musicIntervals.push(setInterval(playHihat, 207) as unknown as number);

    // === КИСЛОТНЫЙ СКРИМ (acid scream) ===
    const playAcidScream = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 + Math.random() * 100, now);
      osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 400, now + 0.3);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
      filter.Q.value = 10;

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.4);
    };

    // Скрим каждые 2 такта
    this.musicIntervals.push(setInterval(playAcidScream, 1656) as unknown as number);
  }

  /** Музыка Чёрного Босса - Deep Techno */
  private playBossBlackMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // === DEEP KICK (126 BPM) ===
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      // Основной глубокий кик
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      // Sub-bass слой
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(60, now);
      osc2.frequency.exponentialRampToValueAtTime(25, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.25);
      osc2.start(now);
      osc2.stop(now + 0.3);
    };

    // Кик на каждую четверть (126 BPM = ~476ms)
    this.musicIntervals.push(setInterval(playKick, 476) as unknown as number);

    // === ГЛУБОКИЙ БАС ===
    const bassNotes = [36.7, 36.7, 41.2, 36.7, 32.7, 36.7, 41.2, 43.6]; // D1 прогрессия
    let bassIndex = 0;

    const playBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = bassNotes[bassIndex];

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.5);

      bassIndex = (bassIndex + 1) % bassNotes.length;
    };

    this.musicIntervals.push(setInterval(playBass, 476) as unknown as number);

    // === ХАЙХЭТЫ (закрытые) ===
    let hihatCounter = 0;
    const playHihat = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      // Шум для хайхэта
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;

      const gain = this.ctx.createGain();
      // Акцент на offbeat
      const vol = hihatCounter % 2 === 1 ? 0.08 : 0.04;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      noise.start(now);
      noise.stop(now + 0.05);

      hihatCounter++;
    };

    this.musicIntervals.push(setInterval(playHihat, 119) as unknown as number);

    // === ГИПНОТИЧЕСКИЙ ПЭД ===
    const playPad = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;
      const chord = [73.4, 87.3, 110, 146.8]; // Dm минорный аккорд

      for (const freq of chord) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 1);
        gain.gain.linearRampToValueAtTime(0.02, now + 3);
        gain.gain.linearRampToValueAtTime(0, now + 4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 4.5);
      }
    };

    playPad();
    this.musicIntervals.push(setInterval(playPad, 7616) as unknown as number); // 16 тактов

    // === РЕЙВ СТАБ (редкий) ===
    const playStab = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;
      if (Math.random() > 0.3) return; // Только 30% шанс

      const now = this.ctx.currentTime;
      const notes = [146.8, 174.6, 220]; // D3, F3, A3

      for (const freq of notes) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.12);
      }
    };

    this.musicIntervals.push(setInterval(playStab, 1904) as unknown as number); // Каждые 4 такта

    // === ТЁМНАЯ АТМОСФЕРА ===
    const playAtmosphere = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      // Низкий rumble
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 30;

      lfo.type = 'sine';
      lfo.frequency.value = 0.5;
      lfoGain.gain.value = 10;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.value = 80;

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 3);
      gain.gain.linearRampToValueAtTime(0, now + 4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 4);
      osc.stop(now + 4);
    };

    playAtmosphere();
    this.musicIntervals.push(setInterval(playAtmosphere, 4000) as unknown as number);

    // === КОСМИЧЕСКИЙ ЭФФЕКТ ===
    const playVoid = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 2);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 2);
    };

    this.musicIntervals.push(setInterval(playVoid, 2000 + Math.random() * 1000) as unknown as number);
  }

  /** Музыка Синего Босса - быстрый электронный бит */
  private playBossBlueMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // Быстрый синтезаторный бас
    const bassNotes = [110, 110, 146.8, 164.8, 110, 130.8, 146.8, 110]; // Быстрая прогрессия
    let noteIndex = 0;

    const playBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_blue') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.value = bassNotes[noteIndex];

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.25);

      noteIndex = (noteIndex + 1) % bassNotes.length;
    };

    this.musicIntervals.push(setInterval(playBass, 250) as unknown as number);

    // Быстрое арпеджио
    const arpNotes = [880, 1046, 1318, 1567, 1318, 1046];
    let arpIndex = 0;

    const playArp = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_blue') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = arpNotes[arpIndex];

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.12);

      arpIndex = (arpIndex + 1) % arpNotes.length;
    };

    this.musicIntervals.push(setInterval(playArp, 125) as unknown as number);

    // Электрические разряды
    const playZap = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_blue') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.15);
    };

    this.musicIntervals.push(setInterval(playZap, 500 + Math.random() * 300) as unknown as number);

    // Быстрые удары
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_blue') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.15);
    };

    this.musicIntervals.push(setInterval(playKick, 500) as unknown as number);
  }

  /** Бас-линия */
  private playBassline(): void {
    if (!this.ctx || !this.musicGain) return;

    const bassNotes = [55, 55, 73.4, 82.4]; // A1, A1, D2, E2
    let noteIndex = 0;

    const playBassNote = () => {
      // Останавливаем если переключились на босса
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal') return;

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
      // Останавливаем если переключились на босса
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal') return;

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
      // Останавливаем если переключились на босса
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal') return;

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
      // Останавливаем если переключились на босса
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'normal') return;

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
