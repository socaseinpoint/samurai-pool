import type { Vec3, ICollisionSystem } from '@/types';
import { vec3, distanceVec3, normalizeVec3 } from '@/utils/math';

/** Тип врага */
export type EnemyType = 'baneling' | 'phantom' | 'runner' | 'hopper' | 'boss_green' | 'boss_black' | 'boss_blue';

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
  lifetime: number;
  damage: number;
}

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
  private removeTimer = 0;

  /** Уникальный ID для разного поведения */
  private id: number;

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

  /** Зелёный босс: таймер создания лужи */
  private poolTimer = 0;

  /** Зелёный босс: фаза (1 или 2) */
  public bossPhase = 1;

  /** Callback при смене фазы босса */
  public onPhaseChange?: (phase: number) => void;

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
    } else if (type === 'boss_green') {
      // ЗЕЛЁНЫЙ БОСС - огромный и живучий
      this.isBoss = true;
      this.speed = speed * 0.6; // Медленный
      this.damage = 40;
      this.radius = 2.5; // ОГРОМНЫЙ!
      this.hp = 20;
      this.maxHp = 20;
    } else if (type === 'boss_black') {
      // ЧЁРНЫЙ БОСС - искривляет пространство
      this.isBoss = true;
      this.speed = speed * 0.8;
      this.damage = 30;
      this.radius = 2.0;
      this.hp = 30;
      this.maxHp = 30;
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

  /** Обновление бейнлинга - медленное преследование с паттернами */
  private updateBaneling(dt: number, playerPos: Vec3, time: number): void {
    const dx = playerPos.x - this.position.x;
    const dy = (playerPos.y - 0.3) - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 0.1) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      const dirZ = dz / dist;

      const aggression = 1.0 + Math.max(0, (15 - dist) / 15) * 0.8;
      const currentSpeed = this.speed * aggression;

      let offsetX = 0, offsetY = 0, offsetZ = 0;
      const wave = time * 4 + this.phase;

      switch (this.moveType) {
        case 0:
          offsetX = Math.cos(wave) * 3;
          offsetZ = Math.sin(wave) * 3;
          offsetY = Math.sin(wave * 0.5) * 1.5;
          break;
        case 1:
          offsetX = Math.sin(wave * 2) * 4;
          offsetY = Math.cos(wave) * 0.5;
          break;
        case 2:
          offsetY = Math.sin(wave * 1.5) * 2.5;
          offsetX = Math.cos(wave * 0.7) * 1;
          break;
        case 3:
          const pulse = Math.sin(wave) > 0 ? 1.5 : 0.5;
          offsetX = Math.cos(wave * 3) * 2 * pulse;
          offsetZ = Math.sin(wave * 3) * 2 * pulse;
          break;
      }

      const perpX = -dirZ;
      const perpZ = dirX;

      this.velocity.x = dirX * currentSpeed + perpX * offsetX * 0.3 + offsetX * 0.1;
      this.velocity.y = dirY * currentSpeed + offsetY * 0.3;
      this.velocity.z = dirZ * currentSpeed + perpZ * offsetZ * 0.3 + offsetZ * 0.1;

      // Применяем движение с проверкой коллизий
      const newX = this.position.x + this.velocity.x * dt;
      const newZ = this.position.z + this.velocity.z * dt;
      
      if (!this.collision?.checkEnemyCollision || 
          !this.collision.checkEnemyCollision({ x: newX, y: this.position.y, z: newZ }, this.radius)) {
        this.position.x = newX;
        this.position.z = newZ;
      } else {
        // Облетаем препятствие сверху
        this.velocity.y += 5 * dt;
      }
      
      this.position.y += this.velocity.y * dt;
      this.position.y = Math.max(0.5, Math.min(6.0, this.position.y));
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

  /** Зелёный босс - медленно надвигается, оставляет лужи */
  private updateBossGreen(dt: number, playerPos: Vec3, time: number): void {
    // Обработка отката от удара
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      // Применяем инерцию отката
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      // Затухание скорости
      this.velocity.x *= 0.9;
      this.velocity.y *= 0.9;
      this.velocity.z *= 0.9;
      // Гравитация
      this.velocity.y -= 15 * dt;
      this.position.y = Math.max(this.radius, this.position.y);
      return;
    }

    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 0.1) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      const dirZ = dz / dist;

      // Медленно но неуклонно
      const wobble = Math.sin(time * 2) * 0.5;
      
      this.velocity.x = dirX * this.speed + wobble;
      this.velocity.y = dirY * this.speed * 0.3;
      this.velocity.z = dirZ * this.speed;

      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;

      // Не опускается ниже пола
      this.position.y = Math.max(this.radius, this.position.y);
    }

    // Пульсирующий размер (больше во второй фазе)
    const baseRadius = this.bossPhase === 2 ? 2.8 : 2.5;
    this.radius = baseRadius + Math.sin(time * 3) * 0.3;

    // Создание токсичных луж
    this.poolTimer -= dt;
    // Во второй фазе лужи создаются в 2 раза чаще!
    const poolCooldown = this.bossPhase === 2 ? 1.0 : 2.0;
    if (this.poolTimer <= 0) {
      this.poolTimer = poolCooldown;
      // Лужа под боссом
      const poolPos = vec3(this.position.x, 0.05, this.position.z);
      this.onCreatePool?.(poolPos);
      
      // Во второй фазе создаёт дополнительные лужи вокруг
      if (this.bossPhase === 2) {
        const angle = Math.random() * Math.PI * 2;
        const extraPool = vec3(
          this.position.x + Math.cos(angle) * 3,
          0.05,
          this.position.z + Math.sin(angle) * 3
        );
        this.onCreatePool?.(extraPool);
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

  /** Callback при смене фазы босса */
  public onBossPhaseChange?: (bossType: EnemyType, phase: number) => void;

  /** Токсичные лужи */
  public toxicPools: ToxicPool[] = [];

  /** Таймер урона от луж */
  private poolDamageTimer = 0;

  /** Система коллизий */
  private collision: ICollisionSystem | null = null;

  constructor(collision?: ICollisionSystem) {
    this.collision = collision || null;
  }

  /** Начать игру с указанной волны */
  public startGame(startWave: number = 1): void {
    this.wave = startWave - 1; // -1 потому что startNextWave сделает +1
    this.score = 0;
    this.targets = [];
    this.toxicPools = [];
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
      // ЗЕЛЁНЫЙ БОСС!
      const pos = vec3(0, 3.0, -spawnRadius);
      const boss = new Target(pos, baseSpeed, this.enemyIdCounter++, 'boss_green', this.collision || undefined);
      // Callback для создания луж
      boss.onCreatePool = (poolPos) => {
        this.toxicPools.push({
          position: { ...poolPos },
          radius: 2.5,
          lifetime: 8.0,
          damage: 5
        });
      };
      // Callback для смены фазы
      boss.onPhaseChange = (phase) => {
        this.onBossPhaseChange?.(boss.enemyType, phase);
      };
      this.targets.push(boss);
    } else if (wave === 10) {
      // ЧЁРНЫЙ БОСС!
      const pos = vec3(0, 2.5, -spawnRadius);
      this.targets.push(new Target(pos, baseSpeed, this.enemyIdCounter++, 'boss_black', this.collision || undefined));
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
    
    if (wave <= 5) {
      // Эпоха 1: кислотная - простая
      banelingCount = Math.floor(wave * 1.2);
      phantomCount = wave >= 3 ? Math.floor((wave - 2) * 0.8) : 0;
      runnerCount = 0; // Нет раннеров
      hopperCount = wave >= 4 ? Math.floor((wave - 3) * 0.5) : 0;
    } else if (wave <= 10) {
      // Эпоха 2: чёрная дыра - средняя сложность
      banelingCount = Math.floor(wave * 0.8); // Меньше бейнлингов
      phantomCount = Math.floor((wave - 3) * 0.6); // Меньше фантомов
      runnerCount = 0; // Нет раннеров до 11 волны!
      hopperCount = Math.floor((wave - 4) * 0.6); // Меньше хопперов
    } else {
      // Эпоха 3: космическая - с раннерами
      banelingCount = Math.floor(wave * 0.7);
      phantomCount = Math.floor((wave - 5) * 0.5);
      runnerCount = Math.floor((wave - 10) * 1.5); // Раннеры с 11 волны!
      hopperCount = Math.floor((wave - 6) * 0.5);
    }

    const totalCount = Math.max(1, banelingCount + phantomCount + runnerCount + hopperCount);
    let idx = 0;

    // Спавним бейнлингов (зелёные)
    for (let i = 0; i < banelingCount; i++) {
      const angle = (idx / totalCount) * Math.PI * 2 + Math.random() * 0.3;
      const height = 1.0 + Math.random() * 2.5;

      const pos = vec3(
        Math.cos(angle) * spawnRadius,
        height,
        Math.sin(angle) * spawnRadius
      );

      const speed = baseSpeed + Math.random() * 1.5;
      this.targets.push(new Target(pos, speed, this.enemyIdCounter++, 'baneling', this.collision || undefined));
      idx++;
    }

    // Спавним раннеров (оранжевые, бегут по земле)
    for (let i = 0; i < runnerCount; i++) {
      const angle = (idx / totalCount) * Math.PI * 2 + Math.random() * 0.3;

      const pos = vec3(
        Math.cos(angle) * spawnRadius,
        0.5,
        Math.sin(angle) * spawnRadius
      );

      const speed = baseSpeed + Math.random() * 1.0;
      this.targets.push(new Target(pos, speed, this.enemyIdCounter++, 'runner', this.collision || undefined));
      idx++;
    }

    // Спавним хопперов (синие, прыгают)
    for (let i = 0; i < hopperCount; i++) {
      const angle = (idx / totalCount) * Math.PI * 2 + Math.random() * 0.3;

      const pos = vec3(
        Math.cos(angle) * spawnRadius,
        0.5,
        Math.sin(angle) * spawnRadius
      );

      const speed = baseSpeed + Math.random() * 1.0;
      this.targets.push(new Target(pos, speed, this.enemyIdCounter++, 'hopper', this.collision || undefined));
      idx++;
    }

    // Спавним фантомов (чёрные)
    for (let i = 0; i < phantomCount; i++) {
      const angle = ((banelingCount + i) / totalCount) * Math.PI * 2 + Math.random() * 0.3;
      const height = 1.5 + Math.random() * 2.0;

      const pos = vec3(
        Math.cos(angle) * spawnRadius,
        height,
        Math.sin(angle) * spawnRadius
      );

      const speed = baseSpeed + Math.random() * 1.0;
      this.targets.push(new Target(pos, speed, this.enemyIdCounter++, 'phantom', this.collision || undefined));
    }
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

    // === ТОКСИЧНЫЕ ЛУЖИ ===
    // Обновляем время жизни луж
    for (const pool of this.toxicPools) {
      pool.lifetime -= dt;
    }
    // Удаляем истёкшие
    this.toxicPools = this.toxicPools.filter(p => p.lifetime > 0);

    // Урон от луж (каждые 0.5 сек)
    this.poolDamageTimer -= dt;
    if (this.poolDamageTimer <= 0) {
      this.poolDamageTimer = 0.5;
      
      for (const pool of this.toxicPools) {
        const dx = playerPos.x - pool.position.x;
        const dz = playerPos.z - pool.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < pool.radius) {
          // Игрок в луже - урон!
          this.onPoolDamage?.(pool.damage);
          break; // Только одна лужа может наносить урон за раз
        }
      }
    }

    // Проверяем завершение волны
    if (this.waveActive && this.getActiveCount() === 0) {
      this.waveActive = false;
      this.waveTimer = this.waveDelay;
      this.onWaveComplete?.(this.wave);
      // Очищаем лужи при завершении волны
      this.toxicPools = [];
    }
  }

  /** Попытка разрубить катаной */
  public trySlice(playerPos: Vec3, playerYaw: number, range: number, angle: number): Target | null {
    for (const target of this.targets) {
      if (!target.active) continue;

      // Расстояние (для боссов увеличиваем хитбокс)
      const dx = target.position.x - playerPos.x;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Учитываем размер врага
      const effectiveRange = range + (target.isBoss ? target.radius : 0);
      if (dist > effectiveRange) continue;

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
        
        // Зелёный босс выпускает бейнлинга при каждом ударе!
        if (target.enemyType === 'boss_green' && !killed) {
          this.spawnBanelingFromBoss(target.position);
        }
        
        if (killed) {
          // Босс убит! Эпичный взрыв
          const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
          target.slice(sliceDir);
          this.score += 1000 * this.wave; // Много очков за босса!
          this.onTargetDestroyed?.(target);
          
          // Зелёный босс при смерти выпускает кучу бейнлингов!
          if (target.enemyType === 'boss_green') {
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
        
        // Зелёный босс выпускает бейнлинга при каждом ударе!
        if (target.enemyType === 'boss_green' && !killed) {
          this.spawnBanelingFromBoss(target.position);
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

  /** Данные луж для шейдера [x, z, radius, lifetime] */
  public getPoolsShaderData(): Float32Array {
    const data = new Float32Array(this.toxicPools.length * 4);
    for (let i = 0; i < this.toxicPools.length; i++) {
      const pool = this.toxicPools[i];
      data[i * 4 + 0] = pool.position.x;
      data[i * 4 + 1] = pool.position.z;
      data[i * 4 + 2] = pool.radius;
      data[i * 4 + 3] = pool.lifetime / 8.0; // Нормализованное время жизни
    }
    return data;
  }

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
