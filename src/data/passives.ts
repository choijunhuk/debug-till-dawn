import type { PassiveDef } from './types';

// 패시브. 스탯형은 mul/value 누적, 특수형은 special.
export const PASSIVES: Record<string, PassiveDef> = {
  overclock:   { id: 'overclock', name: 'Overclock', desc: '이동속도 +12%', color: 0x4ec9b0, maxLevel: 5, speedMul: 0.12 },
  lowlatency:  { id: 'lowlatency', name: 'Low Latency', desc: '쿨다운 -10%', color: 0x79c0ff, maxLevel: 5, cooldownMul: 0.10 },
  ram:         { id: 'ram', name: 'RAM 증설', desc: '최대 체력 +25', color: 0x6a9955, maxLevel: 5, maxHp: 25 },
  multithread: { id: 'multithread', name: 'Multithreading', desc: '투사체 +1', color: 0xdcdcaa, maxLevel: 3, count: 1 },
  widescope:   { id: 'widescope', name: 'Wide Scope', desc: '픽업 반경 +25%', color: 0xc586c0, maxLevel: 4, pickupMul: 0.25 },
  refactor:    { id: 'refactor', name: 'Refactor', desc: '전체 데미지 +12%', color: 0xff7b72, maxLevel: 5, damageMul: 0.12 },
  hotfix:      { id: 'hotfix', name: 'Hotfix', desc: '초당 체력 +1.5', color: 0xff9bce, maxLevel: 4, regen: 1.5 },
  stacktrace:  { id: 'stacktrace', name: 'Stack Trace', desc: '죽을 때 1회 부활(git revert)', color: 0xffd700, maxLevel: 1, special: 'revive' },
  codereview:  { id: 'codereview', name: 'Code Review', desc: '크리티컬 확률 +8%', color: 0xa5d6ff, maxLevel: 4, crit: 0.08 },
  pairprog:    { id: 'pairprog', name: 'Pair Programming', desc: '같이 싸우는 분신 추가', color: 0x7ee787, maxLevel: 2, special: 'clone' },
  lazyload:    { id: 'lazyload', name: 'Lazy Loading', desc: '시간 갈수록 데미지 ↑', color: 0xd2a8ff, maxLevel: 3, special: 'lazyload' },
};
