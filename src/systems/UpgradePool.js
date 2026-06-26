import Phaser from 'phaser';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { availableEvolutions } from './EvolutionSystem';
// 레벨업 3장 카드 구성: 진화(금) > 신규무기/무기강화/패시브 무작위.
export function buildUpgradeOptions(weapons, stats, weaponSlots, onWeapon, onPassive, onEvolve, healFallback) {
    const out = [];
    // 진화 우선(금색)
    for (const evo of availableEvolutions(weapons, stats)) {
        out.push({
            title: `⚡ ${evo.name}`, desc: '무기 진화! 압도적으로 강해짐', color: 0xffd700, gold: true,
            icon: WEAPONS[evo.resultId].icon,
            apply: () => onEvolve(evo.materialId, evo.resultId),
        });
    }
    const pool = [];
    // 무기 강화(보유, 비최대, 진화무기 제외)
    for (const w of weapons.owned) {
        if (w.def.maxLevel <= 1 || w.level >= w.def.maxLevel)
            continue;
        pool.push({
            title: `${w.def.name} Lv.${w.level + 1}`, desc: '데미지/쿨다운/투사체 강화', color: w.def.color,
            icon: w.def.icon, apply: () => onWeapon(w.def.id),
        });
    }
    // 신규 무기(슬롯 여유, 미보유, 기본무기만)
    if (weapons.owned.length < weaponSlots) {
        for (const def of Object.values(WEAPONS)) {
            if (def.maxLevel <= 1)
                continue; // 진화 결과 제외
            if (weapons.has(def.id))
                continue;
            pool.push({
                title: `+ ${def.name}`, desc: '신규 무기 획득', color: def.color,
                icon: def.icon, apply: () => onWeapon(def.id),
            });
        }
    }
    // 패시브(비최대, 슬롯 6)
    const passiveCount = Object.keys(stats.passiveLevels).length;
    for (const def of Object.values(PASSIVES)) {
        const lvl = stats.passiveLevels[def.id] || 0;
        if (lvl >= def.maxLevel)
            continue;
        if (lvl === 0 && passiveCount >= 6)
            continue; // 새 패시브는 슬롯 제한
        pool.push({
            title: `${def.name}${lvl > 0 ? ` Lv.${lvl + 1}` : ''}`, desc: def.desc, color: def.color,
            apply: () => onPassive(def.id),
        });
    }
    Phaser.Utils.Array.Shuffle(pool);
    while (out.length < 3 && pool.length)
        out.push(pool.shift());
    // 완전 고갈 시 회복 카드
    if (out.length === 0) {
        out.push({ title: 'Hotfix', desc: '체력 50 회복', color: 0xce9178, apply: healFallback });
    }
    return out.slice(0, 3);
}
