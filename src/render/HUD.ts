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
  private weaponEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private altarScoreEl: HTMLElement | null;
  private dartsEl: HTMLElement | null;

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
    this.weaponEl = this.createWeaponElement();
    this.scoreEl = this.createScoreElement();
    this.altarScoreEl = this.createAltarScoreElement();
    this.dartsEl = this.createDartsElement();
    
    // Скрываем все HUD элементы до старта игры
    this.hideHUD();
  }
  
  /** Скрыть HUD (в главном меню) */
  public hideHUD(): void {
    const hudEl = document.getElementById('hud');
    if (hudEl) hudEl.style.opacity = '0';
    if (this.weaponEl) this.weaponEl.style.display = 'none';
    if (this.scoreEl) this.scoreEl.style.display = 'none';
    if (this.altarScoreEl) this.altarScoreEl.style.display = 'none';
    if (this.dartsEl) this.dartsEl.style.display = 'none';
    if (this.doubleJumpEl) this.doubleJumpEl.style.display = 'none';
    if (this.splashChargesEl) this.splashChargesEl.style.display = 'none';
  }
  
  /** Показать HUD (при старте игры) */
  public showHUD(): void {
    const hudEl = document.getElementById('hud');
    if (hudEl) hudEl.style.opacity = '1';
    if (this.weaponEl) this.weaponEl.style.display = 'block';
    if (this.scoreEl) this.scoreEl.style.display = 'block';
    if (this.altarScoreEl) this.altarScoreEl.style.display = 'block';
    if (this.dartsEl) this.dartsEl.style.display = 'block';
    if (this.doubleJumpEl) this.doubleJumpEl.style.display = 'block';
    // splashChargesEl показывается только когда есть заряды
  }
  
  /** Создать элемент количества дротиков - CYBERPUNK */
  private createDartsElement(): HTMLElement {
    let el = document.getElementById('darts-count');
    if (!el) {
      el = document.createElement('div');
      el.id = 'darts-count';
      el.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 102, 0, 0.6);
        padding: 6px 12px;
        background: linear-gradient(180deg, rgba(255,102,0,0.08) 0%, transparent 100%);
        border-top: 1px solid rgba(255, 102, 0, 0.4);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `;
      el.innerHTML = '◎ <span id="darts-value" style="font-family:Orbitron;font-size:16px;color:#ff6600;">0</span>';
      document.body.appendChild(el);
    }
    return el;
  }
  
  /** Создать элемент текущих очков - CYBERPUNK */
  private createScoreElement(): HTMLElement {
    let el = document.getElementById('score-carrying');
    if (!el) {
      el = document.createElement('div');
      el.id = 'score-carrying';
      el.style.cssText = `
        position: fixed;
        bottom: 105px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 204, 0, 0.6);
        padding: 6px 12px;
        background: linear-gradient(180deg, rgba(255,204,0,0.08) 0%, transparent 100%);
        border-top: 1px solid rgba(255, 204, 0, 0.4);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `;
      el.innerHTML = '✕ <span id="score-value" style="font-family:Orbitron;font-size:16px;color:#ffcc00;">0</span>';
      document.body.appendChild(el);
    }
    return el;
  }
  
  /** Создать элемент общего счёта алтарей - CYBERPUNK */
  private createAltarScoreElement(): HTMLElement {
    let el = document.getElementById('altar-score');
    if (!el) {
      el = document.createElement('div');
      el.id = 'altar-score';
      el.style.cssText = `
        position: fixed;
        bottom: 140px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(0, 240, 255, 0.6);
        padding: 8px 14px;
        background: linear-gradient(180deg, rgba(0,240,255,0.1) 0%, transparent 100%);
        border-top: 1px solid rgba(0, 240, 255, 0.5);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `;
      el.innerHTML = '⌂ <span id="altar-value" style="font-family:Orbitron;font-size:20px;color:#00f0ff;text-shadow:0 0 20px rgba(0,240,255,0.6);">0</span>';
      document.body.appendChild(el);
    }
    return el;
  }

  /** Создать элемент волны - CYBERPUNK TOAST */
  private createWaveElement(): HTMLElement {
    let el = document.getElementById('wave-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wave-indicator';
      el.style.cssText = `
        position: fixed;
        top: 12%;
        left: 50%;
        transform: translateX(-50%) skewX(-3deg);
        font-family: 'Orbitron', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #00f0ff;
        text-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
        opacity: 0;
        padding: 12px 50px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(0, 240, 255, 0.08) 10%, 
          rgba(0, 240, 255, 0.12) 50%, 
          rgba(0, 240, 255, 0.08) 90%, 
          transparent 100%
        );
        border-left: 2px solid rgba(0, 240, 255, 0.8);
        border-right: 2px solid rgba(0, 240, 255, 0.8);
        backdrop-filter: blur(4px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 8px;
        text-transform: uppercase;
      `;
      document.body.appendChild(el);
    }
    return el;
  }

  /** Создать элемент сообщений - CYBERPUNK STYLE */
  private createMessageElement(): HTMLElement {
    let el = document.getElementById('game-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'game-message';
      el.style.cssText = `
        position: fixed;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%) skewX(-2deg);
        font-family: 'Orbitron', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #ff3366;
        text-shadow: 0 0 40px rgba(255, 51, 102, 0.9), 0 2px 0 rgba(0,0,0,0.3);
        opacity: 0;
        padding: 18px 60px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(255, 51, 102, 0.1) 5%, 
          rgba(255, 51, 102, 0.15) 50%, 
          rgba(255, 51, 102, 0.1) 95%, 
          transparent 100%
        );
        border-top: 1px solid rgba(255, 51, 102, 0.5);
        border-bottom: 1px solid rgba(255, 51, 102, 0.5);
        backdrop-filter: blur(6px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        text-align: center;
        z-index: 1000;
        letter-spacing: 6px;
        text-transform: uppercase;
      `;
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

  /** Создать элемент оружия - CYBERPUNK */
  private createWeaponElement(): HTMLElement {
    let el = document.getElementById('weapon-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'weapon-indicator';
      el.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 120px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 10px;
        font-weight: 500;
        color: rgba(0, 240, 255, 0.5);
        letter-spacing: 3px;
        text-transform: uppercase;
        z-index: 100;
      `;
      el.textContent = '⚔ КАТАНА';
      document.body.appendChild(el);
    }
    return el;
  }

  /** Обновить индикатор оружия */
  public updateWeapon(weapon: 'katana' | 'axe', charges?: number): void {
    if (this.weaponEl) {
      if (weapon === 'katana') {
        this.weaponEl.textContent = '⚔️ КАТАНА';
        this.weaponEl.style.color = '#00ffff';
        this.weaponEl.style.borderColor = 'rgba(0, 255, 255, 0.5)';
      } else {
        this.weaponEl.textContent = `🪓 ТОПОР (${charges})`;
        this.weaponEl.style.color = '#ff8800';
        this.weaponEl.style.borderColor = 'rgba(255, 136, 0, 0.5)';
        
        // Мигание при малом количестве зарядов
        if (charges !== undefined && charges <= 2) {
          this.weaponEl.style.animation = 'pulse 0.5s infinite';
        } else {
          this.weaponEl.style.animation = 'none';
        }
      }
    }
  }

  /** Оверлей замедления */
  private slowOverlay: HTMLElement | null = null;

  /** Игрок получил урон (вибрация по общей настройке студии) */
  public onDamage?: () => void;

  /** Показать урон с определённым цветом */
  public showDamage(color: 'green' | 'purple' = 'green'): void {
    this.onDamage?.();
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
  
  /** Обновить текущие очки (несёт игрок) */
  public updateCarryingScore(score: number): void {
    const valueEl = document.getElementById('score-value');
    if (valueEl) {
      valueEl.textContent = score.toString();
      
      // Пульсация при изменении
      if (this.scoreEl) {
        this.scoreEl.style.transform = 'scale(1.1)';
        setTimeout(() => {
          if (this.scoreEl) this.scoreEl.style.transform = 'scale(1)';
        }, 100);
      }
    }
  }
  
  /** Обновить общий счёт алтарей */
  public updateAltarScore(total: number): void {
    const valueEl = document.getElementById('altar-value');
    if (valueEl) {
      valueEl.textContent = total.toString();
      
      // Яркая вспышка при обновлении
      if (this.altarScoreEl) {
        this.altarScoreEl.style.boxShadow = '0 0 30px #00ffaa';
        setTimeout(() => {
          if (this.altarScoreEl) this.altarScoreEl.style.boxShadow = '';
        }, 300);
      }
    }
  }
  
  /** Обновить количество дротиков */
  public updateDarts(count: number): void {
    const valueEl = document.getElementById('darts-value');
    if (valueEl) {
      valueEl.textContent = count.toString();
      
      // Цвет в зависимости от количества
      if (this.dartsEl) {
        if (count === 0) {
          this.dartsEl.style.opacity = '0.5';
        } else {
          this.dartsEl.style.opacity = '1';
        }
      }
    }
  }

  /** Обновить заряды сплеш-волны */
  public updateSplashCharges(charges: number): void {
    if (!this.splashChargesEl) {
      this.createSplashChargesElement();
    }
    
    if (this.splashChargesEl) {
      if (charges > 0) {
        this.splashChargesEl.style.display = 'block';
        this.splashChargesEl.innerHTML = `⚡ ВОЛНА: ${'●'.repeat(charges)}${'○'.repeat(3 - charges)}`;
        this.splashChargesEl.style.color = '#00ffff';
        this.splashChargesEl.style.textShadow = '0 0 10px #00ffff, 0 0 20px #00ffff';
      } else {
        this.splashChargesEl.style.display = 'none';
      }
    }
  }

  /** Создать элемент зарядов */
  private splashChargesEl: HTMLElement | null = null;
  
  /** Элемент кулдауна двойного прыжка */
  private doubleJumpEl: HTMLElement | null = null;
  
  private createSplashChargesElement(): void {
    this.splashChargesEl = document.createElement('div');
    this.splashChargesEl.id = 'splash-charges';
    this.splashChargesEl.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      font-family: 'Orbitron', 'Audiowide', monospace;
      font-size: 18px;
      color: #00ffff;
      text-shadow: 0 0 10px #00ffff;
      letter-spacing: 2px;
      display: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.splashChargesEl);
  }

  /** Обновить индикатор двойного прыжка - иконка запрета */
  public updateDoubleJump(_cooldown: number, isReady: boolean): void {
    if (!this.doubleJumpEl) {
      this.createDoubleJumpElement();
    }
    
    if (this.doubleJumpEl) {
      if (isReady) {
        // Скрываем когда готов
        this.doubleJumpEl.style.opacity = '0';
      } else {
        // Показываем иконку запрета
        this.doubleJumpEl.style.opacity = '1';
      }
    }
  }

  private createDoubleJumpElement(): void {
    this.doubleJumpEl = document.createElement('div');
    this.doubleJumpEl.id = 'double-jump';
    this.doubleJumpEl.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 15px;
      font-size: 20px;
      color: rgba(255, 100, 100, 0.7);
      text-shadow: 0 0 8px rgba(255, 50, 50, 0.5);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s;
      display: none;
    `;
    this.doubleJumpEl.innerHTML = '⊘'; // Иконка запрета
    document.body.appendChild(this.doubleJumpEl);
  }

  /** Количество врагов */
  private enemiesCount = 0;
  
  /** Обновить врагов - показываем рядом со счётом */
  public updateAmmo(_wave: number, enemiesLeft: number): void {
    this.enemiesCount = enemiesLeft;
    this.updateFragsDisplay();
    
    // Скрываем старую панель ammo
    if (this.ammoEl) {
      const ammoPanel = this.ammoEl.parentElement;
      if (ammoPanel) ammoPanel.style.display = 'none';
    }
  }

  /** Обновить счёт */
  public updateFrags(frags: number): void {
    if (this.fragsEl) {
      this.fragsEl.textContent = frags.toString();
    }
    this.updateFragsDisplay();
  }
  
  /** Обновить отображение счёта с врагами */
  private updateFragsDisplay(): void {
    // Добавляем количество врагов к панели счёта
    let enemyEl = document.getElementById('enemies-inline');
    if (!enemyEl) {
      enemyEl = document.createElement('span');
      enemyEl.id = 'enemies-inline';
      enemyEl.style.cssText = `
        margin-left: 15px;
        color: rgba(0, 212, 224, 0.8);
        font-size: 14px;
      `;
      const fragsPanel = document.getElementById('frags');
      if (fragsPanel) fragsPanel.appendChild(enemyEl);
    }
    
    if (this.enemiesCount > 0) {
      enemyEl.innerHTML = `<span style="color:rgba(0,212,224,0.5);">⚔</span> ${this.enemiesCount}`;
    } else {
      enemyEl.innerHTML = `<span style="color:#00ff88;">✓</span>`;
    }
  }

  /** Показать волну - CYBERPUNK ANIMATION */
  public showWave(wave: number): void {
    if (this.waveEl) {
      this.waveEl.textContent = `▸ ВОЛНА ${wave} ◂`;
      this.waveEl.style.color = '#00f0ff';
      this.waveEl.style.borderColor = 'rgba(0, 240, 255, 0.8)';
      
      // Появление с глитч-эффектом
      this.waveEl.animate([
        { opacity: 0, transform: 'translateX(-50%) skewX(-3deg) scaleX(1.5)', filter: 'blur(10px)' },
        { opacity: 0.5, transform: 'translateX(-48%) skewX(-5deg) scaleX(1.1)', filter: 'blur(2px)' },
        { opacity: 1, transform: 'translateX(-50%) skewX(-3deg) scaleX(1)', filter: 'blur(0px)' }
      ], { duration: 400, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.animate([
            { opacity: 1, transform: 'translateX(-50%) skewX(-3deg)' },
            { opacity: 0, transform: 'translateX(-50%) skewX(-3deg) translateY(-15px)' }
          ], { duration: 300, fill: 'forwards', easing: 'ease-in' });
        }
      }, 1800);
    }
  }

  /** Показать завершение волны - CYBERPUNK */
  public showWaveComplete(wave: number): void {
    if (this.waveEl) {
      this.waveEl.textContent = `◈ ВОЛНА ${wave} ПРОЙДЕНА ◈`;
      this.waveEl.style.color = '#00ff88';
      this.waveEl.style.borderColor = 'rgba(0, 255, 136, 0.8)';
      
      // Появление
      this.waveEl.animate([
        { opacity: 0, transform: 'translateX(-50%) skewX(-3deg) scaleY(0.5)' },
        { opacity: 1, transform: 'translateX(-50%) skewX(-3deg) scaleY(1)' }
      ], { duration: 300, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      
      // Переключение на "готовься"
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.textContent = `▸ ГОТОВЬСЯ ◂`;
          this.waveEl.style.color = '#ffaa00';
          this.waveEl.style.borderColor = 'rgba(255, 170, 0, 0.6)';
        }
      }, 1500);
      
      // Исчезновение
      setTimeout(() => {
        if (this.waveEl) {
          this.waveEl.animate([
            { opacity: 1 },
            { opacity: 0 }
          ], { duration: 400, fill: 'forwards' });
        }
      }, 3200);
    }
  }

  /** Показать Game Over - CYBERPUNK */
  public showGameOver(score: number, wave: number): void {
    if (this.messageEl) {
      this.messageEl.innerHTML = `
        <div style="font-size:32px;letter-spacing:8px;">GAME OVER</div>
        <div style="
          font-size: 14px; 
          color: rgba(0,240,255,0.8); 
          margin-top: 15px;
          letter-spacing: 4px;
          font-weight: 400;
        ">
          СЧЁТ <span style="color:#ff00ff;font-size:18px;">${score}</span> · ВОЛНА <span style="color:#ff00ff;font-size:18px;">${wave}</span>
        </div>
      `;
      
      // Глитч-появление
      this.messageEl.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) skewX(-2deg) scaleX(2)', filter: 'blur(20px) hue-rotate(90deg)' },
        { opacity: 0.8, transform: 'translate(-48%, -50%) skewX(-4deg) scaleX(1.1)', filter: 'blur(5px) hue-rotate(0deg)' },
        { opacity: 1, transform: 'translate(-50%, -50%) skewX(-2deg) scaleX(1)', filter: 'blur(0px) hue-rotate(0deg)' }
      ], { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      
      setTimeout(() => {
        if (this.messageEl) {
          this.messageEl.animate([
            { opacity: 1 },
            { opacity: 0, filter: 'blur(10px)' }
          ], { duration: 500, fill: 'forwards' });
        }
      }, 3000);
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

  /** Показать сообщение - CYBERPUNK TOAST */
  public showMessage(text: string, color: string = 'white'): void {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 25%;
      left: 50%;
      transform: translateX(-50%) skewX(-3deg) translateY(20px);
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: ${color};
      text-shadow: 0 0 30px ${color};
      padding: 10px 40px;
      background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.4) 80%, transparent 100%);
      border-left: 2px solid ${color};
      border-right: 2px solid ${color};
      pointer-events: none;
      z-index: 1100;
      opacity: 0;
      letter-spacing: 3px;
      text-transform: uppercase;
    `;
    msg.textContent = text;
    document.body.appendChild(msg);

    // Анимация появления
    msg.animate([
      { opacity: 0, transform: 'translateX(-50%) skewX(-3deg) translateY(30px)' },
      { opacity: 1, transform: 'translateX(-50%) skewX(-3deg) translateY(0)' }
    ], { duration: 200, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });

    // Анимация исчезновения
    setTimeout(() => {
      msg.animate([
        { opacity: 1, transform: 'translateX(-50%) skewX(-3deg) translateY(0)' },
        { opacity: 0, transform: 'translateX(-50%) skewX(-3deg) translateY(-20px)' }
      ], { duration: 300, fill: 'forwards', easing: 'ease-in' });
      setTimeout(() => msg.remove(), 300);
    }, 800);
  }

  /** Показать оверлей буйства */
  private rageOverlay: HTMLElement | null = null;

  /** HP бар босса */
  private bossHealthBar: HTMLElement | null = null;
  private bossHealthFill: HTMLElement | null = null;
  private bossNameEl: HTMLElement | null = null;

  /** Оверлей войда */
  private voidOverlay: HTMLElement | null = null;
  private voidTimerEl: HTMLElement | null = null;
  private voidKillsEl: HTMLElement | null = null;

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

  /** Показать HP босса */
  public showBossHealth(hp: number, maxHp: number, bossType: string): void {
    if (!this.bossHealthBar) {
      // Создаём контейнер
      this.bossHealthBar = document.createElement('div');
      this.bossHealthBar.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #ff0000;
        border-radius: 8px;
        z-index: 1100;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
      `;
      
      // Имя босса
      this.bossNameEl = document.createElement('div');
      this.bossNameEl.style.cssText = `
        color: #ff4444;
        font-size: 16px;
        text-shadow: 0 0 10px #ff0000;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 3px;
      `;
      this.bossHealthBar.appendChild(this.bossNameEl);
      
      // Полоска HP
      const barContainer = document.createElement('div');
      barContainer.style.cssText = `
        width: 100%;
        height: 20px;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #666;
      `;
      
      this.bossHealthFill = document.createElement('div');
      this.bossHealthFill.style.cssText = `
        height: 100%;
        transition: width 0.3s ease-out;
        border-radius: 10px;
      `;
      barContainer.appendChild(this.bossHealthFill);
      this.bossHealthBar.appendChild(barContainer);
      
      document.body.appendChild(this.bossHealthBar);
    }

    // Имя и цвет
    let bossName = 'БОСС';
    let barColor = '#ff0000';
    
    if (bossType === 'boss_green') {
      bossName = '☠️ ТОКСИЧНЫЙ ГИГАНТ ☠️';
      barColor = 'linear-gradient(90deg, #00ff00, #88ff00)';
      this.bossHealthBar.style.borderColor = '#00ff00';
      this.bossHealthBar.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
    } else if (bossType === 'boss_black') {
      bossName = '🌀 ВЛАДЫКА ПУСТОТЫ 🌀';
      barColor = 'linear-gradient(90deg, #4400aa, #8800ff)';
      this.bossHealthBar.style.borderColor = '#8800ff';
      this.bossHealthBar.style.boxShadow = '0 0 20px rgba(136, 0, 255, 0.5)';
    } else if (bossType === 'boss_blue') {
      bossName = '⚡ ФАНТОМ ХАОСА ⚡';
      barColor = 'linear-gradient(90deg, #0088ff, #00ffff)';
      this.bossHealthBar.style.borderColor = '#00ffff';
      this.bossHealthBar.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
    }
    
    if (this.bossNameEl) {
      this.bossNameEl.textContent = bossName;
    }
    
    if (this.bossHealthFill) {
      const percent = (hp / maxHp) * 100;
      this.bossHealthFill.style.width = percent + '%';
      this.bossHealthFill.style.background = barColor;
    }
    
    this.bossHealthBar.style.display = 'block';
  }

  /** Скрыть HP босса */
  public hideBossHealth(): void {
    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'none';
    }
  }

  /** Эпичная заставка босса */
  public showBossIntro(bossType: string, onComplete?: () => void): void {
    // Определяем имя и стиль босса
    let bossName = 'БОСС';
    let bossSubtitle = '';
    let color = '#ff0044';
    let glowColor = 'rgba(255, 0, 68, 0.5)';
    let icon = '💀';
    
    if (bossType === 'boss_green') {
      bossName = 'ЯДОВИТЫЕ БЛИЗНЕЦЫ';
      bossSubtitle = 'Охотник & Загонщик';
      color = '#00ff44';
      glowColor = 'rgba(0, 255, 68, 0.5)';
      icon = '☣️';
    } else if (bossType === 'boss_black') {
      bossName = 'ВЛАДЫКА ПУСТОТЫ';
      bossSubtitle = 'Повелитель Тьмы';
      color = '#8800ff';
      glowColor = 'rgba(136, 0, 255, 0.5)';
      icon = '🌀';
    } else if (bossType === 'boss_blue') {
      bossName = 'ФАНТОМ ХАОСА';
      bossSubtitle = 'Владыка Молний';
      color = '#00ffff';
      glowColor = 'rgba(0, 255, 255, 0.5)';
      icon = '⚡';
    }

    // Создаём оверлей заставки
    const overlay = document.createElement('div');
    overlay.id = 'boss-intro-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      pointer-events: none;
    `;

    // Иконка босса
    const iconEl = document.createElement('div');
    iconEl.style.cssText = `
      font-size: 120px;
      opacity: 0;
      transform: scale(3);
      filter: drop-shadow(0 0 30px ${glowColor});
    `;
    iconEl.textContent = icon;

    // Имя босса
    const nameEl = document.createElement('div');
    nameEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 72px;
      font-weight: 900;
      color: ${color};
      text-shadow: 
        0 0 20px ${color},
        0 0 40px ${glowColor},
        0 0 60px ${glowColor};
      opacity: 0;
      transform: translateY(50px);
      letter-spacing: 8px;
      margin-top: 20px;
    `;
    nameEl.textContent = bossName;

    // Подзаголовок
    const subtitleEl = document.createElement('div');
    subtitleEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${color};
      text-shadow: 0 0 10px ${glowColor};
      opacity: 0;
      margin-top: 10px;
      letter-spacing: 4px;
    `;
    subtitleEl.textContent = bossSubtitle;

    // Линии по бокам
    const lineLeft = document.createElement('div');
    const lineRight = document.createElement('div');
    const lineStyle = `
      position: absolute;
      top: 50%;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${color});
    `;
    lineLeft.style.cssText = lineStyle + 'left: 0; transform: translateY(-50%);';
    lineRight.style.cssText = lineStyle + 'right: 0; transform: translateY(-50%) scaleX(-1);';

    overlay.appendChild(lineLeft);
    overlay.appendChild(lineRight);
    overlay.appendChild(iconEl);
    overlay.appendChild(nameEl);
    overlay.appendChild(subtitleEl);
    document.body.appendChild(overlay);

    // Анимация появления
    overlay.animate([
      { background: 'rgba(0, 0, 0, 0)' },
      { background: 'rgba(0, 0, 0, 0.8)' }
    ], { duration: 300, fill: 'forwards' });

    iconEl.animate([
      { opacity: 0, transform: 'scale(3)' },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: 500, delay: 200, fill: 'forwards', easing: 'ease-out' });

    nameEl.animate([
      { opacity: 0, transform: 'translateY(50px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 500, delay: 400, fill: 'forwards', easing: 'ease-out' });

    subtitleEl.animate([
      { opacity: 0 },
      { opacity: 0.8 }
    ], { duration: 400, delay: 600, fill: 'forwards' });

    lineLeft.animate([
      { width: '0%' },
      { width: '35%' }
    ], { duration: 600, delay: 300, fill: 'forwards', easing: 'ease-out' });

    lineRight.animate([
      { width: '0%' },
      { width: '35%' }
    ], { duration: 600, delay: 300, fill: 'forwards', easing: 'ease-out' });

    // Анимация исчезновения и удаление
    setTimeout(() => {
      overlay.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], { duration: 500, fill: 'forwards' });
      
      setTimeout(() => {
        overlay.remove();
        onComplete?.();
      }, 500);
    }, 2500);
  }

  /** Показать UI войда (расстояние до портала) */
  public showVoidMode(distance: number, maxDistance: number): void {
    if (!this.voidOverlay) {
      this.createVoidOverlay();
    }

    if (this.voidOverlay) {
      this.voidOverlay.style.display = 'flex';
      
      // Заголовок
      if (this.voidTimerEl) {
        this.voidTimerEl.textContent = `НАЙДИ ПОРТАЛ`;
        this.voidTimerEl.style.color = '#aa55ff';
        this.voidTimerEl.style.textShadow = '0 0 20px #8800ff, 0 0 40px rgba(136, 0, 255, 0.5)';
      }
      
      // Расстояние до портала
      if (this.voidKillsEl) {
        this.voidKillsEl.textContent = `🌀 ${distance}м`;
        
        // Цвет по расстоянию
        if (distance < 15) {
          this.voidKillsEl.style.color = '#00ff88';
          this.voidKillsEl.style.textShadow = '0 0 15px #00ff88';
        } else if (distance < 30) {
          this.voidKillsEl.style.color = '#cc88ff';
          this.voidKillsEl.style.textShadow = '0 0 15px #aa55ff';
        } else {
          this.voidKillsEl.style.color = '#8855cc';
          this.voidKillsEl.style.textShadow = '0 0 15px #6633aa';
        }
      }
    }
  }

  /** Скрыть UI войда */
  public hideVoidMode(): void {
    if (this.voidOverlay) {
      this.voidOverlay.style.display = 'none';
    }
  }

  /** Создать оверлей войда - фиолетовая тема */
  private createVoidOverlay(): void {
    this.voidOverlay = document.createElement('div');
    this.voidOverlay.id = 'void-overlay';
    this.voidOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding-top: 80px;
      pointer-events: none;
      z-index: 1200;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(30, 0, 50, 0.3) 100%);
    `;

    // Заголовок "ВОЙД"
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: #aa55ff;
      text-shadow: 
        0 0 30px #8800ff,
        0 0 60px rgba(136, 0, 255, 0.5),
        0 0 90px rgba(100, 0, 200, 0.3);
      letter-spacing: 15px;
      margin-bottom: 20px;
      animation: voidPulse 1s ease-in-out infinite;
    `;
    titleEl.textContent = 'В О Й Д';

    // Инструкция
    this.voidTimerEl = document.createElement('div');
    this.voidTimerEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #aa55ff;
      text-shadow: 0 0 20px #8800ff, 0 0 40px rgba(136, 0, 255, 0.5);
      letter-spacing: 5px;
      margin-bottom: 15px;
    `;

    // Расстояние до портала
    this.voidKillsEl = document.createElement('div');
    this.voidKillsEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 28px;
      color: #cc88ff;
      text-shadow: 0 0 15px #aa55ff;
      letter-spacing: 3px;
    `;

    // Подсказка
    const hintEl = document.createElement('div');
    hintEl.style.cssText = `
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      color: #7744aa;
      margin-top: 30px;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(136, 0, 255, 0.3);
    `;
    hintEl.textContent = 'БЕГИ ПО МОСТУ К ПОРТАЛУ';

    // Добавляем CSS анимацию
    if (!document.getElementById('void-anim-style')) {
      const style = document.createElement('style');
      style.id = 'void-anim-style';
      style.textContent = `
        @keyframes voidPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
            filter: brightness(1.3);
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.voidOverlay.appendChild(titleEl);
    this.voidOverlay.appendChild(this.voidTimerEl);
    this.voidOverlay.appendChild(this.voidKillsEl);
    this.voidOverlay.appendChild(hintEl);
    document.body.appendChild(this.voidOverlay);
  }

  /** Показать сообщение входа в войд */
  public showVoidEnter(): void {
    this.showMessage('🌀 ВЛАДЫКА ЗАСОСАЛ ТЕБЯ В ВОЙД! 🌀', '#aa55ff');
  }

  /** Показать сообщение выхода из войда */
  public showVoidExit(success: boolean): void {
    if (success) {
      this.showMessage('✓ ВЫРВАЛСЯ ИЗ ВОЙДА!', '#00ff88');
    } else {
      this.showMessage('☠️ ВОЙД ПОГЛОТИЛ ТЕБЯ...', '#aa00ff');
    }
  }
}
