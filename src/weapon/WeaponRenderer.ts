import type { WeaponState } from '@/types';

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

  /** Вспышка попадания */
  private hitFlash = 0;

  /** Частицы */
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Показать эффект попадания - взрыв осколков! */
  public showHitEffect(): void {
    this.hitFlash = 1.0;
    this.spawnFragments();
  }

  /** Создать осколки врага (кислотная жижа!) */
  private spawnFragments(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    // Зелёные кислотные цвета
    const colors = ['#00ff00', '#33ff00', '#66ff33', '#00ff66', '#99ff00', '#00ff99'];

    // Крупные осколки
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 400 + Math.random() * 600;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200,
        size: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
        type: 'fragment',
      });
    }

    // Искры
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 500;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 30,
        y: centerY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.4 + Math.random() * 0.4,
        type: 'spark',
      });
    }
  }

  /** Обновить частицы */
  private updateParticles(dt: number): void {
    const gravity = 800;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Физика
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;

      // Затухание
      p.vx *= 0.98;

      // Время жизни
      p.life -= dt;

      // Удаляем мёртвые
      if (p.life <= 0 || p.y > this.height + 50) {
        this.particles.splice(i, 1);
      }
    }
  }

  /** Рендер частиц */
  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / p.maxLife * 2);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'fragment') {
        // Крупный осколок с градиентом
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, p.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;

        ctx.beginPath();
        // Неправильная форма осколка
        const points = 5 + Math.floor(Math.random() * 3);
        for (let j = 0; j < points; j++) {
          const angle = (j / points) * Math.PI * 2;
          const r = p.size * (0.5 + Math.random() * 0.5);
          const px = p.x + Math.cos(angle) * r;
          const py = p.y + Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Обводка
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();

      } else {
        // Искра
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Хвост
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  public render(state: WeaponState, time: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Обновляем частицы
    this.updateParticles(1 / 60);

    const scale = Math.min(this.width, this.height) / 600;

    // Покачивание
    const bobX = Math.sin(state.bobPhase) * 8 * scale;
    const bobY = Math.abs(Math.sin(state.bobPhase * 2)) * 6 * scale;

    // Затухание вспышки попадания
    if (this.hitFlash > 0) {
      this.hitFlash -= 0.04;
    }

    ctx.save();

    // Позиция катаны
    let baseX = this.width * 0.65;
    let baseY = this.height * 0.8;
    let rotation = -0.4;

    // Анимация атаки - мощный взмах
    if (this.isAttacking) {
      const t = this.attackProgress;
      // Быстрый взмах с замедлением в конце
      const easeOut = 1 - Math.pow(1 - t, 3);
      const swingAngle = Math.sin(easeOut * Math.PI) * 2.5;
      rotation = -0.4 - swingAngle;

      // Движение к центру и вверх
      baseX -= Math.sin(t * Math.PI) * this.width * 0.3;
      baseY -= Math.sin(t * Math.PI) * this.height * 0.2;
    }

    ctx.translate(baseX + bobX, baseY + bobY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Эффект следа ПЕРЕД катаной
    if (this.isAttacking && this.attackProgress > 0.05 && this.attackProgress < 0.8) {
      this.drawRetrowaveSlash(ctx, this.attackProgress, time);
    }

    // Катана
    this.drawKatana(ctx, state, time);

    // Эффект попадания на катане
    if (this.hitFlash > 0) {
      this.drawHitGlow(ctx, this.hitFlash);
    }

    ctx.restore();

    // Рендерим частицы поверх всего
    this.renderParticles(ctx);

    // Полноэкранная вспышка при попадании
    if (this.hitFlash > 0.5) {
      this.drawScreenFlash(ctx);
    }
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

  private drawHitGlow(ctx: CanvasRenderingContext2D, intensity: number): void {
    ctx.save();

    // Свечение на клинке при попадании
    ctx.globalAlpha = intensity;
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

    ctx.restore();
  }

  private drawScreenFlash(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.resetTransform();

    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.hitFlash * 0.4})`);
    gradient.addColorStop(0.3, `rgba(255, 0, 255, ${this.hitFlash * 0.2})`);
    gradient.addColorStop(0.6, `rgba(0, 255, 255, ${this.hitFlash * 0.1})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }
}
