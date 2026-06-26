import type { EnemyDef } from './types';

// 적 정의. base 스탯 × mul, 행동 플래그.
export const ENEMIES: Record<string, EnemyDef> = {
  bug:        { id: 'bug', name: 'Bug', color: 0x6ee7a0, hpMul: 1, speedMul: 1, damageMul: 1, scale: 1, xp: 1, shape: 'bug' },
  syntax:     { id: 'syntax', name: 'Syntax Error', color: 0xff5c5c, hpMul: 0.7, speedMul: 1.9, damageMul: 1, scale: 0.9, xp: 1, dash: true, shape: 'syntax' },
  nullenemy:  { id: 'nullenemy', name: 'null', color: 0x8b949e, hpMul: 0.8, speedMul: 1.2, damageMul: 1, scale: 1, xp: 1, phase: true, shape: 'null' },
  infloop:    { id: 'infloop', name: 'Infinite Loop', color: 0x4ec9b0, hpMul: 1, speedMul: 0.7, damageMul: 1, scale: 1, xp: 2, accel: true, shape: 'infloop' },
  memleak:    { id: 'memleak', name: 'Memory Leak', color: 0x7bb661, hpMul: 1.4, speedMul: 0.7, damageMul: 1.2, scale: 1, xp: 2, grow: true, shape: 'memleak' },
  mergeconf:  { id: 'mergeconf', name: 'Merge Conflict', color: 0xc586c0, hpMul: 1.1, speedMul: 1, damageMul: 1, scale: 1, xp: 2, splitOnDeath: 2, shape: 'mergeconf' },
  legacy:     { id: 'legacy', name: 'Legacy Code', color: 0x6e7681, hpMul: 4, speedMul: 0.45, damageMul: 1.4, scale: 1.5, xp: 3, shape: 'legacy' },
  deadlock:   { id: 'deadlock', name: 'Deadlock', color: 0xce9178, hpMul: 1.3, speedMul: 1, damageMul: 1.3, scale: 1.1, xp: 2, dash: true, shape: 'deadlock' },
  heisenbug:  { id: 'heisenbug', name: 'Heisenbug', color: 0xb392f0, hpMul: 1, speedMul: 1.1, damageMul: 1, scale: 1, xp: 3, vanishNear: true, shape: 'heisenbug' },
  todo:       { id: 'todo', name: 'TODO', color: 0xdcdcaa, hpMul: 1, speedMul: 0.9, damageMul: 1, scale: 1, xp: 2, splitOnDeath: 2, shape: 'todo' },
  techdebt:   { id: 'techdebt', name: 'Tech Debt', color: 0xe3b341, hpMul: 1.2, speedMul: 0.8, damageMul: 1, scale: 1, xp: 3, accel: true, grow: true },

  // 보스
  segfault:   { id: 'segfault', name: 'Segfault', color: 0xff5c5c, hpMul: 60, speedMul: 0.6, damageMul: 2, scale: 2, xp: 40, boss: true, shape: 'boss_segfault' },
  onsquared:  { id: 'onsquared', name: 'O(n²)', color: 0xc586c0, hpMul: 35, speedMul: 0.8, damageMul: 1.5, scale: 1.8, xp: 40, boss: true, splitOnDeath: 3, shape: 'boss_onsquared' },
  prodbug:    { id: 'prodbug', name: 'Production Bug', color: 0xff0066, hpMul: 100, speedMul: 0.5, damageMul: 2.5, scale: 2.2, xp: 60, boss: true, summon: true, shape: 'boss_prodbug' },
};
