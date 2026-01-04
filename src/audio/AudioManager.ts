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
  
  // Войд фильтр (low pass + pitch shift)
  private voidFilter: BiquadFilterNode | null = null;
  private isInVoidMode = false;

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
    
    // Войд фильтр (low pass для приглушённого звука)
    this.voidFilter = this.ctx.createBiquadFilter();
    this.voidFilter.type = 'lowpass';
    this.voidFilter.frequency.value = 20000; // Выключен по умолчанию (полный диапазон)
    this.voidFilter.Q.value = 1.0;
    
    // Вставляем фильтр перед мастером
    this.musicGain.disconnect();
    this.sfxGain.disconnect();
    this.musicGain.connect(this.voidFilter);
    this.sfxGain.connect(this.voidFilter);
    this.voidFilter.connect(this.distortion);

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

  /** Войти в войд режим - глубокий low pass фильтр */
  public enterVoidAudio(): void {
    if (!this.ctx || !this.voidFilter || this.isInVoidMode) return;
    
    this.isInVoidMode = true;
    const now = this.ctx.currentTime;
    
    // Плавно опускаем частоту фильтра для "подводного" эффекта
    this.voidFilter.frequency.cancelScheduledValues(now);
    this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value, now);
    this.voidFilter.frequency.exponentialRampToValueAtTime(400, now + 0.5); // Низкий cutoff
    
    // Увеличиваем резонанс для глубины
    this.voidFilter.Q.cancelScheduledValues(now);
    this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value, now);
    this.voidFilter.Q.linearRampToValueAtTime(4.0, now + 0.5);
    
    // Понижаем громкость музыки
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    }
  }

  /** Выйти из войд режима - убираем фильтр */
  public exitVoidAudio(): void {
    if (!this.ctx || !this.voidFilter || !this.isInVoidMode) return;
    
    this.isInVoidMode = false;
    const now = this.ctx.currentTime;
    
    // Возвращаем фильтр в норму
    this.voidFilter.frequency.cancelScheduledValues(now);
    this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value, now);
    this.voidFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.3);
    
    this.voidFilter.Q.cancelScheduledValues(now);
    this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value, now);
    this.voidFilter.Q.linearRampToValueAtTime(1.0, now + 0.3);
    
    // Возвращаем громкость музыки
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
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
      case 'acid_spit':
        this.playAcidSpit();
        break;
      case 'void_whistle':
        this.playVoidWhistle();
        break;
      case 'phantom_hit':
        this.playPhantomHit();
        break;
      case 'player_hurt':
        this.playPlayerHurt();
        break;
      case 'spiker_scream':
        this.playSpikerScream();
        break;
      case 'spiker_shoot':
        this.playSpikerShoot();
        break;
      case 'explosion':
        this.playExplosion();
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

  /** Таймеры для звуков приближения каждого типа врага */
  private enemySoundCooldowns: Map<string, number> = new Map();

  /** Звук приближения врага определённого типа */
  public playEnemyProximitySound(enemyType: string, distance: number): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    if (distance > 15) return; // Дистанция 15 - слышно издалека

    // Кулдаун для каждого типа врага
    const now = Date.now();
    const lastPlayed = this.enemySoundCooldowns.get(enemyType) || 0;
    const cooldown = enemyType.startsWith('boss') ? 800 : 500; // Реже чтобы не спамить
    if (now - lastPlayed < cooldown) return;
    this.enemySoundCooldowns.set(enemyType, now);

    const volume = Math.max(0.2, (15 - distance) / 15) * 0.8; // Громче!
    const ctxNow = this.ctx.currentTime;

    switch (enemyType) {
      case 'baneling':
        this.playBanelingProximity(volume, ctxNow);
        break;
      case 'phantom':
        this.playPhantomProximity(volume, ctxNow);
        break;
      case 'runner':
        this.playRunnerProximity(volume, ctxNow);
        break;
      case 'hopper':
        this.playHopperProximity(volume, ctxNow);
        break;
      case 'boss_green':
        this.playBossGreenProximity(volume, ctxNow);
        break;
      case 'boss_black':
        this.playBossBlackProximity(volume, ctxNow);
        break;
      case 'boss_blue':
        this.playBossBlueProximity(volume, ctxNow);
        break;
    }
  }

  /** Baneling - булькающий кислотный звук */
  private playBanelingProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // Булькание
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Случайные "буль-буль"
    osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
    osc.frequency.setValueAtTime(100 + Math.random() * 30, now + 0.05);
    osc.frequency.setValueAtTime(180 + Math.random() * 40, now + 0.1);

    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 8;

    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Phantom - жуткий шёпот/завывание */
  private playPhantomProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // Жуткий шёпот
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.linearRampToValueAtTime(150, now + 0.3);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(203, now); // Лёгкая расстройка = биение
    osc2.frequency.linearRampToValueAtTime(148, now + 0.3);

    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
  }

  /** Runner - быстрое шуршание/топот */
  private playRunnerProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // Быстрый топот
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 40, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.03);

      gain.gain.setValueAtTime(vol * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  /** Hopper - пружинистый звук прыжка */
  private playHopperProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Пружина вверх
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(vol * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Boss Green - зловещий шёпот */
  private playBossGreenProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // === ЗЛОВЕЩИЙ ШЁПОТ ===
    // Основа - фильтрованный шум (шипящие согласные)
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Модуляция амплитуды для имитации слогов шёпота
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      // "Слоги" шёпота - прерывистость
      const syllable = Math.sin(t * 12) * 0.5 + 0.5;
      const envelope = Math.sin(t * Math.PI / 0.5) * syllable;
      data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Фильтр для "шипящего" шёпота (2-6 кГц)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 1.5;

    // Второй фильтр - убираем низы
    const hipass = this.ctx.createBiquadFilter();
    hipass.type = 'highpass';
    hipass.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.05);
    gain.gain.setValueAtTime(vol * 0.6, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(hipass);
    hipass.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.55);

    // Низкий "потусторонний" тон под шёпотом
    const tone = this.ctx.createOscillator();
    const tone2 = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    const toneFilter = this.ctx.createBiquadFilter();

    // Два слегка расстроенных тона для "биения"
    tone.type = 'sine';
    tone.frequency.value = 85;
    tone2.type = 'sine';
    tone2.frequency.value = 87; // Лёгкая расстройка = жуткое биение

    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 150;

    toneGain.gain.setValueAtTime(vol * 0.15, now);
    toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    tone.connect(toneFilter);
    tone2.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(this.sfxGain);

    tone.start(now);
    tone2.start(now);
    tone.stop(now + 0.55);
    tone2.stop(now + 0.55);

    // Случайный "вздох" (скользящий тон)
    if (Math.random() > 0.5) {
      const sigh = this.ctx.createOscillator();
      const sighGain = this.ctx.createGain();
      
      sigh.type = 'sine';
      sigh.frequency.setValueAtTime(300, now + 0.1);
      sigh.frequency.exponentialRampToValueAtTime(150, now + 0.4);
      
      sighGain.gain.setValueAtTime(vol * 0.08, now + 0.1);
      sighGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      sigh.connect(sighGain);
      sighGain.connect(this.sfxGain);
      
      sigh.start(now + 0.1);
      sigh.stop(now + 0.45);
    }
  }

  /** Boss Black - гулкий низкий гул искривления */
  private playBossBlackProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // Гулкий гул
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(40, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(42, now); // Биение

    filter.type = 'lowpass';
    filter.frequency.value = 100;
    filter.Q.value = 10;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.45);
    osc2.start(now);
    osc2.stop(now + 0.45);

    // Искажение пространства
    const warp = this.ctx.createOscillator();
    const warpGain = this.ctx.createGain();

    warp.type = 'sawtooth';
    warp.frequency.setValueAtTime(80, now);
    warp.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    warpGain.gain.setValueAtTime(vol * 0.2, now);
    warpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    warp.connect(warpGain);
    warpGain.connect(this.sfxGain);

    warp.start(now);
    warp.stop(now + 0.4);
  }

  /** Boss Blue - электрический разряд/телепорт */
  private playBossBlueProximity(vol: number, now: number): void {
    if (!this.ctx || !this.sfxGain) return;

    // Электрический треск
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Случайные щелчки
      data[i] = Math.random() > 0.95 ? (Math.random() * 2 - 1) : 0;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.18);

    // Высокий писк энергии
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();

    zap.type = 'sine';
    zap.frequency.setValueAtTime(2000 + Math.random() * 500, now);
    zap.frequency.exponentialRampToValueAtTime(500, now + 0.1);

    zapGain.gain.setValueAtTime(vol * 0.25, now);
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    zap.connect(zapGain);
    zapGain.connect(this.sfxGain);

    zap.start(now);
    zap.stop(now + 0.15);
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
  /** Свист фантома в войде - нарастающий зловещий звук */
  private playVoidWhistle(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Нарастающий высокий свист
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    const whistleFilter = this.ctx.createBiquadFilter();

    whistle.type = 'sine';
    // Частота нарастает - приближается!
    whistle.frequency.setValueAtTime(600, now);
    whistle.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
    whistle.frequency.exponentialRampToValueAtTime(800, now + 1.2);

    whistleFilter.type = 'bandpass';
    whistleFilter.frequency.setValueAtTime(800, now);
    whistleFilter.frequency.linearRampToValueAtTime(1500, now + 0.8);
    whistleFilter.Q.value = 8;

    // Громкость нарастает потом спадает
    whistleGain.gain.setValueAtTime(0.0, now);
    whistleGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    whistleGain.gain.setValueAtTime(0.25, now + 0.8);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);

    whistle.connect(whistleFilter);
    whistleFilter.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    whistleGain.connect(this.reverb!);

    whistle.start(now);
    whistle.stop(now + 1.4);

    // Второй слой - низкий гул для атмосферы
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();

    hum.type = 'triangle';
    hum.frequency.setValueAtTime(150, now);
    hum.frequency.linearRampToValueAtTime(200, now + 1.0);

    humGain.gain.setValueAtTime(0.0, now);
    humGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
    humGain.gain.setValueAtTime(0.1, now + 0.8);
    humGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    hum.connect(humGain);
    humGain.connect(this.sfxGain);

    hum.start(now);
    hum.stop(now + 1.3);
  }

  /** Удар фантома по игроку - жёсткий удар с искажением */
  private playPhantomHit(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Резкий удар
    const impact = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    const impactFilter = this.ctx.createBiquadFilter();

    impact.type = 'sawtooth';
    impact.frequency.setValueAtTime(80, now);
    impact.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    impactFilter.type = 'lowpass';
    impactFilter.frequency.setValueAtTime(500, now);
    impactFilter.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    impactFilter.Q.value = 3;

    impactGain.gain.setValueAtTime(0.5, now);
    impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    impact.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(this.sfxGain);

    impact.start(now);
    impact.stop(now + 0.3);

    // Шум удара
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.3));
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;
    
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noise.start(now);
  }

  /** Вскрик героя при получении урона - громкий и выразительный */
  private playPlayerHurt(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Основной вскрик - резкий громкий "АХ!"
    const voice1 = this.ctx.createOscillator();
    const voice1Gain = this.ctx.createGain();
    
    voice1.type = 'sawtooth';
    // Высокая начальная частота для резкости
    voice1.frequency.setValueAtTime(300 + Math.random() * 50, now);
    voice1.frequency.exponentialRampToValueAtTime(150, now + 0.1);
    voice1.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    // ГРОМКО!
    voice1Gain.gain.setValueAtTime(0.6, now);
    voice1Gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    voice1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    voice1.connect(voice1Gain);
    voice1Gain.connect(this.sfxGain);

    voice1.start(now);
    voice1.stop(now + 0.25);

    // Второй голосовой слой - более низкий для глубины
    const voice2 = this.ctx.createOscillator();
    const voice2Gain = this.ctx.createGain();
    
    voice2.type = 'square';
    voice2.frequency.setValueAtTime(150, now);
    voice2.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    voice2Gain.gain.setValueAtTime(0.3, now);
    voice2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    voice2.connect(voice2Gain);
    voice2Gain.connect(this.sfxGain);

    voice2.start(now);
    voice2.stop(now + 0.2);

    // Шумовой компонент - выдох/хрип (громче!)
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.15);
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 1;

    // Громкий шум!
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  // === ЗВУКИ ПОЯВЛЕНИЯ ВРАГОВ ИЗ ПОРТАЛОВ ===
  
  /** Звук появления бейнлинга - хлюпающий слизистый звук */
  public playBanelingSpawn(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Хлюпающий звук - несколько пузырей
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.05 + Math.random() * 0.02;
      const bubble = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();
      const bubbleFilter = this.ctx.createBiquadFilter();
      
      bubble.type = 'sine';
      const baseFreq = 200 + Math.random() * 300;
      bubble.frequency.setValueAtTime(baseFreq, now + delay);
      bubble.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + delay + 0.12);
      
      bubbleFilter.type = 'lowpass';
      bubbleFilter.frequency.value = 800;
      bubbleFilter.Q.value = 4;
      
      bubbleGain.gain.setValueAtTime(0.2, now + delay);
      bubbleGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
      
      bubble.connect(bubbleFilter);
      bubbleFilter.connect(bubbleGain);
      bubbleGain.connect(this.sfxGain);
      
      bubble.start(now + delay);
      bubble.stop(now + delay + 0.2);
    }
    
    // Влажный шум
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.2);
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.3)) * 0.3;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 600;
    
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noise.start(now);
  }
  
  /** Звук появления фантома - зловещий свист из портала */
  public playPhantomSpawn(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Зловещий свист - появление из тьмы
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    const whistleFilter = this.ctx.createBiquadFilter();
    
    whistle.type = 'triangle';
    // Частота растёт от низкой к высокой
    whistle.frequency.setValueAtTime(150, now);
    whistle.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    whistle.frequency.setValueAtTime(500, now + 0.35);
    
    whistleFilter.type = 'bandpass';
    whistleFilter.frequency.setValueAtTime(300, now);
    whistleFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
    whistleFilter.Q.value = 6;
    
    whistleGain.gain.setValueAtTime(0.0, now);
    whistleGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    whistleGain.gain.setValueAtTime(0.2, now + 0.25);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    whistle.connect(whistleFilter);
    whistleFilter.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    whistleGain.connect(this.reverb!);
    
    whistle.start(now);
    whistle.stop(now + 0.55);
    
    // Низкий гул для атмосферы
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    
    hum.type = 'sine';
    hum.frequency.setValueAtTime(80, now);
    hum.frequency.linearRampToValueAtTime(120, now + 0.3);
    
    humGain.gain.setValueAtTime(0.0, now);
    humGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    humGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    hum.connect(humGain);
    humGain.connect(this.sfxGain);
    
    hum.start(now);
    hum.stop(now + 0.45);
  }
  
  /** Звук появления раннера - быстрый шорох/скрежет */
  public playRunnerSpawn(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Быстрый скрежет когтей
    const scrape = this.ctx.createOscillator();
    const scrapeGain = this.ctx.createGain();
    const scrapeFilter = this.ctx.createBiquadFilter();
    
    scrape.type = 'sawtooth';
    // Быстрое вибрато для эффекта бега
    scrape.frequency.setValueAtTime(200, now);
    scrape.frequency.linearRampToValueAtTime(400, now + 0.05);
    scrape.frequency.linearRampToValueAtTime(250, now + 0.1);
    scrape.frequency.linearRampToValueAtTime(350, now + 0.15);
    scrape.frequency.linearRampToValueAtTime(200, now + 0.2);
    
    scrapeFilter.type = 'highpass';
    scrapeFilter.frequency.value = 1000;
    scrapeFilter.Q.value = 2;
    
    scrapeGain.gain.setValueAtTime(0.15, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    scrape.connect(scrapeFilter);
    scrapeFilter.connect(scrapeGain);
    scrapeGain.connect(this.sfxGain);
    
    scrape.start(now);
    scrape.stop(now + 0.3);
    
    // Шум шагов
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.15);
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      // Пульсирующий шум для эффекта шагов
      const pulse = Math.sin(i / this.ctx.sampleRate * 60 * Math.PI * 2) * 0.5 + 0.5;
      noiseData[i] = (Math.random() * 2 - 1) * pulse * Math.exp(-i / (noiseLen * 0.5));
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;
    
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noise.start(now);
  }
  
  /** Звук появления хоппера - пружинистый прыжковый звук */
  public playHopperSpawn(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Пружинистый звук - "бойнг"
    const boing = this.ctx.createOscillator();
    const boingGain = this.ctx.createGain();
    
    boing.type = 'sine';
    // Частота прыгает вверх-вниз
    boing.frequency.setValueAtTime(150, now);
    boing.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    boing.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    boing.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    
    boingGain.gain.setValueAtTime(0.3, now);
    boingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    boing.connect(boingGain);
    boingGain.connect(this.sfxGain);
    
    boing.start(now);
    boing.stop(now + 0.4);
    
    // Электрический "чирик" (хоппер синий/электрический)
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    const zapFilter = this.ctx.createBiquadFilter();
    
    zap.type = 'square';
    zap.frequency.setValueAtTime(800, now + 0.05);
    zap.frequency.linearRampToValueAtTime(1200, now + 0.1);
    zap.frequency.linearRampToValueAtTime(600, now + 0.15);
    
    zapFilter.type = 'bandpass';
    zapFilter.frequency.value = 1000;
    zapFilter.Q.value = 5;
    
    zapGain.gain.setValueAtTime(0.0, now + 0.05);
    zapGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    zap.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(this.sfxGain);
    
    zap.start(now + 0.05);
    zap.stop(now + 0.25);
  }
  
  /** Звук появления босса - мощный рёв из портала */
  public playBossSpawn(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Мощный низкий рёв
    const roar = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    const roarFilter = this.ctx.createBiquadFilter();
    
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(60, now);
    roar.frequency.linearRampToValueAtTime(100, now + 0.3);
    roar.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(300, now);
    roarFilter.frequency.linearRampToValueAtTime(500, now + 0.3);
    roarFilter.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    roarFilter.Q.value = 2;
    
    roarGain.gain.setValueAtTime(0.0, now);
    roarGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    roarGain.gain.setValueAtTime(0.5, now + 0.4);
    roarGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    
    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.sfxGain);
    roarGain.connect(this.reverb!);
    
    roar.start(now);
    roar.stop(now + 1.1);
    
    // Второй слой - более высокий для глубины
    const roar2 = this.ctx.createOscillator();
    const roar2Gain = this.ctx.createGain();
    
    roar2.type = 'triangle';
    roar2.frequency.setValueAtTime(120, now);
    roar2.frequency.linearRampToValueAtTime(180, now + 0.3);
    roar2.frequency.exponentialRampToValueAtTime(80, now + 0.8);
    
    roar2Gain.gain.setValueAtTime(0.0, now);
    roar2Gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    roar2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    
    roar2.connect(roar2Gain);
    roar2Gain.connect(this.sfxGain);
    
    roar2.start(now);
    roar2.stop(now + 1.0);
    
    // Шум для грубости
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.8);
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      const env = Math.sin(i / noiseLen * Math.PI);
      noiseData[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;
    
    noiseGain.gain.setValueAtTime(0.0, now);
    noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseGain.connect(this.reverb!);
    
    noise.start(now);
  }
  
  /** Звук активации портала - пространственное гудение */
  public playPortalActivate(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Пространственный гул
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    
    hum.type = 'sine';
    hum.frequency.setValueAtTime(100, now);
    // Вибрато
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 5;
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(hum.frequency);
    
    humGain.gain.setValueAtTime(0.2, now);
    humGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    hum.connect(humGain);
    humGain.connect(this.sfxGain);
    humGain.connect(this.reverb!);
    
    lfo.start(now);
    hum.start(now);
    hum.stop(now + 0.6);
    lfo.stop(now + 0.6);
  }

  /** Вскрик спайкера перед атакой - пронзительный крик */
  private playSpikerScream(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Пронзительный крик - высокочастотный визг
    const scream = this.ctx.createOscillator();
    const screamGain = this.ctx.createGain();
    const screamFilter = this.ctx.createBiquadFilter();
    
    scream.type = 'sawtooth';
    // Резкий подъём частоты
    scream.frequency.setValueAtTime(800, now);
    scream.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    scream.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
    
    screamFilter.type = 'bandpass';
    screamFilter.frequency.value = 1500;
    screamFilter.Q.value = 3;
    
    screamGain.gain.setValueAtTime(0.3, now);
    screamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    scream.connect(screamFilter);
    screamFilter.connect(screamGain);
    screamGain.connect(this.sfxGain);
    
    scream.start(now);
    scream.stop(now + 0.3);
    
    // Вибрирующий компонент - дрожь в голосе
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(1200, now);
    
    // LFO для вибрато
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 25; // Быстрое дрожание
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(vibrato.frequency);
    
    vibratoGain.gain.setValueAtTime(0.15, now);
    vibratoGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(this.sfxGain);
    
    lfo.start(now);
    vibrato.start(now);
    vibrato.stop(now + 0.25);
    lfo.stop(now + 0.25);
  }
  
  /** Звук выстрела иголкой спайкера */
  private playSpikerShoot(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Свист иглы - быстрый "фьюить"
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    const whistleFilter = this.ctx.createBiquadFilter();
    
    whistle.type = 'sine';
    // Падающая частота - игла летит
    whistle.frequency.setValueAtTime(3000, now);
    whistle.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    
    whistleFilter.type = 'highpass';
    whistleFilter.frequency.value = 1000;
    
    whistleGain.gain.setValueAtTime(0.2, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    whistle.connect(whistleFilter);
    whistleFilter.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    
    whistle.start(now);
    whistle.stop(now + 0.2);
    
    // Щелчок выстрела
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    
    click.type = 'square';
    click.frequency.setValueAtTime(600, now);
    click.frequency.exponentialRampToValueAtTime(200, now + 0.03);
    
    clickGain.gain.setValueAtTime(0.25, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    
    click.start(now);
    click.stop(now + 0.08);
  }
  
  /** Звук взрыва гранаты - глитч эффект */
  private playExplosion(): void {
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    
    // Глитч-взрыв - резкий цифровой шум
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      // Битовый шум - резкий цифровой звук
      noiseData[i] = Math.random() > 0.5 ? 1 : -1;
      // Добавляем глитч-паттерн
      if (i % 100 < 30) noiseData[i] *= 0.3;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    noiseFilter.Q.value = 3;
    
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noise.start(now);
    noise.stop(now + 0.5);
    
    // Низкий удар
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    
    boomGain.gain.setValueAtTime(0.9, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    
    boom.start(now);
    boom.stop(now + 0.4);
    
    // Высокочастотный писк (глитч)
    const glitch = this.ctx.createOscillator();
    const glitchGain = this.ctx.createGain();
    
    glitch.type = 'square';
    glitch.frequency.setValueAtTime(4000, now);
    glitch.frequency.setValueAtTime(100, now + 0.05);
    glitch.frequency.setValueAtTime(3000, now + 0.1);
    glitch.frequency.setValueAtTime(50, now + 0.15);
    
    glitchGain.gain.setValueAtTime(0.3, now);
    glitchGain.gain.setValueAtTime(0.5, now + 0.05);
    glitchGain.gain.setValueAtTime(0.2, now + 0.1);
    glitchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    glitch.connect(glitchGain);
    glitchGain.connect(this.sfxGain);
    
    glitch.start(now);
    glitch.stop(now + 0.3);
  }

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

  /** Кислотный плевок - звук выплёвывания */
  private playAcidSpit(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Хлюпающий звук плевка
    const spit = this.ctx.createOscillator();
    const spitGain = this.ctx.createGain();

    spit.type = 'sawtooth';
    spit.frequency.setValueAtTime(150, now);
    spit.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    spitGain.gain.setValueAtTime(0.25, now);
    spitGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    spit.connect(spitGain);
    spitGain.connect(this.sfxGain);

    spit.start(now);
    spit.stop(now + 0.2);

    // Свистящий звук летящей кислоты
    const swoosh = this.ctx.createOscillator();
    const swooshGain = this.ctx.createGain();
    const swooshFilter = this.ctx.createBiquadFilter();

    swoosh.type = 'sawtooth';
    swoosh.frequency.setValueAtTime(500, now + 0.1);
    swoosh.frequency.exponentialRampToValueAtTime(150, now + 1.2);

    swooshFilter.type = 'bandpass';
    swooshFilter.frequency.setValueAtTime(400, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(200, now + 1.0);
    swooshFilter.Q.value = 3;

    swooshGain.gain.setValueAtTime(0, now);
    swooshGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    swoosh.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(this.sfxGain);

    swoosh.start(now);
    swoosh.stop(now + 1.2);
  }

  /** Всплеск кислоты - приземление снаряда */
  public playAcidSplash(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Мощный плюх
    const splash = this.createNoise(0.8);
    const splashGain = this.ctx.createGain();
    const splashFilter = this.ctx.createBiquadFilter();

    splashFilter.type = 'lowpass';
    splashFilter.frequency.setValueAtTime(1200, now);
    splashFilter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    splashGain.gain.setValueAtTime(0.4, now);
    splashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    splash.connect(splashFilter);
    splashFilter.connect(splashGain);
    splashGain.connect(this.sfxGain);

    // Шипение кислоты
    const hiss = this.createNoise(2.0);
    const hissGain = this.ctx.createGain();
    const hissFilter = this.ctx.createBiquadFilter();

    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3500;

    hissGain.gain.setValueAtTime(0, now + 0.1);
    hissGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
    hissGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.sfxGain);

    // Низкочастотный удар
    const impact = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();

    impact.type = 'sine';
    impact.frequency.setValueAtTime(80, now);
    impact.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    impactGain.gain.setValueAtTime(0.35, now);
    impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    impact.connect(impactGain);
    impactGain.connect(this.sfxGain);

    impact.start(now);
    impact.stop(now + 0.3);
  }

  /** Звук установки метки для кислотного дождя - зловещее предупреждение */
  public playAcidRainMark(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Нарастающий тревожный тон
    const warn = this.ctx.createOscillator();
    const warnGain = this.ctx.createGain();
    const warnFilter = this.ctx.createBiquadFilter();

    warn.type = 'sawtooth';
    warn.frequency.setValueAtTime(200, now);
    warn.frequency.exponentialRampToValueAtTime(600, now + 1.0);

    warnFilter.type = 'bandpass';
    warnFilter.frequency.setValueAtTime(400, now);
    warnFilter.Q.value = 5;

    warnGain.gain.setValueAtTime(0.1, now);
    warnGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
    warnGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    warn.connect(warnFilter);
    warnFilter.connect(warnGain);
    warnGain.connect(this.sfxGain);

    warn.start(now);
    warn.stop(now + 1.2);

    // Пульсирующий сигнал тревоги
    for (let i = 0; i < 3; i++) {
      const beep = this.ctx.createOscillator();
      const beepGain = this.ctx.createGain();

      beep.type = 'square';
      beep.frequency.value = 800;

      beepGain.gain.setValueAtTime(0, now + i * 0.3);
      beepGain.gain.linearRampToValueAtTime(0.1, now + i * 0.3 + 0.05);
      beepGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.15);

      beep.connect(beepGain);
      beepGain.connect(this.sfxGain);

      beep.start(now + i * 0.3);
      beep.stop(now + i * 0.3 + 0.2);
    }
  }

  /** Звук начала кислотного дождя - шипение и хлещущий звук */
  public playAcidRainStart(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Мощный шум падающей жидкости
    const rain = this.createNoise(3.0);
    const rainGain = this.ctx.createGain();
    const rainFilter = this.ctx.createBiquadFilter();

    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 2000;
    rainFilter.Q.value = 1;

    rainGain.gain.setValueAtTime(0, now);
    rainGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    rainGain.gain.setValueAtTime(0.25, now + 2.5);
    rainGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

    rain.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.sfxGain);

    // Шипение кислоты
    const hiss = this.createNoise(3.0);
    const hissGain = this.ctx.createGain();
    const hissFilter = this.ctx.createBiquadFilter();

    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 5000;

    hissGain.gain.setValueAtTime(0, now + 0.1);
    hissGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    hissGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.sfxGain);

    // Низкий гул
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();

    rumble.type = 'sine';
    rumble.frequency.value = 50;

    rumbleGain.gain.setValueAtTime(0.2, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);

    rumble.start(now);
    rumble.stop(now + 2.0);
  }

  /** Звук предупреждения о боссе */
  public playBossWarning(): void {
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Эпичный гонг
    const gong = this.ctx.createOscillator();
    const gongGain = this.ctx.createGain();

    gong.type = 'sine';
    gong.frequency.setValueAtTime(120, now);
    gong.frequency.exponentialRampToValueAtTime(80, now + 2.0);

    gongGain.gain.setValueAtTime(0.5, now);
    gongGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    gong.connect(gongGain);
    gongGain.connect(this.sfxGain);
    gongGain.connect(this.reverb!);

    gong.start(now);
    gong.stop(now + 2.5);

    // Второй гонг повыше
    const gong2 = this.ctx.createOscillator();
    const gong2Gain = this.ctx.createGain();

    gong2.type = 'sine';
    gong2.frequency.setValueAtTime(180, now + 0.5);
    gong2.frequency.exponentialRampToValueAtTime(100, now + 2.5);

    gong2Gain.gain.setValueAtTime(0.3, now + 0.5);
    gong2Gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

    gong2.connect(gong2Gain);
    gong2Gain.connect(this.sfxGain);
    gong2Gain.connect(this.reverb!);

    gong2.start(now + 0.5);
    gong2.stop(now + 3.0);

    // Зловещий шёпот (шум)
    const whisper = this.createNoise(2.0);
    const whisperGain = this.ctx.createGain();
    const whisperFilter = this.ctx.createBiquadFilter();

    whisperFilter.type = 'bandpass';
    whisperFilter.frequency.value = 800;
    whisperFilter.Q.value = 5;

    whisperGain.gain.setValueAtTime(0, now + 1.0);
    whisperGain.gain.linearRampToValueAtTime(0.1, now + 1.5);
    whisperGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    whisper.connect(whisperFilter);
    whisperFilter.connect(whisperGain);
    whisperGain.connect(this.reverb!);
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

      gain.gain.setValueAtTime(0.8, now); // ГРОМЧЕ!
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

    // Тяжёлая бочка на каждую восьмую - агрессивнее! 160 BPM
    this.musicIntervals.push(setInterval(playHeavyKick, 187) as unknown as number);

    // === ЗЛОЙ СИНТ ===
    const playEvilSynth = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Два осциллятора для дисторшн эффекта
      osc.type = 'sawtooth';
      osc2.type = 'square';
      
      // Злой паттерн
      const notes = [110, 110, 146.8, 110]; // A2, A2, D3, A2
      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.value = note;
      osc2.frequency.value = note * 1.5; // Квинта для агрессии

      // Резонансный фильтр - ОЧЕНЬ злой
      filter.type = 'lowpass';
      filter.Q.value = 25;
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.2);
      osc2.stop(now + 0.2);
    };

    // Злой синт на оффбитах
    this.musicIntervals.push(setInterval(playEvilSynth, 93) as unknown as number);

    // === СИРЕНА ТРЕВОГИ ===
    const playAlarm = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.15);
      osc.frequency.linearRampToValueAtTime(500, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
      gain.gain.linearRampToValueAtTime(0.0, now + 0.3);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.35);
    };

    // Сирена каждые 1.5 секунды - чаще!
    this.musicIntervals.push(setInterval(playAlarm, 1500) as unknown as number);
  }

  /** Звук вихря чёрного босса */
  private vortexGain: GainNode | null = null;
  private vortexOsc: OscillatorNode | null = null;
  private vortexNoise: AudioBufferSourceNode | null = null;
  
  /** Флаг storm режима для музыки */
  private isStormMode = false;
  private stormGain: GainNode | null = null;

  public playVortexSound(start: boolean): void {
    if (!this.ctx || !this.masterGain) return;

    if (start) {
      // === ЗАПУСК ВИХРЯ ===
      
      // Создаём gain
      this.vortexGain = this.ctx.createGain();
      this.vortexGain.gain.value = 0;
      this.vortexGain.connect(this.masterGain);

      // Низкий гудящий осциллятор (ветер)
      this.vortexOsc = this.ctx.createOscillator();
      this.vortexOsc.type = 'sawtooth';
      this.vortexOsc.frequency.value = 60;
      
      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 0.15;
      
      // LFO для модуляции частоты (эффект вращения)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 3; // 3 оборота в секунду
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 30; // Модуляция ±30 Гц
      
      lfo.connect(lfoGain);
      lfoGain.connect(this.vortexOsc.frequency);
      
      // Фильтр для глубокого звука
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 200;
      lowpass.Q.value = 5;
      
      this.vortexOsc.connect(lowpass);
      lowpass.connect(oscGain);
      oscGain.connect(this.vortexGain);
      
      // Шум ветра
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.5;
      }
      
      this.vortexNoise = this.ctx.createBufferSource();
      this.vortexNoise.buffer = noiseBuffer;
      this.vortexNoise.loop = true;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 400;
      noiseFilter.Q.value = 2;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.3;
      
      this.vortexNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.vortexGain);
      
      // Запускаем всё
      this.vortexOsc.start();
      lfo.start();
      this.vortexNoise.start();
      
      // Плавное нарастание
      this.vortexGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.5);
      
      // Активируем storm режим музыки
      this.activateStormMode();
      
    } else {
      // === ОСТАНОВКА ВИХРЯ ===
      if (this.vortexGain) {
        this.vortexGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      }
      
      // Деактивируем storm режим
      this.deactivateStormMode();
      
      setTimeout(() => {
        if (this.vortexOsc) {
          try { this.vortexOsc.stop(); } catch (e) {}
          this.vortexOsc = null;
        }
        if (this.vortexNoise) {
          try { this.vortexNoise.stop(); } catch (e) {}
          this.vortexNoise = null;
        }
        this.vortexGain = null;
      }, 600);
    }
  }

  /** Активация storm режима музыки */
  private activateStormMode(): void {
    if (!this.ctx || !this.musicGain || this.isStormMode) return;
    this.isStormMode = true;

    // Создаём gain для storm элементов
    this.stormGain = this.ctx.createGain();
    this.stormGain.gain.value = 0;
    this.stormGain.connect(this.musicGain);
    this.stormGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.5);

    // === STORM: ИНТЕНСИВНЫЙ РЕЙЗЕР ===
    const playRiser = () => {
      if (!this.ctx || !this.stormGain || !this.isStormMode) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(4000, now + 2);
      filter.Q.value = 8;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 1);
      gain.gain.linearRampToValueAtTime(0, now + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.stormGain!);

      osc.start(now);
      osc.stop(now + 2.1);
    };

    // Рейзер каждые 2 секунды
    this.musicIntervals.push(setInterval(playRiser, 2000) as unknown as number);
    playRiser();

    // === STORM: ТЯЖЁЛЫЙ SUB DROP ===
    const playSubDrop = () => {
      if (!this.ctx || !this.stormGain || !this.isStormMode) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.stormGain!);

      osc.start(now);
      osc.stop(now + 0.7);
    };

    // Sub drop каждые 500ms
    this.musicIntervals.push(setInterval(playSubDrop, 500) as unknown as number);

    // === STORM: ШУМОВОЙ SWEEP ===
    const playNoiseSweep = () => {
      if (!this.ctx || !this.stormGain || !this.isStormMode) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.5);
      filter.frequency.exponentialRampToValueAtTime(500, now + 1);
      filter.Q.value = 5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.25);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.75);
      gain.gain.linearRampToValueAtTime(0, now + 1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.stormGain!);

      noise.start(now);
      noise.stop(now + 1.1);
    };

    this.musicIntervals.push(setInterval(playNoiseSweep, 1000) as unknown as number);
    playNoiseSweep();

    // === STORM: БЫСТРЫЕ ХАЙХЭТЫ ===
    const playFastHihat = () => {
      if (!this.ctx || !this.stormGain || !this.isStormMode) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.02;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 10000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.stormGain!);

      noise.start(now);
      noise.stop(now + 0.03);
    };

    // 16th notes (очень быстро)
    this.musicIntervals.push(setInterval(playFastHihat, 119) as unknown as number);
  }

  /** Деактивация storm режима */
  private deactivateStormMode(): void {
    if (!this.isStormMode) return;
    this.isStormMode = false;

    if (this.stormGain && this.ctx) {
      this.stormGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }

    setTimeout(() => {
      this.stormGain = null;
    }, 1100);
  }

  /** Музыка Зелёного Босса - ЖЁСТКОЕ ACID TECHNO */
  private playBossGreenMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // === АГРЕССИВНЫЙ 303 ACID ===
    const acidPattern = [55, 55, 110, 55, 82.4, 110, 73.4, 55]; // Более агрессивный паттерн
    const slidePattern = [0, 0, 1, 0, 1, 1, 0, 1]; // Глайды
    let step = 0;
    let acidFilter: BiquadFilterNode | null = null;

    const playAcidBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Два осциллятора для жирности
      osc.type = 'sawtooth';
      osc2.type = 'square';
      const freq = acidPattern[step];
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.01; // Лёгкая расстройка

      // ОЧЕНЬ резонансный фильтр - главная фишка ACID!
      filter.type = 'lowpass';
      filter.Q.value = 22; // МАКСИМАЛЬНЫЙ резонанс!
      
      // Агрессивная модуляция фильтра
      const isSlide = slidePattern[step] === 1;
      const filterStart = 150 + Math.random() * 100;
      const filterPeak = 1200 + Math.random() * 800;
      
      filter.frequency.setValueAtTime(filterStart, now);
      filter.frequency.exponentialRampToValueAtTime(filterPeak, now + 0.03);
      filter.frequency.exponentialRampToValueAtTime(isSlide ? filterPeak * 0.7 : 200, now + 0.1);

      // Акцент - ГРОМЧЕ!
      const accent = step % 4 === 0 ? 0.5 : 0.3;
      gain.gain.setValueAtTime(accent, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.15);
      osc2.stop(now + 0.15);

      step = (step + 1) % acidPattern.length;
      acidFilter = filter;
    };

    // 150 BPM 16-е ноты
    this.musicIntervals.push(setInterval(playAcidBass, 100) as unknown as number);

    // === ЖЁСТКИЙ КИК ===
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const click = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const clickGain = this.ctx.createGain();

      // Основа кика
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      // Клик атаки
      click.type = 'triangle';
      click.frequency.value = 1500;

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      clickGain.gain.setValueAtTime(0.2, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      click.connect(clickGain);
      gain.connect(this.musicGain!);
      clickGain.connect(this.musicGain!);

      osc.start(now);
      click.start(now);
      osc.stop(now + 0.3);
      click.stop(now + 0.03);
    };

    this.musicIntervals.push(setInterval(playKick, 400) as unknown as number);

    // === ХАЙХЭТ ===
    let hihatStep = 0;
    const playHihat = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_green') return;
      const now = this.ctx.currentTime;

      const noise = this.createNoise(0.04);
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      filter.type = 'highpass';
      filter.frequency.value = 9000;

      // Акцент на оффбит - ГРОМЧЕ!
      const isOffbeat = hihatStep % 2 === 1;
      gain.gain.setValueAtTime(isOffbeat ? 0.18 : 0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      hihatStep++;
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

  /** Музыка Чёрного Босса - DUB TECHNO с жёсткой бочкой */
  private playBossBlackMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // === ЖЁСТКАЯ БОЧКА (130 BPM - агрессивный темп для босс-файта) ===
    const playKick = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      // Жёсткий индустриальный кик
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const distortion = this.ctx.createWaveShaper();
      const gain = this.ctx.createGain();

      // Агрессивный pitch envelope
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      // Тяжёлый sub
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(60, now);
      osc2.frequency.exponentialRampToValueAtTime(25, now + 0.25);

      // Дисторшн для жёсткости
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 8); // Жёсткий клиппинг
      }
      distortion.curve = curve;

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(distortion);
      osc2.connect(gain);
      distortion.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.3);
      osc2.start(now);
      osc2.stop(now + 0.35);
    };

    // 130 BPM = ~461ms
    this.musicIntervals.push(setInterval(playKick, 461) as unknown as number);

    // === ДАБОВЫЙ БАС С ДИЛЭЕМ ===
    const bassNotes = [36.7, 36.7, 32.7, 36.7, 41.2, 36.7, 32.7, 29.1]; // D минор
    let bassIndex = 0;

    const playDubBass = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;
      const note = bassNotes[bassIndex];

      // Основной бас
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = note;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      filter.Q.value = 10;

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.45);

      // Дабовое эхо (3 повтора с затуханием)
      for (let echo = 1; echo <= 3; echo++) {
        const echoOsc = this.ctx.createOscillator();
        const echoFilter = this.ctx.createBiquadFilter();
        const echoGain = this.ctx.createGain();
        const echoTime = now + echo * 0.15;
        const echoVol = 0.15 / echo;

        echoOsc.type = 'sine';
        echoOsc.frequency.value = note;

        echoFilter.type = 'lowpass';
        echoFilter.frequency.value = 200 - echo * 40;

        echoGain.gain.setValueAtTime(echoVol, echoTime);
        echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.25);

        echoOsc.connect(echoFilter);
        echoFilter.connect(echoGain);
        echoGain.connect(this.musicGain!);

        echoOsc.start(echoTime);
        echoOsc.stop(echoTime + 0.3);
      }

      bassIndex = (bassIndex + 1) % bassNotes.length;
    };

    this.musicIntervals.push(setInterval(playDubBass, 461) as unknown as number);

    // === БРЕЙКБИТ (Amen-style паттерн) ===
    // Классический брейк: kick-snare-kick-kick-snare с вариациями
    // 16 шагов паттерна: K=kick, S=snare, H=hihat, _=пауза
    // Pattern: K_H_S_HK__H_S_HK
    const breakPattern = [
      { type: 'kick', vol: 1.0 },
      { type: 'none', vol: 0 },
      { type: 'hat', vol: 0.6 },
      { type: 'none', vol: 0 },
      { type: 'snare', vol: 1.0 },
      { type: 'none', vol: 0 },
      { type: 'hat', vol: 0.5 },
      { type: 'kick', vol: 0.8 },
      { type: 'none', vol: 0 },
      { type: 'none', vol: 0 },
      { type: 'hat', vol: 0.7 },
      { type: 'none', vol: 0 },
      { type: 'snare', vol: 1.0 },
      { type: 'none', vol: 0 },
      { type: 'hat', vol: 0.5 },
      { type: 'kick', vol: 0.7 },
    ];
    let breakIndex = 0;

    const playBreakHit = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;
      const hit = breakPattern[breakIndex];

      if (hit.type === 'kick') {
        // Брейкбит кик - короткий и панчевый
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.03);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        gain.gain.setValueAtTime(0.5 * hit.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.15);

      } else if (hit.type === 'snare') {
        // Брейкбит снэйр - хрустящий
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.02);

        oscGain.gain.setValueAtTime(0.2 * hit.vol, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.1);

        // Шум
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3000;
        noiseFilter.Q.value = 1;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35 * hit.vol, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.musicGain!);

        noise.start(now);
        noise.stop(now + 0.12);

      } else if (hit.type === 'hat') {
        // Брейкбит хайхэт
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15 * hit.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        noise.start(now);
        noise.stop(now + 0.045);
      }

      breakIndex = (breakIndex + 1) % breakPattern.length;
    };

    // 16th notes при 130 BPM
    this.musicIntervals.push(setInterval(playBreakHit, 115) as unknown as number);

    // Снэйр и хайхэты уже в брейкбите!

    // === ДАБОВЫЙ CHORD STAB С ЭХОМ ===
    const playDubChord = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;
      const chord = [146.8, 174.6, 220]; // Dm: D3, F3, A3

      for (const freq of chord) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.3);

        // Множественное эхо (даб!)
        for (let e = 1; e <= 5; e++) {
          const echoOsc = this.ctx.createOscillator();
          const echoFilter = this.ctx.createBiquadFilter();
          const echoGain = this.ctx.createGain();
          const echoTime = now + e * 0.18;

          echoOsc.type = 'sine';
          echoOsc.frequency.value = freq;
          echoFilter.type = 'lowpass';
          echoFilter.frequency.value = 800 - e * 120;

          echoGain.gain.setValueAtTime(0.04 / e, echoTime);
          echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.2);

          echoOsc.connect(echoFilter);
          echoFilter.connect(echoGain);
          echoGain.connect(this.musicGain!);

          echoOsc.start(echoTime);
          echoOsc.stop(echoTime + 0.25);
        }
      }
    };

    this.musicIntervals.push(setInterval(playDubChord, 1844) as unknown as number); // Каждые 4 такта

    // === ГЛУБОКИЙ SUB DRONE ===
    const playSubDrone = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 36.7; // D1

      lfo.type = 'sine';
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 3;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 1);
      gain.gain.linearRampToValueAtTime(0.2, now + 3);
      gain.gain.linearRampToValueAtTime(0, now + 4);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 4.5);
      osc.stop(now + 4.5);
    };

    playSubDrone();
    this.musicIntervals.push(setInterval(playSubDrone, 3688) as unknown as number);

    // === FX: РЕЙЗЕР/ПАДЕНИЕ (каждые 8 тактов) ===
    const playFx = () => {
      if (!this.ctx || !this.musicGain || this.currentMusicMode !== 'boss_black') return;
      if (Math.random() > 0.5) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Случайно вверх или вниз
      if (Math.random() > 0.5) {
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 1);
      } else {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 1.5);
      filter.Q.value = 8;

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 1.6);
    };

    this.musicIntervals.push(setInterval(playFx, 3688) as unknown as number);
  }

  /** Райзер перед вихрем */
  public playVortexRiser(): void {
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;
    const duration = 2.0; // 2 секунды райзера

    // === ОСНОВНОЙ РАЙЗЕР (нарастающий шум) ===
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(8000, now + duration);
    filter.Q.value = 5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0.5, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + duration + 0.1);

    // === ТОНАЛЬНЫЙ РАЙЗЕР (нарастающий тон) ===
    const osc = this.ctx.createOscillator();
    const oscFilter = this.ctx.createBiquadFilter();
    const oscGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + duration);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(100, now);
    oscFilter.frequency.exponentialRampToValueAtTime(2000, now + duration);
    oscFilter.Q.value = 8;

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.25, now + duration);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    // === УДАРНЫЕ АКЦЕНТЫ (нарастающие) ===
    const playRiserHit = (time: number, vol: number) => {
      if (!this.ctx || !this.musicGain) return;

      const hitOsc = this.ctx.createOscillator();
      const hitGain = this.ctx.createGain();

      hitOsc.type = 'sine';
      hitOsc.frequency.setValueAtTime(100, time);
      hitOsc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

      hitGain.gain.setValueAtTime(vol, time);
      hitGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      hitOsc.connect(hitGain);
      hitGain.connect(this.musicGain);

      hitOsc.start(time);
      hitOsc.stop(time + 0.2);
    };

    // Ускоряющиеся удары
    playRiserHit(now + 0.5, 0.15);
    playRiserHit(now + 1.0, 0.2);
    playRiserHit(now + 1.3, 0.25);
    playRiserHit(now + 1.5, 0.3);
    playRiserHit(now + 1.65, 0.35);
    playRiserHit(now + 1.8, 0.4);
    playRiserHit(now + 1.9, 0.45);
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
