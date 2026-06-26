import { PASSIVES } from '../data/passives';
import type { ClassDef } from '../data/types';
import { MetaProgress } from './MetaProgress';
import { BALANCE } from '../data/balance';

// 직군 + 패시브 + 메타 → 유효 스탯 집계. 무기/플레이어가 이걸 참조.
export class PlayerStats {
  passiveLevels: Record<string, number> = {};
  reviveAvailable = false;
  private cls: ClassDef;
  private meta = MetaProgress.startBonuses();

  // 캐시된 유효값
  speedMul = 1;
  maxHpBonus = 0;
  pickupMul = 1;
  damageMulBase = 1;
  cooldownMul = 1;
  extraCount = 0;
  crit = 0;
  regen = 0;
  cloneCount = 0;
  lazyLoadLevel = 0;

  constructor(cls: ClassDef) {
    this.cls = cls;
    this.reviveAvailable = this.meta.revive || false;
    this.recompute();
  }

  addPassive(id: string) {
    const def = PASSIVES[id];
    this.passiveLevels[id] = Math.min((this.passiveLevels[id] || 0) + 1, def.maxLevel);
    if (def.special === 'revive') this.reviveAvailable = true;
    this.recompute();
  }
  passiveMaxed(id: string) {
    const def = PASSIVES[id];
    return (this.passiveLevels[id] || 0) >= def.maxLevel;
  }
  hasPassive(id: string) { return (this.passiveLevels[id] || 0) > 0; }

  recompute() {
    let speed = this.cls.speedMul;
    let hp = this.meta.hp;
    let pickup = this.cls.pickupMul * (1 + this.meta.pickupMul);
    let dmg = this.cls.damageMul * (1 + this.meta.damageMul);
    let cd = 1;
    let count = 0, crit = this.cls.crit, regen = 0, clones = 0, lazy = 0;

    for (const [id, lvl] of Object.entries(this.passiveLevels)) {
      const d = PASSIVES[id];
      if (d.speedMul) speed += d.speedMul * lvl;
      if (d.maxHp) hp += d.maxHp * lvl;
      if (d.pickupMul) pickup += d.pickupMul * lvl;
      if (d.damageMul) dmg += d.damageMul * lvl;
      if (d.cooldownMul) cd -= d.cooldownMul * lvl;
      if (d.count) count += d.count * lvl;
      if (d.crit) crit += d.crit * lvl;
      if (d.regen) regen += d.regen * lvl;
      if (d.special === 'clone') clones += lvl;
      if (d.special === 'lazyload') lazy = lvl;
    }

    this.speedMul = speed;
    this.maxHpBonus = hp;
    this.pickupMul = pickup;
    this.damageMulBase = dmg;
    this.cooldownMul = Math.max(0.25, cd); // 쿨다운 하한
    this.extraCount = count;
    this.crit = Math.min(0.9, crit);
    this.regen = regen;
    this.cloneCount = clones;
    this.lazyLoadLevel = lazy;
  }

  // 시간 반영 데미지 배율(Lazy Loading). elapsedMin 사용.
  damageMul(elapsedMin: number) {
    const lazy = 1 + this.lazyLoadLevel * 0.10 * Math.min(elapsedMin, 10); // 최대 +100%/레벨*…
    return this.damageMulBase * lazy;
  }

  // 크리 굴림 → 최종 데미지
  rollDamage(base: number, elapsedMin: number) {
    let d = base * this.damageMul(elapsedMin);
    const crit = Math.random() < this.crit;
    if (crit) d *= BALANCE.weapon.critMul;
    return { amount: Math.round(d), crit };
  }
}
