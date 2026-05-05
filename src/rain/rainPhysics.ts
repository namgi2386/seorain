export interface Raindrop {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

export function createRaindrop(width: number): Raindrop {
  return {
    x: Math.random() * width,
    y: -10,
    speed: 18 + Math.random() * 10,
    size: 1.5 + Math.random() * 2,
  };
}

// 초기 화면 배치용: 화면 전체에 걸쳐 분산
export function createRaindropInitial(width: number, height: number): Raindrop {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    speed: 18 + Math.random() * 10,
    size: 1.5 + Math.random() * 2,
  };
}

export function createSplash(x: number, y: number): Particle[] {
  const count = 5 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => {
    // 상반구 방향: 위/좌/우로 튀김
    const angle = -Math.PI + Math.random() * Math.PI;
    const speed = 2 + Math.random() * 4;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed, // 상반구이므로 음수 = 위쪽
      alpha: 0.9,
      size: 1 + Math.random() * 1.5,
    };
  });
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.2, // 중력
      alpha: p.alpha - 0.045,
    }))
    .filter((p) => p.alpha > 0);
}
