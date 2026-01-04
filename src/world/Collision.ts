import type { Vec3, ICollisionSystem } from '@/types';

/**
 * Система коллизий для круглой арены с бассейнами
 * Круглые платформы по центру для паркура с двойным прыжком
 */
export class CollisionSystem implements ICollisionSystem {
  /** Радиус игрока */
  private playerRadius = 0.4;

  // Размеры круглой арены
  private arenaRadius = 38.0;
  
  // Центральный бассейн
  private poolRadius = 8.0;
  
  // Боковые платформы (левая и правая)
  private platformHeight = 2.0;
  private platformX = 20.0;
  
  // Мосты
  private bridgeWidth = 3.5;
  
  // Площадки за порталами
  private backPlatformRadius = 8.0;
  private backPlatformX = 30.0;
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль по кругу) ===
  // 6 платформ по кругу с радиусом 10м, высота растёт по спирали
  // Базовые высоты (без анимации)
  private baseHeights = [1.8, 3.0, 4.2, 5.4, 6.6, 7.8];
  private topBaseHeight = 9.5;
  
  private jumpPlatforms = [
    { x: 10.0, z: 0.0, height: 1.8, radius: 1.5 },   // 1 - старт (0°)
    { x: 5.0, z: 8.66, height: 3.0, radius: 1.4 },   // 2 - (60°)
    { x: -5.0, z: 8.66, height: 4.2, radius: 1.4 },  // 3 - (120°)
    { x: -10.0, z: 0.0, height: 5.4, radius: 1.3 },  // 4 - (180°)
    { x: -5.0, z: -8.66, height: 6.6, radius: 1.3 }, // 5 - (240°)
    { x: 5.0, z: -8.66, height: 7.8, radius: 1.2 },  // 6 - (300°)
  ];
  // Верхняя платформа с бафом - в центре над фонтаном
  private topPlatform = { x: 0, z: 0, height: 9.5, radius: 2.5 };

  /** Обновить высоту платформ (анимация парения) */
  public updatePlatforms(time: number): void {
    // Каждая платформа парит с разной фазой
    for (let i = 0; i < this.jumpPlatforms.length; i++) {
      const phase = i * 0.8; // Разная фаза для каждой платформы
      const bobAmount = Math.sin(time * 1.5 + phase) * 0.3; // ±0.3м
      this.jumpPlatforms[i].height = this.baseHeights[i] + bobAmount;
    }
    // Верхняя платформа тоже парит, но медленнее
    this.topPlatform.height = this.topBaseHeight + Math.sin(time * 1.0) * 0.2;
  }

  /** Получить данные платформ для шейдера */
  public getPlatformData(): Float32Array {
    // 7 платформ * 4 компонента (x, z, height, radius)
    const data = new Float32Array(28);
    for (let i = 0; i < this.jumpPlatforms.length; i++) {
      const p = this.jumpPlatforms[i];
      data[i * 4 + 0] = p.x;
      data[i * 4 + 1] = p.z;
      data[i * 4 + 2] = p.height;
      data[i * 4 + 3] = p.radius;
    }
    // Верхняя платформа
    data[24] = this.topPlatform.x;
    data[25] = this.topPlatform.z;
    data[26] = this.topPlatform.height;
    data[27] = this.topPlatform.radius;
    return data;
  }

  /** Проверить коллизию в точке */
  public checkCollision(pos: Vec3): boolean {
    const r = this.playerRadius;

    // Стены убраны - теперь за границей арены река войда!
    // Игрок может свободно падать туда
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    // Нет стен - проверка убрана!

    // Центральная колонна (фонтан) - блокирует только внизу, не на верхней платформе
    // Фонтан высотой ~8м, верхняя платформа на 9.5м
    if (distFromCenter < 2.0 + r && pos.y < 10.0) return true;

    // Колонны по периметру (4 основные)
    const columnPositions = [
      { x: 22, z: 0 },
      { x: -22, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
    ];
    
    for (const col of columnPositions) {
      const dx = pos.x - col.x;
      const dz = pos.z - col.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.7 + r) return true;
    }

    // Бассейн теперь проходим - можно ходить по воде

    // Коллизия с круглыми платформами (сбоку) - только на уровне платформы
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const feetY = pos.y - 1.7;
      
      // Блокируем только если ноги близко к уровню платформы (в пределах 1м ниже)
      // Это позволяет ходить под платформами на земле
      if (dist < plat.radius + r && feetY < plat.height - 0.1 && feetY > plat.height - 1.5) {
        return true;
      }
    }

    // Края платформ (перила)
    // Левая платформа
    if (pos.x < -this.platformX + 3.5 && pos.x > -this.platformX - 3.5 &&
        Math.abs(pos.z) < 6.5 && pos.y > this.platformHeight - 0.5) {
      // Перила на краю
      if (pos.x > -this.platformX + 2.8 && Math.abs(pos.z) < 6.0) {
        return true;
      }
    }
    
    // Правая платформа
    if (pos.x > this.platformX - 3.5 && pos.x < this.platformX + 3.5 &&
        Math.abs(pos.z) < 6.5 && pos.y > this.platformHeight - 0.5) {
      if (pos.x < this.platformX - 2.8 && Math.abs(pos.z) < 6.0) {
        return true;
      }
    }

    return false;
  }

  /** Проверить, находится ли точка над круглой платформой */
  private isOverCirclePlatform(pos: Vec3, plat: { x: number; z: number; height: number; radius: number }): boolean {
    const dx = pos.x - plat.x;
    const dz = pos.z - plat.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Игрок должен быть СТРОГО выше платформы (минимум на уровне верха) и в радиусе
    // pos.y - это позиция глаз, eyeHeight = 1.7, значит ноги на pos.y - 1.7
    // Ноги должны быть выше или на уровне платформы
    const feetY = pos.y - 1.7;
    return dist < plat.radius && feetY >= plat.height - 0.1;
  }

  /** Получить высоту пола в точке */
  public getFloorHeight(pos: Vec3): number {
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    // === КРАЙ АРЕНЫ ===
    const arenaRadius = 33.0; // ARENA_RADIUS - 5.0
    
    if (distFromCenter > arenaRadius) {
      return -50.0; // Бездонная пропасть
    }

    // === МОСТЫ (приоритет - они над бассейном) ===
    const onBridgeX = Math.abs(pos.z) < this.bridgeWidth / 2 && 
                      Math.abs(pos.x) < this.poolRadius + 1;
    const onBridgeZ = Math.abs(pos.x) < this.bridgeWidth / 2 && 
                      Math.abs(pos.z) < this.poolRadius + 1;
    
    if ((onBridgeX || onBridgeZ) && distFromCenter > 2.0) {
      return 0.3; // Высота моста
    }

    // === ЛЕВАЯ ПЛАТФОРМА И ЛЕСТНИЦА ===
    const leftStairStartX = -16.0;
    const leftStairEndX = -17.0;
    const leftPlatformEnd = -23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      if (pos.x >= leftStairEndX && pos.x <= leftStairStartX) {
        const progress = (leftStairStartX - pos.x) / (leftStairStartX - leftStairEndX);
        return progress * this.platformHeight;
      }
      if (pos.x < leftStairEndX && pos.x > leftPlatformEnd) {
        return this.platformHeight;
      }
    }

    // === ПРАВАЯ ПЛАТФОРМА И ЛЕСТНИЦА ===
    const rightStairStartX = 16.0;
    const rightStairEndX = 17.0;
    const rightPlatformEnd = 23.0;
    
    if (Math.abs(pos.z) < 3.0) {
      if (pos.x >= rightStairStartX && pos.x <= rightStairEndX) {
        const progress = (pos.x - rightStairStartX) / (rightStairEndX - rightStairStartX);
        return progress * this.platformHeight;
      }
      if (pos.x > rightStairEndX && pos.x < rightPlatformEnd) {
        return this.platformHeight;
      }
    }

    // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль) ===
    // Верхняя платформа с бафом
    if (this.isOverCirclePlatform(pos, this.topPlatform)) {
      return this.topPlatform.height;
    }
    
    // 6 платформ по кругу (проверяем сверху вниз)
    for (let i = this.jumpPlatforms.length - 1; i >= 0; i--) {
      if (this.isOverCirclePlatform(pos, this.jumpPlatforms[i])) {
        return this.jumpPlatforms[i].height;
      }
    }

    // Основной пол
    return 0.0;
  }

  /** Получить высоту потолка */
  public getCeilingHeight(pos: Vec3): number {
    // Проверяем все платформы - потолок только если близко снизу
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Потолок только если игрок прямо под платформой и близко к ней (в пределах 3м)
      if (dist < plat.radius - 0.3 && pos.y < plat.height - 0.5 && pos.y > plat.height - 4.0) {
        return plat.height - 0.3;
      }
    }
    
    return 18.0;
  }

  /** Проверить коллизию для врага (упрощённая версия без перил) */
  public checkEnemyCollision(pos: Vec3, radius: number): boolean {
    // Стены убраны, но враги не выходят за границу
    const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const ARENA_EDGE = 33.0; // Граница до реки войда
    if (distFromCenter > ARENA_EDGE - radius) return true;

    // Центральная колонна (фонтан)
    if (distFromCenter < 2.0 + radius) return true;

    // Колонны по периметру
    const columnPositions = [
      { x: 22, z: 0 },
      { x: -22, z: 0 },
      { x: 0, z: 22 },
      { x: 0, z: -22 },
    ];
    
    for (const col of columnPositions) {
      const dx = pos.x - col.x;
      const dz = pos.z - col.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.7 + radius) return true;
    }

    // Все платформы - блокируем только если враг рядом по высоте
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = pos.x - plat.x;
      const dz = pos.z - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Блокируем только если враг в пределах 1.5м от уровня платформы
      // (как для игрока в checkCollision)
      if (dist < plat.radius + radius && pos.y < plat.height + 1.5 && pos.y > plat.height - 1.5) {
        return true;
      }
    }

    return false;
  }

  /** Получить высоту препятствия перед врагом (для прыжков) */
  public getObstacleHeight(pos: Vec3, dirX: number, dirZ: number, checkDist: number = 1.5): number {
    const checkX = pos.x + dirX * checkDist;
    const checkZ = pos.z + dirZ * checkDist;
    
    const allPlatforms = [...this.jumpPlatforms, this.topPlatform];
    for (const plat of allPlatforms) {
      const dx = checkX - plat.x;
      const dz = checkZ - plat.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < plat.radius && pos.y < plat.height) {
        return plat.height;
      }
    }
    
    return 0;
  }
}
