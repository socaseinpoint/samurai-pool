import type { Vec3, ICollisionSystem } from '@/types';
import { vec3, distanceVec3, normalizeVec3 } from '@/utils/math';

/** Тип врага */
export type EnemyType = 'baneling' | 'phantom' | 'runner' | 'hopper' | 'spiker' | 'boss_green' | 'boss_black' | 'boss_blue';

/** Осколок после разрубания */
export interface Fragment {
  position: Vec3;
  velocity: Vec3;
  size: number;
  lifetime: number;
  rotation: number;
  rotationSpeed: number;
}

/** Токсичная лужа (от Зелёного Босса) */
export interface ToxicPool {
  position: Vec3;
  radius: number;
  maxRadius: number;      // Максимальный радиус после растекания
  lifetime: number;
  maxLifetime: number;    // Начальное время жизни
  damage: number;
  spreadProgress: number; // 0-1 прогресс растекания
}

/** Зона кислотного дождя (метка на земле → дождь сверху) */
export interface AcidRainZone {
  position: Vec3;         // Центр зоны
  radius: number;         // Радиус зоны
  lifetime: number;       // Время жизни
  markTime: number;       // Время показа метки перед дождём
  isRaining: boolean;     // Идёт ли дождь
  damage: number;         // Урон за тик
}

/** Снаряд кислоты (летящий плевок) */
export interface AcidProjectile {
  position: Vec3;      // Текущая позиция
  targetPos: Vec3;     // Куда летит
  startPos: Vec3;      // Откуда летит
  progress: number;    // 0-1 прогресс полёта
  flightTime: number;  // Время полёта
}

/** Роль зелёного босса в паре */
export type GreenBossRole = 'hunter' | 'blocker';

/**
 * Враг-шар который летит к игроку
 * - baneling: зелёная жижа, взрывается при столкновении
 * - phantom: чёрный шар, пронзает насквозь с инерцией
 */
export class Target {
  /** Позиция */
  public position: Vec3;

  /** Скорость полёта */
  public velocity: Vec3 = vec3();

  /** Радиус */
  public radius = 0.8;

  /** Активен? */
  public active = true;

  /** Базовая скорость движения */
  public speed = 4.0;

  /** Интенсивность огня (для шейдера) */
  public fireIntensity = 1.0;

  /** Осколки после разрубания */
  public fragments: Fragment[] = [];

  /** Время до удаления */
  public removeTimer = 0;

  /** Уникальный ID для разного поведения */
  public id: number;

  /** Фаза синусоиды */
  private phase: number;

  /** Тип движения (0-3) */
  private moveType: number;

  /** Тип врага */
  public enemyType: EnemyType = 'baneling';

  /** Урон при столкновении */
  public damage: number = 25;

  /** Фантом: текущая скорость (для разгона) */
  private currentSpeed = 0;

  /** Фантом: набирает разгон? */
  private isCharging = true;

  /** Фантом: направление атаки (фиксируется при разгоне) */
  private chargeDirection: Vec3 = vec3();

  /** Фантом: время после пролёта через игрока */
  private passedThroughTimer = 0;

  /** Hopper: вертикальная скорость */
  private verticalVelocity = 0;

  /** Hopper: на земле? */
  private onGround = true;

  /** Hopper: время до следующего прыжка */
  private hopTimer = 0;

  /** Runner: угол уклонения */
  private dodgeAngle = 0;

  /** Runner: время до смены направления */
  private dodgeTimer = 0;

  /** Runner: прицепился к игроку? */
  public isAttached = false;

  /** Runner: время на прицепе (сколько осталось чтобы скинуть) */
  public attachTimer = 0;

  /** Runner: угол вращения вокруг игрока */
  private orbitAngle = 0;

  /** Босс: HP (обычные враги имеют 1) */
  public hp = 1;
  public maxHp = 1;

  /** Босс: это босс? */
  public isBoss = false;

  /** Синий босс: таймер телепортации */
  private teleportTimer = 0;

  /** Чёрный босс: интенсивность искривления */
  public distortionPower = 0;

  /** Чёрный босс: таймер спавна фантома */
  private spawnPhantomTimer = 5.0;

  /** Чёрный босс: фаза вихря (всасывание) */
  public isVortexActive = false;
  private vortexTimer = 0;
  private vortexCooldown = 0;
  private vortexWarningPlayed = false;

  /** Чёрный босс: колбэк спавна фантома */
  public onSpawnPhantom?: (pos: Vec3) => void;

  /** Чёрный босс: колбэк начала вихря (для звука) */
  public onVortexStart?: () => void;
  public onVortexEnd?: () => void;
  /** Колбэк предупреждения о вихре (райзер) */
  public onVortexWarning?: () => void;

  /** Зелёный босс: таймер создания лужи */
  private poolTimer = 0;

  /** Зелёный босс: таймер плевка */
  private spitTimer = 0;
  private spitCooldown = 3.0;

  /** Зелёный босс: роль (охотник/загонщик) */
  public greenBossRole: GreenBossRole = 'hunter';

  /** Зелёный босс: последняя известная скорость игрока */
  private lastPlayerPos: Vec3 = vec3();
  private playerVelocity: Vec3 = vec3();

  /** Callback при плевке (стартовая позиция, целевая позиция) */
  public onSpit?: (startPos: Vec3, targetPos: Vec3) => void;

  /** Callback при установке метки кислотного дождя */
  public onAcidRainMark?: (pos: Vec3) => void;

  /** Зелёный босс: фаза (1 или 2) */
  public bossPhase = 1;

  /** Callback при смене фазы босса */
  public onPhaseChange?: (phase: number) => void;

  // === СПАЙКЕР (летающий стрелок) ===
  /** Таймер атаки иголками */
  private spikeAttackTimer = 0;
  private spikeAttackCooldown = 2.0;
  
  /** Можно убить только в прыжке */
  public requiresJumpToKill = false;
  
  /** Callback при атаке иголкой */
  public onSpikeAttack?: (startPos: Vec3, targetPos: Vec3) => void;
  
  /** Callback при вскрике */
  public onSpikerScream?: () => void;

  /** Система коллизий */
  private collision: ICollisionSystem | null = null;

  constructor(position: Vec3, speed: number = 4.0, id: number = 0, type: EnemyType = 'baneling', collision?: ICollisionSystem) {
    this.position = { ...position };
    this.speed = speed;
    this.id = id;
    this.phase = Math.random() * Math.PI * 2;
    this.moveType = id % 4;
    this.enemyType = type;
    this.collision = collision || null;

    // Настройки по типу врага
    if (type === 'phantom') {
      this.speed = speed * 2; // В 2 раза быстрее
      this.damage = 10; // Меньше урона
      this.radius = 0.6;
      this.currentSpeed = 0;
      this.isCharging = true;
    } else if (type === 'runner') {
      this.speed = speed * 2.5; // Очень быстрый!
      this.damage = 15;
      this.radius = 0.4; // Маленький и низкий
      this.position.y = 0.5; // Бежит по земле
    } else if (type === 'hopper') {
      this.speed = speed * 1.2;
      this.damage = 20;
      this.radius = 0.5;
      this.verticalVelocity = 8;
      this.onGround = false;
    } else if (type === 'spiker') {
      // Летающий стрелок - кидает иголки, убивается только с прыжка
      this.speed = speed * 0.8; // Медленный
      this.damage = 5; // Урон от столкновения маленький
      this.radius = 0.6;
      this.position.y = 5 + Math.random() * 3; // Летает высоко (5-8м)
      this.spikeAttackCooldown = 2.0; // Атакует каждые 2 секунды
      this.requiresJumpToKill = true; // Можно убить только в прыжке!
    } else if (type === 'boss_green') {
      // ЗЕЛЁНЫЙ БОСС - плюётся кислотой!
      this.isBoss = true;
      this.speed = speed * 0.6; // Медленный
      this.damage = 40;
      this.radius = 2.5; // ОГРОМНЫЙ!
      this.hp = 10;      // В 2 раза меньше HP (их двое!)
      this.maxHp = 10;
      this.spitCooldown = 3.0; // Плюёт каждые 3 секунды
    } else if (type === 'boss_black') {
      // ЧЁРНЫЙ БОСС - искривляет пространство
      // HP = 10 базовых (половина зелёного) + 60 от 6 кристаллей (по 10 каждый)
      // Без уничтожения кристаллей его невозможно убить!
      this.isBoss = true;
      this.speed = speed * 0.8;
      this.damage = 30;
      this.radius = 2.0;
      this.hp = 70;    // 10 базовых + 6*10 от кристаллей
      this.maxHp = 70;
      this.distortionPower = 1.0;
    } else if (type === 'boss_blue') {
      // СИНИЙ БОСС - телепортируется
      this.isBoss = true;
      this.speed = speed * 1.5; // Быстрый между телепортами
      this.damage = 25;
      this.radius = 1.8;
      this.hp = 24;
      this.maxHp = 24;
      this.teleportTimer = 3.0;
    } else {
      this.damage = 25;
      this.currentSpeed = speed;
    }
  }

  /** Обновление - движение к игроку с паттерном */
  public update(dt: number, playerPos: Vec3, time: number): void {
    // Пульсирующий эффект
    this.fireIntensity = 0.6 + Math.sin(time * 8 + this.id) * 0.4;

    if (this.active) {
      switch (this.enemyType) {
        case 'phantom':
          this.updatePhantom(dt, playerPos, time);
          break;
        case 'runner':
          this.updateRunner(dt, playerPos, time);
          break;
        case 'hopper':
          this.updateHopper(dt, playerPos, time);
          break;
        case 'spiker':
          this.updateSpiker(dt, playerPos, time);
          break;
        case 'boss_green':
          this.updateBossGreen(dt, playerPos, time);
          break;
        case 'boss_black':
          this.updateBossBlack(dt, playerPos, time);
          break;
        case 'boss_blue':
          this.updateBossBlue(dt, playerPos, time);
          break;
        default:
          this.updateBaneling(dt, playerPos, time);
      }
    }

    // Обновление осколков
    this.updateFragments(dt);

    // Таймер удаления
    if (!this.active && this.removeTimer > 0) {
      this.removeTimer -= dt;
    }
  }

  /** Обновление бейнлинга - катится по земле к игроку */
  private updateBaneling(dt: number, playerPos: Vec3, time: number): void {
    // Направление к игроку (только по XZ - катимся по земле!)
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.1) {
      const dirX = dx / dist;
      const dirZ = dz / dist;

      // Агрессия растёт при приближении
      const aggression = 1.0 + Math.max(0, (15 - dist) / 15) * 0.8;
      const currentSpeed = this.speed * aggression;

      // Горизонтальное "извивание" для интересного движения
      let offsetX = 0, offsetZ = 0;
      const wave = time * 4 + this.phase;

      switch (this.moveType) {
        case 0:
          offsetX = Math.cos(wave) * 2;
          offsetZ = Math.sin(wave) * 2;
          break;
        case 1:
          offsetX = Math.sin(wave * 2) * 3;
          break;
        case 2:
          offsetZ = Math.sin(wave * 1.5) * 3;
          break;
        case 3:
          const pulse = Math.sin(wave) > 0 ? 1.5 : 0.5;
          offsetX = Math.cos(wave * 3) * 2 * pulse;
          offsetZ = Math.sin(wave * 3) * 2 * pulse;
          break;
      }

      // Перпендикуляр для бокового смещения
      const perpX = -dirZ;
      const perpZ = dirX;

      this.velocity.x = dirX * currentSpeed + perpX * offsetX * 0.3;
      this.velocity.z = dirZ * currentSpeed + perpZ * offsetZ * 0.3;

      // Применяем движение с проверкой коллизий
      const newX = this.position.x + this.velocity.x * dt;
      const newZ = this.position.z + this.velocity.z * dt;
      
      if (!this.collision?.checkEnemyCollision || 
          !this.collision.checkEnemyCollision({ x: newX, y: this.position.y, z: newZ }, this.radius)) {
        this.position.x = newX;
        this.position.z = newZ;
      }
      
      // Бейнлинг всегда на земле (его радиус ~0.7)
      this.position.y = this.radius;
    }
  }

  /** Обновление фантома - разгон и пронзание */
  private updatePhantom(dt: number, playerPos: Vec3, time: number): void {
    const dx = playerPos.x - this.position.x;
    const dy = (playerPos.y - 0.3) - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (this.isCharging) {
      // Фаза разгона - набираем скорость, направляемся к игроку
      this.currentSpeed = Math.min(this.currentSpeed + dt * 15, this.speed);

      // Обновляем направление пока разгоняемся
      if (dist > 0.1) {
        this.chargeDirection.x = dx / dist;
        this.chargeDirection.y = dy / dist;
        this.chargeDirection.z = dz / dist;
      }

      // Слегка покачиваемся пока набираем разгон
      const wobble = Math.sin(time * 10) * 0.3;
      
      this.velocity.x = this.chargeDirection.x * this.currentSpeed + wobble;
      this.velocity.y = this.chargeDirection.y * this.currentSpeed;
      this.velocity.z = this.chargeDirection.z * this.currentSpeed;

      // Когда набрали полную скорость - фиксируем направление
      if (this.currentSpeed >= this.speed * 0.9) {
        this.isCharging = false;
      }
    } else {
      // Фаза атаки - летим по инерции в зафиксированном направлении
      this.passedThroughTimer += dt;

      // Продолжаем лететь в том же направлении
      this.velocity.x = this.chargeDirection.x * this.speed;
      this.velocity.y = this.chargeDirection.y * this.speed;
      this.velocity.z = this.chargeDirection.z * this.speed;

      // После пролёта через игрока (3 сек) - разворачиваемся
      if (this.passedThroughTimer > 2.5) {
        this.isCharging = true;
        this.currentSpeed = this.speed * 0.3; // Частичный разгон
        this.passedThroughTimer = 0;
      }
    }

    // Движение
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Ограничения высоты
    this.position.y = Math.max(0.5, Math.min(4.0, this.position.y));

    // Если улетел слишком далеко - начинаем разгон заново
    if (dist > 35) {
      this.isCharging = true;
      this.currentSpeed = 0;
      this.passedThroughTimer = 0;
    }
  }

  /** Вертикальная скорость раннера */
  private runnerVerticalVel = 0;
  /** Раннер на земле? */
  private runnerOnGround = true;

  /** Обновление раннера - быстрый бегун, прицепляется к игроку */
  private updateRunner(dt: number, playerPos: Vec3, time: number): void {
    if (this.isAttached) {
      // === РЕЖИМ ПРИЦЕПА - летает вокруг игрока ===
      this.attachTimer -= dt;
      this.orbitAngle += dt * 12;

      const orbitRadius = 1.2;
      const orbitHeight = Math.sin(time * 8) * 0.3;
      
      this.position.x = playerPos.x + Math.cos(this.orbitAngle) * orbitRadius;
      this.position.y = playerPos.y + orbitHeight;
      this.position.z = playerPos.z + Math.sin(this.orbitAngle) * orbitRadius;

      if (this.attachTimer <= 0) {
        this.isAttached = false;
        this.active = false;
        this.removeTimer = 0.5;
      }
      return;
    }

    // === РЕЖИМ ПОГОНИ ===
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.5) {
      this.isAttached = true;
      this.attachTimer = 3.0;
      this.orbitAngle = Math.atan2(dz, dx);
      return;
    }

    if (dist > 0.1) {
      const dirX = dx / dist;
      const dirZ = dz / dist;

      // Проверяем препятствие впереди
      if (this.collision?.getObstacleHeight && this.runnerOnGround) {
        const obstacleHeight = this.collision.getObstacleHeight(this.position, dirX, dirZ, 1.5);
        // Если есть препятствие - прыгаем!
        if (obstacleHeight > this.position.y && obstacleHeight < 10) {
          this.runnerVerticalVel = 12; // Сильный прыжок
          this.runnerOnGround = false;
        }
      }

      // Проверяем коллизию
      if (this.collision?.checkEnemyCollision) {
        const testPos = { 
          x: this.position.x + dirX * this.speed * dt, 
          y: this.position.y, 
          z: this.position.z + dirZ * this.speed * dt 
        };
        if (this.collision.checkEnemyCollision(testPos, this.radius)) {
          // Пытаемся обойти
          this.dodgeAngle = (Math.random() > 0.5 ? 1 : -1) * Math.PI * 0.5;
        }
      }

      // Таймер уклонения
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.dodgeAngle = (Math.random() - 0.5) * Math.PI * 0.8;
        this.dodgeTimer = 0.3 + Math.random() * 0.4;
      }

      const cos = Math.cos(this.dodgeAngle);
      const sin = Math.sin(this.dodgeAngle);
      const dodgedDirX = dirX * cos - dirZ * sin;
      const dodgedDirZ = dirX * sin + dirZ * cos;

      const aggression = 1.0 + Math.max(0, (10 - dist) / 10) * 0.5;
      const currentSpeed = this.speed * aggression;
      const zigzag = Math.sin(time * 15 + this.phase) * 2;

      this.velocity.x = dodgedDirX * currentSpeed + zigzag * 0.3;
      this.velocity.z = dodgedDirZ * currentSpeed;

      // Применяем горизонтальное движение с проверкой коллизий
      const newX = this.position.x + this.velocity.x * dt;
      const newZ = this.position.z + this.velocity.z * dt;
      
      if (!this.collision?.checkEnemyCollision || 
          !this.collision.checkEnemyCollision({ x: newX, y: this.position.y, z: newZ }, this.radius)) {
        this.position.x = newX;
        this.position.z = newZ;
      }

      // Вертикальное движение (прыжки)
      if (!this.runnerOnGround) {
        this.runnerVerticalVel -= 25 * dt; // Гравитация
        this.position.y += this.runnerVerticalVel * dt;
        
        if (this.position.y <= 0.5) {
          this.position.y = 0.5;
          this.runnerVerticalVel = 0;
          this.runnerOnGround = true;
        }
      } else {
        this.position.y = 0.5 + Math.abs(Math.sin(time * 20)) * 0.1;
      }
    }
  }

  /** Откидывание от удара (для боссов) */
  public applyKnockback(dirX: number, dirZ: number, force: number): void {
    // Нормализуем направление
    const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0) {
      this.velocity.x = (dirX / len) * force;
      this.velocity.z = (dirZ / len) * force;
      // Немного подбрасываем
      this.velocity.y = force * 0.3;
    }
    // Таймер стана - босс замирает на мгновение
    this.knockbackTimer = 0.3;
  }

  /** Таймер отката от удара */
  private knockbackTimer = 0;

  /** Скинуть раннера (двойной прыжок) */
  public detachRunner(): boolean {
    if (this.isAttached && this.enemyType === 'runner') {
      this.isAttached = false;
      const angle = this.orbitAngle + Math.PI;
      this.velocity.x = Math.cos(angle) * 15;
      this.velocity.y = 8;
      this.velocity.z = Math.sin(angle) * 15;
      this.attachTimer = 0;
      return true;
    }
    return false;
  }

  /** Callback для создания лужи */
  public onCreatePool?: (pos: Vec3) => void;

  /** Зелёный босс - работает в паре: охотник гонит, загонщик отрезает путь */
  private updateBossGreen(dt: number, playerPos: Vec3, time: number): void {
    // Обработка отката от удара
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      this.velocity.x *= 0.9;
      this.velocity.y *= 0.9;
      this.velocity.z *= 0.9;
      this.velocity.y -= 15 * dt;
      this.position.y = Math.max(this.radius, this.position.y);
      return;
    }

    // Вычисляем скорость игрока (для предсказания)
    this.playerVelocity.x = (playerPos.x - this.lastPlayerPos.x) / Math.max(dt, 0.001);
    this.playerVelocity.z = (playerPos.z - this.lastPlayerPos.z) / Math.max(dt, 0.001);
    this.lastPlayerPos = { ...playerPos };

    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Пульсирующий размер (больше во второй фазе)
    const baseRadius = this.bossPhase === 2 ? 2.8 : 2.5;
    this.radius = baseRadius + Math.sin(time * 3) * 0.3;

    // === ПОВЕДЕНИЕ ЗАВИСИТ ОТ РОЛИ ===
    if (this.greenBossRole === 'hunter') {
      // ОХОТНИК: вызывает КИСЛОТНЫЙ ДОЖДЬ с неба!
      this.spitTimer -= dt;
      const spitCooldownActual = this.bossPhase === 2 ? 5.0 : 8.0;
      
      if (this.spitTimer <= 0 && dist < 25) {
        this.spitTimer = spitCooldownActual;
        
        // Ставим метку на позицию игрока
        const rainTarget = vec3(playerPos.x, 0.05, playerPos.z);
        this.onAcidRainMark?.(rainTarget);
        
        // Во второй фазе - больше меток!
        if (this.bossPhase === 2) {
          setTimeout(() => {
            this.onAcidRainMark?.(vec3(rainTarget.x + 6, 0.05, rainTarget.z));
            this.onAcidRainMark?.(vec3(rainTarget.x - 6, 0.05, rainTarget.z));
          }, 800);
        }
      }
      
      // Охотник идёт медленно, держит дистанцию
      if (dist > 8) {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        this.velocity.x = dirX * this.speed * 0.5;
        this.velocity.z = dirZ * this.speed * 0.5;
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
      }
      this.position.y = Math.max(this.radius, this.position.y);
      
    } else {
      // ЗАГОНЩИК: кидает ЛУЖИ (плевки)!
      this.spitTimer -= dt;
      const spitCooldownActual = this.bossPhase === 2 ? 2.0 : 3.5;
      
      if (this.spitTimer <= 0 && dist < 20) {
        this.spitTimer = spitCooldownActual;
        
        // Плюём в игрока!
        const spitTarget = vec3(
          playerPos.x + (Math.random() - 0.5) * 2,
          0.05,
          playerPos.z + (Math.random() - 0.5) * 2
        );
        const spitStart = vec3(this.position.x, this.position.y + 1, this.position.z);
        this.onSpit?.(spitStart, spitTarget);
        
        // Во второй фазе - серия плевков!
        if (this.bossPhase === 2) {
          setTimeout(() => {
            const extra = vec3(playerPos.x + 3, 0.05, playerPos.z);
            this.onSpit?.(spitStart, extra);
          }, 300);
          setTimeout(() => {
            const extra = vec3(playerPos.x - 3, 0.05, playerPos.z);
            this.onSpit?.(spitStart, extra);
          }, 600);
        }
      }
      
      // Загонщик быстро бежит к игроку!
      if (dist > 0.1) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        const dirZ = dz / dist;
        const wobble = Math.sin(time * 2) * 0.5;
        
        const speedMult = this.bossPhase === 2 ? 1.4 : 1.0;
        this.velocity.x = dirX * this.speed * speedMult + wobble;
        this.velocity.y = dirY * this.speed * 0.3;
        this.velocity.z = dirZ * this.speed * speedMult;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;
        this.position.y = Math.max(this.radius, this.position.y);
      }
    }
  }

  /** Чёрный босс - искривляет пространство вокруг себя */
  private updateBossBlack(dt: number, playerPos: Vec3, time: number): void {
    // Обработка отката от удара
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      this.velocity.x *= 0.92;
      this.velocity.y *= 0.92;
      this.velocity.z *= 0.92;
      this.velocity.y -= 10 * dt;
      this.position.y = Math.max(1.0, this.position.y);
      return;
    }

    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // === СПАВН ФАНТОМОВ КАЖДЫЕ 5 СЕКУНД ===
    this.spawnPhantomTimer -= dt;
    if (this.spawnPhantomTimer <= 0) {
      this.spawnPhantomTimer = 5.0;
      // Спавним фантома рядом с боссом
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = 3 + Math.random() * 2;
      const spawnPos = vec3(
        this.position.x + Math.cos(spawnAngle) * spawnDist,
        this.position.y,
        this.position.z + Math.sin(spawnAngle) * spawnDist
      );
      this.onSpawnPhantom?.(spawnPos);
    }

    // === ФАЗА ВИХРЯ (ВСАСЫВАНИЕ) ===
    this.vortexCooldown -= dt;
    
    if (this.isVortexActive) {
      // Вихрь активен - всасываем игрока
      this.vortexTimer -= dt;
      
      // Босс крутится на месте
      this.position.y = 2.0 + Math.sin(time * 10) * 0.3;
      
      // Интенсивное искривление
      this.distortionPower = 1.5 + Math.sin(time * 15) * 0.5;
      
      if (this.vortexTimer <= 0) {
        // Вихрь закончился
        this.isVortexActive = false;
        this.vortexCooldown = 12.0; // Кулдаун 12 секунд
        this.vortexWarningPlayed = false; // Сбрасываем флаг предупреждения
        this.onVortexEnd?.();
      }
      return; // Не двигаемся во время вихря
    }
    
    // Предупреждение о вихре за 2 секунды (райзер)
    if (this.vortexCooldown > 0 && this.vortexCooldown <= 2.0 && !this.vortexWarningPlayed && dist < 15) {
      this.vortexWarningPlayed = true;
      this.onVortexWarning?.();
    }
    
    // Начинаем вихрь каждые 12 секунд (если игрок близко)
    if (this.vortexCooldown <= 0 && dist < 15) {
      this.isVortexActive = true;
      this.vortexTimer = 4.0; // Вихрь длится 4 секунды
      this.onVortexStart?.();
    }

    // === ОБЫЧНОЕ ДВИЖЕНИЕ ===
    // Орбитальное движение вокруг центра + приближение к игроку
    const orbitSpeed = 0.5;
    const orbitRadius = 8 + Math.sin(time * 0.3) * 3;
    
    const targetX = Math.cos(time * orbitSpeed) * orbitRadius;
    const targetZ = Math.sin(time * orbitSpeed) * orbitRadius;
    
    // Притяжение к орбите + направление к игроку
    const toOrbitX = targetX - this.position.x;
    const toOrbitZ = targetZ - this.position.z;
    
    this.velocity.x = toOrbitX * 0.5 + (dx / dist) * this.speed * 0.3;
    this.velocity.y = (1.5 - this.position.y) * 2; // Держится на высоте
    this.velocity.z = toOrbitZ * 0.5 + (dz / dist) * this.speed * 0.3;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Интенсивность искривления зависит от расстояния до игрока
    this.distortionPower = Math.max(0, 1.0 - dist / 20);
  }

  /** Получить силу притяжения вихря (для игрока) */
  public getVortexPull(playerPos: Vec3): Vec3 {
    if (!this.isVortexActive) return vec3(0, 0, 0);
    
    const dx = this.position.x - playerPos.x;
    const dz = this.position.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 0.5) return vec3(0, 0, 0);
    
    // Сила притяжения - сильнее когда ближе (ослаблена в 2 раза)
    const pullStrength = Math.max(0, 1 - dist / 20) * 7.5;
    
    return vec3(
      (dx / dist) * pullStrength,
      0,
      (dz / dist) * pullStrength
    );
  }

  /** Синий босс - телепортируется */
  private updateBossBlue(dt: number, playerPos: Vec3, time: number): void {
    // Обработка отката от удара - синий откидывается сильно!
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      this.velocity.x *= 0.85; // Быстрее затухает
      this.velocity.y *= 0.85;
      this.velocity.z *= 0.85;
      this.velocity.y -= 20 * dt;
      this.position.y = Math.max(0.5, this.position.y);
      return;
    }

    this.teleportTimer -= dt;

    if (this.teleportTimer <= 0) {
      // ТЕЛЕПОРТ!
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 10;
      
      this.position.x = playerPos.x + Math.cos(angle) * dist;
      this.position.y = 1.5 + Math.random() * 2;
      this.position.z = playerPos.z + Math.sin(angle) * dist;
      
      this.teleportTimer = 2.0 + Math.random() * 2.0; // 2-4 сек между телепортами
      return;
    }

    // Между телепортами - агрессивное преследование
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 0.1) {
      // Зигзаг движение
      const zigzag = Math.sin(time * 10) * 3;
      
      this.velocity.x = (dx / dist) * this.speed + zigzag * 0.5;
      this.velocity.y = (dy / dist) * this.speed * 0.5;
      this.velocity.z = (dz / dist) * this.speed;

      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;

      this.position.y = Math.max(0.5, Math.min(4.0, this.position.y));
    }
  }

  /** Получить урон (для боссов) */
  public takeDamage(amount: number = 1): boolean {
    this.hp -= amount;
    
    // Проверка смены фазы для Зелёного Босса
    if (this.enemyType === 'boss_green' && this.bossPhase === 1) {
      if (this.hp <= this.maxHp / 2) {
        this.bossPhase = 2;
        this.speed *= 1.3; // Быстрее во второй фазе
        this.onPhaseChange?.(2);
      }
    }
    
    if (this.hp <= 0) {
      this.hp = 0;
      return true; // Убит
    }
    return false;
  }

  /** Обновление хоппера - прыгающий враг */
  private updateHopper(dt: number, playerPos: Vec3, _time: number): void {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    const gravity = 18.0;

    if (this.onGround) {
      this.hopTimer -= dt;
      
      if (this.hopTimer <= 0) {
        // ПРЫЖОК!
        this.onGround = false;
        
        // Проверяем препятствие - прыгаем выше если нужно
        let jumpForce = 10 + Math.random() * 4;
        if (this.collision?.getObstacleHeight && distXZ > 0.1) {
          const dirX = dx / distXZ;
          const dirZ = dz / distXZ;
          const obstacleHeight = this.collision.getObstacleHeight(this.position, dirX, dirZ, 3);
          if (obstacleHeight > this.position.y) {
            // Прыгаем выше чтобы перепрыгнуть
            jumpForce = Math.max(jumpForce, (obstacleHeight - this.position.y + 2) * 3);
          }
        }
        
        this.verticalVelocity = jumpForce;
        this.hopTimer = 0.5 + Math.random() * 0.5;

        if (distXZ > 0.1) {
          const jumpSpeed = this.speed * 1.5;
          this.velocity.x = (dx / distXZ) * jumpSpeed;
          this.velocity.z = (dz / distXZ) * jumpSpeed;
        }
      } else {
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
      }
    } else {
      this.verticalVelocity -= gravity * dt;
      
      if (distXZ > 0.1) {
        this.velocity.x += (dx / distXZ) * dt * 3;
        this.velocity.z += (dz / distXZ) * dt * 3;
      }
    }

    // Применяем движение с проверкой коллизий
    const newX = this.position.x + this.velocity.x * dt;
    const newZ = this.position.z + this.velocity.z * dt;
    
    if (!this.collision?.checkEnemyCollision || 
        !this.collision.checkEnemyCollision({ x: newX, y: this.position.y, z: newZ }, this.radius)) {
      this.position.x = newX;
      this.position.z = newZ;
    } else {
      // Отскакиваем при столкновении
      this.velocity.x *= -0.5;
      this.velocity.z *= -0.5;
    }
    
    this.position.y += this.verticalVelocity * dt;

    // Проверка земли
    if (this.position.y <= 0.5) {
      this.position.y = 0.5;
      this.onGround = true;
      this.verticalVelocity = 0;
    }

    this.position.y = Math.min(12.0, this.position.y); // Выше могут прыгать
  }

  /** Обновление спайкера - летает сверху, кидает иголки */
  // Таймер манёвра спайкера
  private spikerManeuverTimer = 0;
  private spikerManeuverDir: Vec3 = { x: 0, y: 0, z: 0 };
  private spikerDodging = false;
  private spikerDiveTimer = 0;
  
  private updateSpiker(dt: number, playerPos: Vec3, time: number): void {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    
    // === ПОКАЧИВАНИЕ КРЫЛЬЯМИ (быстрое!) ===
    const wingCycle = time * 8 + this.phase; // Быстрые взмахи!
    const wingBeat = Math.sin(wingCycle);
    const bobAmount = wingBeat * 0.5;
    
    // === МАНЁВРЫ И УКЛОНЕНИЯ ===
    this.spikerManeuverTimer -= dt;
    this.spikerDiveTimer -= dt;
    
    // Случайный манёвр каждые 0.3-0.8 секунды
    if (this.spikerManeuverTimer <= 0) {
      this.spikerManeuverTimer = 0.3 + Math.random() * 0.5;
      
      // Выбираем тип манёвра
      const maneuverType = Math.random();
      
      if (maneuverType < 0.3) {
        // Резкий рывок в сторону
        const sideAngle = Math.atan2(dz, dx) + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
        this.spikerManeuverDir = {
          x: Math.cos(sideAngle) * 15,
          y: (Math.random() - 0.3) * 8,
          z: Math.sin(sideAngle) * 15
        };
        this.spikerDodging = true;
      } else if (maneuverType < 0.5) {
        // Пикирование к игроку
        this.spikerDiveTimer = 0.4;
        this.spikerManeuverDir = {
          x: dx / distXZ * 20,
          y: -8,
          z: dz / distXZ * 20
        };
        this.spikerDodging = false;
      } else if (maneuverType < 0.7) {
        // Резкий подъём
        this.spikerManeuverDir = {
          x: (Math.random() - 0.5) * 10,
          y: 12,
          z: (Math.random() - 0.5) * 10
        };
        this.spikerDodging = false;
      } else {
        // Отлёт назад
        this.spikerManeuverDir = {
          x: -dx / distXZ * 12,
          y: (Math.random() - 0.5) * 5,
          z: -dz / distXZ * 12
        };
        this.spikerDodging = false;
      }
    }
    
    // Применяем манёвр с затуханием
    const maneuverFade = Math.max(0, this.spikerManeuverTimer / 0.5);
    this.position.x += this.spikerManeuverDir.x * dt * maneuverFade;
    this.position.y += this.spikerManeuverDir.y * dt * maneuverFade;
    this.position.z += this.spikerManeuverDir.z * dt * maneuverFade;
    
    // === БАЗОВОЕ КРУЖЕНИЕ (быстрое!) ===
    if (!this.spikerDodging && this.spikerDiveTimer <= 0) {
      const orbitRadius = 8 + Math.sin(time * 2 + this.phase) * 3; // Радиус меняется!
      
      if (distXZ > 0.1) {
        const angle = Math.atan2(dz, dx);
        const orbitSpeed = 3.5; // Быстро кружит!
        const newAngle = angle + orbitSpeed * dt;
        
        // Коррекция расстояния
        let radialSpeed = 0;
        if (distXZ < orbitRadius - 2) {
          radialSpeed = -8;
        } else if (distXZ > orbitRadius + 2) {
          radialSpeed = 8;
        }
        
        const targetX = playerPos.x - Math.cos(newAngle) * (distXZ + radialSpeed * dt);
        const targetZ = playerPos.z - Math.sin(newAngle) * (distXZ + radialSpeed * dt);
        
        this.position.x += (targetX - this.position.x) * dt * 5;
        this.position.z += (targetZ - this.position.z) * dt * 5;
      }
    }
    
    // === ВЫСОТА ===
    const baseHeight = 5.0 + Math.sin(time * 1.5 + this.phase * 2) * 2.0;
    const targetHeight = baseHeight + bobAmount;
    
    // После пикирования - резкий подъём
    if (this.spikerDiveTimer > 0 && this.position.y < 3) {
      this.spikerManeuverDir.y = 15; // Резко вверх!
    }
    
    // Плавная коррекция высоты
    if (this.spikerDiveTimer <= 0 && !this.spikerDodging) {
      const heightDiff = targetHeight - this.position.y;
      this.position.y += heightDiff * dt * 3;
    }
    
    // === АТАКА ИГОЛКАМИ ===
    this.spikeAttackTimer -= dt;
    if (this.spikeAttackTimer <= 0 && distXZ < 20) {
      this.onSpikerScream?.();
      
      // Стреляем быстрее!
      setTimeout(() => {
        if (this.active) {
          this.onSpikeAttack?.(
            { ...this.position },
            { ...playerPos }
          );
        }
      }, 200);
      
      this.spikeAttackTimer = this.spikeAttackCooldown * 0.7 + Math.random() * 0.5;
    }
    
    // === ОГРАНИЧЕНИЯ ===
    const arenaRadius = 35;
    const dist = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (dist > arenaRadius) {
      this.position.x *= arenaRadius / dist;
      this.position.z *= arenaRadius / dist;
    }
    this.position.y = Math.max(2.5, Math.min(12, this.position.y));
  }

  /** Обновление осколков */
  private updateFragments(dt: number): void {
    const gravity = 15.0;

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];

      // Физика
      f.position.x += f.velocity.x * dt;
      f.position.y += f.velocity.y * dt;
      f.position.z += f.velocity.z * dt;

      // Гравитация
      f.velocity.y -= gravity * dt;

      // Вращение
      f.rotation += f.rotationSpeed * dt;

      // Время жизни
      f.lifetime -= dt;

      // Удаляем мёртвые
      if (f.lifetime <= 0 || f.position.y < -5) {
        this.fragments.splice(i, 1);
      }
    }
  }

  /** Проверка столкновения с игроком */
  public checkPlayerCollision(playerPos: Vec3): boolean {
    if (!this.active) return false;

    const dist = distanceVec3(this.position, playerPos);
    return dist < this.radius + 0.5; // Радиус игрока ~0.5
  }

  /** Разрубить на куски! */
  public slice(sliceDirection: Vec3): void {
    if (!this.active) return;

    this.active = false;
    this.removeTimer = 3.0;

    // Создаём осколки
    const numFragments = 4 + Math.floor(Math.random() * 4); // 4-7 кусков

    for (let i = 0; i < numFragments; i++) {
      // Случайное направление разлёта
      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      
      const speed = 8 + Math.random() * 12;
      
      // Основное направление - от удара + случайное
      const vx = sliceDirection.x * speed * 0.5 + Math.cos(angle) * Math.cos(upAngle) * speed;
      const vy = Math.sin(upAngle) * speed + 3;
      const vz = sliceDirection.z * speed * 0.5 + Math.sin(angle) * Math.cos(upAngle) * speed;

      this.fragments.push({
        position: { 
          x: this.position.x + (Math.random() - 0.5) * this.radius,
          y: this.position.y + (Math.random() - 0.5) * this.radius,
          z: this.position.z + (Math.random() - 0.5) * this.radius,
        },
        velocity: { x: vx, y: vy, z: vz },
        size: 0.15 + Math.random() * 0.25,
        lifetime: 1.5 + Math.random() * 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
      });
    }
  }

  /** Можно удалить? */
  public canRemove(): boolean {
    return !this.active && this.removeTimer <= 0 && this.fragments.length === 0;
  }

  /** Данные для шейдера [x, y, z, type+intensity] */
  public getShaderData(): [number, number, number, number] {
    // w компонент: 0 = неактивен
    // 1.0-1.9 = бейнлинг (зелёный)
    // 3.0-3.9 = фантом (чёрный)
    // 5.0-5.9 = runner (оранжевый)
    // 7.0-7.9 = hopper (синий)
    // 9.0-9.9 = spiker (красно-жёлтый, летающий)
    // 11.0-11.9 = boss_green (огромный зелёный)
    // 13.0-13.9 = boss_black (чёрный, искривление)
    // 15.0-15.9 = boss_blue (синий, телепорт)
    let w = 0;
    if (this.active) {
      const intensity = this.fireIntensity * 0.5;
      switch (this.enemyType) {
        case 'phantom':
          w = 3 + intensity;
          break;
        case 'runner':
          w = 5 + intensity;
          break;
        case 'hopper':
          w = 7 + intensity;
          break;
        case 'spiker':
          w = 9 + intensity;
          break;
        case 'boss_green':
          w = 11 + intensity;
          break;
        case 'boss_black':
          w = 13 + intensity;
          break;
        case 'boss_blue':
          w = 15 + intensity;
          break;
        default: // baneling
          w = 1 + intensity;
      }
    }
    return [this.position.x, this.position.y, this.position.z, w];
  }

  /** Данные осколков для шейдера */
  public getFragmentsData(): number[] {
    const data: number[] = [];
    for (const f of this.fragments) {
      data.push(f.position.x, f.position.y, f.position.z, f.size);
    }
    return data;
  }
}

/** Кристалл силы чёрного босса */
export interface PowerCrystal {
  x: number;
  z: number;
  height: number;
  active: boolean;
  platformIndex: number; // На какой платформе
}

/** Элемент очереди спавна через портал */
export interface SpawnQueueItem {
  type: EnemyType;
  speed: number;
  portalSide: 'left' | 'right'; // Через какой портал выходит
}

/** Позиции порталов */
export const PORTAL_POSITIONS = {
  left: { x: -21.0, y: 1.5, z: 0 },
  right: { x: 21.0, y: 1.5, z: 0 }
} as const;

/**
 * Менеджер врагов с системой волн
 */
export class TargetManager {
  /** Все враги */
  public targets: Target[] = [];

  /** Текущая волна */
  public wave = 0;

  /** Волна активна? */
  public waveActive = false;

  /** Задержка между волнами (секунды) */
  private waveDelay = 4.0;
  private waveTimer = 0;

  /** Счёт */
  public score = 0;

  /** Кристаллы силы для чёрного босса */
  public powerCrystals: PowerCrystal[] = [];

  /** Callback при уничтожении */
  public onTargetDestroyed?: (target: Target) => void;

  /** Callback при столкновении с игроком */
  public onPlayerHit?: (target: Target) => void;

  /** Callback при завершении волны */
  public onWaveComplete?: (wave: number) => void;

  /** Callback при старте волны */
  public onWaveStart?: (wave: number) => void;

  /** Callback при уроне от лужи */
  public onPoolDamage?: (damage: number) => void;

  /** Callback при уничтожении кристалла */
  public onCrystalDestroyed?: (remaining: number) => void;

  /** Callback при смене фазы босса */
  public onBossPhaseChange?: (bossType: EnemyType, phase: number) => void;

  /** Callback при кислотном дожде (зелёный босс плюнул) */
  public onAcidRain?: (pos: Vec3) => void;

  /** Callback при начале/конце вихря чёрного босса */
  public onBossVortexStart?: () => void;
  public onBossVortexEnd?: () => void;
  public onBossVortexWarning?: () => void;

  /** Токсичные лужи */
  public toxicPools: ToxicPool[] = [];

  /** Зоны кислотного дождя */
  public acidRainZones: AcidRainZone[] = [];

  /** Фаза 2 зелёного босса (один из двух убит) */
  public greenBossPhase2 = false;

  /** Летящие снаряды кислоты */
  public acidProjectiles: AcidProjectile[] = [];

  /** Таймер урона от луж и дождя */
  private poolDamageTimer = 0;

  /** Система коллизий */
  private collision: ICollisionSystem | null = null;

  // === СИСТЕМА ПОРТАЛОВ ===
  /** Очередь спавна врагов */
  private spawnQueue: SpawnQueueItem[] = [];
  
  /** Таймеры порталов (левый и правый) */
  private portalTimers = { left: 0, right: 0 };
  
  /** Интервал между спавнами через один портал (сек) */
  private readonly PORTAL_SPAWN_INTERVAL = 0.7;
  
  /** Callback при спавне врага через портал (для звука) */
  public onEnemySpawn?: (type: EnemyType, portalSide: 'left' | 'right') => void;
  
  /** Callback при атаке иголкой спайкера */
  public onSpikerAttack?: (startPos: Vec3, targetPos: Vec3) => void;
  
  /** Callback при вскрике спайкера */
  public onSpikerScream?: () => void;
  
  /** Callback при попадании иголки в игрока */
  public onSpikeHit?: () => void;
  
  // === СИСТЕМА ЛАЗЕРОВ СПАЙКЕРОВ ===
  /** Активные лазеры */
  public spikes: Array<{
    start: Vec3;      // Начало луча (позиция спайкера)
    end: Vec3;        // Конец луча (позиция игрока)
    active: boolean;
    lifetime: number; // Время существования
    intensity: number; // Интенсивность (для затухания)
    damageDealt: boolean; // Урон уже нанесён?
  }> = [];

  constructor(collision?: ICollisionSystem) {
    this.collision = collision || null;
  }

  /** Проверить находится ли игрок под платформой (укрытие от дождя) */
  private isPlayerUnderPlatform(playerPos: Vec3): boolean {
    if (!this.collision) return false;
    
    // Проверяем есть ли потолок над игроком
    const ceiling = this.collision.getCeilingHeight(playerPos);
    // Если есть потолок ниже 15м - игрок под укрытием
    return ceiling < 15;
  }

  /** Начать игру с указанной волны */
  public startGame(startWave: number = 1): void {
    this.wave = startWave - 1; // -1 потому что startNextWave сделает +1
    this.score = 0;
    this.targets = [];
    this.toxicPools = [];
    this.greenBossPhase2 = false;
    this.spawnQueue = []; // Очищаем очередь порталов
    this.portalTimers = { left: 0, right: 0 };
    this.startNextWave();
  }

  /** Начать следующую волну */
  public startNextWave(): void {
    this.wave++;
    this.waveActive = true;
    
    // Спавним N врагов (N = номер волны)
    this.spawnEnemies(this.wave);
    
    this.onWaveStart?.(this.wave);
  }

  /** Счётчик для ID */
  private enemyIdCounter = 0;

  /**
   * Спавн врагов по волнам:
   * - Волна 5: ЗЕЛЁНЫЙ БОСС + враги
   * - Волна 10: ЧЁРНЫЙ БОСС + враги
   * - Волна 15: СИНИЙ БОСС + враги
   */
  private spawnEnemies(wave: number): void {
    const spawnRadius = 18;
    const baseSpeed = 3.5 + wave * 0.3;

    // === БОССЫ ===
    if (wave === 5) {
      // ДВА ЗЕЛЁНЫХ БОССА - охотник и загонщик!
      const bossConfigs: Array<{ pos: Vec3; role: GreenBossRole }> = [
        { pos: vec3(-8, 3.0, -spawnRadius), role: 'hunter' },   // Охотник - гонит
        { pos: vec3(8, 3.0, -spawnRadius), role: 'blocker' },   // Загонщик - плюёт впереди
      ];
      
      for (const config of bossConfigs) {
        const boss = new Target(config.pos, baseSpeed, this.enemyIdCounter++, 'boss_green', this.collision || undefined);
        boss.greenBossRole = config.role;
        
        if (config.role === 'hunter') {
          // ОХОТНИК: вызывает кислотный дождь с неба!
          boss.onAcidRainMark = (pos) => {
            this.spawnAcidRainZone(pos);
          };
        } else {
          // ЗАГОНЩИК: кидает лужи (плевки)
          boss.onSpit = (startPos, targetPos) => {
            this.spawnAcidProjectile(startPos, targetPos);
          };
        }
        
        // Callback для смены фазы
        boss.onPhaseChange = (phase) => {
          this.onBossPhaseChange?.(boss.enemyType, phase);
        };
        
        this.targets.push(boss);
      }
    } else if (wave === 10) {
      // ЧЁРНЫЙ БОСС!
      const pos = vec3(0, 2.5, -spawnRadius);
      const boss = new Target(pos, baseSpeed, this.enemyIdCounter++, 'boss_black', this.collision || undefined);
      
      // Колбэк для спавна фантомов
      boss.onSpawnPhantom = (spawnPos) => {
        this.spawnPhantomFromBoss(spawnPos);
      };
      
      // Колбэки для вихря (звук)
      boss.onVortexWarning = () => {
        this.onBossVortexWarning?.();
      };
      boss.onVortexStart = () => {
        this.onBossVortexStart?.();
      };
      boss.onVortexEnd = () => {
        this.onBossVortexEnd?.();
      };
      
      this.targets.push(boss);

      // === КРИСТАЛЛЫ СИЛЫ НА ПЛАТФОРМАХ ===
      // 6 кристаллов на 6 платформах
      const platformPositions = [
        { x: 10.0, z: 0.0, height: 2.3 },     // Платформа 1
        { x: 5.0, z: 8.66, height: 3.5 },     // Платформа 2
        { x: -5.0, z: 8.66, height: 4.7 },    // Платформа 3
        { x: -10.0, z: 0.0, height: 5.9 },    // Платформа 4
        { x: -5.0, z: -8.66, height: 7.1 },   // Платформа 5
        { x: 5.0, z: -8.66, height: 8.3 },    // Платформа 6
      ];
      
      this.powerCrystals = platformPositions.map((pos, i) => ({
        x: pos.x,
        z: pos.z,
        height: pos.height,
        active: true,
        platformIndex: i
      }));
    } else if (wave === 15) {
      // СИНИЙ БОСС!
      const pos = vec3(0, 2.0, -spawnRadius);
      this.targets.push(new Target(pos, baseSpeed, this.enemyIdCounter++, 'boss_blue', this.collision || undefined));
    }

    // На волнах боссов - ТОЛЬКО БОСС!
    const isBossWave = wave === 5 || wave === 10 || wave === 15;
    if (isBossWave) return; // Не спавним обычных врагов на волнах боссов
    
    // === СБАЛАНСИРОВАННОЕ КОЛИЧЕСТВО ВРАГОВ ===
    // Эпоха 1 (1-5): умеренно
    // Эпоха 2 (6-10): сложнее, но без раннеров
    // Эпоха 3 (11-15): максимальная сложность с раннерами
    
    let banelingCount: number;
    let phantomCount: number;
    let runnerCount: number;
    let hopperCount: number;
    let spikerCount: number;
    
    if (wave <= 5) {
      // Эпоха 1: кислотная - простая
      banelingCount = Math.floor(wave * 1.2);
      phantomCount = wave >= 3 ? Math.floor((wave - 2) * 0.8) : 0;
      runnerCount = 0; // Нет раннеров
      hopperCount = wave >= 4 ? Math.floor((wave - 3) * 0.5) : 0;
      spikerCount = wave >= 2 ? Math.floor((wave - 1) * 0.5) : 0; // С 2й волны
    } else if (wave <= 10) {
      // Эпоха 2: чёрная дыра - средняя сложность
      banelingCount = Math.floor(wave * 0.8); // Меньше бейнлингов
      phantomCount = Math.floor((wave - 3) * 0.6); // Меньше фантомов
      runnerCount = 0; // Нет раннеров до 11 волны!
      hopperCount = Math.floor((wave - 4) * 0.6); // Меньше хопперов
      spikerCount = Math.floor((wave - 2) * 0.6); // Больше спайкеров
    } else {
      // Эпоха 3: космическая - с раннерами
      banelingCount = Math.floor(wave * 0.7);
      phantomCount = Math.floor((wave - 5) * 0.5);
      runnerCount = Math.floor((wave - 10) * 1.5); // Раннеры с 11 волны!
      hopperCount = Math.floor((wave - 6) * 0.5);
      spikerCount = Math.floor((wave - 5) * 0.7); // Много спайкеров
    }

    // === ДОБАВЛЯЕМ ВРАГОВ В ОЧЕРЕДЬ ПОРТАЛОВ ===
    // Очищаем очередь перед новой волной
    this.spawnQueue = [];
    
    // Чередуем порталы для равномерного спавна
    let useLeftPortal = true;
    
    // Добавляем бейнлингов (зелёные) в очередь
    for (let i = 0; i < banelingCount; i++) {
      const speed = baseSpeed + Math.random() * 1.5;
      this.spawnQueue.push({
        type: 'baneling',
        speed,
        portalSide: useLeftPortal ? 'left' : 'right'
      });
      useLeftPortal = !useLeftPortal;
    }

    // Добавляем раннеров (оранжевые)
    for (let i = 0; i < runnerCount; i++) {
      const speed = baseSpeed + Math.random() * 1.0;
      this.spawnQueue.push({
        type: 'runner',
        speed,
        portalSide: useLeftPortal ? 'left' : 'right'
      });
      useLeftPortal = !useLeftPortal;
    }

    // Добавляем хопперов (синие)
    for (let i = 0; i < hopperCount; i++) {
      const speed = baseSpeed + Math.random() * 1.0;
      this.spawnQueue.push({
        type: 'hopper',
        speed,
        portalSide: useLeftPortal ? 'left' : 'right'
      });
      useLeftPortal = !useLeftPortal;
    }

    // Добавляем фантомов (чёрные)
    for (let i = 0; i < phantomCount; i++) {
      const speed = baseSpeed + Math.random() * 1.0;
      this.spawnQueue.push({
        type: 'phantom',
        speed,
        portalSide: useLeftPortal ? 'left' : 'right'
      });
      useLeftPortal = !useLeftPortal;
    }

    // Добавляем спайкеров (летающие стрелки)
    for (let i = 0; i < spikerCount; i++) {
      const speed = baseSpeed * 0.6; // Медленные
      this.spawnQueue.push({
        type: 'spiker',
        speed,
        portalSide: useLeftPortal ? 'left' : 'right'
      });
      useLeftPortal = !useLeftPortal;
    }
    
    // Перемешиваем очередь для разнообразия
    this.shuffleSpawnQueue();
  }
  
  /** Перемешать очередь спавна (Fisher-Yates) */
  private shuffleSpawnQueue(): void {
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
  }
  
  /** Спавн врага из портала */
  private spawnFromPortal(item: SpawnQueueItem): void {
    const portal = PORTAL_POSITIONS[item.portalSide];
    
    // Позиция появления - немного перед порталом
    const offsetX = item.portalSide === 'left' ? 1.5 : -1.5;
    const offsetZ = (Math.random() - 0.5) * 2; // Случайный сдвиг по Z
    
    // Высота зависит от типа врага
    let height: number;
    if (item.type === 'baneling') {
      // Бейнлинги катятся по земле (их радиус ~0.7)
      height = 0.7;
    } else if (item.type === 'runner') {
      // Раннеры бегут по земле
      height = 0.5;
    } else if (item.type === 'hopper') {
      // Хопперы прыгают, начинают с земли
      height = 0.5;
    } else if (item.type === 'phantom') {
      // Фантомы летают
      height = 1.5 + Math.random() * 1.5;
    } else if (item.type === 'spiker') {
      // Спайкеры летают высоко
      height = 5 + Math.random() * 3;
    } else {
      // По умолчанию на земле
      height = 0.7;
    }
    
    const pos = vec3(
      portal.x + offsetX,
      height,
      portal.z + offsetZ
    );
    
    const enemy = new Target(pos, item.speed, this.enemyIdCounter++, item.type, this.collision || undefined);
    
    // Подключаем callbacks для спайкеров
    if (item.type === 'spiker') {
      enemy.onSpikeAttack = (startPos, targetPos) => {
        this.fireSpike(startPos, targetPos);
        this.onSpikerAttack?.(startPos, targetPos);
      };
      enemy.onSpikerScream = () => {
        this.onSpikerScream?.();
      };
    }
    
    this.targets.push(enemy);
    
    // Callback для звука появления
    this.onEnemySpawn?.(item.type, item.portalSide);
  }
  
  /** Выстрел иголкой спайкера */
  private fireSpike(startPos: Vec3, targetPos: Vec3): void {
    const dist = Math.sqrt(
      (targetPos.x - startPos.x) ** 2 +
      (targetPos.y - startPos.y) ** 2 +
      (targetPos.z - startPos.z) ** 2
    );
    
    if (dist < 0.1) return;
    
    // Создаём лазер - мгновенный луч от спайкера к игроку
    this.spikes.push({
      start: { ...startPos },
      end: { ...targetPos },
      active: true,
      lifetime: 0.4, // Лазер виден 0.4 секунды
      intensity: 1.0,
      damageDealt: false,
    });
  }

  /** Кулдаун на урон от фантомов (чтобы не спамил урон) */
  private phantomDamageCooldown: Map<number, number> = new Map();

  /** Обновление */
  public update(dt: number, playerPos: Vec3, time: number): void {
    // Таймер между волнами
    if (!this.waveActive && this.waveTimer > 0) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // === ОБРАБОТКА ОЧЕРЕДИ СПАВНА ЧЕРЕЗ ПОРТАЛЫ ===
    // Обновляем таймеры порталов
    if (this.portalTimers.left > 0) this.portalTimers.left -= dt;
    if (this.portalTimers.right > 0) this.portalTimers.right -= dt;
    
    // Спавним врагов из очереди когда порталы готовы
    if (this.spawnQueue.length > 0) {
      // Ищем следующего врага для левого портала
      if (this.portalTimers.left <= 0) {
        const leftIdx = this.spawnQueue.findIndex(item => item.portalSide === 'left');
        if (leftIdx !== -1) {
          const item = this.spawnQueue.splice(leftIdx, 1)[0];
          this.spawnFromPortal(item);
          this.portalTimers.left = this.PORTAL_SPAWN_INTERVAL;
        }
      }
      
      // Ищем следующего врага для правого портала
      if (this.portalTimers.right <= 0) {
        const rightIdx = this.spawnQueue.findIndex(item => item.portalSide === 'right');
        if (rightIdx !== -1) {
          const item = this.spawnQueue.splice(rightIdx, 1)[0];
          this.spawnFromPortal(item);
          this.portalTimers.right = this.PORTAL_SPAWN_INTERVAL;
        }
      }
    }

    // Уменьшаем кулдауны фантомов
    for (const [id, cd] of this.phantomDamageCooldown) {
      if (cd > 0) {
        this.phantomDamageCooldown.set(id, cd - dt);
      }
    }

    // Обновляем врагов
    for (const target of this.targets) {
      target.update(dt, playerPos, time);

      // Проверка столкновения с игроком
      if (target.checkPlayerCollision(playerPos)) {
        if (target.enemyType === 'phantom') {
          // Фантом пролетает сквозь, но наносит урон с кулдауном
          const cd = this.phantomDamageCooldown.get(target['id'] as number) || 0;
          if (cd <= 0) {
            this.onPlayerHit?.(target);
            this.phantomDamageCooldown.set(target['id'] as number, 1.0); // 1 сек кулдаун
          }
          // НЕ деактивируем - фантом летит дальше!
        } else if (target.isBoss) {
          // Боссы наносят урон но НЕ умирают при столкновении!
          const cd = this.phantomDamageCooldown.get(target['id'] as number) || 0;
          if (cd <= 0) {
            this.onPlayerHit?.(target);
            this.phantomDamageCooldown.set(target['id'] as number, 1.5); // 1.5 сек кулдаун для боссов
          }
        } else {
          // Обычные враги взрываются
          this.onPlayerHit?.(target);
          target.active = false;
        }
      }
    }

    // Удаляем мёртвых
    this.targets = this.targets.filter(t => !t.canRemove());

    // === ЛЕТЯЩИЕ СНАРЯДЫ КИСЛОТЫ ===
    for (const proj of this.acidProjectiles) {
      proj.progress += dt / proj.flightTime;
      
      // Параболическая траектория
      const t = proj.progress;
      proj.position.x = proj.startPos.x + (proj.targetPos.x - proj.startPos.x) * t;
      proj.position.z = proj.startPos.z + (proj.targetPos.z - proj.startPos.z) * t;
      // Дуга вверх и вниз
      proj.position.y = proj.startPos.y + (1 - (2 * t - 1) * (2 * t - 1)) * 8; // Макс высота 8м
      
      // Снаряд приземлился
      if (proj.progress >= 1) {
        // Создаём растекающуюся лужу
        this.toxicPools.push({
          position: { ...proj.targetPos },
          radius: 0.5,          // Начальный радиус маленький
          maxRadius: 3.5,       // Растечётся до 3.5м
          lifetime: 6.0,
          maxLifetime: 6.0,
          damage: 8,
          spreadProgress: 0     // Начинает растекаться
        });
        this.onAcidRain?.(proj.targetPos);
      }
    }
    // Удаляем приземлившиеся снаряды
    this.acidProjectiles = this.acidProjectiles.filter(p => p.progress < 1);

    // === ЛАЗЕРЫ СПАЙКЕРОВ ===
    for (const laser of this.spikes) {
      if (!laser.active) continue;
      
      // Уменьшаем время жизни
      laser.lifetime -= dt;
      
      // Затухание интенсивности
      laser.intensity = Math.max(0, laser.lifetime / 0.4);
      
      if (laser.lifetime <= 0) {
        laser.active = false;
        continue;
      }
      
      // Проверка попадания - луч проходит мгновенно
      // Урон наносится только один раз в начале
      if (!laser.damageDealt) {
        // Расстояние от игрока до линии лазера
        const laserDir = {
          x: laser.end.x - laser.start.x,
          y: laser.end.y - laser.start.y,
          z: laser.end.z - laser.start.z,
        };
        const laserLen = Math.sqrt(laserDir.x ** 2 + laserDir.y ** 2 + laserDir.z ** 2);
        
        if (laserLen > 0.1) {
          // Нормализуем направление
          laserDir.x /= laserLen;
          laserDir.y /= laserLen;
          laserDir.z /= laserLen;
          
          // Вектор от начала лазера к игроку
          const toPlayer = {
            x: playerPos.x - laser.start.x,
            y: playerPos.y - laser.start.y,
            z: playerPos.z - laser.start.z,
          };
          
          // Проекция на линию лазера
          const proj = toPlayer.x * laserDir.x + toPlayer.y * laserDir.y + toPlayer.z * laserDir.z;
          const clampedProj = Math.max(0, Math.min(laserLen, proj));
          
          // Ближайшая точка на лазере
          const closest = {
            x: laser.start.x + laserDir.x * clampedProj,
            y: laser.start.y + laserDir.y * clampedProj,
            z: laser.start.z + laserDir.z * clampedProj,
          };
          
          // Расстояние до игрока
          const dist = Math.sqrt(
            (playerPos.x - closest.x) ** 2 +
            (playerPos.y - closest.y) ** 2 +
            (playerPos.z - closest.z) ** 2
          );
          
          // Попадание если близко к лучу
          if (dist < 1.2) {
            laser.damageDealt = true;
            this.onSpikeHit?.();
          }
        }
      }
    }
    // Удаляем неактивные лазеры
    this.spikes = this.spikes.filter(s => s.active);

    // === ТОКСИЧНЫЕ ЛУЖИ (остаются навсегда) ===
    for (const pool of this.toxicPools) {
      // Растекание: радиус увеличивается в первые 1.5 сек
      if (pool.spreadProgress < 1) {
        pool.spreadProgress = Math.min(1, pool.spreadProgress + dt / 1.5);
        pool.radius = pool.maxRadius * (0.3 + 0.7 * pool.spreadProgress);
      }
      // lifetime не уменьшается - лужи остаются навсегда
    }

    // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ ===
    for (const zone of this.acidRainZones) {
      if (!zone.isRaining) {
        // Ещё показываем метку
        zone.markTime -= dt;
        if (zone.markTime <= 0) {
          zone.isRaining = true;
          this.onAcidRainStart?.(zone.position);
        }
      } else {
        // Дождь идёт
        zone.lifetime -= dt;
      }
    }
    // Удаляем истёкшие зоны
    this.acidRainZones = this.acidRainZones.filter(z => z.lifetime > 0 || !z.isRaining);

    // Урон от луж и дождя (каждые 0.5 сек)
    this.poolDamageTimer -= dt;
    if (this.poolDamageTimer <= 0) {
      this.poolDamageTimer = 0.5;
      
      // Урон от луж (только на земле)
      for (const pool of this.toxicPools) {
        const dx = playerPos.x - pool.position.x;
        const dz = playerPos.z - pool.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // Проверяем только если игрок НА ЗЕМЛЕ (не в прыжке)
        if (dist < pool.radius && playerPos.y < 0.8) {
          this.onPoolDamage?.(pool.damage);
          break;
        }
      }
      
      // Урон от кислотного дождя (если не под платформой)
      for (const zone of this.acidRainZones) {
        if (!zone.isRaining) continue;
        
        const dx = playerPos.x - zone.position.x;
        const dz = playerPos.z - zone.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < zone.radius) {
          // Проверяем есть ли платформа над игроком (укрытие от дождя)
          const isUnderCover = this.isPlayerUnderPlatform(playerPos);
          if (!isUnderCover) {
            this.onPoolDamage?.(zone.damage);
            break;
          }
        }
      }
    }

    // Проверяем завершение волны (все враги убиты И очередь пуста)
    if (this.waveActive && this.getActiveCount() === 0 && this.spawnQueue.length === 0) {
      this.waveActive = false;
      this.waveTimer = this.waveDelay;
      this.onWaveComplete?.(this.wave);
      // Лужи остаются навсегда - не очищаем
    }
  }

  /** Попытка разрубить катаной */
  public trySlice(playerPos: Vec3, playerYaw: number, range: number, angle: number, playerGrounded = true): Target | null {
    for (const target of this.targets) {
      if (!target.active) continue;

      // Спайкеры требуют удара в прыжке!
      if (target.requiresJumpToKill && playerGrounded) {
        continue; // Пропускаем - игрок на земле
      }

      // Расстояние (для боссов увеличиваем хитбокс, для спайкеров добавляем вертикальную проверку)
      const dx = target.position.x - playerPos.x;
      const dy = target.position.y - playerPos.y;
      const dz = target.position.z - playerPos.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Для спайкеров используем 3D расстояние и увеличенную дальность в прыжке
      const effectiveRange = target.requiresJumpToKill 
        ? range + 2.5 // Увеличенная дальность для спайкеров
        : range + (target.isBoss ? target.radius : 0);
      
      const checkDist = target.requiresJumpToKill ? dist3D : distXZ;
      if (checkDist > effectiveRange) continue;

      // Угол
      const angleToTarget = Math.atan2(dx, -dz);
      let angleDiff = angleToTarget - playerYaw;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) > angle / 2) continue;

      // Попали!
      if (target.isBoss) {
        // Босс - уменьшаем HP
        const killed = target.takeDamage(1);
        
        // Зелёный босс выпускает бейнлингов при каждом ударе!
        if (target.enemyType === 'boss_green' && !killed) {
          // В фазе 2 - спавним 2 бейнлинга!
          const spawnCount = this.greenBossPhase2 ? 2 : 1;
          for (let i = 0; i < spawnCount; i++) {
            this.spawnBanelingFromBoss(target.position);
          }
        }
        
        if (killed) {
          // Босс убит! Эпичный взрыв
          const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
          target.slice(sliceDir);
          this.score += 1000 * this.wave; // Много очков за босса!
          this.onTargetDestroyed?.(target);
          
          // Зелёный босс при смерти выпускает кучу бейнлингов!
          if (target.enemyType === 'boss_green') {
            // Проверяем остался ли ещё один зелёный босс
            const remainingGreenBosses = this.targets.filter(
              t => t.active && t.enemyType === 'boss_green' && t !== target
            ).length;
            
            if (remainingGreenBosses > 0 && !this.greenBossPhase2) {
              // Входим в фазу 2 - один босс остался!
              this.greenBossPhase2 = true;
              this.onBossPhaseChange?.('boss_green', 2);
            }
            
            for (let i = 0; i < 5; i++) {
              this.spawnBanelingFromBoss(target.position);
            }
          }
        } else {
          // Не убит - откидываем босса назад!
          const knockbackForce = target.enemyType === 'boss_green' ? 8 : 
                                 target.enemyType === 'boss_black' ? 5 : 12; // Синий откидывается сильнее
          target.applyKnockback(dx, dz, knockbackForce);
        }
        // Возвращаем даже если не убит - чтобы был хитмаркер
        return target;
      } else {
        // Обычный враг - убиваем сразу
        const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
        target.slice(sliceDir);
        
        this.score += 100 * this.wave;
        this.onTargetDestroyed?.(target);
        
        return target;
      }
    }

    return null;
  }

  /** Сплеш-волна - бьёт всех врагов в радиусе горизонтально */
  public trySplashWave(playerPos: Vec3, playerYaw: number, radius: number): number {
    let killCount = 0;
    
    for (const target of this.targets) {
      if (!target.active) continue;

      // Расстояние от игрока
      const dx = target.position.x - playerPos.x;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Учитываем размер врага для радиуса
      const effectiveRadius = radius + (target.isBoss ? target.radius : target.radius);
      if (dist > effectiveRadius) continue;

      // Попали!
      if (target.isBoss) {
        // Босс - уменьшаем HP (сплеш наносит 2 урона)
        const killed = target.takeDamage(2);
        
        // Зелёный босс выпускает бейнлингов при каждом ударе!
        if (target.enemyType === 'boss_green' && !killed) {
          const spawnCount = this.greenBossPhase2 ? 2 : 1;
          for (let i = 0; i < spawnCount; i++) {
            this.spawnBanelingFromBoss(target.position);
          }
        }
        
        if (killed) {
          // Босс убит!
          const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
          target.slice(sliceDir);
          this.score += 1000 * this.wave;
          this.onTargetDestroyed?.(target);
          killCount++;
          
          // Зелёный босс при смерти выпускает бейнлингов
          if (target.enemyType === 'boss_green') {
            const remainingGreenBosses = this.targets.filter(
              t => t.active && t.enemyType === 'boss_green' && t !== target
            ).length;
            
            if (remainingGreenBosses > 0 && !this.greenBossPhase2) {
              this.greenBossPhase2 = true;
              this.onBossPhaseChange?.('boss_green', 2);
            }
            
            for (let i = 0; i < 5; i++) {
              this.spawnBanelingFromBoss(target.position);
            }
          }
        } else {
          // Откидываем босса назад (сплеш сильнее)
          const knockbackForce = (target.enemyType === 'boss_green' ? 12 : 
                                  target.enemyType === 'boss_black' ? 8 : 18);
          target.applyKnockback(dx, dz, knockbackForce);
        }
      } else {
        // Обычный враг - убиваем сразу
        const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
        target.slice(sliceDir);
        
        this.score += 100 * this.wave;
        this.onTargetDestroyed?.(target);
        killCount++;
      }
    }

    return killCount;
  }

  /** Данные для шейдера (4 компонента: x, y, z, type) */
  public getShaderData(): Float32Array {
    const data = new Float32Array(this.targets.length * 4);
    for (let i = 0; i < this.targets.length; i++) {
      const [x, y, z, typeIntensity] = this.targets[i].getShaderData();
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = typeIntensity;
    }
    return data;
  }

  /** Данные всех осколков */
  public getAllFragmentsData(): Float32Array {
    const allFragments: number[] = [];
    for (const target of this.targets) {
      allFragments.push(...target.getFragmentsData());
    }
    return new Float32Array(allFragments);
  }

  /** Данные луж для шейдера [x, z, radius, animData] */
  /** Данные луж для шейдера [x, z, radius, spreadProgress] */
  public getPoolsShaderData(): Float32Array {
    const data = new Float32Array(this.toxicPools.length * 4);
    for (let i = 0; i < this.toxicPools.length; i++) {
      const pool = this.toxicPools[i];
      data[i * 4 + 0] = pool.position.x;
      data[i * 4 + 1] = pool.position.z;
      data[i * 4 + 2] = pool.radius;
      data[i * 4 + 3] = pool.spreadProgress; // 0-1 анимация растекания
    }
    return data;
  }

  /** Данные снарядов кислоты для шейдера [x, y, z, progress] */
  public getAcidProjectilesData(): Float32Array {
    const data = new Float32Array(this.acidProjectiles.length * 4);
    for (let i = 0; i < this.acidProjectiles.length; i++) {
      const proj = this.acidProjectiles[i];
      data[i * 4 + 0] = proj.position.x;
      data[i * 4 + 1] = proj.position.y;
      data[i * 4 + 2] = proj.position.z;
      data[i * 4 + 3] = proj.progress;
    }
    return data;
  }

  /** Данные иголок спайкеров для шейдера [x, y, z, lifetime] */
  /** Данные начальных точек лазеров [startX, startY, startZ, lifetime] */
  public getSpikesData(): Float32Array {
    const data = new Float32Array(Math.min(this.spikes.length, 8) * 4);
    for (let i = 0; i < Math.min(this.spikes.length, 8); i++) {
      const laser = this.spikes[i];
      data[i * 4 + 0] = laser.start.x;
      data[i * 4 + 1] = laser.start.y;
      data[i * 4 + 2] = laser.start.z;
      data[i * 4 + 3] = laser.lifetime;
    }
    return data;
  }

  /** Данные конечных точек лазеров [endX, endY, endZ, intensity] */
  public getSpikeTargetsData(): Float32Array {
    const data = new Float32Array(Math.min(this.spikes.length, 8) * 4);
    for (let i = 0; i < Math.min(this.spikes.length, 8); i++) {
      const laser = this.spikes[i];
      data[i * 4 + 0] = laser.end.x;
      data[i * 4 + 1] = laser.end.y;
      data[i * 4 + 2] = laser.end.z;
      data[i * 4 + 3] = laser.intensity;
    }
    return data;
  }

  /** Данные зон кислотного дождя для шейдера [x, z, radius, isRaining] */
  public getAcidRainZonesData(): Float32Array {
    const data = new Float32Array(this.acidRainZones.length * 4);
    for (let i = 0; i < this.acidRainZones.length; i++) {
      const zone = this.acidRainZones[i];
      data[i * 4 + 0] = zone.position.x;
      data[i * 4 + 1] = zone.position.z;
      data[i * 4 + 2] = zone.radius;
      data[i * 4 + 3] = zone.isRaining ? 1.0 : (1.0 - zone.markTime / 1.5) * 0.5; // 0-0.5 = метка, 1 = дождь
    }
    return data;
  }

  /** Создать летящий снаряд кислоты */
  private spawnAcidProjectile(startPos: Vec3, targetPos: Vec3): void {
    this.acidProjectiles.push({
      position: { ...startPos },
      targetPos: { ...targetPos },
      startPos: { ...startPos },
      progress: 0,
      flightTime: 1.2 // 1.2 секунды полёта
    });
    // Звук плевка
    this.onAcidSpit?.();
  }

  /** Создать зону кислотного дождя (метка → дождь) */
  private spawnAcidRainZone(pos: Vec3): void {
    this.acidRainZones.push({
      position: { ...pos },
      radius: 4.0,       // Радиус зоны
      lifetime: 5.0,     // 5 секунд дождя
      markTime: 1.5,     // 1.5 секунды предупреждение
      isRaining: false,
      damage: 6
    });
    // Звук установки метки
    this.onAcidRainMarkSound?.();
  }

  /** Callback при плевке (звук) */
  public onAcidSpit?: () => void;

  /** Callback при установке метки дождя (звук) */
  public onAcidRainMarkSound?: () => void;

  /** Callback когда дождь начинается */
  public onAcidRainStart?: (pos: Vec3) => void;

  /** Спавн бейнлинга из Зелёного Босса */
  private spawnBanelingFromBoss(bossPos: Vec3): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 3;
    
    const pos = vec3(
      bossPos.x + Math.cos(angle) * 2,
      bossPos.y + Math.random() * 1.5,
      bossPos.z + Math.sin(angle) * 2
    );
    
    const baneling = new Target(pos, speed, this.enemyIdCounter++, 'baneling', this.collision || undefined);
    
    baneling.velocity = vec3(
      Math.cos(angle) * 8,
      3 + Math.random() * 3,
      Math.sin(angle) * 8
    );
    
    this.targets.push(baneling);
  }

  /** Спавн фантома из Чёрного Босса */
  private spawnPhantomFromBoss(spawnPos: Vec3): void {
    const speed = 8 + Math.random() * 4;
    const phantom = new Target(spawnPos, speed, this.enemyIdCounter++, 'phantom', this.collision || undefined);
    this.targets.push(phantom);
  }

  /** Получить силу притяжения вихря для игрока */
  public getVortexPull(playerPos: Vec3): Vec3 {
    for (const target of this.targets) {
      if (target.active && target.enemyType === 'boss_black') {
        return target.getVortexPull(playerPos);
      }
    }
    return vec3(0, 0, 0);
  }

  /** Попытка разрубить кристалл */
  public trySliceCrystal(playerPos: Vec3, playerYaw: number, range: number): boolean {
    for (const crystal of this.powerCrystals) {
      if (!crystal.active) continue;

      const dx = crystal.x - playerPos.x;
      const dy = crystal.height - playerPos.y;
      const dz = crystal.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > range + 1.0) continue; // +1 для размера кристалла

      // Угол
      const angleToTarget = Math.atan2(dx, -dz);
      let angleDiff = angleToTarget - playerYaw;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) > Math.PI / 3) continue; // 60° угол атаки

      // Попали по кристаллу!
      crystal.active = false;
      
      const remaining = this.powerCrystals.filter(c => c.active).length;
      this.onCrystalDestroyed?.(remaining);

      // Спавним фантома из разбитого кристалла
      this.spawnPhantomFromBoss(vec3(crystal.x, crystal.height, crystal.z));

      // Каждый кристалл = 10 HP босса (половина HP зелёного босса)
      // Уничтожение кристалла уменьшает maxHp босса на 10
      for (const target of this.targets) {
        if (target.active && target.enemyType === 'boss_black') {
          target.maxHp -= 10; // Убираем защиту кристалла
          // HP не может быть больше maxHp
          if (target.hp > target.maxHp) {
            target.hp = target.maxHp;
          }
        }
      }

      return true;
    }
    return false;
  }

  /** Данные кристаллов для шейдера */
  public getCrystalsData(): Float32Array {
    // 6 кристаллов * 4 компонента (x, z, height, active)
    const data = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      if (i < this.powerCrystals.length) {
        const c = this.powerCrystals[i];
        data[i * 4 + 0] = c.x;
        data[i * 4 + 1] = c.z;
        data[i * 4 + 2] = c.height;
        data[i * 4 + 3] = c.active ? 1.0 : 0.0;
      } else {
        data[i * 4 + 3] = 0.0; // Неактивен
      }
    }
    return data;
  }

  /** Количество активных врагов */
  public getActiveCount(): number {
    return this.targets.filter(t => t.active).length;
  }

  /** Получить активного босса (если есть) */
  public getActiveBoss(): Target | null {
    return this.targets.find(t => t.active && t.isBoss) || null;
  }

  /** Расстояние до ближайшего врага */
  public getClosestEnemyDistance(playerPos: Vec3): number {
    let minDist = Infinity;
    for (const target of this.targets) {
      if (!target.active) continue;
      const dx = target.position.x - playerPos.x;
      const dy = target.position.y - playerPos.y;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  /** Создать мишени для арены (заглушка для совместимости) */
  public createArenaTargets(_count: number = 8): void {
    this.startGame();
  }

  /** Проверить попадание снаряда (заглушка) */
  public checkProjectileHit(_position: Vec3, _damage: number): Target | null {
    return null;
  }
}
