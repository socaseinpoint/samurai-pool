import type { Vec3 } from '@/types';
import { vec3, distanceVec3, normalizeVec3 } from '@/utils/math';

/** Тип врага */
export type EnemyType = 'baneling' | 'phantom';

/** Осколок после разрубания */
export interface Fragment {
  position: Vec3;
  velocity: Vec3;
  size: number;
  lifetime: number;
  rotation: number;
  rotationSpeed: number;
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

  constructor(position: Vec3, speed: number = 4.0, id: number = 0, type: EnemyType = 'baneling') {
    this.position = { ...position };
    this.speed = speed;
    this.id = id;
    this.phase = Math.random() * Math.PI * 2;
    this.moveType = id % 4;
    this.enemyType = type;

    // Настройки по типу врага
    if (type === 'phantom') {
      this.speed = speed * 2; // В 2 раза быстрее
      this.damage = 10; // Меньше урона
      this.radius = 0.6; // Чуть меньше
      this.currentSpeed = 0;
      this.isCharging = true;
    } else {
      this.damage = 25;
      this.currentSpeed = speed;
    }
  }

  /** Обновление - движение к игроку с паттерном */
  public update(dt: number, playerPos: Vec3, time: number): void {
    // Пульсирующий огонь
    this.fireIntensity = 0.6 + Math.sin(time * 8 + this.id) * 0.4;

    if (this.active) {
      // Направление к игроку
      const dx = playerPos.x - this.position.x;
      const dy = (playerPos.y - 0.3) - this.position.y;
      const dz = playerPos.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 0.1) {
        // Базовое направление к игроку
        const dirX = dx / dist;
        const dirY = dy / dist;
        const dirZ = dz / dist;

        // Скорость увеличивается при приближении (агрессия!)
        const aggression = 1.0 + Math.max(0, (15 - dist) / 15) * 0.8;
        const currentSpeed = this.speed * aggression;

        // Разные паттерны движения
        let offsetX = 0, offsetY = 0, offsetZ = 0;
        const wave = time * 4 + this.phase;

        switch (this.moveType) {
          case 0: // Спираль
            offsetX = Math.cos(wave) * 3;
            offsetZ = Math.sin(wave) * 3;
            offsetY = Math.sin(wave * 0.5) * 1.5;
            break;
          case 1: // Зигзаг горизонтальный
            offsetX = Math.sin(wave * 2) * 4;
            offsetY = Math.cos(wave) * 0.5;
            break;
          case 2: // Волна вверх-вниз
            offsetY = Math.sin(wave * 1.5) * 2.5;
            offsetX = Math.cos(wave * 0.7) * 1;
            break;
          case 3: // Рывками
            const pulse = Math.sin(wave) > 0 ? 1.5 : 0.5;
            offsetX = Math.cos(wave * 3) * 2 * pulse;
            offsetZ = Math.sin(wave * 3) * 2 * pulse;
            break;
        }

        // Добавляем смещение перпендикулярно направлению
        const perpX = -dirZ;
        const perpZ = dirX;

        this.velocity.x = dirX * currentSpeed + perpX * offsetX * 0.3 + offsetX * 0.1;
        this.velocity.y = dirY * currentSpeed + offsetY * 0.3;
        this.velocity.z = dirZ * currentSpeed + perpZ * offsetZ * 0.3 + offsetZ * 0.1;

        // Двигаемся
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // Не даём уйти слишком высоко или низко
        this.position.y = Math.max(0.5, Math.min(4.0, this.position.y));
      }
    }

    // Обновление осколков
    this.updateFragments(dt);

    // Таймер удаления
    if (!this.active && this.removeTimer > 0) {
      this.removeTimer -= dt;
    }
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

  /** Данные для шейдера */
  public getShaderData(): [number, number, number, number] {
    return [
      this.position.x,
      this.position.y,
      this.position.z,
      this.active ? this.fireIntensity : 0,
    ];
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

  constructor() {}

  /** Начать игру (первую волну) */
  public startGame(): void {
    this.wave = 0;
    this.score = 0;
    this.targets = [];
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

  /** Спавн врагов */
  private spawnEnemies(count: number): void {
    const spawnRadius = 18; // Расстояние от центра
    const baseSpeed = 3.5 + this.wave * 0.4; // Скорость растёт с волнами

    for (let i = 0; i < count; i++) {
      // Равномерно по кругу
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const height = 1.0 + Math.random() * 2.5;

      const pos = vec3(
        Math.cos(angle) * spawnRadius,
        height,
        Math.sin(angle) * spawnRadius
      );

      // Немного разная скорость
      const speed = baseSpeed + Math.random() * 1.5;

      // Передаём уникальный ID для разного поведения
      this.targets.push(new Target(pos, speed, this.enemyIdCounter++));
    }
  }

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

    // Обновляем врагов
    for (const target of this.targets) {
      target.update(dt, playerPos, time);

      // Проверка столкновения с игроком
      if (target.checkPlayerCollision(playerPos)) {
        this.onPlayerHit?.(target);
        target.active = false;
      }
    }

    // Удаляем мёртвых
    this.targets = this.targets.filter(t => !t.canRemove());

    // Проверяем завершение волны
    if (this.waveActive && this.getActiveCount() === 0) {
      this.waveActive = false;
      this.waveTimer = this.waveDelay;
      this.onWaveComplete?.(this.wave);
    }
  }

  /** Попытка разрубить катаной */
  public trySlice(playerPos: Vec3, playerYaw: number, range: number, angle: number): Target | null {
    for (const target of this.targets) {
      if (!target.active) continue;

      // Расстояние
      const dx = target.position.x - playerPos.x;
      const dz = target.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > range) continue;

      // Угол
      const angleToTarget = Math.atan2(dx, -dz);
      let angleDiff = angleToTarget - playerYaw;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) > angle / 2) continue;

      // Попали! Разрубаем
      const sliceDir = normalizeVec3({ x: dx, y: 0, z: dz });
      target.slice(sliceDir);
      
      this.score += 100 * this.wave; // Очки зависят от волны
      this.onTargetDestroyed?.(target);
      
      return target;
    }

    return null;
  }

  /** Данные для шейдера */
  public getShaderData(): Float32Array {
    const data = new Float32Array(this.targets.length * 4);
    for (let i = 0; i < this.targets.length; i++) {
      const [x, y, z, intensity] = this.targets[i].getShaderData();
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = intensity;
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

  /** Количество активных врагов */
  public getActiveCount(): number {
    return this.targets.filter(t => t.active).length;
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
