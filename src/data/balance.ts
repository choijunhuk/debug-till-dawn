// 게임 밸런스 상수 — 전부 여기서 튜닝 (ponytail: 매직넘버 한곳에)
export const BALANCE = {
  player: {
    speed: 200,
    maxHp: 100,
    pickupRadius: 80, // 자석 반경
    bodyRadius: 14,
  },
  enemy: {
    baseHp: 10,
    baseSpeed: 55,
    baseDamage: 8,
    touchCooldown: 500, // 같은 적 재접촉 데미지 간격(ms)
    spawnRingMin: 520, // 카메라 밖 스폰 거리
    spawnRingMax: 640,
    // 시간 난이도: 분당 스폰 간격 감소, 체력/속도 증가
    spawnIntervalStart: 900, // ms
    spawnIntervalMin: 180,
    spawnIntervalDecayPerMin: 160,
    hpPerMin: 6,
    speedPerMin: 6,
  },
  xp: {
    gemValue: 1,
    magnetSpeed: 420,
    firstLevel: 4, // 첫 레벨업 필요 XP
    growth: 1.32, // 레벨마다 필요 XP 배수
  },
  weapon: {
    damageGrowth: 0.16,   // 레벨당 데미지 +16%
    cooldownGrowth: 0.07, // 레벨당 쿨다운 -7%
    countEvery: 2,        // N레벨마다 투사체 +1 (projectile/homing/bomb)
    critMul: 2,           // 크리 배율
  },
  minion: { hp: 30, damage: 6, cooldown: 600, range: 240 },
  pickups: {
    coffeeHeal: 30,
    dropCoffee: 0.015,  // 적 처치 시 커피 드랍 확률
    dropBomb: 0.006,    // rm -rf 화면폭탄
    dropMagnet: 0.008,  // 전체 XP 흡수
  },
  boss: { hpBarW: 320 },
};

// 레벨 N 도달에 필요한 누적 XP 임계값
export function xpForLevel(level: number): number {
  const { firstLevel, growth } = BALANCE.xp;
  return Math.round(firstLevel * Math.pow(growth, level - 1));
}
