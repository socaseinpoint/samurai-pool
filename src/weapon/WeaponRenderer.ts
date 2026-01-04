import type { WeaponState } from '@/types';
import type { WeaponType } from './Weapon';

/** 2D частица для эффектов */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'fragment' | 'spark' | 'trail';
}

/** Параметры освещения сцены */
interface SceneLighting {
  ambient: [number, number, number];  // RGB 0-1
  accentColor: [number, number, number];
  brightness: number;  // 0-1
}

/**
 * Рендерер катаны в стиле Retrowave
 * Неоновые эффекты при взмахе + частицы осколков
 */
export class WeaponRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  /** Прогресс атаки (0-1) */
  public attackProgress = 0;

  /** Сейчас атакуем? */
  public isAttacking = false;

  /** Это сплеш-атака? */
  public isSplashAttack = false;

  /** Заряды сплеша */
  public splashCharges = 0;

  /** Вспышка попадания */
  private hitFlash = 0;

  /** Частицы */
  private particles: Particle[] = [];

  /** Максимум частиц для производительности */
  private static readonly MAX_PARTICLES = 50;

  /** Активна сплеш-волна */
  private splashWaveActive = false;
  
  /** Прогресс волны (0-1) */
  private splashWaveProgress = 0;
  
  /** Направление волны (yaw) */
  private splashWaveYaw = 0;

  /** Текущее освещение сцены */
  private sceneLighting: SceneLighting = {
    ambient: [0.12, 0.15, 0.2],
    accentColor: [0.15, 0.7, 1.0],
    brightness: 0.7
  };

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Установить освещение сцены для тонирования катаны */
  public setSceneLighting(era: number): void {
    // Параметры освещения по эпохам (соответствуют шейдеру)
    if (era === 1) {
      // Кислотная
      this.sceneLighting = {
        ambient: [0.08, 0.12, 0.08],
        accentColor: [0.4, 1.0, 0.2],
        brightness: 0.75
      };
    } else if (era === 2) {
      // Чёрная дыра
      this.sceneLighting = {
        ambient: [0.07, 0.05, 0.12],
        accentColor: [0.7, 0.15, 1.0],
        brightness: 0.7
      };
    } else {
      // Космическая (по умолчанию)
      this.sceneLighting = {
        ambient: [0.08, 0.1, 0.14],
        accentColor: [0.15, 0.7, 1.0],
        brightness: 0.75
      };
    }
  }

  /** Применить тонирование цвета под освещение сцены */
  private tintColor(color: string, intensity: number = 1.0): string {
    // Парсим цвет
    const match = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!match) return color;

    let r = parseInt(match[1], 16) / 255;
    let g = parseInt(match[2], 16) / 255;
    let b = parseInt(match[3], 16) / 255;

    const [ar, ag, ab] = this.sceneLighting.ambient;
    const brightness = this.sceneLighting.brightness;

    // Применяем тонирование: смешиваем с ambient и применяем яркость
    r = r * brightness * (0.6 + ar * 2) * intensity;
    g = g * brightness * (0.6 + ag * 2) * intensity;
    b = b * brightness * (0.6 + ab * 2) * intensity;

    // Clamp
    r = Math.min(1, Math.max(0, r));
    g = Math.min(1, Math.max(0, g));
    b = Math.min(1, Math.max(0, b));

    return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
  }

  /** Показать эффект попадания */
  public showHitEffect(): void {
    // 2D частицы отключены - всё в 3D шейдере
    this.hitFlash = 0.5;
  }

  /** Показать эффект сплеш-атаки */
  public showSplashEffect(): void {
    // 2D частицы отключены
    this.hitFlash = 0.6;
  }

  /** Показать сплеш-волну */
  public showSplashWave(yaw: number): void {
    // 2D частицы отключены
    this.splashWaveYaw = yaw;
    this.hitFlash = 0.5;
  }

  /** Создать частицы волны (оптимизировано) */
  private spawnWaveParticles(): void {
    if (this.particles.length > WeaponRenderer.MAX_PARTICLES) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const colors = ['#00ffff', '#00e5ff', '#00bfff', '#40e0d0'];

    // Частицы расходятся горизонтально (уменьшено с 30 до 12)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI - Math.PI / 2;
      const speed = 600 + Math.random() * 300;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.3,
        size: 5 + Math.random() * 6,
        color: colors[i % colors.length],
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.4 + Math.random() * 0.3,
        type: 'spark',
      });
    }

    // Большие капли энергии (уменьшено с 15 до 6)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 600 + Math.random() * 300;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.2,
        size: 12 + Math.random() * 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        type: 'fragment',
      });
    }
  }

  /** Создать осколки врага (оптимизировано!) */
  private spawnFragments(): void {
    // Ограничиваем количество частиц
    if (this.particles.length > WeaponRenderer.MAX_PARTICLES) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const colors = ['#00ff00', '#33ff00', '#66ff33', '#00ff66'];

    // Крупные осколки (уменьшено с 12 до 6)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 400 + Math.random() * 400;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        size: 6 + Math.random() * 8,
        color: colors[i % colors.length],
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        type: 'fragment',
      });
    }

    // Искры (уменьшено с 25 до 10)
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 300;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 20,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 2 + Math.random() * 3,
        color: colors[i % colors.length],
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.3 + Math.random() * 0.2,
        type: 'spark',
      });
    }
  }

  /** Обновить частицы (оптимизировано) */
  private updateParticles(dt: number): void {
    const gravity = 800;
    const heightLimit = this.height + 50;
    let writeIndex = 0;

    // Обновляем и фильтруем за один проход (без splice)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Физика
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;
      p.vx *= 0.98;
      p.life -= dt;

      // Сохраняем живые частицы
      if (p.life > 0 && p.y < heightLimit) {
        this.particles[writeIndex++] = p;
      }
    }

    // Обрезаем массив
    this.particles.length = writeIndex;
  }

  /** Рендер частиц (оптимизировано - без градиентов и теней!) */
  private renderParticles(ctx: CanvasRenderingContext2D): void {
    // Отключаем тени для производительности
    ctx.shadowBlur = 0;

    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / p.maxLife * 2);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'fragment') {
        // Простой круг вместо сложной формы
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Яркий центр
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Искра - простой круг
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Короткий хвост
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
      }
    }

    // Восстанавливаем альфу
    ctx.globalAlpha = 1;
  }

  public render(state: WeaponState, time: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 2D частицы и волны отключены - всё в 3D шейдере

    const scale = Math.min(this.width, this.height) / 600;

    // Покачивание
    const bobX = Math.sin(state.bobPhase) * 8 * scale;
    const bobY = Math.abs(Math.sin(state.bobPhase * 2)) * 6 * scale;

    // Затухание вспышки попадания
    if (this.hitFlash > 0) {
      this.hitFlash -= 0.04;
    }

    // 2D сплеш-волна отключена - всё в 3D шейдере

    ctx.save();

    // Позиция оружия
    let baseX = this.width * 0.65;
    let baseY = this.height * 0.8;
    let rotation = -0.4;

    // Анимация атаки - мощный взмах
    if (this.isAttacking) {
      const t = this.attackProgress;
      // Быстрый взмах с замедлением в конце
      const easeOut = 1 - Math.pow(1 - t, 3);
      // Сплеш-атака - более мощный горизонтальный взмах
      const swingAngle = Math.sin(easeOut * Math.PI) * (this.isSplashAttack ? 3.2 : 2.5);
      rotation = -0.4 - swingAngle;

      // Движение к центру и вверх (сплеш движется сильнее)
      const moveMultiplier = this.isSplashAttack ? 1.5 : 1.0;
      baseX -= Math.sin(t * Math.PI) * this.width * 0.3 * moveMultiplier;
      baseY -= Math.sin(t * Math.PI) * this.height * 0.15 * moveMultiplier;
    }

    ctx.translate(baseX + bobX, baseY + bobY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Катана теперь в 3D шейдере!
    // 2D эффекты взмаха отключены - всё в 3D
    
    ctx.restore();

    // 2D частицы отключены - всё в 3D шейдере

    // Полноэкранная вспышка при попадании
    if (this.hitFlash > 0.5) {
      this.drawScreenFlash(ctx, this.isSplashAttack ? 'charged' : 'katana');
    }
  }

  /** Применить тонирование под освещение сцены */
  private applySceneLighting(ctx: CanvasRenderingContext2D): void {
    const [ar, ag, ab] = this.sceneLighting.ambient;
    const brightness = this.sceneLighting.brightness;
    
    // Сначала затемняем (multiply) - только поверх катаны
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    
    // Тёмный слой для затемнения
    const darkFactor = brightness * 0.6; // Затемняем до 60% от яркости сцены
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - darkFactor})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
    
    // Добавляем цветовой оттенок сцены
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    
    // Цвет ambient сцены
    const tintR = Math.floor(ar * 255 * 2);
    const tintG = Math.floor(ag * 255 * 2);
    const tintB = Math.floor(ab * 255 * 2);
    
    ctx.fillStyle = `rgba(${tintR}, ${tintG}, ${tintB}, 0.25)`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  /** Рисуем индикатор заряда */
  private drawChargeIndicator(ctx: CanvasRenderingContext2D, time: number): void {
    // 3 точки энергии вдоль лезвия
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    
    for (let i = 0; i < 3; i++) {
      const y = -50 - i * 60;
      const pulse = 0.7 + 0.3 * Math.sin(time * 5 + i);
      
      if (this.splashCharges > i) {
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Внешнее кольцо
        ctx.strokeStyle = `rgba(0, 255, 255, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, y, 12 + Math.sin(time * 8 + i) * 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(0, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }

  /** Эффект сплеш-волны на экране */
  private drawSplashWaveEffect(ctx: CanvasRenderingContext2D, time: number): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.max(this.width, this.height) * 0.8;
    const currentRadius = this.splashWaveProgress * maxRadius;
    
    ctx.save();
    
    // Несколько концентрических волн
    for (let i = 0; i < 3; i++) {
      const r = currentRadius - i * 30;
      if (r > 0) {
        const alpha = (1 - this.splashWaveProgress) * (0.5 - i * 0.1);
        
        // Основная волна
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 8 - i * 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        // Рисуем полукруг вперёд (горизонтальная волна)
        ctx.ellipse(centerX, centerY + 100, r, r * 0.3, 0, Math.PI, 0);
        ctx.stroke();
        
        // Искрящаяся линия
        if (i === 0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 100, r - 5, (r - 5) * 0.3, 0, Math.PI, 0);
          ctx.stroke();
        }
      }
    }
    
    // Добавляем искры на волне
    const sparkCount = Math.floor((1 - this.splashWaveProgress) * 20);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.PI + Math.random() * Math.PI;
      const sparkR = currentRadius + (Math.random() - 0.5) * 20;
      const x = centerX + Math.cos(angle) * sparkR;
      const y = centerY + 100 + Math.sin(angle) * sparkR * 0.3;
      const size = 2 + Math.random() * 4;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /** След сплеш-атаки (более широкий и яркий) */
  private drawSplashSlash(ctx: CanvasRenderingContext2D, progress: number, time: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Основной широкий след - бирюзовый
    const cyanGrad = ctx.createLinearGradient(-200, -350, 50, 0);
    cyanGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
    cyanGrad.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
    cyanGrad.addColorStop(0.6, 'rgba(0, 255, 255, 1)');
    cyanGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');

    ctx.strokeStyle = cyanGrad;
    ctx.lineWidth = 30 + Math.sin(progress * Math.PI) * 20; // Шире!
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 40;

    ctx.beginPath();
    ctx.moveTo(-200, -350);
    ctx.quadraticCurveTo(
      -100 + Math.sin(time * 30) * 20,
      -200,
      50, 0
    );
    ctx.stroke();

    // Внутреннее ядро - белое
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Дополнительные волны
    for (let i = 0; i < 3; i++) {
      const offset = i * 15;
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.4 - i * 0.1})`;
      ctx.lineWidth = 4 - i;
      ctx.beginPath();
      ctx.moveTo(-200 - offset, -350 + offset);
      ctx.quadraticCurveTo(
        -100 - offset + Math.sin(time * 30 + i) * 15,
        -200 + offset,
        50 - offset, 0 + offset
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawKatana(ctx: CanvasRenderingContext2D, _state: WeaponState, time: number): void {
    // === РУКА ===
    ctx.fillStyle = '#8a7a6a';
    ctx.beginPath();
    ctx.ellipse(0, 80, 40, 50, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // === ЦУКА (рукоять) ===
    const tsukaGrad = ctx.createLinearGradient(0, 40, 0, 160);
    tsukaGrad.addColorStop(0, '#2a1a1a');
    tsukaGrad.addColorStop(0.5, '#1a0a0a');
    tsukaGrad.addColorStop(1, '#2a1a1a');

    ctx.fillStyle = tsukaGrad;
    ctx.beginPath();
    ctx.moveTo(-14, 40);
    ctx.lineTo(14, 40);
    ctx.lineTo(12, 160);
    ctx.lineTo(-12, 160);
    ctx.closePath();
    ctx.fill();

    // Обмотка с неоном
    ctx.strokeStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = 50 + i * 11;
      const glow = 0.5 + 0.5 * Math.sin(time * 3 + i * 0.5);
      ctx.strokeStyle = `rgba(255, 0, 255, ${glow})`;
      ctx.beginPath();
      ctx.moveTo(-12, y);
      ctx.lineTo(0, y + 5);
      ctx.lineTo(12, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // === ЦУБА (гарда) - неоновая ===
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.ellipse(0, 35, 35, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Неоновый контур гарды
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 35, 32, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === КЛИНОК ===
    // Основа
    const bladeGrad = ctx.createLinearGradient(-10, 0, 10, 0);
    bladeGrad.addColorStop(0, '#8080a0');
    bladeGrad.addColorStop(0.3, '#c0c0e0');
    bladeGrad.addColorStop(0.5, '#ffffff');
    bladeGrad.addColorStop(0.7, '#c0c0e0');
    bladeGrad.addColorStop(1, '#6060a0');

    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-10, 30);
    ctx.lineTo(10, 30);
    ctx.lineTo(7, -280);
    ctx.lineTo(0, -320);
    ctx.lineTo(-5, -280);
    ctx.closePath();
    ctx.fill();

    // Неоновая кромка
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 30);
    ctx.lineTo(6, -280);
    ctx.lineTo(0, -320);
    ctx.stroke();

    // Пульсирующий хамон
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + 0.3 * Math.sin(time * 4)})`;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 30);
    for (let i = 0; i < 25; i++) {
      const y = 30 - i * 13;
      const wave = Math.sin(i * 0.7 + time * 2) * 4;
      ctx.lineTo(-4 + wave, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(3, 25);
    ctx.lineTo(5, 25);
    ctx.lineTo(3, -270);
    ctx.lineTo(1, -270);
    ctx.closePath();
    ctx.fill();
  }

  private drawRetrowaveSlash(ctx: CanvasRenderingContext2D, progress: number, time: number): void {
    ctx.save();
    ctx.translate(0, -150);

    const alpha = Math.sin(progress * Math.PI);

    // Множественные неоновые дуги
    const colors = [
      { color: '#ff00ff', offset: 0 },
      { color: '#00ffff', offset: 15 },
      { color: '#ff0080', offset: 30 },
      { color: '#8000ff', offset: 45 },
    ];

    for (const { color, offset } of colors) {
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.lineWidth = 10 - offset * 0.15;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(0, 100, 200 + offset, -Math.PI * 0.7, Math.PI * 0.15);
      ctx.globalAlpha = alpha * (1 - offset * 0.015);
      ctx.stroke();
    }

    // Искры
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 15; i++) {
      const angle = -Math.PI * 0.7 + (Math.PI * 0.85) * (i / 15) + Math.sin(time * 10 + i) * 0.1;
      const dist = 200 + Math.random() * 50;
      const x = Math.cos(angle) * dist;
      const y = 100 + Math.sin(angle) * dist;

      const sparkColor = i % 2 === 0 ? '#ff00ff' : '#00ffff';
      ctx.fillStyle = sparkColor;
      ctx.shadowColor = sparkColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Рисуем ТОПОР ХАОСА - как катана, но с широким лезвием! */
  private drawAxe(ctx: CanvasRenderingContext2D, _state: WeaponState, time: number, charges: number): void {
    // === РУКА ===
    ctx.fillStyle = '#8a7a6a';
    ctx.beginPath();
    ctx.ellipse(0, 80, 40, 50, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // === РУКОЯТЬ (как у катаны) ===
    const tsukaGrad = ctx.createLinearGradient(0, 40, 0, 160);
    tsukaGrad.addColorStop(0, '#3a2010');
    tsukaGrad.addColorStop(0.5, '#2a1005');
    tsukaGrad.addColorStop(1, '#3a2010');

    ctx.fillStyle = tsukaGrad;
    ctx.beginPath();
    ctx.moveTo(-14, 40);
    ctx.lineTo(14, 40);
    ctx.lineTo(12, 160);
    ctx.lineTo(-12, 160);
    ctx.closePath();
    ctx.fill();

    // Обмотка - огненная (как у катаны но оранжевая)
    ctx.strokeStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = 50 + i * 11;
      const glow = 0.5 + 0.5 * Math.sin(time * 4 + i * 0.5);
      ctx.strokeStyle = `rgba(255, 100, 0, ${glow})`;
      ctx.beginPath();
      ctx.moveTo(-12, y);
      ctx.lineTo(0, y + 5);
      ctx.lineTo(12, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // === ГАРДА (как цуба но квадратная) ===
    ctx.fillStyle = '#2a2020';
    ctx.beginPath();
    ctx.rect(-30, 25, 60, 20);
    ctx.fill();

    // Огненный контур гарды
    ctx.strokeStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.strokeRect(-28, 27, 56, 16);
    ctx.shadowBlur = 0;

    // === ЛЕЗВИЕ ТОПОРА (широкое, как секира) ===
    // Основа - широкий клинок
    const bladeGrad = ctx.createLinearGradient(-40, 0, 40, 0);
    bladeGrad.addColorStop(0, '#6060a0');
    bladeGrad.addColorStop(0.2, '#8080b0');
    bladeGrad.addColorStop(0.4, '#b0b0d0');
    bladeGrad.addColorStop(0.5, '#e0e0f0');
    bladeGrad.addColorStop(0.6, '#b0b0d0');
    bladeGrad.addColorStop(0.8, '#8080b0');
    bladeGrad.addColorStop(1, '#6060a0');

    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    // Широкое лезвие секиры
    ctx.moveTo(-12, 20);
    ctx.lineTo(12, 20);
    ctx.lineTo(15, -50);
    // Расширение к голове
    ctx.lineTo(50, -180);
    ctx.lineTo(55, -220);
    // Острие
    ctx.lineTo(0, -300);
    // Обратная сторона
    ctx.lineTo(-55, -220);
    ctx.lineTo(-50, -180);
    ctx.lineTo(-15, -50);
    ctx.closePath();
    ctx.fill();

    // Огненная кромка (как неоновая у катаны но оранжевая)
    ctx.strokeStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 20);
    ctx.lineTo(52, -180);
    ctx.lineTo(57, -220);
    ctx.lineTo(0, -305);
    ctx.stroke();

    // Вторая кромка
    ctx.beginPath();
    ctx.moveTo(-14, 20);
    ctx.lineTo(-52, -180);
    ctx.lineTo(-57, -220);
    ctx.lineTo(0, -305);
    ctx.stroke();

    // Пульсирующая линия по центру (как хамон)
    ctx.strokeStyle = `rgba(255, 150, 0, ${0.5 + 0.3 * Math.sin(time * 5)})`;
    ctx.shadowColor = '#ff9900';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    for (let i = 0; i < 20; i++) {
      const y = 15 - i * 15;
      const wave = Math.sin(i * 0.8 + time * 3) * (3 + i * 0.3);
      ctx.lineTo(wave, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Индикатор зарядов - огненные точки вдоль лезвия
    for (let i = 0; i < 5; i++) {
      const y = -50 - i * 45;
      
      if (i < charges) {
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = '#333333';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.arc(0, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(5, 15);
    ctx.lineTo(8, 15);
    ctx.lineTo(40, -170);
    ctx.lineTo(37, -170);
    ctx.closePath();
    ctx.fill();
  }

  /** След от топора - как у катаны но с разлётом! */
  private drawAxeSlash(ctx: CanvasRenderingContext2D, progress: number, time: number): void {
    ctx.save();
    ctx.translate(0, -150);

    const alpha = Math.sin(progress * Math.PI);

    // Огненные дуги (как у катаны)
    const colors = [
      { color: '#ff6600', offset: 0 },
      { color: '#ff9900', offset: 15 },
      { color: '#ff3300', offset: 30 },
      { color: '#ffcc00', offset: 45 },
    ];

    for (const { color, offset } of colors) {
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.lineWidth = 12 - offset * 0.15;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(0, 100, 200 + offset, -Math.PI * 0.7, Math.PI * 0.15);
      ctx.globalAlpha = alpha * (1 - offset * 0.015);
      ctx.stroke();
    }

    // Искры разлетаются!
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 15; i++) {
      const angle = -Math.PI * 0.7 + (Math.PI * 0.85) * (i / 15) + Math.sin(time * 10 + i) * 0.1;
      const dist = 200 + Math.random() * 50;
      const x = Math.cos(angle) * dist;
      const y = 100 + Math.sin(angle) * dist;

      const sparkColor = i % 2 === 0 ? '#ff6600' : '#ffaa00';
      ctx.fillStyle = sparkColor;
      ctx.shadowColor = sparkColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Создать огненные осколки при сплеше топора (оптимизировано) */
  public spawnAxeSplash(): void {
    if (this.particles.length > WeaponRenderer.MAX_PARTICLES) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const colors = ['#ff6600', '#ff9900', '#ff3300', '#ffcc00'];

    // Крупные огненные осколки (уменьшено с 20 до 8)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 400 + Math.random() * 500;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 60,
        y: centerY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        size: 8 + Math.random() * 10,
        color: colors[i % colors.length],
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        type: 'fragment',
      });
    }

    // Искры (уменьшено с 35 до 12)
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 250 + Math.random() * 400;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 30,
        y: centerY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 2 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.3 + Math.random() * 0.3,
        type: 'spark',
      });
    }
  }

  private drawHitGlow(ctx: CanvasRenderingContext2D, intensity: number, weaponType: WeaponType = 'katana'): void {
    ctx.save();
    ctx.globalAlpha = intensity;

    if (weaponType === 'charged') {
      // Электрическое свечение для заряженной катаны
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 50 * intensity;
      ctx.lineWidth = 10;

      // Обводка всего лезвия
      ctx.beginPath();
      ctx.moveTo(9, 30);
      ctx.lineTo(6, -280);
      ctx.lineTo(0, -320);
      ctx.stroke();

      // Дополнительные волны энергии
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#0088ff';
      ctx.shadowBlur = 30 * intensity;
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, -150, 50 + i * 30, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Неоновое свечение для катаны
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 30 * intensity;
      ctx.lineWidth = 6;

      ctx.beginPath();
      ctx.moveTo(9, 30);
      ctx.lineTo(6, -280);
      ctx.lineTo(0, -320);
      ctx.stroke();

      ctx.strokeStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 20 * intensity;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawScreenFlash(ctx: CanvasRenderingContext2D, weaponType: WeaponType = 'katana'): void {
    ctx.save();
    ctx.resetTransform();

    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width
    );
    
    if (weaponType === 'charged') {
      // Электрическая вспышка для заряженной катаны
      gradient.addColorStop(0, `rgba(255, 255, 255, ${this.hitFlash * 0.6})`);
      gradient.addColorStop(0.2, `rgba(0, 255, 255, ${this.hitFlash * 0.4})`);
      gradient.addColorStop(0.5, `rgba(0, 150, 255, ${this.hitFlash * 0.2})`);
      gradient.addColorStop(0.8, `rgba(0, 80, 255, ${this.hitFlash * 0.1})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      // Неоновая вспышка для катаны
      gradient.addColorStop(0, `rgba(255, 255, 255, ${this.hitFlash * 0.4})`);
      gradient.addColorStop(0.3, `rgba(255, 0, 255, ${this.hitFlash * 0.2})`);
      gradient.addColorStop(0.6, `rgba(0, 255, 255, ${this.hitFlash * 0.1})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }
}
