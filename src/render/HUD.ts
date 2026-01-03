/**
 * HUD для Samurai Pool Arena
 * Здоровье, волна, счёт, эффекты
 */
export class HUD {
  private healthEl: HTMLElement | null;
  private ammoEl: HTMLElement | null;
  private fragsEl: HTMLElement | null;
  private crosshairEl: HTMLElement | null;
  private hitmarkerEl: HTMLElement | null;
  private reloadEl: HTMLElement | null;
  private waveEl: HTMLElement | null;
  private messageEl: HTMLElement | null;
  private damageOverlay: HTMLElement | null;

  constructor() {
    this.healthEl = document.getElementById('health-value');
    this.ammoEl = document.getElementById('ammo-value');
    this.fragsEl = document.getElementById('frags-value');
    this.crosshairEl = document.getElementById('crosshair');
    this.hitmarkerEl = document.getElementById('hitmarker');
    this.reloadEl = document.getElementById('reload-indicator');
    
    // Скрываем перезарядку - катане не нужна
    if (this.reloadEl) {
      this.reloadEl.style.display = 'none';
    }
    
    // Создаём элементы для волн
    this.waveEl = this.createWaveElement();
    this.messageEl = this.createMessageElement();
    this.damageOverlay = this.createDamageOverlay();
  }

  /** Создать элемент волны */
  private createWaveElement(): HTMLElement {
    let el = document.getElementById('wave-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wave-indicator';
      el.style.cssText = `
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        font-family: 'Orbitron', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #00ffff;
        text-shadow: 
          0 0 10px #00ffff,
          0 0 20px rgba(0, 255, 255, 0.5);
        opacity: 0;
        padding: 12px 30px;
        border: 2px solid rgba(255, 0, 255, 0.6);
        border-radius: 4px;
        box-shadow: 
          0 0 15px rgba(255, 0, 255, 0.3),
          inset 0 0 20px rgba(0, 255, 255, 0.05);
        background: linear-gradient(180deg, 
          rgba(0, 0, 20, 0.85) 0%,
          rgba(10, 0, 30, 0.9) 100%
        );
        backdrop-filter: blur(5px);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 4px;
      `;
      
      // Тонкие угловые акценты
      const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      corners.forEach(corner => {
        const cornerEl = document.createElement('div');
        const [v, h] = corner.split('-');
        cornerEl.style.cssText = `
          position: absolute;
          ${v}: -2px;
          ${h}: -2px;
          width: 12px;
          height: 12px;
          border-${v}: 2px solid #00ffff;
          border-${h}: 2px solid #00ffff;
        `;
        el!.appendChild(cornerEl);
      });
      
      document.body.appendChild(el);
    }
    return el;
  }

  /** Создать элемент сообщений */
  private createMessageElement(): HTMLElement {
    let el = document.getElementById('game-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'game-message';
      el.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Orbitron', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: #ff0044;
        text-shadow: 
          0 0 15px #ff0044,
          0 0 30px rgba(255, 0, 68, 0.4);
        opacity: 0;
        padding: 25px 50px;
        border: 2px solid rgba(255, 0, 68, 0.7);
        border-radius: 4px;
        box-shadow: 
          0 0 20px rgba(255, 0, 68, 0.4),
          inset 0 0 30px rgba(255, 0, 68, 0.05);
        background: linear-gradient(180deg, 
          rgba(20, 0, 5, 0.9) 0%,
          rgba(30, 0, 10, 0.95) 100%
        );
        backdrop-filter: blur(5px);
        transition: opacity 0.4s;
        pointer-events: none;
        text-align: center;
        z-index: 1000;
        letter-spacing: 4px;
      `;
      
      // Угловые декорации
      const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      corners.forEach(corner => {
        const cornerEl = document.createElement('div');
        const [v, h] = corner.split('-');
        cornerEl.style.cssText = `
          position: absolute;
          ${v}: -2px;
          ${h}: -2px;
          width: 15px;
          height: 15px;
          border-${v}: 2px solid #ff0044;
          border-${h}: 2px solid #ff0044;
        `;
        el!.appendChild(cornerEl);
      });
      
      document.body.appendChild(el);
    }
    return el;
  }

  /** Создать оверлей урона */
  private createDamageOverlay(): HTMLElement {
    let el = document.getElementById('damage-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'damage-overlay';
      el.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, 
          rgba(0, 255, 0, 0.3) 0%,
          rgba(50, 255, 50, 0.4) 30%,
          rgba(0, 150, 0, 0.5) 70%,
          rgba(0, 100, 0, 0.6) 100%
        );
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
        z-index: 999;
      `;
      document.body.appendChild(el);
    }
    return el;
  }

  /** Оверлей замедления */
  private slowOverlay: HTMLElement | null = null;

  /** Показать урон с определённым цветом */
  public showDamage(color: 'green' | 'purple' = 'green'): void {
    if (this.damageOverlay) {
      if (color === 'purple') {
        // Фиолетовый для фантома + ЗАМЕДЛЕНИЕ
        this.damageOverlay.style.background = `radial-gradient(circle, 
          rgba(100, 0, 150, 0.3) 0%,
          rgba(80, 0, 120, 0.4) 30%,
          rgba(50, 0, 80, 0.5) 70%,
          rgba(30, 0, 50, 0.6) 100%
        )`;
        // Показываем оверлей замедления
        this.showSlowdown(2.0);
      } else {
        // Зелёный для бейнлинга
        this.damageOverlay.style.background = `radial-gradient(circle, 
          rgba(0, 255, 0, 0.3) 0%,
          rgba(50, 255, 50, 0.4) 30%,
          rgba(0, 150, 0, 0.5) 70%,
          rgba(0, 100, 0, 0.6) 100%
        )`;
      }
      this.damageOverlay.style.opacity = '1';
      setTimeout(() => {
        if (this.damageOverlay) this.damageOverlay.style.opacity = '0';
      }, 150);
    }
  }

  /** Показать эффект замедления */
  public showSlowdown(duration: number): void {
    if (!this.slowOverlay) {
      this.slowOverlay = document.createElement('div');
      this.slowOverlay.id = 'slow-overlay';
      this.slowOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle,
          transparent 0%,
          rgba(50, 0, 80, 0.2) 50%,
          rgba(30, 0, 60, 0.4) 100%
        );
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(this.slowOverlay);
    }

    this.slowOverlay.style.opacity = '1';
    
    // Эффект пульсации
    this.slowOverlay.animate([
      { filter: 'hue-rotate(0deg) brightness(1)' },
      { filter: 'hue-rotate(20deg) brightness(1.1)' },
      { filter: 'hue-rotate(0deg) brightness(1)' }
    ], {
      duration: 500,
      iterations: Math.ceil(duration * 2)
    });

    setTimeout(() => {
      if (this.slowOverlay) {
        this.slowOverlay.style.opacity = '0';
      }
    }, duration * 1000);
  }

  /** Обновить здоровье */
  public updateHealth(health: number, maxHealth: number): void {
    if (this.healthEl) {
      this.healthEl.textContent = Math.floor(health).toString();
      
      const ratio = health / maxHealth;
      if (ratio > 0.5) {
        this.healthEl.style.color = '#00ffaa';
      } else if (ratio > 0.25) {
        this.healthEl.style.color = '#ffaa00';
      } else {
        this.healthEl.style.color = '#ff4444';
      }
    }
  }

  /** Обновить врагов */
  public updateAmmo(_wave: number, enemiesLeft: number): void {
    if (this.ammoEl) {
      this.ammoEl.textContent = `⚔️ ${enemiesLeft}`;
      this.ammoEl.style.color = enemiesLeft > 0 ? '#00ffff' : '#00ff00';
    }
  }

  /** Обновить счёт */
  public updateFrags(frags: number): void {
    if (this.fragsEl) {
      this.fragsEl.textContent = frags.toString();
    }
  }

  /** Показать волну */
  public showWave(wave: number): void {
    if (this.waveEl) {
      this.waveEl.textContent = `ВОЛНА ${wave}`;
      this.waveEl.style.opacity = '1';
      this.waveEl.style.transform = 'translateX(-50%) scale(1)';
      this.waveEl.style.color = '#00ffff';
      this.waveEl.style.borderColor = 'rgba(255, 0, 255, 0.6)';
      
      // Плавное появление сверху
      this.waveEl.animate([
        { transform: 'translateX(-50%) translateY(-20px) scale(0.9)', opacity: 0 },
        { transform: 'translateX(-50%) translateY(0) scale(1)', opacity: 1 }
      ], { duration: 300, easing: 'ease-out' });
      
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.animate([
            { opacity: 1 },
            { opacity: 0 }
          ], { duration: 250, easing: 'ease-in' });
          setTimeout(() => {
            if (this.waveEl) this.waveEl.style.opacity = '0';
          }, 230);
        }
      }, 1500);
    }
  }

  /** Показать завершение волны */
  public showWaveComplete(wave: number): void {
    if (this.waveEl) {
      this.waveEl.textContent = `✓ ВОЛНА ${wave}`;
      this.waveEl.style.color = '#00ff88';
      this.waveEl.style.borderColor = 'rgba(0, 255, 136, 0.6)';
      this.waveEl.style.opacity = '1';
      this.waveEl.style.transform = 'translateX(-50%) scale(1)';
      
      // Мягкая победная анимация
      this.waveEl.animate([
        { transform: 'translateX(-50%) scale(0.95)', opacity: 0 },
        { transform: 'translateX(-50%) scale(1.02)', opacity: 1 },
        { transform: 'translateX(-50%) scale(1)', opacity: 1 }
      ], { duration: 350, easing: 'ease-out' });
      
      // Показать "пройдена" потом "готовься"
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.textContent = `ГОТОВЬСЯ...`;
          this.waveEl.style.color = '#ffaa00';
          this.waveEl.style.borderColor = 'rgba(255, 170, 0, 0.5)';
        }
      }, 1200);
      
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.style.opacity = '0';
          this.waveEl.style.color = '#00ffff';
          this.waveEl.style.borderColor = 'rgba(255, 0, 255, 0.6)';
        }
      }, 3500);
    }
  }

  /** Показать Game Over */
  public showGameOver(score: number, wave: number): void {
    if (this.messageEl) {
      this.messageEl.innerHTML = `
        ☠ GAME OVER ☠<br>
        <div style="
          font-size: 24px; 
          color: #00ffff; 
          margin-top: 20px;
          text-shadow: 0 0 10px #00ffff;
          letter-spacing: 3px;
        ">
          СЧЁТ: <span style="color: #ff00ff;">${score}</span><br>
          ВОЛНА: <span style="color: #ff00ff;">${wave}</span>
        </div>
      `;
      this.messageEl.style.opacity = '1';
      
      // Драматичная анимация
      this.messageEl.animate([
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
      ], { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      
      setTimeout(() => {
        if (this.messageEl) {
          this.messageEl.animate([
            { opacity: 1 },
            { opacity: 0 }
          ], { duration: 400 });
          setTimeout(() => {
            if (this.messageEl) this.messageEl.style.opacity = '0';
          }, 380);
        }
      }, 2500);
    }
  }

  /** Показать индикатор перезарядки - не используется для катаны */
  public showReloading(_show: boolean): void {
    // Катане не нужна перезарядка
  }

  /** Расширить прицел */
  public expandCrosshair(): void {
    if (this.crosshairEl) {
      this.crosshairEl.classList.add('shooting');
      setTimeout(() => {
        this.crosshairEl?.classList.remove('shooting');
      }, 100);
    }
  }

  /** Показать хитмаркер */
  public showHitmarker(isKill: boolean = false): void {
    if (this.hitmarkerEl) {
      this.hitmarkerEl.className = 'hitmarker active';
      if (isKill) {
        this.hitmarkerEl.classList.add('kill');
      }
      
      setTimeout(() => {
        this.hitmarkerEl?.classList.remove('active', 'kill');
      }, 150);
    }
  }

  /** Эффект урона (алиас) */
  public showDamageEffect(): void {
    this.showDamage('green');
  }

  /** Показать сообщение */
  public showMessage(text: string, color: string = 'white'): void {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${color};
      text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
      pointer-events: none;
      z-index: 1100;
      opacity: 1;
      animation: messageFloat 1s ease-out forwards;
    `;
    msg.textContent = text;
    document.body.appendChild(msg);

    // Добавляем стиль анимации если его нет
    if (!document.getElementById('message-anim-style')) {
      const style = document.createElement('style');
      style.id = 'message-anim-style';
      style.textContent = `
        @keyframes messageFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => msg.remove(), 1000);
  }

  /** Показать оверлей буйства */
  private rageOverlay: HTMLElement | null = null;

  public showRageOverlay(duration: number): void {
    if (!this.rageOverlay) {
      this.rageOverlay = document.createElement('div');
      this.rageOverlay.id = 'rage-overlay';
      this.rageOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle,
          transparent 0%,
          rgba(255, 50, 0, 0.15) 50%,
          rgba(255, 0, 0, 0.3) 100%
        );
        pointer-events: none;
        z-index: 997;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(this.rageOverlay);
    }

    this.rageOverlay.style.opacity = '1';
    
    // Пульсация красным
    this.rageOverlay.animate([
      { filter: 'hue-rotate(0deg) brightness(1)' },
      { filter: 'hue-rotate(-20deg) brightness(1.2)' },
      { filter: 'hue-rotate(0deg) brightness(1)' }
    ], {
      duration: 300,
      iterations: Math.ceil(duration * 3)
    });

    setTimeout(() => {
      if (this.rageOverlay) {
        this.rageOverlay.style.opacity = '0';
      }
    }, duration * 1000);
  }
}
