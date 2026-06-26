import type { ClassDef } from './types';

// 직군. 시작 무기 + 스탯 보정. 일부 메타로 해금.
export const CLASSES: Record<string, ClassDef> = {
  fullstack: { id: 'fullstack', name: 'Fullstack', desc: '밸런스, 무기 슬롯 +1', color: 0xdcdcaa,
    startWeapon: 'consolelog', speedMul: 1, hpMul: 1, damageMul: 1, pickupMul: 1, crit: 0.05, weaponSlots: 7 },
  frontend: { id: 'frontend', name: 'Frontend', desc: '빠르고 화려, 체력 낮음', color: 0x4ec9b0,
    startWeapon: 'regex', speedMul: 1.2, hpMul: 0.75, damageMul: 1, pickupMul: 1, crit: 0.05, weaponSlots: 6 },
  backend: { id: 'backend', name: 'Backend', desc: '묵직, 데미지 높고 느림', color: 0x659ad2,
    startWeapon: 'nullptr', speedMul: 0.85, hpMul: 1.3, damageMul: 1.25, pickupMul: 1, crit: 0.05, weaponSlots: 6 },
  devops: { id: 'devops', name: 'DevOps', desc: '소환/자동화 강화', color: 0x2496ed,
    startWeapon: 'npminstall', speedMul: 1, hpMul: 1.1, damageMul: 1, pickupMul: 1, crit: 0.05, weaponSlots: 6, locked: true },
  qa: { id: 'qa', name: 'QA', desc: '픽업/크리 강화, 버그 잘 찾음', color: 0xc586c0,
    startWeapon: 'regex', speedMul: 1, hpMul: 1, damageMul: 1, pickupMul: 1.4, crit: 0.18, weaponSlots: 6, locked: true },
};
