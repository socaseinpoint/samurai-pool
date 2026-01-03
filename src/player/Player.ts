import type { PlayerState, MovementConfig, InputState, Vec3, ICollisionSystem } from '@/types';
import { vec3, clamp } from '@/utils/math';

/** Конфигурация по умолчанию */
const DEFAULT_CONFIG: MovementConfig = {
  walkSpeed: 8.0,
  runSpeed: 20.0,
  jumpForce: 8.0,
  gravity: 25.0,
  groundFriction: 12.0,
  airControl: 0.3,
  mouseSensitivity: 0.002, // Высокая чувствительность
};

/**
 * Игрок
 * Управление позицией, движением и камерой
 * Поддержка лестниц через getFloorHeight
 */
export class Player {
  /** Состояние игрока */
  public state: PlayerState;

  /** Конфигурация движения */
  public config: MovementConfig;

  /** Система коллизий */
  private collision: ICollisionSystem;

  /** Скорость подъёма/спуска по лестницам */
  private stepSpeed = 12.0;

  /** Максимальная высота автоматического подъёма */
  private maxStepHeight = 0.5;

  /** Целевые значения камеры */
  private targetYaw = 0;
  private targetPitch = -0.05;

  constructor(
    startPosition: Vec3 = vec3(0, 1.7, 5),
    config: Partial<MovementConfig> = {},
    collision: ICollisionSystem
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.collision = collision;

    this.state = {
      position: { ...startPosition },
      velocity: vec3(),
      yaw: 0, // Смотрим вперёд
      pitch: -0.05, // Слегка вниз
      grounded: true,
      eyeHeight: 1.7, // Высота глаз над полом
      health: 100,
      maxHealth: 100,
    };
  }

  /** Обновление игрока */
  public update(dt: number, input: InputState, mouseDelta: { x: number; y: number }): void {
    // Обновляем камеру
    this.updateCamera(mouseDelta);

    // Обновляем движение
    this.updateMovement(dt, input);
  }

  /** Обновление камеры - быстрое и лёгкое */
  private updateCamera(mouseDelta: { x: number; y: number }): void {
    // Прямое применение движения мыши к целевым углам
    this.targetYaw -= mouseDelta.x;
    this.targetPitch += mouseDelta.y;

    // Ограничиваем pitch
    this.targetPitch = clamp(this.targetPitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);

    // Быстрая интерполяция (0.7 = почти мгновенно, но чуть сглажено)
    this.state.yaw += (this.targetYaw - this.state.yaw) * 0.7;
    this.state.pitch += (this.targetPitch - this.state.pitch) * 0.7;
  }

  /** Обновление движения с поддержкой лестниц */
  private updateMovement(dt: number, input: InputState): void {
    const { state, config } = this;

    // Направление движения от ввода
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    // Нормализуем если движемся по диагонали
    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0) {
      moveX /= moveLen;
      moveZ /= moveLen;
    }

    // Поворачиваем направление по yaw
    const sin = Math.sin(state.yaw);
    const cos = Math.cos(state.yaw);
    const worldMoveX = moveX * cos - moveZ * sin;
    const worldMoveZ = moveX * sin + moveZ * cos;

    // Скорость (бег или ходьба)
    const speed = input.run ? config.runSpeed : config.walkSpeed;

    // Целевая скорость
    const targetVx = worldMoveX * speed;
    const targetVz = worldMoveZ * speed;

    // Получаем высоту пола в текущей позиции
    const currentFloorHeight = this.collision.getFloorHeight(state.position);
    const targetY = currentFloorHeight + state.eyeHeight;

    if (state.grounded) {
      // На земле — полный контроль и трение
      const friction = config.groundFriction * dt;
      state.velocity.x += (targetVx - state.velocity.x) * Math.min(friction, 1);
      state.velocity.z += (targetVz - state.velocity.z) * Math.min(friction, 1);

      // Прыжок
      if (input.jump) {
        state.velocity.y = config.jumpForce;
        state.grounded = false;
      } else {
        // Плавное следование за полом (лестницы)
        const heightDiff = targetY - state.position.y;
        
        if (Math.abs(heightDiff) < 0.01) {
          // Почти на уровне - просто выравниваем
          state.position.y = targetY;
          state.velocity.y = 0;
        } else if (heightDiff > 0 && heightDiff < this.maxStepHeight) {
          // Подъём по лестнице - плавно поднимаемся
          state.velocity.y = this.stepSpeed;
        } else if (heightDiff < 0 && heightDiff > -this.maxStepHeight) {
          // Спуск по лестнице - плавно опускаемся
          state.velocity.y = -this.stepSpeed * 0.8;
        } else if (heightDiff < -this.maxStepHeight) {
          // Большой спуск - начинаем падать
          state.grounded = false;
          state.velocity.y = 0;
        }
      }
    } else {
      // В воздухе — ограниченный контроль
      state.velocity.x += (targetVx - state.velocity.x) * config.airControl * dt;
      state.velocity.z += (targetVz - state.velocity.z) * config.airControl * dt;

      // Гравитация
      state.velocity.y -= config.gravity * dt;
    }

    // Применяем скорость к позиции
    const newPosX = state.position.x + state.velocity.x * dt;
    const newPosY = state.position.y + state.velocity.y * dt;
    const newPosZ = state.position.z + state.velocity.z * dt;

    // Проверяем коллизии по осям отдельно
    // X
    const testPosX = { x: newPosX, y: state.position.y, z: state.position.z };
    if (!this.collision.checkCollision(testPosX)) {
      state.position.x = newPosX;
    } else {
      state.velocity.x = 0;
    }

    // Z
    const testPosZ = { x: state.position.x, y: state.position.y, z: newPosZ };
    if (!this.collision.checkCollision(testPosZ)) {
      state.position.z = newPosZ;
    } else {
      state.velocity.z = 0;
    }

    // Y (вертикаль) - с учётом пола
    const newFloorHeight = this.collision.getFloorHeight(state.position);
    const minY = newFloorHeight + state.eyeHeight;

    if (!state.grounded) {
      // В воздухе - проверяем приземление
      if (newPosY <= minY) {
        // Приземлились
        state.position.y = minY;
        state.velocity.y = 0;
        state.grounded = true;
      } else {
        // Ещё летим
        const testPosY = { x: state.position.x, y: newPosY, z: state.position.z };
        const ceilingHeight = this.collision.getCeilingHeight(state.position);
        
        if (newPosY < ceilingHeight - 0.3 && !this.collision.checkCollision(testPosY)) {
          state.position.y = newPosY;
        } else {
          // Упёрлись в потолок
          state.velocity.y = Math.min(state.velocity.y, 0);
        }
      }
    } else {
      // На земле - плавно следуем за полом
      state.position.y += state.velocity.y * dt;
      
      // Не проваливаемся ниже пола
      if (state.position.y < minY) {
        state.position.y = minY;
        state.velocity.y = 0;
      }
    }
  }

  /** Получить позицию глаз */
  public getEyePosition(): Vec3 {
    return {
      x: this.state.position.x,
      y: this.state.position.y,
      z: this.state.position.z,
    };
  }

  /** Получить направление взгляда */
  public getLookDirection(): Vec3 {
    const { yaw, pitch } = this.state;
    return {
      x: Math.sin(yaw) * Math.cos(pitch),
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * Math.cos(pitch),
    };
  }

  /** Нанести урон */
  public takeDamage(amount: number): void {
    this.state.health = Math.max(0, this.state.health - amount);
  }

  /** Вылечить */
  public heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  /** Игрок мёртв? */
  public isDead(): boolean {
    return this.state.health <= 0;
  }

  /** Сброс позиции */
  public reset(position: Vec3): void {
    this.state.position = { ...position };
    this.state.velocity = vec3();
    this.state.health = this.state.maxHealth;
    this.state.grounded = true;
  }
}
