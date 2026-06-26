// 공유 타입. 순환 import 방지용으로 한곳에 모음.

export type WeaponBehavior =
  | 'projectile' // 직선 탄, 가장 가까운 적
  | 'orbit'      // 회전 오브
  | 'whip'       // 좌우 광역 베기
  | 'pierce'     // 관통 직선
  | 'bounce'     // 적 사이 튕김
  | 'aura'       // 주변 장판(흡입/속박/지속뎀)
  | 'summon'     // 미니언 소환
  | 'homing'     // 유도탄
  | 'nuke'       // 화면 전체 폭발
  | 'bomb';      // 주기적 설치 폭격

export interface WeaponDef {
  id: string;
  name: string;
  behavior: WeaponBehavior;
  icon: string;       // brandAssets 키
  color: number;
  maxLevel: number;
  // 기본 스탯 (Lv1)
  damage: number;
  cooldown: number;   // ms
  count: number;      // 투사체/오브/미니언 수
  speed: number;      // 투사체 속도
  area: number;       // 장판/폭발 반경 또는 채찍 길이
  duration?: number;  // 장판/오브 지속(ms)
  pierce?: number;    // 관통 횟수
  bounces?: number;   // 튕김 횟수
  knockback?: number; // 넉백 세기
  slow?: number;      // 속박 비율(0~1)
  vacuum?: boolean;   // 흡입 여부
  instakill?: number; // 즉사 확률(0~1)
  // 진화
  evolvesTo?: string;    // 진화 결과 무기 id
  evoPassive?: string;   // 필요 패시브 id
}

export interface PassiveDef {
  id: string;
  name: string;
  desc: string;
  color: number;
  maxLevel: number;
  // 스탯 보정 (레벨당 누적). 특수효과는 special 로.
  damageMul?: number;     // +배율/레벨 (0.1 = +10%)
  cooldownMul?: number;   // -배율/레벨
  speedMul?: number;      // 이동속도 +/레벨
  maxHp?: number;         // +체력/레벨
  pickupMul?: number;     // 픽업반경 +/레벨
  count?: number;         // 투사체 +/레벨
  crit?: number;          // 크리 확률 +/레벨
  regen?: number;         // 초당 회복/레벨
  special?: 'revive' | 'clone' | 'lazyload';
}

export interface EnemyDef {
  id: string;
  name: string;
  color: number;
  hpMul: number;
  speedMul: number;
  damageMul: number;
  scale: number;
  xp: number;
  // 특수 행동 플래그
  dash?: boolean;        // 멈췄다 돌진(Deadlock) / 빠른 돌진
  accel?: boolean;       // 시간 지날수록 가속(Infinite Loop)
  grow?: boolean;        // 살아있을수록 성장(Memory Leak)
  splitOnDeath?: number; // 죽으면 N개로 분열(Merge Conflict/O(n²))
  phase?: boolean;       // 반투명, 가끔 통과(null)
  vanishNear?: boolean;  // 가까이 가면 사라짐(Heisenbug)
  boss?: boolean;
  summon?: boolean;      // 미니언 소환(Production Bug)
  shape?: string;        // 절차적 비주얼 키(enemyVisuals). 없으면 원형 도형 fallback.
}

export interface ClassDef {
  id: string;
  name: string;
  desc: string;
  color: number;
  startWeapon: string;
  speedMul: number;
  hpMul: number;
  damageMul: number;
  pickupMul: number;
  crit: number;
  weaponSlots: number; // 기본 6 → 일부 +1
  locked?: boolean;    // 메타로 해금
}

export interface StageDef {
  id: string;
  name: string;
  desc: string;
  bgTint: number;
  enemyPool: string[];     // 등장 적 id
  bosses: { time: number; id: string }[]; // ms 시각별 보스
  spawnMul: number;        // 스폰 밀도 배수
  hpMul: number;           // 적 체력 배수(모디파이어)
  locked?: boolean;
}

export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  cost: number;       // 레벨당 RP 비용(누적 증가)
  apply: 'startHp' | 'startDamage' | 'pickup' | 'rpBonus' | 'reviveUnlock';
  value: number;      // 레벨당 효과량
}
