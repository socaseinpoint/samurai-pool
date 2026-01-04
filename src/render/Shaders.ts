/** Вершинный шейдер */
export const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/** Фрагментный шейдер - Circular Arena with Pools */
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec4 u_targets[16];
uniform int u_targetCount;
uniform float u_muzzleFlash;
uniform vec4 u_pools[8]; // Токсичные лужи [x, z, radius, lifetime]
uniform int u_poolCount;
uniform vec4 u_acidProjectiles[4]; // Летящие снаряды кислоты [x, y, z, progress]
uniform int u_acidProjectileCount;
uniform vec4 u_spikes[8]; // Лазеры спайкеров [startX, startY, startZ, lifetime]
uniform vec4 u_spikeTargets[8]; // Конечные точки лазеров [endX, endY, endZ, intensity]
uniform int u_spikeCount;
uniform vec4 u_acidRainZones[4]; // Зоны кислотного дождя [x, z, radius, state]
uniform int u_acidRainZoneCount;
uniform int u_era; // Эпоха: 1=кислотная, 2=чёрная дыра, 3=космическая
uniform vec4 u_altars[2]; // Алтари [x, y, z, score]
uniform vec4 u_darts[16]; // Летящие лучи [x, y, z, active]
uniform vec4 u_dartDirs[16]; // Направления лучей [dx, dy, dz, speed]
uniform int u_dartCount;
uniform float u_voidPortalActive; // Активен ли портал в войд (0 или время жизни)
uniform vec4 u_bloodCoins[12]; // Монеты крови в войде [x, y, z, active]
uniform int u_bloodCoinCount;
uniform int u_wave; // Текущая волна (для эффекта дождя на 15+)
uniform int u_greenBossPhase2; // Фаза 2 зелёного босса - зелёное небо!
uniform vec4 u_pickups[8]; // Пикапы [x, y, z, type] type: 9=health, 10=stimpack, 11=charge
uniform int u_pickupCount;
uniform vec4 u_crystals[6]; // Кристаллы силы [x, z, height, active]
uniform int u_voidMode; // Режим войда (засосан Владыкой пустоты)
uniform float u_voidProgress; // Прогресс войда (0-1, для анимации выхода)
uniform float u_voidFallOffset; // Смещение падения для визуального эффекта
uniform vec3 u_portalPos; // Позиция портала выхода в войде
uniform vec4 u_grenades[8]; // Гранаты [x, y, z, lifetime]
uniform int u_grenadeCount;
uniform vec4 u_explosions[8]; // Взрывы [x, y, z, progress]
uniform int u_explosionCount;
uniform int u_voidVariant; // Вариант войда (0-3: багровый, изумрудный, золотой, ледяной)

in vec2 v_uv;
out vec4 fragColor;

// === ПАРАМЕТРЫ РЕЙТРЕЙСИНГА (ГРАФОН) ===
#define MAX_STEPS 64
#define MAX_DIST 55.0
#define SURF_DIST 0.003
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 38.0
#define DOME_HEIGHT 22.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0
// Площадки за порталами
#define BACK_PLATFORM_RADIUS 8.0
#define BACK_PLATFORM_X 30.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Улучшенная интерполяция (quintic)
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
}

// Быстрый фрактальный шум (3 октавы вместо 5)
float fbm(vec2 p) {
  float value = 0.0;
  value += 0.5 * noise(p);
  value += 0.25 * noise(p * 2.0);
  value += 0.125 * noise(p * 4.0);
  return value;
}

// Острый шум для трещин и швов
float sharpNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Без сглаживания - резкие границы
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, step(0.5, f.x)), mix(c, d, step(0.5, f.x)), step(0.5, f.y));
}

float waterWaves(vec2 p, float t) {
  float wave = 0.0;
  wave += sin(p.x * 0.5 + t * 0.8) * 0.08;
  wave += sin(p.y * 0.4 + t * 0.6) * 0.06;
  wave += sin((p.x + p.y) * 0.7 + t) * 0.04;
  return wave;
}

// === SDF ПРИМИТИВЫ ===
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// Октаэдр (кристалл)
float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// Плавное объединение
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// === МАТЕРИАЛ ===
// 0 = стены/пол, 1 = вода, 2 = растения, 3 = металл, 4 = свечение
int materialId = 0;

// === ПАЛЬМА ===
float sdPalm(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  // Горшок
  float pot = sdCappedCone(lp - vec3(0.0, 0.3, 0.0), 0.3, 0.5, 0.4);
  d = min(d, pot);
  
  // Ствол
  float trunk = sdCylinder(lp - vec3(0.0, 1.5, 0.0), 0.12, 1.2);
  d = min(d, trunk);
  
  // Крона (несколько сфер)
  float crown = sdSphere(lp - vec3(0.0, 3.0, 0.0), 1.0);
  crown = min(crown, sdSphere(lp - vec3(0.5, 2.8, 0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(-0.5, 2.8, -0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(0.3, 2.9, -0.5), 0.6));
  crown = min(crown, sdSphere(lp - vec3(-0.3, 2.9, 0.5), 0.6));
  d = min(d, crown);
  
  return d;
}

// === КУСТ ===
float sdBush(vec3 p, vec3 pos, float size) {
  vec3 lp = p - pos;
  float d = sdSphere(lp, size);
  // Добавляем неровности
  d += sin(lp.x * 8.0) * sin(lp.y * 8.0) * sin(lp.z * 8.0) * 0.05 * size;
  return d;
}

// === ФАКЕЛ ===
float sdTorch(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float holder = sdCylinder(lp, 0.08, 0.3);
  float bowl = sdCappedCone(lp - vec3(0.0, 0.35, 0.0), 0.15, 0.05, 0.15);
  return min(holder, bowl);
}

// === ЛЕСТНИЦА ===
float sdStairs(vec3 p, vec3 pos, float width, float height, float depth, int steps) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  float stepH = height / float(steps);
  float stepD = depth / float(steps);
  
  for (int i = 0; i < steps; i++) {
    if (i >= 10) break; // Ограничение для производительности
    float y = float(i) * stepH;
    float z = float(i) * stepD;
    float step = sdBox(lp - vec3(0.0, y + stepH * 0.5, z + stepD * 0.5), 
                       vec3(width * 0.5, stepH * 0.5, stepD * 0.5));
    d = min(d, step);
  }
  
  return d;
}

// === СЦЕНА ===
float map(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  
  // === ПРОСТОЙ КРАЙ АРЕНЫ ===
  float arenaRadius = ARENA_RADIUS - 5.0;
  float arenaEdge = length(p.xz) - arenaRadius;
  
  // === ПОЛ (ДЕТАЛИЗИРОВАННЫЙ) ===
  float floor_d = p.y;
  if (arenaEdge < 0.0) {
    // Основной пол
    if (floor_d < d) {
      d = floor_d;
      
      // Определяем зону пола для разных материалов
      float centerDist = length(p.xz);
      
      if (centerDist < 4.0) {
        materialId = 53; // Мозаика в центре
      } else if (centerDist < 8.0) {
        materialId = 54; // Декоративное кольцо
      } else {
        materialId = 55; // Основной пол - каменная плитка
      }
    }
  }
  
  // === ТОКСИЧНЫЕ ЛУЖИ (оптимизировано) ===
  for (int i = 0; i < u_poolCount; i++) {
    if (i >= 8) break;
    vec4 pool = u_pools[i];
    if (pool.w > 0.0 && p.y < 0.15 && p.y > -0.1) {
      float distToPool = length(p.xz - pool.xy);
      if (distToPool < pool.z) {
        float poolSurface = p.y - 0.08;
        if (poolSurface < d) {
          d = poolSurface;
          materialId = 13;
        }
      }
    }
  }
  
  // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ ===
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
    vec4 zone = u_acidRainZones[i];
    float state = zone.w;
    float distToZone = length(p.xz - zone.xy);
    float zoneRadius = zone.z;
    
    if (state < 1.0) {
      // Метка предупреждения на земле
      if (p.y < 0.1 && p.y > -0.05) {
        float markRadius = zoneRadius * (0.3 + state * 1.4);
        if (distToZone < markRadius) {
          float ring = smoothstep(0.2, 0.0, abs(distToZone - markRadius * 0.85));
          float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
          float center = step(distToZone, markRadius * 0.3) * pulse;
          if (ring + center > 0.3) {
            d = p.y - 0.02;
            materialId = 20;
          }
        }
      }
    } else {
      // === АКТИВНЫЙ ДОЖДЬ - СТОЛБ КИСЛОТЫ ===
      // Светящийся круг на земле
      if (p.y < 0.15 && p.y > -0.05 && distToZone < zoneRadius) {
        d = p.y - 0.03;
        materialId = 21; // Зелёный светящийся круг
      }
      // Вертикальный столб дождя (цилиндр частиц)
      if (p.y > 0.0 && p.y < 15.0 && distToZone < zoneRadius * 0.8) {
        // Анимированные "струи" внутри столба
        float angle = atan(p.z - zone.y, p.x - zone.x);
        float streams = sin(angle * 8.0 + p.y * 2.0 - u_time * 10.0) * 0.5 + 0.5;
        float fade = 1.0 - p.y / 15.0; // Затухание к верху
        float streamDist = distToZone / (zoneRadius * 0.8);
        
        if (streams > 0.7 && streamDist > 0.3) {
          float pillarD = distToZone - zoneRadius * 0.75;
          if (pillarD < d) {
            d = pillarD;
            materialId = 22; // Полупрозрачные струи
          }
        }
      }
    }
  }
  
  // === ЛЕТЯЩИЕ СНАРЯДЫ КИСЛОТЫ ===
  for (int i = 0; i < u_acidProjectileCount; i++) {
    if (i >= 4) break;
    vec4 proj = u_acidProjectiles[i];
    vec3 projPos = proj.xyz;
    float progress = proj.w;
    
    if (progress > 0.0 && progress < 1.0) {
      // Основная сфера кислоты
      float projSphere = length(p - projPos) - 0.5;
      if (projSphere < d) {
        d = projSphere;
        materialId = 19; // Снаряд кислоты
      }
      
      // Хвост из капель
      for (int j = 1; j <= 3; j++) {
        vec3 tailPos = projPos - vec3(0.0, float(j) * 0.4, 0.0);
        float tailDrop = length(p - tailPos) - (0.3 - float(j) * 0.08);
        if (tailDrop < d) {
          d = tailDrop;
          materialId = 19;
        }
      }
    }
  }
  
  // === ЭНЕРГЕТИЧЕСКИЕ ЛУЧИ ===
  for (int i = 0; i < u_dartCount; i++) {
    if (i >= 16) break;
    vec4 dart = u_darts[i];
    vec4 dartDir = u_dartDirs[i];
    
    if (dart.w > 0.5) {
      vec3 dartPos = dart.xyz;
      vec3 dir = normalize(dartDir.xyz);
      vec3 dp = p - dartPos;
      
      // Яркое ядро луча (очень тонкое)
      float core = length(dp) - 0.1;
      
      // Внешнее свечение (больше, вытянутое)
      float glow = length(dp) - 0.25;
      
      // Длинный красивый след
      float trail = 1000.0;
      for (int t = 1; t <= 8; t++) {
        float trailDist = float(t) * 0.4;
        vec3 trailPos = dartPos - dir * trailDist;
        float trailSize = 0.2 - float(t) * 0.02;
        if (trailSize > 0.02) {
          float trailSphere = length(p - trailPos) - trailSize;
          trail = min(trail, trailSphere);
        }
      }
      
      // Дополнительные искры вокруг следа
      for (int s = 0; s < 4; s++) {
        float sparkOffset = float(s) * 0.5 + sin(u_time * 20.0 + float(s)) * 0.3;
        vec3 sparkPos = dartPos - dir * sparkOffset;
        sparkPos += vec3(
          sin(u_time * 15.0 + float(s) * 2.0) * 0.15,
          cos(u_time * 18.0 + float(s) * 3.0) * 0.15,
          sin(u_time * 12.0 + float(s) * 1.5) * 0.15
        );
        float spark = length(p - sparkPos) - 0.06;
        trail = min(trail, spark);
      }
      
      if (core < d) {
        d = core;
        materialId = 35; // Ядро луча (ярко-белое)
      } else if (glow < d) {
        d = glow;
        materialId = 36; // Свечение (голубое)
      } else if (trail < d) {
        d = trail;
        materialId = 37; // След (затухающий с искрами)
      }
    }
  }
  
  // === ЛАЗЕРЫ СПАЙКЕРОВ ===
  for (int i = 0; i < u_spikeCount; i++) {
    if (i >= 8) break;
    vec4 spike = u_spikes[i];
    vec4 spikeTarget = u_spikeTargets[i];
    vec3 laserStart = spike.xyz;
    vec3 laserEnd = spikeTarget.xyz;
    float lifetime = spike.w;
    float intensity = spikeTarget.w;
    
    if (lifetime > 0.0 && intensity > 0.0) {
      // Вектор луча
      vec3 laserDir = laserEnd - laserStart;
      float laserLen = length(laserDir);
      if (laserLen > 0.1) {
        laserDir /= laserLen;
        
        // Расстояние до линии лазера
        vec3 toPoint = p - laserStart;
        float proj = clamp(dot(toPoint, laserDir), 0.0, laserLen);
        vec3 closestPoint = laserStart + laserDir * proj;
        float distToLaser = length(p - closestPoint);
        
        // Толщина луча зависит от интенсивности
        float beamRadius = 0.08 + intensity * 0.05;
        float laserD = distToLaser - beamRadius;
        
        // Свечение вокруг луча
        float glow = max(0.0, 0.3 - distToLaser) * intensity * 2.0;
        
        if (laserD < d) {
          d = laserD;
          materialId = 27; // Лазер
        }
      }
    }
  }
  
  // === ГРАНАТЫ ===
  for (int i = 0; i < u_grenadeCount; i++) {
    if (i >= 8) break;
    vec4 grenade = u_grenades[i];
    vec3 grenadePos = grenade.xyz;
    float lifetime = grenade.w;
    
    // Сфера гранаты
    float grenadeD = length(p - grenadePos) - 0.3;
    
    if (grenadeD < d) {
      d = grenadeD;
      materialId = lifetime < 0.5 ? 42 : 41; // Красная если скоро взрыв
    }
  }
  
  // === ВЗРЫВЫ ===
  for (int i = 0; i < u_explosionCount; i++) {
    if (i >= 8) break;
    vec4 explosion = u_explosions[i];
    vec3 expPos = explosion.xyz;
    float progress = explosion.w;
    
    // Расширяющаяся сфера взрыва
    float expRadius = progress * 8.0; // Радиус 8 метров
    float expD = length(p - expPos) - expRadius;
    
    // Только оболочка (полая сфера)
    float shell = abs(expD) - 0.3 * (1.0 - progress);
    
    if (shell < d && progress < 1.0) {
      d = shell;
      materialId = 43; // Взрыв
    }
  }
  
  // === ПИКАПЫ ===
  for (int i = 0; i < u_pickupCount; i++) {
    if (i >= 8) break;
    vec4 pickup = u_pickups[i];
    float pType = pickup.w;
    
    if (pType > 0.0) {
      vec3 pickupPos = pickup.xyz;
      float pickupDist = length(p - pickupPos);
      
      // Парящая сфера/куб
      if (pType == 9.0) {
        // Аптечка - красный крест (сфера + кубы)
        float sphere = length(p - pickupPos) - 0.4;
        // Простая сфера для производительности
        if (sphere < d) {
          d = sphere;
          materialId = 14; // Аптечка
        }
      } else if (pType == 10.0) {
        // Стимпак - жёлтая звезда (сфера)
        float sphere = length(p - pickupPos) - 0.35;
        if (sphere < d) {
          d = sphere;
          materialId = 15; // Стимпак
        }
      } else if (pType == 11.0) {
        // Заряд катаны - энергетическая сфера
        float chargeSphere = length(p - pickupPos) - 0.5;
        if (chargeSphere < d) {
          d = chargeSphere;
          materialId = 17; // Заряд
        }
      } else if (pType == 12.0) {
        // БОЛЬШАЯ аптечка (на краях карты) - крест с аурой
        float healthBig = length(p - pickupPos) - 0.6; // Больше обычной
        
        // Вертикальный крест (3D)
        vec3 localP = p - pickupPos;
        float crossV = sdBox(localP, vec3(0.15, 0.5, 0.15));
        float crossH = sdBox(localP, vec3(0.5, 0.15, 0.15));
        float cross = min(crossV, crossH);
        
        // Светящаяся аура вокруг
        float aura = length(localP) - 0.8;
        
        if (cross < d) {
          d = cross;
          materialId = 31; // Большая аптечка
        }
      }
    }
  }
  
  // === ОБРЫВ ПО КРАЯМ ===
  // Бортик края - тор вокруг арены
  float rimTorus = sdTorus(p - vec3(0.0, 0.0, 0.0), vec2(33.0, 0.4));
  if (rimTorus < d) {
    d = rimTorus;
    materialId = 46;
  }
  
  // За краем - бездна (простой пол далеко внизу)
  if (arenaEdge > 0.5) {
    float voidFloor = p.y + 10.0;
    if (voidFloor < d) {
      d = voidFloor;
      materialId = 44;
    }
  }
  
  // === ЦЕНТРАЛЬНЫЙ ФОНТАН (ДЕТАЛИЗИРОВАННЫЙ) ===
  // Основание - широкий восьмиугольный постамент
  vec3 fp = p;
  float baseAngle = atan(fp.z, fp.x);
  float baseDist = length(fp.xz) * (1.0 + 0.08 * cos(baseAngle * 8.0)); // Восьмиугольник
  float base1 = max(baseDist - 2.8, abs(fp.y - 0.15) - 0.15);
  if (base1 < d) { d = base1; materialId = 50; } // Тёмный камень
  
  // Ступень 1
  float step1Dist = length(fp.xz) * (1.0 + 0.06 * cos(baseAngle * 8.0));
  float step1 = max(step1Dist - 2.3, abs(fp.y - 0.4) - 0.1);
  if (step1 < d) { d = step1; materialId = 50; }
  
  // Ступень 2
  float step2Dist = length(fp.xz) * (1.0 + 0.04 * cos(baseAngle * 8.0));
  float step2 = max(step2Dist - 1.8, abs(fp.y - 0.6) - 0.1);
  if (step2 < d) { d = step2; materialId = 50; }
  
  // Центральная колонна с каннелюрами
  vec3 colP = p - vec3(0.0, 1.8, 0.0);
  float colAngle = atan(colP.z, colP.x);
  float colRadius = 0.8 + 0.05 * cos(colAngle * 12.0); // 12 каннелюр
  float centerCol = max(length(colP.xz) - colRadius, abs(colP.y) - 1.2);
  if (centerCol < d) { d = centerCol; materialId = 51; } // Мрамор
  
  // Капитель (верхняя часть колонны)
  float capitel = sdCylinder(p - vec3(0.0, 3.1, 0.0), 1.0, 0.15);
  if (capitel < d) { d = capitel; materialId = 51; }
  
  // Декоративный тор на капители
  float capRing = sdTorus(p - vec3(0.0, 3.0, 0.0), vec2(0.9, 0.08));
  if (capRing < d) { d = capRing; materialId = 52; } // Бронза
  
  // Чаша фонтана (большая)
  float bowl1 = sdTorus(p - vec3(0.0, 0.75, 0.0), vec2(2.0, 0.2));
  if (bowl1 < d) { d = bowl1; materialId = 51; }
  
  // Внутренняя чаша (меньше)
  float bowl2 = sdTorus(p - vec3(0.0, 0.85, 0.0), vec2(1.5, 0.12));
  if (bowl2 < d) { d = bowl2; materialId = 52; }
  
  // === ЦЕНТРАЛЬНЫЙ БАССЕЙН ===
  float poolDist = distFromCenter;
  if (poolDist < POOL_RADIUS + 1.0 && poolDist > 2.5 && p.y < 0.5) {
    // Дно бассейна
    float poolBottom = p.y + POOL_DEPTH;
    
    // Бортик бассейна
    float rim = sdTorus(p - vec3(0.0, 0.15, 0.0), vec2(POOL_RADIUS, 0.3));
    d = min(d, rim);
    
    // Не пробиваем дно если внутри бассейна
    if (poolDist < POOL_RADIUS - 0.3) {
      d = min(d, poolBottom);
    }
  }
  
  // === МОСТЫ ЧЕРЕЗ БАССЕЙН ===
  // Мост по X
  float bridgeX = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(POOL_RADIUS + 1.0, 0.2, BRIDGE_WIDTH * 0.5));
  // Вырезаем центр для колонны
  bridgeX = max(bridgeX, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeX);
  
  // Мост по Z
  float bridgeZ = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(BRIDGE_WIDTH * 0.5, 0.2, POOL_RADIUS + 1.0));
  bridgeZ = max(bridgeZ, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeZ);
  
  // === ПОДХОДЫ К ПОРТАЛАМ (рампы) ===
  // Левая рампа к порталу
  float rampL = sdBox(p - vec3(-19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampL);
  
  // Правая рампа к порталу
  float rampR = sdBox(p - vec3(19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampR);
  
  // === ПОРТАЛЫ ===
  // Левый портал
  {
    vec3 pp = p - vec3(-22.0, 2.0, 0.0);
    
    // Постамент
    float base = sdBox(pp - vec3(0.0, -2.0, 0.0), vec3(2.0, 0.2, 2.5));
    if (base < d) { d = base; materialId = 50; }
    
    // Две колонны
    float colL = sdCylinder(pp - vec3(0.0, 0.0, -1.6), 0.3, 2.5);
    float colR = sdCylinder(pp - vec3(0.0, 0.0, 1.6), 0.3, 2.5);
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    // Верхняя балка
    float beam = sdBox(pp - vec3(0.0, 2.7, 0.0), vec3(0.35, 0.25, 2.0));
    if (beam < d) { d = beam; materialId = 23; }
    
    // Энергия внутри - простая СФЕРА
    float energy = sdSphere(pp, 1.2);
    if (energy < d) { d = energy; materialId = 24; }
  }
  
  // Правый портал  
  {
    vec3 pp = p - vec3(22.0, 2.0, 0.0);
    
    // Постамент
    float base = sdBox(pp - vec3(0.0, -2.0, 0.0), vec3(2.0, 0.2, 2.5));
    if (base < d) { d = base; materialId = 50; }
    
    // Две колонны
    float colL = sdCylinder(pp - vec3(0.0, 0.0, -1.6), 0.3, 2.5);
    float colR = sdCylinder(pp - vec3(0.0, 0.0, 1.6), 0.3, 2.5);
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    // Верхняя балка
    float beam = sdBox(pp - vec3(0.0, 2.7, 0.0), vec3(0.35, 0.25, 2.0));
    if (beam < d) { d = beam; materialId = 23; }
    
    // Энергия внутри - простая СФЕРА
    float energy = sdSphere(pp, 1.2);
    if (energy < d) { d = energy; materialId = 24; }
  }
  
  // === КРУГЛЫЕ ПЛОЩАДКИ ЗА ПОРТАЛАМИ ===
  // Левая площадка (за левым порталом)
  {
    vec3 platPos = vec3(-BACK_PLATFORM_X, 0.0, 0.0);
    vec3 lp = p - platPos;
    
    // Круглая платформа
    float platform = sdCylinder(lp - vec3(0.0, 0.15, 0.0), BACK_PLATFORM_RADIUS, 0.3);
    if (platform < d) {
      d = platform;
      materialId = 0; // Пол
    }
    
    // Декоративный бортик
    float rimOuter = length(lp.xz) - BACK_PLATFORM_RADIUS;
    float rimInner = length(lp.xz) - (BACK_PLATFORM_RADIUS - 0.5);
    float rim = max(rimOuter, -rimInner);
    rim = max(rim, lp.y - 0.6);
    rim = max(rim, -lp.y);
    if (rim < d) {
      d = rim;
      materialId = 3; // Металл
    }
    
    // Светящиеся руны на полу
    float runeDist = length(lp.xz);
    if (runeDist < BACK_PLATFORM_RADIUS - 1.0 && abs(lp.y - 0.32) < 0.05) {
      float runeAngle = atan(lp.z, lp.x);
      float runePattern = sin(runeAngle * 6.0 + u_time * 0.5) * sin(runeDist * 2.0);
      if (runePattern > 0.7) {
        materialId = 17; // Свечение
      }
    }
  }
  
  // Правая площадка (за правым порталом)
  {
    vec3 platPos = vec3(BACK_PLATFORM_X, 0.0, 0.0);
    vec3 lp = p - platPos;
    
    // Круглая платформа
    float platform = sdCylinder(lp - vec3(0.0, 0.15, 0.0), BACK_PLATFORM_RADIUS, 0.3);
    if (platform < d) {
      d = platform;
      materialId = 0;
    }
    
    // Декоративный бортик
    float rimOuter = length(lp.xz) - BACK_PLATFORM_RADIUS;
    float rimInner = length(lp.xz) - (BACK_PLATFORM_RADIUS - 0.5);
    float rim = max(rimOuter, -rimInner);
    rim = max(rim, lp.y - 0.6);
    rim = max(rim, -lp.y);
    if (rim < d) {
      d = rim;
      materialId = 3;
    }
    
    // Светящиеся руны
    float runeDist = length(lp.xz);
    if (runeDist < BACK_PLATFORM_RADIUS - 1.0 && abs(lp.y - 0.32) < 0.05) {
      float runeAngle = atan(lp.z, lp.x);
      float runePattern = sin(runeAngle * 6.0 - u_time * 0.5) * sin(runeDist * 2.0);
      if (runePattern > 0.7) {
        materialId = 17;
      }
    }
  }
  
  // === МОСТЫ К ПЛОЩАДКАМ ЗА ПОРТАЛАМИ ===
  // Левый мост (от портала к площадке)
  float bridgeLeft = sdBox(p - vec3(-26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeLeft < d) {
    d = bridgeLeft;
    materialId = 0;
  }
  
  // Правый мост
  float bridgeRight = sdBox(p - vec3(26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeRight < d) {
    d = bridgeRight;
    materialId = 0;
  }
  
  // === ОРБИТАЛЬНЫЕ ОГНИ (светящиеся сферы) ===
  for (int i = 0; i < 4; i++) {
    float orbitAngle = u_time * 0.5 + float(i) * 1.57;
    float orbitRadius = 12.0 + sin(u_time * 0.3 + float(i)) * 2.0;
    float orbitHeight = 4.0 + sin(u_time * 0.7 + float(i) * 0.5) * 1.5;
    
    vec3 orbPos = vec3(
      cos(orbitAngle) * orbitRadius,
      orbitHeight,
      sin(orbitAngle) * orbitRadius
    );
    
    float orbSphere = sdSphere(p - orbPos, 0.25);
    if (orbSphere < d) {
      d = orbSphere;
      materialId = 56 + i; // 56, 57, 58, 59 - разные цвета огней
    }
  }
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль по кругу) ===
  // 6 платформ по кругу с радиусом 10м, парящие вверх-вниз
  float bob1 = sin(u_time * 1.5 + 0.0) * 0.3;
  float bob2 = sin(u_time * 1.5 + 0.8) * 0.3;
  float bob3 = sin(u_time * 1.5 + 1.6) * 0.3;
  float bob4 = sin(u_time * 1.5 + 2.4) * 0.3;
  float bob5 = sin(u_time * 1.5 + 3.2) * 0.3;
  float bob6 = sin(u_time * 1.5 + 4.0) * 0.3;
  
  float jp1 = sdCylinder(p - vec3(10.0, 1.8 + bob1, 0.0), 1.5, 0.25);
  float jp2 = sdCylinder(p - vec3(5.0, 3.0 + bob2, 8.66), 1.4, 0.25);
  float jp3 = sdCylinder(p - vec3(-5.0, 4.2 + bob3, 8.66), 1.4, 0.25);
  float jp4 = sdCylinder(p - vec3(-10.0, 5.4 + bob4, 0.0), 1.3, 0.25);
  float jp5 = sdCylinder(p - vec3(-5.0, 6.6 + bob5, -8.66), 1.3, 0.25);
  float jp6 = sdCylinder(p - vec3(5.0, 7.8 + bob6, -8.66), 1.2, 0.25);
  
  float jumpPlats = min(jp1, min(jp2, min(jp3, min(jp4, min(jp5, jp6)))));
  if (jumpPlats < d) {
    d = jumpPlats;
    materialId = 16;
  }
  
  // Верхняя платформа с бафом (в центре над фонтаном), парит медленнее
  float topBob = sin(u_time * 1.0) * 0.2;
  float topPlat = sdCylinder(p - vec3(0.0, 9.5 + topBob, 0.0), 2.5, 0.35);
  if (topPlat < d) {
    d = topPlat;
    materialId = 16;
  }
  
  // Свечение под верхней платформой
  float glowRing = sdTorus(p - vec3(0.0, 9.0, 0.0), vec2(2.0, 0.12));
  if (glowRing < d) {
    d = glowRing;
    materialId = 17;
  }

  // === КРИСТАЛЛЫ СИЛЫ (только на волне 10) ===
  if (u_wave == 10) {
    for (int i = 0; i < 6; i++) {
      if (u_crystals[i].w > 0.5) { // active
        float cx = u_crystals[i].x;
        float cz = u_crystals[i].y;
        float ch = u_crystals[i].z;
        
        // Кристалл парит и вращается
        float bobOffset = sin(u_time * 2.0 + float(i)) * 0.15;
        float rotation = u_time * 1.5 + float(i) * 1.047; // Вращение
        
        vec3 crystalPos = vec3(cx, ch + bobOffset, cz);
        vec3 lp = p - crystalPos;
        
        // Вращаем вокруг Y
        float cosR = cos(rotation);
        float sinR = sin(rotation);
        lp.xz = mat2(cosR, -sinR, sinR, cosR) * lp.xz;
        
        // Октаэдр (кристалл)
        float crystal = sdOctahedron(lp, 0.5);
        
        if (crystal < d) {
          d = crystal;
          materialId = 18; // Чёрный кристалл
        }
      }
    }
  }
  
  // === ПОРТАЛ В ВОЙД (центр арены) ===
  if (u_voidPortalActive > 0.0) {
    // Луч уходящий в небо
    float beamDist = length(p.xz); // Расстояние до центра по XZ
    float beamRadius = 1.5 + sin(u_time * 3.0) * 0.3; // Пульсирующий радиус
    
    if (beamDist < beamRadius && p.y > 0.0 && p.y < 30.0) {
      // Внутри луча
      float beamD = beamDist - beamRadius * 0.3; // Ядро
      
      if (beamD < d) {
        d = max(beamD, 0.01);
        materialId = 38; // Ядро портала
      }
    }
    
    // Внешнее свечение луча
    float glowRadius = beamRadius + 1.0;
    if (beamDist < glowRadius && beamDist > beamRadius * 0.3 && p.y > 0.0 && p.y < 25.0) {
      float glowD = abs(beamDist - beamRadius * 0.7) - 0.3;
      if (glowD < d) {
        d = max(glowD, 0.01);
        materialId = 39; // Свечение портала
      }
    }
    
    // Кольца энергии вокруг основания
    for (int ring = 0; ring < 3; ring++) {
      float ringY = float(ring) * 0.8 + mod(u_time * 5.0, 3.0);
      if (ringY < 10.0) {
        float ringDist = abs(length(p.xz) - beamRadius * 1.2) - 0.1;
        float ringHeight = abs(p.y - ringY) - 0.15;
        float ringD = max(ringDist, ringHeight);
        if (ringD < d) {
          d = ringD;
          materialId = 40; // Энергетическое кольцо
        }
      }
    }
    
    // Частицы вокруг портала
    for (int i = 0; i < 8; i++) {
      float angle = float(i) * 0.785 + u_time * 2.0;
      float radius = beamRadius * 1.5 + sin(u_time * 3.0 + float(i)) * 0.5;
      float height = mod(u_time * 4.0 + float(i) * 1.5, 15.0);
      vec3 particlePos = vec3(cos(angle) * radius, height, sin(angle) * radius);
      float particleD = length(p - particlePos) - 0.15;
      if (particleD < d) {
        d = particleD;
        materialId = 40;
      }
    }
  }
  
  // === АЛТАРИ НА КРАЯХ КАРТЫ ===
  for (int i = 0; i < 2; i++) {
    vec4 altar = u_altars[i];
    vec3 altarPos = vec3(altar.x, 0.0, altar.z);
    vec3 ap = p - altarPos;
    
    // Основание алтаря (круглая платформа)
    float base = sdCylinder(ap - vec3(0.0, 0.2, 0.0), 2.5, 0.4);
    
    // Ступени (3 уровня)
    float step1 = sdCylinder(ap - vec3(0.0, 0.5, 0.0), 2.0, 0.15);
    float step2 = sdCylinder(ap - vec3(0.0, 0.75, 0.0), 1.5, 0.15);
    float step3 = sdCylinder(ap - vec3(0.0, 1.0, 0.0), 1.0, 0.15);
    
    // Центральный столб (тории-образный)
    float pillarL = sdBox(ap - vec3(-1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    float pillarR = sdBox(ap - vec3(1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    
    // Перекладина сверху
    float top = sdBox(ap - vec3(0.0, 4.0, 0.0), vec3(1.8, 0.2, 0.2));
    float topSub = sdBox(ap - vec3(0.0, 3.6, 0.0), vec3(1.5, 0.1, 0.15));
    
    // Чаша для очков (в центре)
    float bowl = sdTorus(ap - vec3(0.0, 1.3, 0.0), vec2(0.6, 0.15));
    float bowlInner = sdCylinder(ap - vec3(0.0, 1.4, 0.0), 0.5, 0.2);
    
    // Собираем алтарь
    float altarD = base;
    altarD = min(altarD, step1);
    altarD = min(altarD, step2);
    altarD = min(altarD, step3);
    altarD = min(altarD, pillarL);
    altarD = min(altarD, pillarR);
    altarD = min(altarD, top);
    altarD = min(altarD, topSub);
    altarD = min(altarD, bowl);
    
    if (altarD < d) {
      d = altarD;
      materialId = 32; // Камень алтаря
    }
    
    // Огонь в чаше (если есть очки)
    if (altar.w > 0.0) {
      float fireY = 1.5 + sin(u_time * 5.0 + float(i)) * 0.2;
      float fireSize = 0.3 + altar.w * 0.001; // Размер зависит от очков
      float fire = length(ap - vec3(0.0, fireY, 0.0)) - min(fireSize, 0.8);
      
      if (fire < d) {
        d = fire;
        materialId = 33; // Огонь в алтаре
      }
    }
    
    // Светящийся символ (кольцо вокруг чаши)
    float glow = sdTorus(ap - vec3(0.0, 1.2, 0.0), vec2(0.9, 0.05));
    if (glow < d) {
      d = glow;
      materialId = 34; // Светящийся символ
    }
  }
  
  // === ВОДА В БАССЕЙНЕ (замедляет игрока!) ===
  // Центральный бассейн с водой
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.05 + waterWaves(p.xz, u_time) * 0.05;
      // Плоскость воды как SDF
      float waterSdf = abs(p.y - waterY) - 0.02;
      if (waterSdf < d) {
        d = waterSdf;
        materialId = 30; // Вода!
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.45 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterSdf = abs(p.y - waterY) - 0.02;
    if (waterSdf < d) {
      d = waterSdf;
      materialId = 30; // Вода!
    }
  }
  
  // === ВРАГИ ===
  // w: 0=неактивен, 1-2=бейнлинг, 3-4=фантом, 5-6=runner, 7-8=hopper, 9-10=spiker
  // 11-12=boss_green, 13-14=boss_black, 15-16=boss_blue
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 16) break;
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 tp = p - target.xyz;
      int enemyType = int(target.w / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper, 4=spiker, 5=boss_green, 6=boss_black, 7=boss_blue
      
      float targetD;
      int matId;
      
      if (enemyType == 5) {
        // === ЗЕЛЁНЫЙ БОСС (огромная зелёная жижа) ===
        float wobble = sin(u_time * 2.0 + tp.x * 1.5) * 0.3
                     + sin(u_time * 1.5 + tp.y * 2.0) * 0.25
                     + sin(u_time * 2.5 + tp.z * 1.0) * 0.2;
        float radius = 2.5 + wobble;
        targetD = sdSphere(tp, radius);
        
        // Пузырящаяся поверхность
        float bubbles = sin(tp.x * 4.0 + u_time * 3.0) 
                      * sin(tp.y * 4.0 + u_time * 2.5) 
                      * sin(tp.z * 4.0 + u_time * 3.5) * 0.2;
        targetD += bubbles;
        
        // Щупальца
        for (int t = 0; t < 4; t++) {
          float angle = float(t) * 1.57 + u_time * 0.5;
          vec3 tentacle = tp - vec3(cos(angle) * 1.5, -1.0, sin(angle) * 1.5);
          targetD = smin(targetD, sdCylinder(tentacle, 0.3, 1.5), 0.3);
        }
        matId = 10; // Зелёный босс
        
      } else if (enemyType == 6) {
        // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
        // Искажённое пространство вокруг
        vec3 distorted = tp;
        float distortAmount = sin(u_time * 3.0) * 0.3;
        distorted.x += sin(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        distorted.z += cos(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        
        float radius = 2.0;
        targetD = sdSphere(distorted, radius);
        
        // Кольца тёмной энергии
        float ring1 = abs(sdTorus(tp, vec2(3.0, 0.1))) - 0.05;
        float ring2 = abs(sdTorus(tp * vec3(1.0, 0.7, 1.0), vec2(3.5, 0.08))) - 0.03;
        targetD = min(targetD, ring1);
        targetD = min(targetD, ring2);
        matId = 11; // Чёрный босс
        
      } else if (enemyType == 7) {
        // === СИНИЙ БОСС (телепортирующийся) ===
        // Мерцающая форма
        float flicker = abs(sin(u_time * 20.0)) * 0.3 + 0.7;
        float radius = 1.8 * flicker;
        targetD = sdSphere(tp, radius);
        
        // Электрические разряды
        float sparks = sin(tp.x * 15.0 + u_time * 30.0) 
                     * sin(tp.y * 15.0 + u_time * 25.0) * 0.1;
        targetD += sparks;
        
        // Призрачные копии
        vec3 ghost1 = tp - vec3(sin(u_time * 5.0) * 2.0, 0.0, cos(u_time * 5.0) * 2.0);
        vec3 ghost2 = tp + vec3(cos(u_time * 4.0) * 2.0, 0.0, sin(u_time * 4.0) * 2.0);
        targetD = min(targetD, sdSphere(ghost1, 0.5) - 0.1);
        targetD = min(targetD, sdSphere(ghost2, 0.5) - 0.1);
        matId = 12; // Синий босс
        
      } else if (enemyType == 1) {
        // === ФАНТОМ (чёрный шар) ===
        float distort = sin(u_time * 8.0 + tp.x * 5.0) * 0.08
                      + sin(u_time * 7.0 + tp.z * 6.0) * 0.06;
        float radius = 0.55 + distort;
        targetD = sdSphere(tp, radius);
        
        vec3 trail = tp + vec3(0.0, 0.0, 0.3);
        float trailD = sdSphere(trail, 0.3) - 0.1;
        targetD = min(targetD, trailD);
        matId = 5;
        
      } else if (enemyType == 2) {
        // === RUNNER (оранжевый, вытянутый) ===
        vec3 stretched = tp;
        stretched.x *= 0.6;
        float radius = 0.35;
        targetD = sdSphere(stretched, radius);
        
        float speedTrail = sdSphere(tp + vec3(0.3, 0.0, 0.0), 0.2);
        speedTrail = min(speedTrail, sdSphere(tp + vec3(0.5, 0.0, 0.0), 0.12));
        targetD = min(targetD, speedTrail);
        matId = 6;
        
      } else if (enemyType == 3) {
        // === HOPPER (синий, пружинистый) ===
        float squeeze = 1.0 + sin(u_time * 12.0) * 0.15;
        vec3 squashed = tp;
        squashed.y *= squeeze;
        float radius = 0.45;
        targetD = sdSphere(squashed, radius);
        
        vec3 ear1 = tp - vec3(0.2, 0.4, 0.0);
        vec3 ear2 = tp - vec3(-0.2, 0.4, 0.0);
        float ears = min(sdSphere(ear1, 0.12), sdSphere(ear2, 0.12));
        targetD = min(targetD, ears);
        matId = 7;
        
      } else if (enemyType == 4) {
        // === SPIKER (летающий шар с глазом-лазером) ===
        
        // Покачивание
        float bob = sin(u_time * 6.0 + float(i) * 2.0) * 0.2;
        vec3 bobbed = tp - vec3(0.0, bob, 0.0);
        
        // Вращение - глаз смотрит на камеру
        vec3 toCamera = normalize(u_cameraPos - target.xyz);
        
        // Основной шар тела
        float bodyRadius = 0.55;
        targetD = sdSphere(bobbed, bodyRadius);
        
        // Текстура на шаре - "прожилки"
        float veins = sin(bobbed.x * 15.0 + u_time * 2.0) 
                    * sin(bobbed.y * 12.0 + u_time * 1.5) 
                    * sin(bobbed.z * 15.0 + u_time * 2.5);
        targetD += veins * 0.02;
        
        // Пульсация
        float pulse = 1.0 + sin(u_time * 4.0 + float(i)) * 0.08;
        targetD *= pulse;
        
        // Глаз - выпуклость в направлении камеры
        vec3 eyeOffset = toCamera * 0.4;
        vec3 eyePos = bobbed - eyeOffset;
        float eyeBulge = sdSphere(eyePos, 0.35);
        targetD = min(targetD, eyeBulge);
        
        // Зрачок - в центре глаза (чёрный)
        vec3 pupilPos = bobbed - toCamera * 0.55;
        float pupilD = sdSphere(pupilPos, 0.15);
        
        // Радужка вокруг зрачка
        vec3 irisPos = bobbed - toCamera * 0.5;
        float irisD = sdSphere(irisPos, 0.25);
        
        // Маленькие шипы по краям
        for (int s = 0; s < 4; s++) {
          float angle = float(s) * 1.57 + u_time * 0.5;
          vec3 spikeDir = vec3(cos(angle), 0.0, sin(angle));
          vec3 spikePos = bobbed - spikeDir * 0.6;
          float spikeD = length(spikePos) - 0.08;
          targetD = min(targetD, spikeD);
        }
        
        // Определяем материал по расстоянию
        if (pupilD < 0.01) {
          matId = 28; // Зрачок (чёрный с красным свечением)
        } else if (irisD < eyeBulge) {
          matId = 29; // Радужка (красно-оранжевая)
        } else {
          matId = 26; // Тело спайкера
        }
        
      } else {
        // === БЕЙНЛИНГ (зелёная жижа) ===
        float wobble = sin(u_time * 4.0 + tp.x * 3.0) * 0.1
                     + sin(u_time * 3.0 + tp.y * 4.0) * 0.1
                     + sin(u_time * 5.0 + tp.z * 2.0) * 0.08;
        float radius = 0.7 + wobble;
        targetD = sdSphere(tp, radius);
        
        float bubbles = sin(tp.x * 8.0 + u_time * 2.0) 
                      * sin(tp.y * 8.0 + u_time * 1.5) 
                      * sin(tp.z * 8.0 + u_time * 2.5) * 0.05;
        targetD += bubbles;
        matId = 4;
      }
      
      if (targetD < d) {
        d = targetD;
        materialId = matId;
      }
    }
  }
  
  return d;
}

// === RAY MARCHING ===
float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    // Точный marching без overrelaxation для качества
    d += dist;
    if (dist < SURF_DIST || d > MAX_DIST) break;
  }
  return d;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// === БЫСТРЫЕ МЯГКИЕ ТЕНИ ===
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 12; i++) { // 12 шагов вместо 24
    if (t > maxt) break;
    float h = map(ro + rd * t);
    if (h < 0.002) return 0.0;
    res = min(res, k * h / t);
    t += max(h, 0.2); // Большие шаги
  }
  return clamp(res, 0.0, 1.0);
}

// === БЫСТРЫЙ AO ===
float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float h1 = 0.05;
  float h2 = 0.15;
  occ += (h1 - map(pos + h1 * nor)) * 0.7;
  occ += (h2 - map(pos + h2 * nor)) * 0.3;
  return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}

// === КРАСИВАЯ ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ ===
float filmGrain(vec2 uv, float time) {
  // Динамический шум меняется каждый кадр
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  float noise1 = fract(sin(seed) * 43758.5453);
  float noise2 = fract(sin(seed * 1.1) * 28461.2314);
  float noise3 = fract(sin(seed * 0.9) * 51732.8912);
  
  // Смешиваем несколько слоёв для органичности
  float grain = (noise1 + noise2 + noise3) / 3.0;
  
  // Центрируем около 0 для симметричного влияния
  grain = grain - 0.5;
  
  return grain;
}

// === КАУСТИКИ ===
float caustics(vec2 p, float t) {
  float c = 0.0;
  for (float i = 1.0; i <= 3.0; i++) {
    vec2 uv = p * (1.0 + i * 0.3);
    uv += vec2(sin(t * 0.3 + i), cos(t * 0.4 + i * 1.1)) * 0.5;
    c += pow(0.5 + 0.5 * sin(noise(uv) * 6.0), 4.0);
  }
  return c / 3.0;
}

// === ЗВЁЗДНОЕ НЕБО (через купол) ===
vec3 renderSky(vec3 rd) {
  vec3 color = vec3(0.02, 0.03, 0.08);
  
  // ФАЗА 2 ЗЕЛЁНОГО БОССА - ТОКСИЧНОЕ ЗЕЛЁНОЕ НЕБО!
  if (u_greenBossPhase2 == 1) {
    // Ядовито-зелёный градиент
    float heightFade = smoothstep(-0.2, 0.8, rd.y);
    vec3 toxicGreen = mix(vec3(0.05, 0.15, 0.02), vec3(0.1, 0.4, 0.05), heightFade);
    color = toxicGreen;
    
    // Токсичные облака
    float clouds = sin(rd.x * 3.0 + u_time * 0.5) * sin(rd.z * 2.0 + u_time * 0.3) * 0.5 + 0.5;
    color += vec3(0.0, 0.2, 0.0) * clouds * 0.3;
    
    // Пульсирующее свечение
    float pulse = sin(u_time * 2.0) * 0.2 + 0.8;
    color *= pulse;
    
    return color;
  }
  
  // Звёзды
  vec2 skyUV = rd.xz / (rd.y + 0.5);
  for (float i = 0.0; i < 50.0; i++) {
    vec2 starPos = vec2(hash(vec2(i, 0.0)), hash(vec2(i, 1.0))) * 4.0 - 2.0;
    float star = 0.002 / (length(skyUV - starPos) + 0.002);
    star *= step(0.7, hash(vec2(i, 2.0)));
    color += vec3(1.0, 0.95, 0.9) * star * 0.3;
  }
  
  // Луна
  vec3 moonDir = normalize(vec3(0.5, 0.8, -0.3));
  float moon = smoothstep(0.98, 0.99, dot(rd, moonDir));
  color += vec3(1.0, 0.98, 0.95) * moon * 2.0;
  
  // Свечение вокруг луны
  float moonGlow = pow(max(0.0, dot(rd, moonDir)), 32.0);
  color += vec3(0.3, 0.35, 0.5) * moonGlow * 0.5;
  
  return color;
}

// === ЭФФЕКТ ДОЖДЯ И МОЛНИЙ ===

// Функция для вертикальных линий дождя
float rainStreak(vec2 uv, float speed, float density, float seed) {
  vec2 st = uv * vec2(density, 1.0);
  st.y = st.y * 0.1 - u_time * speed;
  
  float id = floor(st.x);
  float x = fract(st.x);
  float y = fract(st.y + fract(sin(id * seed) * 1000.0));
  
  // Тонкая вертикальная линия
  float streak = smoothstep(0.45, 0.5, x) * smoothstep(0.55, 0.5, x);
  // Ограничиваем длину капли
  streak *= smoothstep(0.0, 0.02, y) * smoothstep(0.15, 0.08, y);
  // Случайность появления
  streak *= step(0.7, fract(sin(id * 127.1 + seed) * 43758.5453));
  
  return streak;
}

// Функция молнии
float lightning(vec2 uv, float time, float seed) {
  // Позиция молнии по X (меняется каждые несколько секунд)
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  
  // Фаза молнии (0-1 в пределах удара)
  float phase = fract(time * 0.3 + seed);
  
  // Молния видна только короткое время
  float visible = smoothstep(0.7, 0.75, phase) * smoothstep(0.95, 0.85, phase);
  
  // Основной канал молнии с зигзагами
  float bolt = 0.0;
  float x = strikeX;
  float segments = 8.0;
  
  for (float i = 0.0; i < segments; i++) {
    float segY = 1.0 - i / segments;
    float nextY = 1.0 - (i + 1.0) / segments;
    
    // Случайное смещение для зигзага
    float nextX = x + (fract(sin((strikeTime + i) * 73.7) * 43758.5453) - 0.5) * 0.3;
    
    // Проверяем попадает ли пиксель в сегмент
    if (uv.y < segY && uv.y > nextY) {
      float t = (segY - uv.y) / (segY - nextY);
      float lineX = mix(x, nextX, t);
      float dist = abs(uv.x - lineX);
      
      // Яркое ядро + свечение
      bolt += smoothstep(0.02, 0.0, dist) * 2.0;
      bolt += smoothstep(0.08, 0.0, dist) * 0.5;
    }
    x = nextX;
  }
  
  return bolt * visible;
}

// Предупреждающее свечение перед молнией
float lightningWarning(vec2 uv, float time, float seed) {
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  float phase = fract(time * 0.3 + seed);
  
  // Свечение появляется перед ударом (фаза 0.5-0.7)
  float warning = smoothstep(0.5, 0.6, phase) * smoothstep(0.75, 0.65, phase);
  
  // Пульсация
  warning *= 0.5 + 0.5 * sin(time * 20.0);
  
  // Область свечения сверху
  float glow = smoothstep(0.3, 1.0, uv.y);
  glow *= smoothstep(0.5, 0.0, abs(uv.x - strikeX));
  
  return glow * warning;
}

// Кислотный дождь - капли только когда игрок В зоне
vec3 renderAcidRain(vec2 uv, vec3 color, float time, vec3 camPos) {
  if (u_acidRainZoneCount == 0) return color;
  
  vec3 result = color;
  float inRainIntensity = 0.0; // Игрок ВНУТРИ зоны дождя
  
  // Проверяем находится ли игрок в зоне дождя
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
    vec4 zone = u_acidRainZones[i];
    if (zone.w >= 1.0) {
      float dist = length(camPos.xz - zone.xy);
      float zoneRadius = zone.z;
      // Только если игрок ВНУТРИ зоны (с небольшим запасом)
      if (dist < zoneRadius + 1.0) {
        inRainIntensity = max(inRainIntensity, 1.0 - dist / (zoneRadius + 1.0));
      }
    }
  }
  
  // Капли на экране ТОЛЬКО если игрок под дождём
  if (inRainIntensity > 0.01) {
    float drops = 0.0;
    
    // Толстые струи
    float y1 = fract(uv.y * 3.0 - time * 15.0);
    drops += step(0.0, y1) * step(y1, 0.5) * step(0.4, fract(uv.x * 3.0)) * step(fract(uv.x * 3.0), 0.6) * 0.5;
    
    float y1b = fract(uv.y * 3.0 - time * 18.0 + 0.33);
    drops += step(0.0, y1b) * step(y1b, 0.5) * step(0.4, fract(uv.x * 3.0 + 0.33)) * step(fract(uv.x * 3.0 + 0.33), 0.6) * 0.5;
    
    // Средние капли
    float y2 = fract(uv.y * 6.0 - time * 22.0);
    drops += step(0.1, y2) * step(y2, 0.4) * step(0.45, fract(uv.x * 6.0)) * step(fract(uv.x * 6.0), 0.55) * 0.3;
    
    // Мелкие капли
    float y3 = fract(uv.y * 10.0 - time * 28.0);
    drops += step(0.15, y3) * step(y3, 0.35) * step(0.47, fract(uv.x * 10.0)) * step(fract(uv.x * 10.0), 0.53) * 0.2;
    
    // Зелёные капли на экране
    result += vec3(0.2, 1.0, 0.1) * drops * inRainIntensity * 5.0;
    
    // Зелёная дымка когда под дождём
    result = mix(result, vec3(0.1, 0.5, 0.1), inRainIntensity * 0.35);
  }
  
  return result;
}

// === ЭФФЕКТ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
// Рендерит skybox который вращается с камерой
// voidVariant: 0=багровый, 1=изумрудный, 2=золотой, 3=ледяной
vec3 renderVoidSky(vec3 rd, float time) {
  // Базовые цвета для разных вариантов войда
  vec3 baseSky, upColor, nebulaColor1, nebulaColor2, starColor1, starColor2;
  
  if (u_voidVariant == 0) {
    // БАГРОВЫЙ войд
    baseSky = vec3(0.04, 0.01, 0.02);
    upColor = vec3(0.1, 0.02, 0.05);
    nebulaColor1 = vec3(0.15, 0.02, 0.05);
    nebulaColor2 = vec3(0.1, 0.0, 0.03);
    starColor1 = vec3(0.8, 0.3, 0.3);
    starColor2 = vec3(1.0, 0.5, 0.4);
  } else if (u_voidVariant == 1) {
    // ИЗУМРУДНЫЙ войд
    baseSky = vec3(0.01, 0.04, 0.02);
    upColor = vec3(0.02, 0.1, 0.05);
    nebulaColor1 = vec3(0.02, 0.15, 0.08);
    nebulaColor2 = vec3(0.0, 0.1, 0.05);
    starColor1 = vec3(0.3, 0.8, 0.5);
    starColor2 = vec3(0.5, 1.0, 0.7);
  } else if (u_voidVariant == 2) {
    // ЗОЛОТОЙ войд
    baseSky = vec3(0.04, 0.03, 0.01);
    upColor = vec3(0.1, 0.08, 0.02);
    nebulaColor1 = vec3(0.15, 0.1, 0.02);
    nebulaColor2 = vec3(0.1, 0.06, 0.0);
    starColor1 = vec3(1.0, 0.8, 0.3);
    starColor2 = vec3(1.0, 0.9, 0.5);
  } else {
    // ЛЕДЯНОЙ войд (по умолчанию)
    baseSky = vec3(0.01, 0.02, 0.04);
    upColor = vec3(0.02, 0.05, 0.1);
    nebulaColor1 = vec3(0.02, 0.08, 0.15);
    nebulaColor2 = vec3(0.0, 0.05, 0.1);
    starColor1 = vec3(0.3, 0.5, 0.8);
    starColor2 = vec3(0.6, 0.8, 1.0);
  }
  
  vec3 skyColor = baseSky;
  
  // Градиент вверх - немного светлее
  float upGrad = max(0.0, rd.y);
  skyColor += upColor * upGrad * 0.5;
  
  // Градиент вниз - бездна
  float downGrad = max(0.0, -rd.y);
  skyColor = mix(skyColor, baseSky * 0.3, downGrad);
  
  // === ЗВЁЗДЫ/ЧАСТИЦЫ ТЬМЫ ===
  vec3 starDir = normalize(rd);
  
  for (float i = 0.0; i < 50.0; i++) {
    vec3 starPos = normalize(vec3(
      sin(i * 73.1) * cos(i * 127.3),
      sin(i * 91.7) * cos(i * 173.1),
      cos(i * 47.3) * sin(i * 311.7)
    ));
    
    float starDist = length(starDir - starPos);
    float starSize = 0.01 + fract(sin(i * 37.7) * 100.0) * 0.02;
    float twinkle = sin(time * 2.0 + i * 1.7) * 0.5 + 0.5;
    float star = smoothstep(starSize, 0.0, starDist) * twinkle;
    
    vec3 starColor = mix(starColor1, starColor2, fract(i * 0.37));
    skyColor += starColor * star * 0.3;
  }
  
  // === ТУМАННОСТИ ===
  float nebula1 = sin(rd.x * 3.0 + rd.z * 2.0 + time * 0.1) * 
                  cos(rd.y * 4.0 + rd.x * 1.5);
  nebula1 = smoothstep(-0.3, 0.5, nebula1);
  skyColor += nebulaColor1 * nebula1 * 0.3;
  
  float nebula2 = cos(rd.x * 2.0 - rd.z * 3.0 + time * 0.05) * 
                  sin(rd.y * 2.5 - rd.x * 2.0);
  nebula2 = smoothstep(-0.2, 0.6, nebula2);
  skyColor += nebulaColor2 * nebula2 * 0.2;
  
  return skyColor;
}

// Старая функция для совместимости (не используется в новом войде)
vec3 renderVoid(vec2 uv, float fallOffset) {
  return vec3(0.0);
}

vec3 renderRain(vec2 uv, vec3 color, float time) {
  // Нормализуем UV для эффектов
  vec2 screenUV = uv;
  
  // === ДОЖДЬ ===
  float rain = 0.0;
  
  // Слой 1 - крупные яркие капли (передний план)
  rain += rainStreak(screenUV, 3.0, 80.0, 1.0) * 0.8;
  rain += rainStreak(screenUV + vec2(0.1, 0.0), 3.5, 90.0, 2.0) * 0.7;
  
  // Слой 2 - средние капли
  rain += rainStreak(screenUV, 2.5, 120.0, 3.0) * 0.5;
  rain += rainStreak(screenUV + vec2(0.05, 0.0), 2.8, 140.0, 4.0) * 0.4;
  
  // Слой 3 - мелкие капли (задний план)
  rain += rainStreak(screenUV, 2.0, 200.0, 5.0) * 0.3;
  
  // Цвет дождя - яркий голубой
  vec3 rainColor = vec3(0.6, 0.8, 1.0);
  color += rainColor * rain;
  
  // === МОЛНИИ ===
  // Несколько независимых молний с разным таймингом
  float bolt1 = lightning(screenUV, time, 0.0);
  float bolt2 = lightning(screenUV, time, 3.7);
  float bolt3 = lightning(screenUV, time, 7.3);
  
  float totalBolt = bolt1 + bolt2 + bolt3;
  
  // Цвет молнии - яркий бело-голубой
  vec3 boltColor = vec3(0.8, 0.9, 1.0);
  color += boltColor * totalBolt;
  
  // Вспышка освещения при ударе молнии
  float flash = max(bolt1, max(bolt2, bolt3));
  color = mix(color, vec3(0.9, 0.95, 1.0), flash * 0.3);
  
  // === ПРЕДУПРЕЖДАЮЩЕЕ СВЕЧЕНИЕ ===
  float warn1 = lightningWarning(screenUV, time, 0.0);
  float warn2 = lightningWarning(screenUV, time, 3.7);
  float warn3 = lightningWarning(screenUV, time, 7.3);
  
  float totalWarning = warn1 + warn2 + warn3;
  
  // Жёлто-белое свечение предупреждения
  vec3 warningColor = vec3(1.0, 0.95, 0.7);
  color += warningColor * totalWarning * 0.4;
  
  // === АТМОСФЕРА ШТОРМА ===
  // Тёмное грозовое небо
  color = mix(color, vec3(0.08, 0.1, 0.15), 0.2);
  
  return color;
}

// === ГЛАВНАЯ (ОПТИМИЗИРОВАННАЯ) ===
void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;
  
  vec3 ro = u_cameraPos;
  
  float cy = cos(u_cameraYaw);
  float sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch);
  float sp = sin(u_cameraPitch);
  
  vec3 forward = vec3(sy * cp, sp, -cy * cp);
  vec3 right = vec3(cy, 0.0, sy);
  vec3 up = cross(right, forward);
  
  vec3 rd = normalize(forward + uv.x * right + uv.y * up);
  
  // === РЕЖИМ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
  if (u_voidMode == 1) {
    // Skybox - вращается с камерой
    vec3 voidSky = renderVoidSky(rd, u_time);
    
    // Рендерим врагов, портал и острова
    float d = MAX_DIST;
    int hitMat = 0;
    vec3 hitPos = ro;
    
    // Ray march
    float marchDist = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * marchDist;
      float minD = MAX_DIST;
      
      // === ОСТРОВА - несколько платформ ===
      // Главный остров под игроком (уменьшен!)
      float mainIsland = length(vec2(p.x, p.z)) - 10.0; // Радиус 10
      float mainHeight = p.y + 0.5; // Толщина острова
      float mainD = max(mainIsland, mainHeight);
      mainD = max(mainD, -(p.y + 2.0)); // Нижняя граница
      if (mainD < minD) {
        minD = mainD;
        hitMat = 100; // ground
      }
      
      // Остров у портала (маленький!)
      vec2 portalIslandPos = u_portalPos.xz;
      float portalIsland = length(p.xz - portalIslandPos) - 5.0; // Радиус 5
      float portalIslandH = p.y + 0.5;
      float portalIslandD = max(portalIsland, portalIslandH);
      portalIslandD = max(portalIslandD, -(p.y + 2.0));
      if (portalIslandD < minD) {
        minD = portalIslandD;
        hitMat = 100;
      }
      
      // Обломки между островами (прыгать!)
      vec2 toPortal = normalize(portalIslandPos);
      float bridgeLen = length(portalIslandPos) - 5.0 - 10.0; // Длина дорожки (портал 5 + главный 10)
      
      // 6-8 обломков разного размера и высоты
      for (int i = 0; i < 8; i++) {
        // Позиция обломка вдоль дорожки (начинаем после главного острова)
        float fragmentPos = 12.0 + float(i) * (bridgeLen / 7.0);
        
        // Случайное смещение в стороны и по высоте
        float randX = sin(float(i) * 73.1) * 2.0;
        float randZ = cos(float(i) * 47.3) * 2.0;
        float randY = sin(float(i) * 91.7) * 0.8 - 0.3; // Разная высота
        
        // Случайный размер (2-4м)
        float fragmentSize = 2.0 + fract(sin(float(i) * 127.3) * 43758.5) * 2.0;
        
        // Позиция обломка
        vec3 fragmentCenter = vec3(
          toPortal.x * fragmentPos + randX,
          randY,
          toPortal.y * fragmentPos + randZ
        );
        
        // Неровная форма - используем смесь бокса и сферы
        vec3 fp = p - fragmentCenter;
        
        // Вращаем каждый обломок по-разному
        float rotAngle = float(i) * 0.7;
        vec3 rotFp = vec3(
          fp.x * cos(rotAngle) - fp.z * sin(rotAngle),
          fp.y,
          fp.x * sin(rotAngle) + fp.z * cos(rotAngle)
        );
        
        // Неровный бокс (разные размеры по осям)
        float sizeX = fragmentSize * (0.8 + fract(sin(float(i) * 31.7) * 100.0) * 0.4);
        float sizeZ = fragmentSize * (0.8 + fract(sin(float(i) * 57.3) * 100.0) * 0.4);
        float fragmentD = max(max(abs(rotFp.x) - sizeX, abs(rotFp.y) - 0.5), abs(rotFp.z) - sizeZ);
        
        if (fragmentD < minD) {
          minD = fragmentD;
          hitMat = 101; // Обломок
        }
      }
      
      // Портал выхода (светящаяся сфера)
      float portalD = length(p - u_portalPos) - 3.0;
      if (portalD < minD) {
        minD = portalD;
        hitMat = 99; // portal
      }
      
      // Враги в войде
      for (int j = 0; j < u_targetCount; j++) {
        if (j >= 16) break;
        vec4 target = u_targets[j];
        if (target.w > 0.5) {
          vec3 tp = p - target.xyz;
          float enemyD = length(tp) - 0.6;
          if (enemyD < minD) {
            minD = enemyD;
            hitMat = 5; // phantom
          }
        }
      }
      
      // === ГЛИТЧ-МОНЕТЫ ===
      for (int c = 0; c < u_bloodCoinCount; c++) {
        if (c >= 12) break;
        vec4 coin = u_bloodCoins[c];
        if (coin.w > 0.5) {
          vec3 coinPos = coin.xyz;
          vec3 cp = p - coinPos;
          
          // Маленький глитч-куб с искажением
          float glitchOffset = sin(u_time * 20.0 + float(c) * 10.0) * 0.05;
          vec3 glitchP = cp + vec3(glitchOffset, 0.0, -glitchOffset);
          
          // Маленький кубик (0.2м)
          float coinD = max(max(abs(glitchP.x), abs(glitchP.y)), abs(glitchP.z)) - 0.15;
          
          // Второй смещённый куб для глитч-эффекта
          vec3 glitchP2 = cp + vec3(-glitchOffset * 0.5, glitchOffset, glitchOffset * 0.3);
          float cube2 = max(max(abs(glitchP2.x), abs(glitchP2.y)), abs(glitchP2.z)) - 0.12;
          coinD = min(coinD, cube2);
          
          if (coinD < minD) {
            minD = coinD;
            hitMat = 102; // glitch coin
          }
          
          // Глитч-аура вокруг монеты (меньше)
          float glow = length(cp) - 0.4;
          if (glow < minD && glow > 0.0) {
            minD = glow;
            hitMat = 103; // glitch glow
          }
        }
      }
      
      marchDist += minD;
      if (minD < SURF_DIST) {
        hitPos = p;
        d = marchDist;
        break;
      }
      if (marchDist > MAX_DIST) break;
    }
    
    vec3 color = voidSky;
    
    // Рендерим то, во что попали
    if (d < MAX_DIST) {
      if (hitMat == 100 || hitMat == 101) {
        // === ОСТРОВА - тёмный камень с фиолетовым свечением ===
        vec3 rockBase = vec3(0.03, 0.02, 0.05);
        
        // Текстура камня
        float noise = sin(hitPos.x * 3.0) * sin(hitPos.z * 3.0) * 0.5 + 0.5;
        noise += sin(hitPos.x * 7.0 + hitPos.z * 5.0) * 0.2;
        
        vec3 rockColor = mix(rockBase, vec3(0.06, 0.03, 0.1), noise);
        
        // Светящиеся трещины (фиолетовые)
        float cracks = sin(hitPos.x * 5.0) * cos(hitPos.z * 4.0);
        cracks = smoothstep(0.7, 0.9, abs(cracks));
        rockColor += vec3(0.2, 0.05, 0.4) * cracks * 0.5;
        
        // Края острова светятся
        float edgeDist = length(hitPos.xz);
        if (hitMat == 100 && edgeDist > 12.0) {
          float edgeGlow = smoothstep(12.0, 15.0, edgeDist);
          rockColor += vec3(0.15, 0.05, 0.3) * edgeGlow;
        }
        
        // Мост немного другой цвет
        if (hitMat == 101) {
          rockColor = mix(rockColor, vec3(0.05, 0.02, 0.08), 0.3);
        }
        
        // Затухание с расстоянием
        float fogDist = d / 100.0;
        rockColor = mix(rockColor, voidSky, smoothstep(0.3, 1.0, fogDist));
        
        color = rockColor;
      } else if (hitMat == 99) {
        // === ПОРТАЛ ВЫХОДА - фиолетовое свечение ===
        float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
        vec3 portalCore = vec3(0.6, 0.2, 1.0) * pulse;
        vec3 portalEdge = vec3(0.3, 0.1, 0.6);
        
        // Fresnel
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 2.0);
        color = mix(portalCore, portalEdge, fresnel);
        
        // Искры
        float spark = sin(u_time * 15.0 + hitPos.y * 8.0 + hitPos.x * 6.0);
        if (spark > 0.85) {
          color += vec3(0.8, 0.5, 1.0) * 0.5;
        }
        
        // Свечение
        color += vec3(0.3, 0.1, 0.5) * (1.0 - fresnel) * 0.6;
      } else if (hitMat == 5) {
        // === ВРАГИ - как фантомы босса ===
        vec3 phantomBlack = vec3(0.01, 0.0, 0.02);
        vec3 phantomGlow = vec3(0.2, 0.05, 0.35);
        
        // Мерцание
        float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + hitPos.x * 5.0);
        vec3 enemyColor = phantomBlack * flicker;
        
        // Фиолетовое свечение по краям
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 3.0);
        color = mix(enemyColor, phantomGlow, fresnel * 0.8);
        
        // Тёмные искры
        float spark = sin(u_time * 10.0 + hitPos.y * 15.0);
        if (spark > 0.9) {
          color += vec3(0.3, 0.1, 0.5) * 0.3;
        }
      } else if (hitMat == 102) {
        // === ГЛИТЧ-МОНЕТА ===
        vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
        vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
        
        // Хаотичное мерцание между цветами
        float glitchNoise = fract(sin(dot(hitPos.xy + u_time * 30.0, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 coinColor = mix(glitchCyan, glitchMagenta, step(0.5, glitchNoise));
        
        // Белые вспышки
        if (glitchNoise > 0.85) {
          coinColor = glitchWhite;
        }
        
        // RGB сдвиг
        float rgbShift = sin(u_time * 40.0) * 0.3;
        coinColor.r *= 1.0 + rgbShift;
        coinColor.b *= 1.0 - rgbShift;
        
        // Scanlines
        float scanline = step(0.5, fract(hitPos.y * 30.0 + u_time * 50.0));
        coinColor *= 0.7 + scanline * 0.5;
        
        // Яркий
        coinColor *= 4.0;
        
        color = coinColor;
        
      } else if (hitMat == 103) {
        // === ГЛИТЧ-АУРА ===
        vec3 glitchCyan = vec3(0.0, 0.8, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 0.8);
        
        // Быстрое мерцание
        float flicker = fract(sin(u_time * 50.0 + hitPos.x * 20.0) * 100.0);
        color = mix(glitchCyan, glitchMagenta, step(0.5, flicker)) * 0.8;
        
        // Случайные пиксели
        float noise = fract(sin(dot(hitPos.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
        if (noise > 0.9) {
          color = vec3(1.0) * 2.0;
        }
      }
    }
    
    // Фиолетовая виньетка
    float vig = 1.0 - length(v_uv - 0.5) * 0.5;
    color *= vig;
    
    // Усиливаем фиолетовый
    color.b *= 1.1;
    
    // Тонмаппинг
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(0.9));
    
    fragColor = vec4(color, 1.0);
    return;
  }
  
  float d = rayMarch(ro, rd);
  
  // Фоновый цвет (небо через купол)
  vec3 color = renderSky(rd) * 0.3;
  
  if (d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = getNormal(p);
    
    map(p);
    int mat = materialId;
    
    // === ОСВЕЩЕНИЕ ПО ЭПОХАМ ===
    vec3 ambient;
    vec3 mainLight;
    vec3 accentColor;
    vec3 fogColor;
    
    if (u_era == 1) {
      // ЭПОХА 1: Кислотная - НУАР
      ambient = vec3(0.008, 0.015, 0.008);
      mainLight = vec3(0.08, 0.2, 0.08);
      accentColor = vec3(0.4, 1.0, 0.2);
      fogColor = vec3(0.005, 0.015, 0.005);
    } else if (u_era == 2) {
      // ЭПОХА 2: Чёрная дыра - ГЛУБОКИЙ НУАР
      ambient = vec3(0.008, 0.005, 0.015);
      mainLight = vec3(0.1, 0.06, 0.18);
      accentColor = vec3(0.7, 0.15, 1.0);
      fogColor = vec3(0.005, 0.002, 0.01);
    } else {
      // ЭПОХА 3: Космическая - ХОЛОДНЫЙ НУАР
      ambient = vec3(0.01, 0.015, 0.025);
      mainLight = vec3(0.08, 0.15, 0.25);
      accentColor = vec3(0.15, 0.7, 1.0);
      fogColor = vec3(0.003, 0.006, 0.015);
    }
    
    // === НУАРНОЕ ОСВЕЩЕНИЕ С ТЕНЯМИ ===
    
    // Ambient Occlusion
    float ao = calcAO(p, n);
    
    // Основной свет (прожектор сверху, вращается)
    float sunAngle = u_time * 0.15;
    vec3 sunDir = normalize(vec3(sin(sunAngle) * 0.4, 0.8, cos(sunAngle) * 0.3));
    float mainDot = max(dot(n, sunDir), 0.0);
    
    // ТЕНЬ от основного света
    float mainShadow = softShadow(p + n * 0.02, sunDir, 0.1, 20.0, 8.0);
    mainDot *= mainShadow;
    
    // Мерцание факела
    float flicker1 = sin(u_time * 15.0) * 0.2;
    float flicker2 = sin(u_time * 23.0 + 1.0) * 0.15;
    float flicker3 = sin(u_time * 31.0 + 2.0) * 0.1;
    float torchFlicker = 1.0 + flicker1 + flicker2 + flicker3;
    
    // Центральный факел
    vec3 torchPos = vec3(0.0, 6.0, 0.0);
    vec3 toTorch = torchPos - p;
    float torchDist = length(toTorch);
    vec3 torchDir = normalize(toTorch);
    float atten = 40.0 / (1.0 + torchDist * 0.05 + torchDist * torchDist * 0.008);
    vec3 torchColor = mix(accentColor, vec3(1.0, 0.5, 0.1), 0.4);
    
    // ТЕНЬ от факела
    float torchShadow = softShadow(p + n * 0.02, torchDir, 0.1, torchDist, 6.0);
    vec3 torchLight = torchColor * max(dot(n, torchDir), 0.0) * atten * torchFlicker * torchShadow;
    
    // Орбитальные огни (без теней - оптимизация)
    vec3 orbitalLight = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float orbitAngle = u_time * 0.4 + float(i) * 1.57;
      float orbitRadius = 14.0 + sin(u_time * 0.3 + float(i)) * 3.0;
      float orbitHeight = 5.0 + sin(u_time * 0.5 + float(i) * 0.5) * 2.0;
      
      vec3 orbPos = vec3(cos(orbitAngle) * orbitRadius, orbitHeight, sin(orbitAngle) * orbitRadius);
      vec3 toOrb = orbPos - p;
      float orbDist = length(toOrb);
      vec3 orbDir = normalize(toOrb);
      float orbAtten = 30.0 / (1.0 + orbDist * 0.06 + orbDist * orbDist * 0.01);
      
      vec3 orbColor = accentColor;
      if (i == 1) orbColor = vec3(1.0, 0.4, 0.0);
      if (i == 2) orbColor = vec3(0.0, 0.8, 0.6);
      if (i == 3) orbColor = vec3(1.0, 0.1, 0.4);
      
      float orbFlicker = 0.7 + 0.3 * sin(u_time * 18.0 + float(i) * 4.0);
      
      // Без теней для производительности
      orbitalLight += orbColor * max(dot(n, orbDir), 0.0) * orbAtten * orbFlicker;
    }
    
    // Подсветка бассейна (слабее, нуарнее)
    float distFromCenter = length(p.xz);
    float poolPulse = 0.5 + 0.5 * sin(u_time * 1.5 - distFromCenter * 0.3);
    float poolInfluence = 1.0 - smoothstep(0.0, 10.0, distFromCenter);
    vec3 poolLight = accentColor * poolInfluence * 2.0 * poolPulse;
    
    // Применяем AO
    ambient *= ao;
    torchLight *= (0.5 + 0.5 * ao);
    
    // Добавляем орбитальный свет
    torchLight += orbitalLight * 0.6;
    
    // === МАТЕРИАЛЫ (упрощённые) ===
    if (mat == 1) {
      // === ВОДА (простая) ===
      vec3 waterColor = vec3(0.2, 0.55, 0.7);
      waterColor += poolLight;
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(waterColor, vec3(0.5, 0.8, 0.9), fresnel * 0.3);
      
    } else if (mat == 4) {
      // === БЕЙНЛИНГИ (зелёная кислотная жижа) ===
      vec3 acidGreen = vec3(0.2, 0.9, 0.1);
      vec3 darkGreen = vec3(0.0, 0.4, 0.0);
      
      float pulse = 0.7 + 0.3 * sin(u_time * 4.0 + p.x * 2.0);
      float pulse2 = 0.8 + 0.2 * sin(u_time * 6.0 + p.z * 3.0);
      float glow = 0.5 + 0.5 * sin(u_time * 3.0);
      
      color = mix(darkGreen, acidGreen, pulse * pulse2);
      color += vec3(0.3, 1.0, 0.2) * glow * 0.5;
      color *= 1.5;
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color = mix(color, vec3(0.5, 1.0, 0.3), fresnel * 0.4);
      
    } else if (mat == 5) {
      // === ФАНТОМ (чёрный шар с тёмной энергией) ===
      vec3 voidBlack = vec3(0.02, 0.02, 0.05);
      vec3 darkPurple = vec3(0.1, 0.0, 0.15);
      
      float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + p.x * 5.0);
      float flicker2 = 0.7 + 0.3 * sin(u_time * 15.0 + p.z * 4.0);
      
      color = mix(voidBlack, darkPurple, flicker * flicker2 * 0.3);
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      vec3 edgeGlow = vec3(0.3, 0.0, 0.5) * fresnel * 0.8;
      color += edgeGlow;
      
      float spark = sin(u_time * 20.0 + p.y * 10.0) * sin(u_time * 18.0 + p.x * 8.0);
      if (spark > 0.9) {
        color += vec3(0.5, 0.2, 0.8) * 0.5;
      }
      color *= 0.6;
      
    } else if (mat == 6) {
      // === RUNNER (оранжевый, огненный) ===
      vec3 orange = vec3(1.0, 0.5, 0.0);
      vec3 yellow = vec3(1.0, 0.9, 0.2);
      vec3 red = vec3(1.0, 0.2, 0.0);
      
      // Быстрое мерцание как пламя
      float flame = 0.5 + 0.5 * sin(u_time * 20.0 + p.x * 8.0);
      float flame2 = 0.6 + 0.4 * sin(u_time * 25.0 + p.z * 10.0);
      
      color = mix(red, orange, flame);
      color = mix(color, yellow, flame2 * 0.4);
      color *= 1.8; // Яркий!
      
      // Свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(1.0, 0.8, 0.3) * fresnel * 0.6;
      
    } else if (mat == 7) {
      // === HOPPER (синий, электрический) ===
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      vec3 blue = vec3(0.1, 0.3, 1.0);
      vec3 white = vec3(0.9, 0.95, 1.0);
      
      // Электрические разряды
      float spark1 = sin(u_time * 30.0 + p.y * 15.0);
      float spark2 = sin(u_time * 35.0 + p.x * 12.0);
      float electric = spark1 * spark2;
      
      color = mix(blue, cyan, 0.5 + 0.5 * sin(u_time * 8.0));
      
      // Яркие вспышки
      if (electric > 0.8) {
        color = mix(color, white, 0.7);
      }
      color *= 1.5;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += vec3(0.3, 0.6, 1.0) * fresnel * 0.8;
      
    } else if (mat == 10) {
      // === ЗЕЛЁНЫЙ БОСС (огромная токсичная жижа) ===
      vec3 toxicGreen = vec3(0.1, 0.9, 0.2);
      vec3 darkGreen = vec3(0.0, 0.4, 0.1);
      vec3 yellow = vec3(0.8, 1.0, 0.0);
      
      // Пульсирующее ядовитое свечение
      float pulse = 0.6 + 0.4 * sin(u_time * 3.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри на поверхности
      float bubbles = sin(p.x * 6.0 + u_time * 4.0) * sin(p.z * 6.0 + u_time * 3.0);
      if (bubbles > 0.7) {
        color = mix(color, yellow, 0.5);
      }
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += toxicGreen * fresnel * 1.5;
      color *= 2.0; // Очень яркий!
      
    } else if (mat == 11) {
      // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
      vec3 voidBlack = vec3(0.02, 0.0, 0.05);
      vec3 purple = vec3(0.4, 0.0, 0.6);
      vec3 darkPurple = vec3(0.15, 0.0, 0.25);
      
      // Почти чёрный с пурпурным мерцанием
      float darkPulse = sin(u_time * 2.0 + p.y * 3.0) * 0.5 + 0.5;
      color = mix(voidBlack, darkPurple, darkPulse * 0.3);
      
      // Искривление видно как переливы
      float distortion = sin(u_time * 5.0 + p.x * 8.0) * sin(u_time * 4.0 + p.z * 8.0);
      if (distortion > 0.6) {
        color += purple * 0.3;
      }
      
      // Жуткое свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 4.0);
      color += purple * fresnel * 2.0;
      
      // Звёзды внутри (как чёрная дыра)
      float stars = sin(p.x * 30.0) * sin(p.y * 30.0) * sin(p.z * 30.0);
      if (stars > 0.95) {
        color += vec3(1.0, 1.0, 1.0) * 0.5;
      }
      
    } else if (mat == 12) {
      // === СИНИЙ БОСС (телепортирующийся) ===
      vec3 electricBlue = vec3(0.0, 0.5, 1.0);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 white = vec3(1.0, 1.0, 1.0);
      
      // Мерцание (телепорт эффект)
      float flicker = abs(sin(u_time * 25.0));
      color = mix(electricBlue, cyan, flicker);
      
      // Разряды
      float spark = sin(u_time * 50.0 + p.x * 20.0) * sin(u_time * 45.0 + p.y * 20.0);
      if (spark > 0.85) {
        color = white;
      }
      
      // Призрачность
      float ghost = sin(u_time * 8.0) * 0.3 + 0.7;
      color *= ghost;
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += cyan * fresnel * 1.5;
      color *= 1.8;
      
    } else if (mat == 13) {
      // === ТОКСИЧНАЯ ЛУЖА ===
      vec3 toxicGreen = vec3(0.2, 1.0, 0.3);
      vec3 darkGreen = vec3(0.0, 0.3, 0.1);
      
      // Пульсирующий эффект
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + p.x * 2.0 + p.z * 2.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри
      float bubbles = sin(p.x * 10.0 + u_time * 5.0) * sin(p.z * 10.0 + u_time * 4.0);
      if (bubbles > 0.7) {
        color += vec3(0.3, 0.5, 0.1);
      }
      
      // Яркое свечение
      color *= 2.0;
      
    } else if (mat == 14) {
      // === АПТЕЧКА ===
      // Красный крест с белым свечением
      vec3 healthRed = vec3(1.0, 0.2, 0.2);
      vec3 healthWhite = vec3(1.0, 0.9, 0.9);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 5.0);
      color = mix(healthRed, healthWhite, pulse * 0.3);
      
      // Яркое свечение
      color *= 2.5;
      
    } else if (mat == 15) {
      // === СТИМПАК ===
      // Жёлто-оранжевый энергетический шар
      vec3 stimYellow = vec3(1.0, 0.8, 0.2);
      vec3 stimOrange = vec3(1.0, 0.5, 0.1);
      
      // Быстрая пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 8.0);
      color = mix(stimOrange, stimYellow, pulse);
      
      // Электрические искры
      float spark = fract(sin(dot(p.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 1.0, 0.5);
      }
      
      // Яркое свечение
      color *= 2.5;
      
    } else if (mat == 16) {
      // === БАЛКОН ===
      vec3 balconyColor = vec3(0.3, 0.25, 0.4); // Тёмно-фиолетовый
      
      // Светящиеся линии
      float gridX = step(0.9, fract(p.x * 2.0));
      float gridZ = step(0.9, fract(p.z * 2.0));
      float grid = max(gridX, gridZ);
      
      color = mix(balconyColor, accentColor, grid * 0.5);
      color += accentColor * 0.1; // Лёгкое свечение
      
    } else if (mat == 17) {
      // === ЗАРЯД КАТАНЫ (энергетическая сфера) ===
      vec3 chargeColor1 = vec3(0.0, 0.8, 1.0); // Бирюзовый
      vec3 chargeColor2 = vec3(0.0, 1.0, 1.0); // Циан
      vec3 chargeColor3 = vec3(0.5, 0.8, 1.0); // Светло-голубой
      
      // Интенсивная пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 6.0);
      float pulse2 = 0.5 + 0.5 * sin(u_time * 8.0 + 1.0);
      color = mix(chargeColor1, chargeColor2, pulse);
      color = mix(color, chargeColor3, pulse2 * 0.3);
      
      // Электрические разряды
      float spark = fract(sin(dot(p.xy + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.85) {
        color += vec3(1.0, 1.0, 1.0); // Белые искры
      }
      
      // Вращающиеся кольца энергии
      float ring = sin(atan(p.y, p.x) * 3.0 + u_time * 5.0);
      color += chargeColor2 * max(0.0, ring) * 0.3;
      
      // Очень яркое свечение
      color *= 4.0;
      
    } else if (mat == 18) {
      // === ЧЁРНЫЙ КРИСТАЛЛ СИЛЫ ===
      vec3 crystalBase = vec3(0.05, 0.02, 0.1); // Очень тёмный фиолетовый
      vec3 crystalGlow = vec3(0.3, 0.0, 0.5); // Фиолетовое свечение
      vec3 crystalEdge = vec3(0.8, 0.2, 1.0); // Яркие края
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
      
      // Эффект внутреннего свечения
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);
      
      // Энергетические линии на гранях
      float edge = fract(p.x * 5.0 + p.y * 5.0 + u_time * 2.0);
      edge = smoothstep(0.8, 1.0, edge);
      
      color = crystalBase;
      color += crystalGlow * fresnel * 2.0;
      color += crystalEdge * edge * 0.5;
      color += crystalGlow * pulse * 0.3;
      
      // Искры внутри
      float spark = fract(sin(dot(p.xyz + u_time * 5.0, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 0.5, 1.0); // Розовые искры
      }
      
      // Общее свечение
      color *= 2.5;
      
    } else if (mat == 19) {
      // === СНАРЯД КИСЛОТЫ ===
      vec3 acidCore = vec3(0.2, 1.0, 0.3);
      vec3 acidGlow = vec3(0.5, 1.0, 0.2);
      vec3 acidDark = vec3(0.1, 0.4, 0.1);
      
      float bubble = sin(p.x * 20.0 + u_time * 15.0) * 
                    sin(p.y * 20.0 + u_time * 12.0) * 
                    sin(p.z * 20.0 + u_time * 18.0);
      bubble = bubble * 0.5 + 0.5;
      
      float veins = sin(p.x * 10.0 + p.y * 15.0 + u_time * 5.0);
      veins = smoothstep(0.7, 1.0, veins);
      
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 2.0);
      
      color = mix(acidDark, acidCore, bubble);
      color += acidGlow * veins * 0.5;
      color += acidGlow * fresnel * 2.0;
      
      float drip = sin(u_time * 8.0 + p.y * 10.0);
      color *= 0.8 + 0.2 * drip;
      color *= 3.0;
      
    } else if (mat == 20) {
      // === МЕТКА ДОЖДЯ ===
      float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
      color = mix(vec3(1.0, 0.2, 0.0), vec3(0.3, 1.0, 0.2), pulse);
      color *= 4.0;
      
    } else if (mat == 21) {
      // === ЗОНА ДОЖДЯ НА ЗЕМЛЕ ===
      float pulse = sin(u_time * 5.0) * 0.3 + 0.7;
      color = vec3(0.1, 0.8, 0.2) * pulse * 3.0;
      
    } else if (mat == 22) {
      // === СТРУИ КИСЛОТНОГО ДОЖДЯ ===
      float flicker = sin(u_time * 20.0 + p.y * 5.0) * 0.3 + 0.7;
      color = vec3(0.2, 1.0, 0.3) * flicker * 2.0;
      
    } else if (mat == 23) {
      // === РАМКА ПОРТАЛА (обсидиан с руническим свечением) ===
      vec3 obsidian = vec3(0.02, 0.02, 0.03); // Глубокий чёрный
      vec3 obsidianHighlight = vec3(0.08, 0.06, 0.1); // Лёгкий фиолетовый отлив
      
      // Гладкая полированная поверхность
      float polish = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(obsidian, obsidianHighlight, polish * 0.3);
      
      // Руны вдоль рамки (светящиеся символы)
      float runeY = sin(p.y * 3.0) * sin(p.z * 3.0 + u_time * 0.5);
      float runePattern = smoothstep(0.6, 0.8, abs(runeY));
      vec3 runeGlow = vec3(1.0, 0.5, 0.1); // Оранжевое свечение
      color += runeGlow * runePattern * 0.4;
      
      // Отблеск огня изнутри
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float innerGlow = 1.0 - min(1.0, abs(p.z) / 2.0);
      float pulse = sin(u_time * 3.0) * 0.2 + 0.8;
      color += fireGlow * innerGlow * pulse * 0.3;
      
      // Металлический блеск
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 30.0);
      color += vec3(1.0, 0.8, 0.6) * specular * 0.2;
      
    } else if (mat == 24) {
      // === ОГНЕННЫЙ ШАР ПОРТАЛА ===
      // Базовые цвета огня
      vec3 fireCore = vec3(1.0, 1.0, 0.8);    // Белое ядро
      vec3 fireYellow = vec3(1.0, 0.9, 0.3);  // Жёлтый
      vec3 fireOrange = vec3(1.0, 0.5, 0.1);  // Оранжевый
      vec3 fireRed = vec3(1.0, 0.2, 0.05);    // Красный
      vec3 fireDark = vec3(0.5, 0.1, 0.0);    // Тёмно-красный
      
      // Расстояние от центра шара
      float dist = length(p - vec3(sign(p.x) * 22.0, 2.0, 0.0));
      float normalDist = dist / 1.2; // 0 в центре, 1 на краю
      
      // Анимированные волны огня
      float flame1 = sin(p.y * 5.0 + p.z * 3.0 - u_time * 8.0) * 0.5 + 0.5;
      float flame2 = sin(p.y * 7.0 - p.z * 4.0 + u_time * 6.0) * 0.5 + 0.5;
      float flame3 = cos(p.y * 4.0 + p.z * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Градиент от центра к краям
      color = mix(fireCore, fireYellow, normalDist * 0.5);
      color = mix(color, fireOrange, normalDist * 0.8);
      color = mix(color, fireRed, normalDist);
      
      // Добавляем анимацию пламени
      color = mix(color, fireYellow, flames * (1.0 - normalDist) * 0.5);
      
      // Пульсация яркости
      float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
      float pulse2 = 0.9 + 0.1 * sin(u_time * 15.0 + p.y * 10.0);
      color *= pulse * pulse2;
      
      // Яркость (умеренная)
      color *= 2.5;
      
      // Искры (яркие точки)
      float spark = sin(p.x * 30.0 + u_time * 20.0) * sin(p.y * 25.0 - u_time * 15.0) * sin(p.z * 28.0 + u_time * 18.0);
      if (spark > 0.88) {
        color += vec3(1.0, 0.9, 0.5) * 1.5;
      }
      
    } else if (mat == 25) {
      // === ПОСТАМЕНТ ПОРТАЛА (каменные ступени) ===
      vec3 stoneLight = vec3(0.18, 0.15, 0.12); // Светлый камень
      vec3 stoneMid = vec3(0.12, 0.10, 0.08);   // Средний тон
      vec3 stoneDark = vec3(0.06, 0.05, 0.04);  // Тёмный камень
      
      // Текстура камня - слои и трещины
      float noise1 = sin(p.x * 8.0) * sin(p.y * 12.0) * sin(p.z * 8.0);
      float noise2 = sin(p.x * 20.0 + p.z * 15.0) * 0.3;
      float noise3 = cos(p.y * 25.0 + p.x * 10.0) * 0.2;
      float stoneTexture = noise1 * 0.15 + noise2 * 0.1 + noise3 * 0.1;
      
      // Базовый цвет с текстурой
      color = mix(stoneDark, stoneMid, 0.5 + stoneTexture);
      
      // Светлые грани (верхние поверхности)
      if (n.y > 0.5) {
        color = mix(color, stoneLight, 0.4);
      }
      
      // Тёмные грани (боковые и нижние)
      if (n.y < -0.3) {
        color = mix(color, stoneDark, 0.5);
      }
      
      // Отблеск огня от портала
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float glowIntensity = sin(u_time * 3.0) * 0.15 + 0.25;
      float distToCenter = abs(p.z) / 3.0; // Ближе к центру - ярче
      float fireInfluence = max(0.0, 1.0 - distToCenter) * glowIntensity;
      color += fireGlow * fireInfluence * 0.3;
      
      // Патина/мох в углублениях
      float moss = sin(p.x * 30.0) * sin(p.z * 30.0);
      if (moss > 0.7 && n.y > 0.3) {
        color = mix(color, vec3(0.05, 0.12, 0.05), 0.2); // Зеленоватый оттенок
      }
      
      // Блики на гранях
      float edgeHighlight = pow(max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5)))), 8.0);
      color += vec3(0.15, 0.12, 0.1) * edgeHighlight * 0.3;
      
    } else if (mat == 26) {
      // === ТЕЛО СПАЙКЕРА (органическая кожа с прожилками) ===
      vec3 skinBase = vec3(0.4, 0.15, 0.1);      // Тёмно-красная кожа
      vec3 skinLight = vec3(0.7, 0.25, 0.15);    // Светлые участки
      vec3 veinColor = vec3(0.2, 0.0, 0.05);     // Тёмные прожилки
      vec3 glowColor = vec3(1.0, 0.3, 0.1);      // Внутреннее свечение
      
      // Базовая текстура кожи - неровности
      float skinNoise = sin(p.x * 20.0 + u_time * 0.5) 
                      * sin(p.y * 18.0 + u_time * 0.3) 
                      * sin(p.z * 22.0 + u_time * 0.4);
      
      // Прожилки - сеть линий
      float veins = sin(p.x * 8.0 + p.y * 5.0) * sin(p.z * 7.0 + p.y * 3.0);
      veins = smoothstep(0.6, 0.9, abs(veins));
      
      // Пульсирующие "вены" под кожей
      float veinPulse = sin(u_time * 3.0 + length(p) * 5.0) * 0.5 + 0.5;
      
      // Собираем цвет
      color = mix(skinBase, skinLight, skinNoise * 0.3 + 0.3);
      color = mix(color, veinColor, veins * 0.4);
      
      // Внутреннее свечение (как будто внутри огонь)
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += glowColor * innerGlow * veinPulse * 0.5;
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 4.0);
      color *= pulse;
      
      // Шипы по краям темнее
      float distFromCenter = length(p.xz);
      if (distFromCenter > 0.5) {
        color = mix(color, veinColor, 0.3);
      }
      
      // Подсветка
      color *= 1.4;
      
      // Fresnel - красноватый отблеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowColor * fresnel * 0.4;
      
    } else if (mat == 27) {
      // === ЛАЗЕР СПАЙКЕРА ===
      vec3 laserCore = vec3(1.0, 1.0, 1.0);   // Яркое белое ядро
      vec3 laserRed = vec3(1.0, 0.1, 0.0);    // Красный
      vec3 laserOrange = vec3(1.0, 0.4, 0.0); // Оранжевый
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 30.0 + p.x * 20.0 + p.y * 25.0);
      
      // Электрические разряды вдоль луча
      float spark = sin(u_time * 50.0 + length(p) * 30.0);
      
      // Ядро белое, края красно-оранжевые
      color = mix(laserCore, laserRed, 0.3);
      if (spark > 0.7) {
        color = mix(color, laserCore, 0.5); // Яркие вспышки
      }
      
      color *= pulse;
      color *= 5.0; // Очень ярко!
      
      // Fresnel свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += laserOrange * fresnel * 2.0;
      
    } else if (mat == 28) {
      // === ЗРАЧОК СПАЙКЕРА (чёрный с красным свечением) ===
      vec3 pupilBlack = vec3(0.0, 0.0, 0.0);
      vec3 glowRed = vec3(1.0, 0.0, 0.0);
      
      color = pupilBlack;
      
      // Красное свечение изнутри
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color += glowRed * innerGlow * 2.0;
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0);
      color += glowRed * pulse * 0.3;
      
    } else if (mat == 29) {
      // === РАДУЖКА СПАЙКЕРА (красно-оранжевая, огненная) ===
      vec3 irisRed = vec3(0.9, 0.1, 0.0);
      vec3 irisOrange = vec3(1.0, 0.5, 0.0);
      vec3 irisYellow = vec3(1.0, 0.8, 0.2);
      
      // Радиальные полосы как в настоящем глазе
      float angle = atan(p.y, p.x);
      float radialPattern = sin(angle * 12.0 + u_time * 2.0) * 0.5 + 0.5;
      
      // Пульсирующие кольца
      float rings = sin(length(p) * 30.0 - u_time * 5.0) * 0.5 + 0.5;
      
      color = mix(irisRed, irisOrange, radialPattern);
      color = mix(color, irisYellow, rings * 0.3);
      
      // Огненное свечение
      color *= 2.0;
      
      // Блик
      float highlight = pow(max(0.0, dot(-rd, n)), 20.0);
      color += vec3(1.0, 0.9, 0.8) * highlight * 0.5;
      
    } else if (mat == 32) {
      // === КАМЕНЬ АЛТАРЯ ===
      vec3 stoneBase = vec3(0.2, 0.18, 0.15);     // Тёмный камень
      vec3 stoneLight = vec3(0.35, 0.3, 0.25);    // Светлые участки
      vec3 mossColor = vec3(0.1, 0.2, 0.1);       // Мох
      
      // Текстура камня
      float stoneNoise = sin(p.x * 10.0) * sin(p.y * 8.0) * sin(p.z * 12.0);
      
      color = mix(stoneBase, stoneLight, stoneNoise * 0.3 + 0.3);
      
      // Немного мха внизу
      float mossAmount = smoothstep(1.0, 0.0, p.y) * 0.3;
      color = mix(color, mossColor, mossAmount);
      
      // Резьба/узоры
      float carving = sin(p.y * 20.0) * sin(atan(p.x, p.z) * 8.0);
      color *= 0.9 + carving * 0.1;
      
      // Освещение
      float light = max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5))));
      color *= 0.6 + light * 0.6;
      
    } else if (mat == 33) {
      // === ОГОНЬ В АЛТАРЕ ===
      vec3 fireWhite = vec3(1.0, 1.0, 0.9);
      vec3 fireOrange = vec3(1.0, 0.6, 0.1);
      vec3 fireRed = vec3(1.0, 0.2, 0.0);
      
      // Динамическое пламя
      float flame = sin(u_time * 15.0 + p.y * 10.0 + p.x * 5.0);
      float flicker = sin(u_time * 20.0 + p.z * 8.0);
      
      // Цвет от центра к краям
      float gradient = smoothstep(0.0, 1.0, p.y);
      color = mix(fireWhite, fireOrange, gradient);
      color = mix(color, fireRed, gradient * 0.5);
      
      // Мерцание
      color *= 0.8 + flame * 0.2 + flicker * 0.1;
      
      // Очень яркий
      color *= 4.0;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += fireOrange * fresnel * 2.0;
      
    } else if (mat == 34) {
      // === СВЕТЯЩИЙСЯ СИМВОЛ АЛТАРЯ ===
      vec3 glowCyan = vec3(0.0, 1.0, 0.8);
      vec3 glowWhite = vec3(1.0, 1.0, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 3.0);
      
      color = mix(glowCyan, glowWhite, 0.3);
      color *= pulse * 3.0;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 1.5;
      
    } else if (mat == 35) {
      // === ЯДРО ЭНЕРГЕТИЧЕСКОГО ЛУЧА (ярко-белое) ===
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 coreBlue = vec3(0.8, 0.9, 1.0);
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 30.0);
      
      // Ярко-белое ядро
      color = mix(coreWhite, coreBlue, 0.1);
      color *= pulse;
      
      // ОЧЕНЬ яркое!
      color *= 8.0;
      
      // Дополнительное свечение от fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += coreWhite * fresnel * 3.0;
      
    } else if (mat == 36) {
      // === ВНЕШНЕЕ СВЕЧЕНИЕ ЛУЧА (голубое) ===
      vec3 glowCyan = vec3(0.3, 0.8, 1.0);
      vec3 glowWhite = vec3(0.9, 0.95, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 25.0 + p.x * 5.0);
      
      color = mix(glowCyan, glowWhite, 0.4);
      color *= pulse * 4.0;
      
      // Fresnel для объёма
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 2.0;
      
    } else if (mat == 37) {
      // === СЛЕД ЛУЧА (затухающий) ===
      vec3 trailCyan = vec3(0.2, 0.6, 1.0);
      vec3 trailPurple = vec3(0.5, 0.2, 1.0);
      
      // Мерцание
      float flicker = sin(u_time * 40.0 + p.y * 10.0 + p.x * 15.0);
      
      // Цвет меняется по следу
      color = mix(trailCyan, trailPurple, 0.3 + flicker * 0.2);
      
      // Яркость
      color *= 2.5;
      
      // Искры
      if (flicker > 0.8) {
        color += vec3(1.0) * 1.5;
      }
      
    } else if (mat == 38) {
      // === ПОРТАЛ В ВОЙД - ЭНЕРГЕТИЧЕСКИЙ ЛУЧ ИЗ ЧАСТИЦ ===
      
      // Расстояние от центральной оси луча
      float distFromAxis = length(p.xz);
      float normalizedDist = distFromAxis / 1.5;
      
      // Частицы поднимающиеся вверх
      float particleY = fract(p.y * 0.5 - u_time * 2.0);
      float particlePhase = fract(sin(floor(p.y * 0.5 - u_time * 2.0) * 127.1) * 43758.5);
      
      // Спиральные частицы
      float angle = atan(p.z, p.x);
      float spiralParticle = sin(angle * 8.0 + p.y * 2.0 - u_time * 5.0);
      spiralParticle = smoothstep(0.7, 1.0, spiralParticle);
      
      // Вертикальные лучи света
      float rays = sin(angle * 12.0) * 0.5 + 0.5;
      rays = pow(rays, 3.0);
      
      // Базовый цвет - полупрозрачный фиолетовый
      vec3 voidCore = vec3(0.6, 0.3, 1.0);
      vec3 voidEdge = vec3(0.2, 0.0, 0.4);
      vec3 particleColor = vec3(1.0, 0.8, 1.0);
      
      // Прозрачность увеличивается к краям
      float alpha = 1.0 - normalizedDist;
      alpha = pow(alpha, 0.5);
      
      color = mix(voidEdge, voidCore, alpha);
      
      // Добавляем частицы
      color += particleColor * spiralParticle * 0.8;
      color += particleColor * rays * 0.3 * alpha;
      
      // Вертикальные струи энергии
      float stream = sin(p.y * 8.0 - u_time * 10.0) * 0.5 + 0.5;
      stream *= sin(angle * 6.0 + u_time * 3.0) * 0.5 + 0.5;
      color += vec3(0.8, 0.5, 1.0) * stream * 0.4;
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 4.0);
      color *= pulse;
      
      // Яркость (умеренная)
      color *= 2.0 * alpha;
      
    } else if (mat == 39) {
      // === СВЕЧЕНИЕ ПОРТАЛА (фиолетовое) ===
      vec3 glowPurple = vec3(0.6, 0.2, 1.0);
      vec3 glowPink = vec3(1.0, 0.4, 0.8);
      
      // Пульсация
      float pulse = 0.6 + 0.4 * sin(u_time * 5.0 + p.y * 2.0);
      
      // Вращение
      float angle = atan(p.z, p.x);
      float spin = sin(angle * 8.0 - u_time * 3.0) * 0.5 + 0.5;
      
      color = mix(glowPurple, glowPink, spin * 0.5);
      color *= pulse * 2.5;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += glowPurple * fresnel * 1.5;
      
    } else if (mat == 40) {
      // === ЭНЕРГЕТИЧЕСКИЕ КОЛЬЦА ПОРТАЛА ===
      vec3 ringPurple = vec3(0.8, 0.3, 1.0);
      vec3 ringWhite = vec3(1.0, 0.9, 1.0);
      
      // Быстрая пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 15.0 + p.y * 5.0);
      
      color = mix(ringPurple, ringWhite, 0.3);
      color *= pulse * 4.0;
      
      // Искры
      float sparkle = sin(u_time * 30.0 + p.x * 10.0 + p.z * 12.0);
      if (sparkle > 0.85) {
        color += vec3(1.0) * 2.0;
      }
      
    } else if (mat == 41) {
      // === ГРАНАТА (обычная, зелёная) ===
      vec3 grenadeGreen = vec3(0.2, 0.5, 0.2);
      vec3 grenadeBlack = vec3(0.1, 0.1, 0.1);
      
      // Полоски на гранате
      float stripes = sin(p.y * 20.0);
      color = mix(grenadeGreen, grenadeBlack, stripes * 0.3 + 0.35);
      
      // Металлический блеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(0.4, 0.5, 0.4) * fresnel * 0.5;
      
    } else if (mat == 42) {
      // === ГРАНАТА (мигает перед взрывом) ===
      vec3 grenadeRed = vec3(1.0, 0.2, 0.1);
      vec3 grenadeYellow = vec3(1.0, 0.8, 0.2);
      
      // Быстрое мигание
      float blink = sin(u_time * 30.0) * 0.5 + 0.5;
      color = mix(grenadeRed, grenadeYellow, blink);
      
      // Яркое свечение
      color *= 3.0;
      
    } else if (mat == 43) {
      // === ВЗРЫВ (GLITCH ЭФФЕКТ) ===
      // Базовые цвета глитча
      vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
      vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
      vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
      vec3 glitchBlack = vec3(0.0, 0.0, 0.0);
      
      // Хаотичный шум для глитча
      float glitchNoise = fract(sin(dot(p.xy + u_time * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
      float blockNoise = floor(glitchNoise * 8.0) / 8.0;
      
      // Горизонтальные полосы сбоя
      float scanline = step(0.5, fract(p.y * 20.0 + u_time * 100.0));
      
      // RGB сдвиг
      float rgbShift = sin(u_time * 30.0 + p.y * 5.0) * 0.5;
      
      // Основной цвет - мерцание между циан и маджента
      color = mix(glitchCyan, glitchMagenta, blockNoise);
      
      // Добавляем белые вспышки
      if (glitchNoise > 0.8) {
        color = glitchWhite;
      }
      
      // Чёрные провалы
      if (glitchNoise < 0.15) {
        color = glitchBlack;
      }
      
      // Scanlines
      color *= 0.8 + scanline * 0.4;
      
      // RGB смещение
      color.r *= 1.0 + rgbShift * 0.3;
      color.b *= 1.0 - rgbShift * 0.3;
      
      // Очень яркий
      color *= 4.0;
      
      // Случайные яркие пиксели
      if (fract(sin(dot(floor(p.xz * 10.0), vec2(41.1, 67.3)) + u_time * 20.0) * 1000.0) > 0.95) {
        color = glitchWhite * 8.0;
      }
      
    } else if (mat == 44) {
      // === ГЛУБИНА ЖИЛЫ/ВОЙДА (тёмная бездна) ===
      vec3 voidDeep = vec3(0.02, 0.03, 0.05);
      vec3 voidGlow = vec3(0.08, 0.15, 0.2);
      
      // Глубинное затемнение
      float depth = abs(p.y + 5.0) / 10.0;
      color = mix(voidGlow, voidDeep, depth);
      
      // Еле заметные течения
      float flow = sin(p.x * 1.5 + u_time * 0.3) * sin(p.z * 1.5 + u_time * 0.2);
      color += vec3(0.03, 0.06, 0.08) * flow * 0.5;
      
      // Очень редкие блики
      float flash = fract(sin(dot(floor(p.xz * 0.3), vec2(12.9, 78.2)) + u_time * 0.5) * 43758.0);
      if (flash > 0.98) {
        color += vec3(0.1, 0.2, 0.25);
      }
      
    } else if (mat == 45) {
      // === ПОВЕРХНОСТЬ ВОЙДА (прозрачная дымка) ===
      vec3 surfaceCore = vec3(0.1, 0.2, 0.25);
      vec3 surfaceEdge = vec3(0.05, 0.08, 0.12);
      vec3 surfaceHighlight = vec3(0.3, 0.4, 0.5);
      
      // Мягкие волны
      float wave1 = sin(p.x * 2.0 + u_time * 1.0) * sin(p.z * 1.8 + u_time * 0.8);
      float wave2 = sin(p.x * 3.0 - u_time * 0.7) * sin(p.z * 2.5 + u_time * 0.5);
      float waves = (wave1 + wave2) * 0.5;
      
      // Прозрачный цвет
      color = mix(surfaceEdge, surfaceCore, 0.4 + waves * 0.2);
      
      // Редкие блики
      float highlight = pow(max(0.0, waves), 4.0);
      color = mix(color, surfaceHighlight, highlight * 0.3);
      
      // Редкие белые искры
      float glint = fract(sin(dot(p.xz + u_time * 3.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.96) {
        color = mix(color, vec3(0.4, 0.5, 0.6), 0.5);
      }
      
      // Умеренное свечение
      color *= 1.5;
      
    } else if (mat == 46) {
      // === БОРТИК ОБРЫВА ===
      vec3 stoneBase = vec3(0.15, 0.1, 0.2);
      vec3 voidGlow = vec3(0.4, 0.0, 0.8);
      
      // Грубая текстура камня
      float noise = fract(sin(dot(floor(p.xz * 5.0), vec2(12.9, 78.2))) * 43758.0);
      color = mix(stoneBase, stoneBase * 1.5, noise);
      
      // Фиолетовое свечение от реки войда
      float glowStrength = sin(u_time * 3.0) * 0.3 + 0.5;
      color = mix(color, voidGlow, glowStrength * 0.4);
      
      // Блестящие прожилки
      float vein = sin(p.x * 20.0 + p.z * 15.0) * sin(p.y * 30.0);
      if (vein > 0.85) {
        color += vec3(0.3, 0.0, 0.5);
      }
      
    } else if (mat == 47) {
      // === БОРТИК ЖИЛЫ (обветренный камень) ===
      vec3 darkStone = vec3(0.12, 0.11, 0.10);
      vec3 edgeGlow = vec3(0.15, 0.25, 0.3);
      
      // Тёмный обветренный камень
      float stoneNoise = noise(p.xz * 8.0);
      color = darkStone * (0.8 + stoneNoise * 0.4);
      
      // Тонкие прожилки энергии
      float vein1 = sin(p.x * 20.0) * sin(p.z * 18.0);
      if (vein1 > 0.9) {
        color = mix(color, edgeGlow, 0.5);
      }
      
      // Лёгкое голубоватое свечение от жилы
      color += edgeGlow * 0.05;
      
    } else if (mat == 48) {
      // === ПОВЕРХНОСТЬ ЖИЛЫ (прозрачная энергия) ===
      vec3 voidBlue = vec3(0.05, 0.1, 0.2);
      vec3 voidCyan = vec3(0.1, 0.3, 0.4);
      vec3 glitchWhite = vec3(0.5, 0.6, 0.7);
      
      // Мягкое течение
      float flow = sin(p.x * 2.0 + p.z * 2.0 - u_time * 1.5);
      flow = flow * 0.5 + 0.5;
      
      // Прозрачный голубоватый цвет
      color = mix(voidBlue, voidCyan, flow * 0.6);
      
      // Лёгкая пульсация
      float pulse = sin(u_time * 0.8) * 0.2 + 0.8;
      color *= pulse;
      
      // Редкие белые блики
      float glint = fract(sin(dot(p.xz + u_time * 2.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.97) {
        color = mix(color, glitchWhite, 0.4);
      }
      
      // Умеренное свечение
      color *= 1.2;
      
    } else if (mat == 31) {
      // === БОЛЬШАЯ АПТЕЧКА (на краях карты) ===
      vec3 healthWhite = vec3(1.0, 1.0, 1.0);
      vec3 healthGold = vec3(1.0, 0.85, 0.3);
      vec3 healthGreen = vec3(0.3, 1.0, 0.5);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 5.0);
      
      // Градиент от золотого к белому
      float gradient = p.y * 0.5 + 0.5;
      color = mix(healthGold, healthWhite, gradient);
      
      // Зелёный оттенок для "здоровья"
      color = mix(color, healthGreen, 0.2);
      
      // Очень яркое свечение
      color *= pulse * 2.5;
      
      // Fresnel аура
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += healthGold * fresnel * 1.5;
      
      // Искры
      float sparkle = sin(u_time * 20.0 + p.x * 10.0 + p.y * 15.0);
      if (sparkle > 0.9) {
        color += vec3(1.0) * 0.5;
      }
      
    } else if (mat == 30) {
      // === ВОДА В БАССЕЙНЕ ===
      vec3 waterDeep = vec3(0.0, 0.2, 0.4);    // Тёмно-синяя глубина
      vec3 waterMid = vec3(0.1, 0.4, 0.6);     // Средний тон
      vec3 waterShallow = vec3(0.2, 0.6, 0.8); // Светлый на мелководье
      vec3 waterFoam = vec3(0.8, 0.9, 1.0);    // Пена
      
      // Волны на поверхности
      float wave1 = sin(p.x * 3.0 + u_time * 2.0) * sin(p.z * 2.5 + u_time * 1.5);
      float wave2 = sin(p.x * 5.0 - u_time * 3.0) * sin(p.z * 4.0 + u_time * 2.0);
      float waves = (wave1 + wave2) * 0.5;
      
      // Глубина - темнее к центру
      float depth = smoothstep(2.5, 6.0, length(p.xz));
      
      // Базовый цвет
      color = mix(waterDeep, waterShallow, depth);
      color = mix(color, waterMid, waves * 0.3 + 0.5);
      
      // Блики на волнах
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 30.0);
      color += waterFoam * specular * 0.5;
      
      // Рябь
      float ripple = sin(length(p.xz) * 8.0 - u_time * 4.0) * 0.5 + 0.5;
      color += waterFoam * ripple * 0.1;
      
      // Прозрачность/свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color += vec3(0.3, 0.5, 0.7) * fresnel * 0.4;
      
      // Общая яркость
      color *= 1.3;
      
    } else if (mat == 50) {
      // === ТЁМНЫЙ КАМЕНЬ (основание фонтана) - ДЕТАЛИЗИРОВАННЫЙ ===
      vec3 stoneBase = vec3(0.1, 0.09, 0.08);
      vec3 stoneDark = vec3(0.04, 0.035, 0.03);
      vec3 stoneHighlight = vec3(0.15, 0.13, 0.11);
      
      // Многослойная текстура камня
      float baseNoise = fbm(p.xz * 4.0);
      float detailNoise = noise(p.xz * 15.0) * 0.3;
      float microNoise = noise(p.xz * 40.0) * 0.1;
      
      vec3 stone = mix(stoneDark, stoneBase, baseNoise);
      stone += detailNoise * 0.05;
      stone += microNoise * 0.02;
      
      // Грани восьмиугольника с бликами
      float angle = atan(p.z, p.x);
      float edgeFactor = abs(cos(angle * 8.0));
      float edgeHighlight = smoothstep(0.85, 1.0, edgeFactor) * 0.15;
      stone = mix(stone, stoneHighlight, edgeHighlight);
      
      // Трещины в камне
      float crack = sharpNoise(p.xz * 20.0);
      if (crack > 0.9) {
        stone *= 0.6;
      }
      
      color = stone * ambient * 1.5;
      color += stone * mainLight * mainDot * 0.4;
      color += stone * torchLight * 0.8;
      
    } else if (mat == 51) {
      // === МРАМОР (колонна фонтана) - ДЕТАЛИЗИРОВАННЫЙ ===
      vec3 marbleWhite = vec3(0.88, 0.85, 0.82);
      vec3 marbleGray = vec3(0.65, 0.62, 0.58);
      vec3 marbleVein = vec3(0.25, 0.22, 0.2);
      vec3 marbleDeep = vec3(0.15, 0.12, 0.1);
      
      // Основные прожилки (крупные)
      float vein1 = sin(p.x * 12.0 + p.y * 4.0 + fbm(p.xz * 3.0) * 6.0);
      float vein2 = sin(p.z * 10.0 - p.y * 5.0 + fbm(p.xy * 2.5) * 5.0);
      float veins = smoothstep(0.75, 0.95, abs(vein1)) + smoothstep(0.8, 0.98, abs(vein2)) * 0.6;
      
      // Мелкие прожилки (детализация)
      float microVein1 = sin(p.x * 30.0 + p.y * 15.0 + noise(p.xz * 8.0) * 3.0);
      float microVein2 = sin(p.z * 25.0 - p.y * 20.0 + noise(p.xy * 7.0) * 2.5);
      float microVeins = smoothstep(0.85, 0.98, abs(microVein1)) * 0.3;
      microVeins += smoothstep(0.88, 0.99, abs(microVein2)) * 0.2;
      
      // Базовый цвет с вариациями
      vec3 marble = mix(marbleWhite, marbleGray, fbm(p.xz * 1.5) * 0.4);
      
      // Применяем прожилки
      marble = mix(marble, marbleVein, veins * 0.5);
      marble = mix(marble, marbleDeep, microVeins);
      
      // Микро-текстура поверхности
      float surface = fbm(p.xz * 20.0) * 0.03;
      marble += surface;
      
      // Блеск мрамора (полированный)
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 40.0);
      
      color = marble * ambient * 2.0;
      color += marble * mainLight * mainDot * 0.6;
      color += vec3(1.0, 0.98, 0.95) * specular * 0.5;
      color += marble * torchLight * 0.5;
      
    } else if (mat == 52) {
      // === БРОНЗА (декор) ===
      vec3 bronzeBase = vec3(0.55, 0.35, 0.15);
      vec3 bronzeHighlight = vec3(0.8, 0.6, 0.3);
      vec3 bronzePatina = vec3(0.2, 0.4, 0.35);
      
      // Патина в углублениях
      float patina = smoothstep(0.3, 0.7, noise(p.xz * 8.0));
      vec3 bronze = mix(bronzeBase, bronzePatina, patina * 0.3);
      
      // Металлический блеск
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 40.0);
      
      color = bronze * ambient * 1.5;
      color += bronze * mainLight * mainDot * 0.5;
      color += bronzeHighlight * specular * 0.6;
      color += bronze * torchLight * 0.8;
      
    } else if (mat == 53) {
      // === МОЗАИКА (центр арены) ===
      vec3 mosaicDark = vec3(0.1, 0.08, 0.12);
      vec3 mosaicLight = vec3(0.25, 0.22, 0.28);
      vec3 mosaicGold = vec3(0.6, 0.45, 0.1);
      vec3 mosaicCyan = vec3(0.1, 0.4, 0.5);
      
      // Геометрический паттерн
      float angle = atan(p.z, p.x);
      float dist = length(p.xz);
      
      // Лучи из центра
      float rays = sin(angle * 8.0) * 0.5 + 0.5;
      // Концентрические круги
      float rings = sin(dist * 4.0) * 0.5 + 0.5;
      
      // Смешиваем паттерны
      float pattern = rays * rings;
      vec3 mosaic = mix(mosaicDark, mosaicLight, pattern);
      
      // Золотые акценты на пересечениях
      if (pattern > 0.7 && pattern < 0.8) {
        mosaic = mosaicGold;
      }
      // Циановые линии
      if (abs(sin(angle * 16.0)) > 0.95 || abs(sin(dist * 8.0)) > 0.95) {
        mosaic = mix(mosaic, mosaicCyan, 0.5);
      }
      
      color = mosaic * ambient * 2.5;
      color += mosaic * mainLight * mainDot * 0.4;
      color += mosaic * torchLight * 1.0;
      
    } else if (mat == 54) {
      // === ДЕКОРАТИВНОЕ КОЛЬЦО ===
      vec3 ringBase = vec3(0.15, 0.12, 0.1);
      vec3 ringLight = vec3(0.25, 0.2, 0.18);
      vec3 ringGlow = vec3(0.3, 0.15, 0.5);
      
      // Руны по кольцу
      float angle = atan(p.z, p.x);
      float runePattern = sin(angle * 12.0) * sin(length(p.xz) * 3.0);
      
      vec3 ring = mix(ringBase, ringLight, noise(p.xz * 4.0));
      
      // Светящиеся руны
      if (abs(runePattern) > 0.7) {
        ring += ringGlow * (0.5 + 0.5 * sin(u_time * 2.0));
      }
      
      color = ring * ambient * 2.0;
      color += ring * mainLight * mainDot * 0.5;
      color += ring * torchLight * 1.0;
      
    } else if (mat == 55) {
      // === КАМЕННАЯ ПЛИТКА (основной пол) - ДЕТАЛИЗИРОВАННАЯ ===
      vec3 tileBase = vec3(0.22, 0.2, 0.18);
      vec3 tileDark = vec3(0.12, 0.1, 0.09);
      vec3 tileLight = vec3(0.32, 0.28, 0.24);
      
      // Крупная плитка 2x2
      vec2 tileCoord = floor(p.xz * 0.5);
      vec2 tileFract = fract(p.xz * 0.5);
      
      // Случайный оттенок для каждой плитки
      float tileVar = hash(tileCoord);
      vec3 tileColor = mix(tileDark, tileLight, tileVar);
      
      // Чёткие швы между плитками
      float seamWidth = 0.015;
      float seam = step(seamWidth, tileFract.x) * step(seamWidth, tileFract.y);
      seam *= step(seamWidth, 1.0 - tileFract.x) * step(seamWidth, 1.0 - tileFract.y);
      vec3 seamColor = vec3(0.05, 0.04, 0.03);
      tileColor = mix(seamColor, tileColor, seam);
      
      // Микро-текстура камня (высокая частота)
      float microDetail = fbm(p.xz * 25.0) * 0.08;
      tileColor += microDetail;
      
      // Средняя текстура (зернистость)
      float grainDetail = noise(p.xz * 12.0) * 0.05;
      tileColor += grainDetail - 0.025;
      
      // Крупные пятна/потёртости
      float wear = fbm(p.xz * 2.0 + 50.0);
      tileColor = mix(tileColor, tileColor * 0.75, smoothstep(0.55, 0.7, wear));
      
      // Светлые царапины
      float scratch = sharpNoise(p.xz * 40.0);
      if (scratch > 0.92) {
        tileColor += 0.1;
      }
      
      color = tileColor * ambient * 2.0;
      color += tileColor * mainLight * mainDot * 0.5;
      color += tileColor * torchLight * 1.2;
      color += tileColor * poolLight * 0.8;
      
    } else if (mat == 56) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 1 (основной цвет эпохи) ===
      float pulse = 0.8 + 0.2 * sin(u_time * 20.0);
      color = accentColor * 5.0 * pulse;
      // Ореол
      color += accentColor * 2.0;
      
    } else if (mat == 57) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 2 (оранжевый) ===
      vec3 fireOrange = vec3(1.0, 0.5, 0.0);
      float pulse = 0.8 + 0.2 * sin(u_time * 23.0 + 1.0);
      color = fireOrange * 5.0 * pulse;
      color += fireOrange * 2.0;
      
    } else if (mat == 58) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 3 (циан) ===
      vec3 fireCyan = vec3(0.0, 1.0, 0.8);
      float pulse = 0.8 + 0.2 * sin(u_time * 19.0 + 2.0);
      color = fireCyan * 5.0 * pulse;
      color += fireCyan * 2.0;
      
    } else if (mat == 59) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 4 (розовый) ===
      vec3 firePink = vec3(1.0, 0.2, 0.5);
      float pulse = 0.8 + 0.2 * sin(u_time * 17.0 + 3.0);
      color = firePink * 5.0 * pulse;
      color += firePink * 2.0;
      
    } else {
      // === FALLBACK ===
      vec3 baseColor = vec3(0.2, 0.18, 0.15);
      color = baseColor * ambient * 2.0;
      color += baseColor * mainLight * mainDot * 0.5;
      color += baseColor * torchLight * 1.2;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Туман по эпохе
    float fog = 1.0 - exp(-d * 0.02);
    color = mix(color, fogColor, fog * 0.5);
  }
  
  // Кислотный дождь от зелёного босса (всегда когда есть зоны)
  if (u_acidRainZoneCount > 0) {
    color = renderAcidRain(v_uv, color, u_time, u_cameraPos);
  }
  
  // Эффект дождя на волне 15+
  if (u_wave >= 15) {
    color = renderRain(v_uv, color, u_time);
  }
  
  // Атмосферный туман для глубины
  float fogDist = d / MAX_DIST;
  vec3 fogColor = vec3(0.03, 0.05, 0.1);
  color = mix(color, fogColor, fogDist * fogDist * 0.3);
  
  // Мягкий bloom (слабый)
  float brightness = max(max(color.r, color.g), color.b);
  if (brightness > 1.5) {
    vec3 bloomColor = color * (brightness - 1.5) * 0.1;
    color += bloomColor;
  }
  
  // Reinhard тонмаппинг (мягче чем ACES)
  color = color / (color + vec3(1.0));
  
  // Гамма
  color = pow(color, vec3(0.95));
  
  // Лёгкая цветокоррекция
  color = mix(color, color * vec3(0.95, 0.97, 1.05), 0.15);
  
  // Мягкий контраст
  color = (color - 0.5) * 1.05 + 0.5;
  color = max(color, vec3(0.0));
  
  // Насыщение
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, 1.15);
  
  // Виньетка
  float vig = 1.0 - length(v_uv - 0.5) * 0.4;
  color *= vig;
  
  // === ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ ===
  float grain = filmGrain(v_uv * u_resolution, u_time * 60.0);
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float grainStrength = mix(0.05, 0.02, luminance);
  color += grain * grainStrength;
  
  // Лёгкое размытие на краях (имитация AA)
  float edgeDist = max(abs(v_uv.x - 0.5), abs(v_uv.y - 0.5));
  
  // Минимальные глитч-эффекты
  float glitchLine = fract(sin(floor(v_uv.y * 800.0) + u_time * 2.0) * 43758.5);
  if (glitchLine > 0.998) {
    color.rgb = color.gbr;
  }
  
  // Тонкая хроматическая аберрация по углам
  if (edgeDist > 0.42) {
    float aberration = (edgeDist - 0.42) * 0.002;
    color.r *= 1.0 + aberration;
    color.b *= 1.0 - aberration;
  }
  
  fragColor = vec4(color, 1.0);
}
`;
