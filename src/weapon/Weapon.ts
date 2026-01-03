import type { WeaponState, Vec3 } from '@/types';

/** Тип оружия */
export type WeaponType = 'katana' | 'charged';

/**
 * Катана - оружие ближнего боя
 * ЛКМ = обычный взмах
 * ПКМ = сплеш-волна (если заряжена)
 */
export class Weapon {
  /** Состояние оружия */
  public state: WeaponState;

  /** Текущий тип оружия */
  public currentWeapon: WeaponType = 'katana';

  /** Заряды сплеш-атаки */
  public splashCharges = 0;

  /** Время до следующего удара */
  private attackCooldown = 0;

  /** Время атаки */
  private attackDuration = 0.3;

  /** Перезарядка между ударами */
  private attackCooldownTime = 0.4;

  /** Дальность удара */
  public attackRange = 4.0;

  /** Угол атаки (радианы) */
  public attackAngle = Math.PI * 0.6; // 108 градусов

  /** Урон */
  public damage = 100;

  /** Сейчас атакуем? */
  public isAttacking = false;

  /** Прогресс атаки (0-1) */
  public attackProgress = 0;

  /** Callback при ударе */
  public onSlice?: () => void;

  /** Callback при сплеш-атаке */
  public onSplash?: () => void;

  /** Это сплеш-атака? */
  public isSplashAttack = false;

  /** Радиус сплеш-волны */
  public splashRadius = 10.0;

  constructor() {
    this.state = {
      ammo: 999,
      reserveAmmo: 999,
      magazineSize: 999,
      isReloading: false,
      reloadTimeLeft: 0,
      recoilX: 0,
      recoilY: 0,
      recoilBack: 0,
      muzzleFlash: 0,
      bobPhase: 0,
    };
  }

  /** Обновление оружия */
  public update(dt: number, isMoving: boolean, isRunning: boolean): void {
    // Кулдаун атаки
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Прогресс анимации атаки
    if (this.isAttacking) {
      this.attackProgress += dt / this.attackDuration;
      if (this.attackProgress >= 1) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    }

    // Покачивание при ходьбе
    if (isMoving) {
      const bobSpeed = isRunning ? 14 : 10;
      this.state.bobPhase += dt * bobSpeed;
    } else {
      this.state.bobPhase *= 0.95;
    }

    // Затухание эффектов
    this.state.recoilX *= 0.85;
    this.state.recoilY *= 0.85;
    this.state.muzzleFlash *= 0.8;
  }

  /** Попытка обычного удара (ЛКМ) */
  public tryAttack(): boolean {
    if (this.attackCooldown > 0) return false;
    if (this.isAttacking) return false;

    this.attack(false);
    return true;
  }

  /** Попытка сплеш-атаки (ПКМ) */
  public trySplashAttack(): boolean {
    if (this.attackCooldown > 0) return false;
    if (this.isAttacking) return false;
    if (this.splashCharges <= 0) return false;

    this.attack(true);
    return true;
  }

  /** Удар катаной */
  private attack(isSplash: boolean): void {
    this.isAttacking = true;
    this.attackProgress = 0;
    this.attackCooldown = isSplash ? 0.6 : this.attackCooldownTime;
    this.isSplashAttack = isSplash;
    
    if (isSplash) {
      // Сплеш-волна
      this.splashCharges--;
      this.state.recoilX = 0.6;
      this.state.muzzleFlash = 2.0;
      
      // Если закончились заряды - возвращаемся к обычной катане
      if (this.splashCharges <= 0) {
        this.currentWeapon = 'katana';
      }
      
      this.onSplash?.();
    } else {
      // Обычный удар
      this.state.recoilX = 0.3;
      this.state.muzzleFlash = 1.0;
      this.onSlice?.();
    }
  }

  /** Зарядить катану (подбор на балконе) */
  public chargeKatana(): void {
    this.currentWeapon = 'charged';
    this.splashCharges = 3; // 3 сплеш-удара
  }

  /** Проверить заряжена ли */
  public isCharged(): boolean {
    return this.splashCharges > 0;
  }

  /** Проверка попадания по врагу */
  public checkHit(playerPos: Vec3, playerYaw: number, targetPos: Vec3): boolean {
    if (!this.isAttacking) return false;
    // Попадаем только в середине анимации
    if (this.attackProgress < 0.2 || this.attackProgress > 0.6) return false;

    // Вектор к цели
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Сплеш-атака топором - бьёт всех в радиусе!
    if (this.isSplashAttack) {
      return dist <= this.splashRadius;
    }

    // Обычная атака катаной - проверка дистанции
    if (dist > this.attackRange) return false;

    // Проверка угла
    const angleToTarget = Math.atan2(dx, -dz);
    let angleDiff = angleToTarget - playerYaw;
    
    // Нормализуем угол
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) < this.attackAngle / 2;
  }

  /** Получить смещение от покачивания */
  public getWeaponOffset(): { x: number; y: number; z: number } {
    const bobX = Math.sin(this.state.bobPhase) * 0.02;
    const bobY = Math.abs(Math.sin(this.state.bobPhase * 2)) * 0.015;

    // Анимация атаки
    let attackOffsetX = 0;
    let attackOffsetY = 0;

    if (this.isAttacking) {
      // Взмах справа налево
      const t = this.attackProgress;
      attackOffsetX = Math.sin(t * Math.PI) * 0.3;
      attackOffsetY = -Math.sin(t * Math.PI * 2) * 0.1;
    }

    return {
      x: bobX + this.state.recoilX + attackOffsetX,
      y: bobY - this.state.recoilY + attackOffsetY,
      z: 0,
    };
  }

  // Заглушки для совместимости
  public tryShoot(_playerPos: Vec3, _playerDir: Vec3): boolean {
    return this.tryAttack();
  }
  
  public startReload(): boolean {
    return false;
  }
  
  public projectiles: never[] = [];
}
