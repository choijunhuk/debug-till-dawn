import { PASSIVES } from '../data/passives';
import { MetaProgress } from './MetaProgress';
import { BALANCE } from '../data/balance';
// 직군 + 패시브 + 메타 → 유효 스탯 집계. 무기/플레이어가 이걸 참조.
export class PlayerStats {
    constructor(cls) {
        this.passiveLevels = {};
        this.reviveAvailable = false;
        this.meta = MetaProgress.startBonuses();
        // 캐시된 유효값
        this.speedMul = 1;
        this.maxHpBonus = 0;
        this.pickupMul = 1;
        this.damageMulBase = 1;
        this.cooldownMul = 1;
        this.extraCount = 0;
        this.crit = 0;
        this.regen = 0;
        this.cloneCount = 0;
        this.lazyLoadLevel = 0;
        this.cls = cls;
        this.reviveAvailable = this.meta.revive || false;
        this.recompute();
    }
    addPassive(id) {
        const def = PASSIVES[id];
        this.passiveLevels[id] = Math.min((this.passiveLevels[id] || 0) + 1, def.maxLevel);
        if (def.special === 'revive')
            this.reviveAvailable = true;
        this.recompute();
    }
    passiveMaxed(id) {
        const def = PASSIVES[id];
        return (this.passiveLevels[id] || 0) >= def.maxLevel;
    }
    hasPassive(id) { return (this.passiveLevels[id] || 0) > 0; }
    recompute() {
        let speed = this.cls.speedMul;
        let hp = this.meta.hp;
        let pickup = this.cls.pickupMul * (1 + this.meta.pickupMul);
        let dmg = this.cls.damageMul * (1 + this.meta.damageMul);
        let cd = 1;
        let count = 0, crit = this.cls.crit, regen = 0, clones = 0, lazy = 0;
        for (const [id, lvl] of Object.entries(this.passiveLevels)) {
            const d = PASSIVES[id];
            if (d.speedMul)
                speed += d.speedMul * lvl;
            if (d.maxHp)
                hp += d.maxHp * lvl;
            if (d.pickupMul)
                pickup += d.pickupMul * lvl;
            if (d.damageMul)
                dmg += d.damageMul * lvl;
            if (d.cooldownMul)
                cd -= d.cooldownMul * lvl;
            if (d.count)
                count += d.count * lvl;
            if (d.crit)
                crit += d.crit * lvl;
            if (d.regen)
                regen += d.regen * lvl;
            if (d.special === 'clone')
                clones += lvl;
            if (d.special === 'lazyload')
                lazy = lvl;
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
    damageMul(elapsedMin) {
        const lazy = 1 + this.lazyLoadLevel * 0.10 * Math.min(elapsedMin, 10); // 최대 +100%/레벨*…
        return this.damageMulBase * lazy;
    }
    // 크리 굴림 → 최종 데미지
    rollDamage(base, elapsedMin) {
        let d = base * this.damageMul(elapsedMin);
        const crit = Math.random() < this.crit;
        if (crit)
            d *= BALANCE.weapon.critMul;
        return { amount: Math.round(d), crit };
    }
}
