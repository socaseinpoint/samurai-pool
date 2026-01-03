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
uniform int u_era; // Эпоха: 1=кислотная, 2=чёрная дыра, 3=космическая
uniform vec4 u_pickups[8]; // Пикапы [x, y, z, type] type: 9=health, 10=stimpack, 11=charge
uniform int u_pickupCount;

in vec2 v_uv;
out vec4 fragColor;

// === ОПТИМИЗИРОВАННЫЕ ПАРАМЕТРЫ ===
#define MAX_STEPS 20
#define MAX_DIST 40.0
#define SURF_DIST 0.03
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 28.0
#define DOME_HEIGHT 18.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
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
  
  // === ПОЛ ===
  float floor_d = p.y;
  d = min(d, floor_d);
  
  // === ТОКСИЧНЫЕ ЛУЖИ ===
  for (int i = 0; i < u_poolCount; i++) {
    if (i >= 8) break;
    vec4 pool = u_pools[i];
    if (pool.w > 0.0) { // lifetime > 0
      float distToPool = length(p.xz - pool.xy);
      if (distToPool < pool.z && p.y < 0.15 && p.y > -0.1) {
        // Внутри лужи
        float poolSurface = p.y - 0.08;
        if (poolSurface < d) {
          d = poolSurface;
          materialId = 13; // Токсичная лужа
        }
      }
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
      }
    }
  }
  
  // === КРУГЛЫЕ СТЕНЫ (цилиндр вовнутрь) ===
  float walls = -(length(p.xz) - ARENA_RADIUS);
  d = min(d, walls);
  
  // === КУПОЛ ===
  // Сферический купол над ареной
  float domeRadius = ARENA_RADIUS * 1.3;
  float dome = -(length(vec3(p.x, p.y - 3.0, p.z)) - domeRadius);
  dome = max(dome, p.y - DOME_HEIGHT);
  d = min(d, dome);
  
  // === ЦЕНТРАЛЬНАЯ КОЛОННА (фонтан) ===
  float centerCol = sdCylinder(p - vec3(0.0, 1.5, 0.0), 1.2, 1.5);
  d = min(d, centerCol);
  
  // Чаша фонтана
  float fountain = sdTorus(p - vec3(0.0, 0.3, 0.0), vec2(1.8, 0.25));
  d = min(d, fountain);
  
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
  
  // === ПЛАТФОРМЫ С ЛЕСТНИЦАМИ ===
  // Левая платформа (X от -17 до -23)
  float leftPlat = sdBox(p - vec3(-20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                         vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, leftPlat);
  
  // Лестница к левой платформе (X от -16 до -17, Z в центре)
  float stairsL = sdBox(p - vec3(-16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  // Рампа вместо ступенек для простоты
  d = min(d, stairsL);
  
  // Правая платформа (X от 17 до 23)
  float rightPlat = sdBox(p - vec3(20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                          vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, rightPlat);
  
  // Лестница к правой платформе (X от 16 до 17)
  float stairsR = sdBox(p - vec3(16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  d = min(d, stairsR);
  
  // Перила платформ
  float railL = sdBox(p - vec3(-17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  float railR = sdBox(p - vec3(17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  d = min(d, min(railL, railR));
  
  // === КОЛОННЫ (только 2 у платформ) ===
  float colD = sdCylinder(p - vec3(22.0, 4.0, 0.0), 0.5, 4.0);
  colD = min(colD, sdCylinder(p - vec3(-22.0, 4.0, 0.0), 0.5, 4.0));
  d = min(d, colD);
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль по кругу) ===
  // 6 платформ по кругу с радиусом 10м
  float jp1 = sdCylinder(p - vec3(10.0, 1.8, 0.0), 1.5, 0.25);
  float jp2 = sdCylinder(p - vec3(5.0, 3.0, 8.66), 1.4, 0.25);
  float jp3 = sdCylinder(p - vec3(-5.0, 4.2, 8.66), 1.4, 0.25);
  float jp4 = sdCylinder(p - vec3(-10.0, 5.4, 0.0), 1.3, 0.25);
  float jp5 = sdCylinder(p - vec3(-5.0, 6.6, -8.66), 1.3, 0.25);
  float jp6 = sdCylinder(p - vec3(5.0, 7.8, -8.66), 1.2, 0.25);
  
  float jumpPlats = min(jp1, min(jp2, min(jp3, min(jp4, min(jp5, jp6)))));
  if (jumpPlats < d) {
    d = jumpPlats;
    materialId = 16;
  }
  
  // Верхняя платформа с бафом (в центре над фонтаном)
  float topPlat = sdCylinder(p - vec3(0.0, 9.5, 0.0), 2.5, 0.35);
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
  
  // === ВОДА ===
  // Центральный бассейн (только визуально, не пройти - коллизия блокирует)
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.0 + waterWaves(p.xz, u_time) * 0.05;
      float waterPlane = p.y - waterY;
      if (waterPlane < d && waterPlane > -0.3) {
        d = max(waterPlane, 0.001);
        materialId = 1;
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.4 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterPlane = p.y - waterY;
    if (waterPlane < d && waterPlane > -0.1) {
      d = max(waterPlane, 0.001);
      materialId = 1;
    }
  }
  
  // === ВРАГИ ===
  // w: 0=неактивен, 1-2=бейнлинг, 3-4=фантом, 5-6=runner, 7-8=hopper
  // 11-12=boss_green, 13-14=boss_black, 15-16=boss_blue
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 16) break;
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 tp = p - target.xyz;
      int enemyType = int(target.w / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper, 5=boss_green, 6=boss_black, 7=boss_blue
      
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
    d += dist * 0.9; // Небольшой overrelaxation для скорости
    if (dist < SURF_DIST || d > MAX_DIST) break;
  }
  return d;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.02, 0.0); // Грубее но быстрее
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
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

// === ГЛАВНАЯ ===
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
      // ЭПОХА 1: Кислотная (зелёная токсичная)
      ambient = vec3(0.08, 0.15, 0.08);
      mainLight = vec3(0.3, 0.8, 0.3); // Зелёный свет
      accentColor = vec3(0.5, 1.0, 0.3); // Кислотный
      fogColor = vec3(0.02, 0.08, 0.02);
    } else if (u_era == 2) {
      // ЭПОХА 2: Чёрная дыра (тёмно-фиолетовая)
      ambient = vec3(0.06, 0.04, 0.12);
      mainLight = vec3(0.5, 0.3, 0.8); // Фиолетовый
      accentColor = vec3(0.8, 0.2, 1.0); // Пурпурный
      fogColor = vec3(0.03, 0.01, 0.06);
    } else {
      // ЭПОХА 3: Космическая (синяя технологичная)
      ambient = vec3(0.08, 0.12, 0.18);
      mainLight = vec3(0.4, 0.7, 1.0); // Синий
      accentColor = vec3(0.2, 0.8, 1.0); // Циан
      fogColor = vec3(0.01, 0.03, 0.08);
    }
    
    // Основной свет сверху
    float mainDot = max(dot(n, vec3(0.3, 0.9, -0.2)), 0.0);
    
    // Один тёплый источник (факел) - цвет меняется по эпохе
    vec3 torchPos = vec3(0.0, 8.0, 0.0);
    vec3 toTorch = torchPos - p;
    float torchDist = length(toTorch);
    float atten = 25.0 / (1.0 + torchDist * 0.05 + torchDist * torchDist * 0.008);
    vec3 torchLight = accentColor * max(dot(n, normalize(toTorch)), 0.0) * atten;
    
    // Подсветка бассейна - цвет по эпохе
    float distFromCenter = length(p.xz);
    float poolInfluence = 1.0 - smoothstep(0.0, 15.0, distFromCenter);
    vec3 poolLight = accentColor * poolInfluence * 2.0;
    
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
      
    } else {
      // === ПОЛ / СТЕНЫ ===
      vec3 baseColor = vec3(0.15, 0.14, 0.12);
      
      // Простая плитка
      if (abs(n.y) > 0.9) {
        vec2 tile = fract(p.xz * 0.25);
        float tileEdge = step(0.04, min(min(tile.x, tile.y), min(1.0 - tile.x, 1.0 - tile.y)));
        baseColor *= 0.8 + 0.2 * tileEdge;
      }
      
      color = baseColor * ambient * 2.0;
      color += baseColor * mainLight * mainDot * 0.5;
      color += baseColor * torchLight * 1.2;
      color += baseColor * poolLight * 1.0;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Туман по эпохе
    float fog = 1.0 - exp(-d * 0.02);
    color = mix(color, fogColor, fog * 0.5);
  }
  
  // Тонмаппинг
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(0.9));
  
  // Цветокоррекция - добавляем голубой оттенок для ночной атмосферы
  color = mix(color, color * vec3(0.9, 0.95, 1.1), 0.25);
  
  // Небольшое насыщение
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, 1.15);
  
  // Виньетка
  float vig = 1.0 - length(v_uv - 0.5) * 0.4;
  color *= vig;
  
  fragColor = vec4(color, 1.0);
}
`;
