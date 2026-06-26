import Phaser from 'phaser';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import type { UpgradeOption } from '../ui/LevelUpCards';
import type { WeaponSystem } from './WeaponSystem';
import type { PlayerStats } from './PlayerStats';
import { availableEvolutions } from './EvolutionSystem';

// 레벨업 3장 카드 구성: 진화(금) > 신규무기/무기강화/패시브 무작위.
export function buildUpgradeOptions(
  weapons: WeaponSystem, stats: PlayerStats, weaponSlots: number,
  onWeapon: (id: string) => void, onPassive: (id: string) => void, onEvolve: (mat: string, res: string) => void,
  healFallback: () => void,
): UpgradeOption[] {
  const out: UpgradeOption[] = [];

  // 진화 우선(금색)
  for (const evo of availableEvolutions(weapons, stats)) {
    out.push({
      title: `⚡ ${evo.name}`, desc: '무기 진화! 압도적으로 강해짐', color: 0xffd700, gold: true,
      icon: WEAPONS[evo.resultId].icon,
      apply: () => onEvolve(evo.materialId, evo.resultId),
    });
  }

  const pool: UpgradeOption[] = [];

  // 무기 강화(보유, 비최대, 진화무기 제외)
  for (const w of weapons.owned) {
    if (w.def.maxLevel <= 1 || w.level >= w.def.maxLevel) continue;
    // 진화 경로 힌트: 패시브 미보유 → 재료 안내, 패시브 보유 → 레벨업 독촉
    let hint: string | undefined;
    if (w.def.evolvesTo && w.def.evoPassive) {
      const passiveName = PASSIVES[w.def.evoPassive]?.name ?? w.def.evoPassive;
      hint = stats.hasPassive(w.def.evoPassive)
        ? `⚡ 진화 임박: 최대레벨까지!`
        : `⚡ 진화: + ${passiveName} 패시브`;
    }
    pool.push({
      title: `${w.def.name} Lv.${w.level + 1}`, desc: '데미지/쿨다운/투사체 강화', color: w.def.color,
      icon: w.def.icon, hint, apply: () => onWeapon(w.def.id),
    });
  }

  // 신규 무기(슬롯 여유, 미보유, 기본무기만)
  if (weapons.owned.length < weaponSlots) {
    for (const def of Object.values(WEAPONS)) {
      if (def.maxLevel <= 1) continue; // 진화 결과 제외
      if (weapons.has(def.id)) continue;
      // 진화 경로 힌트: 결과 무기명 + 필요 패시브
      let hint: string | undefined;
      if (def.evolvesTo && def.evoPassive) {
        const resultName = WEAPONS[def.evolvesTo]?.name ?? def.evolvesTo;
        const passiveName = PASSIVES[def.evoPassive]?.name ?? def.evoPassive;
        hint = `⚡ ${resultName}(으)로 진화 가능 (+${passiveName})`;
      }
      pool.push({
        title: `+ ${def.name}`, desc: '신규 무기 획득', color: def.color,
        icon: def.icon, hint, apply: () => onWeapon(def.id),
      });
    }
  }

  // 패시브(비최대, 슬롯 6)
  const passiveCount = Object.keys(stats.passiveLevels).length;
  for (const def of Object.values(PASSIVES)) {
    const lvl = stats.passiveLevels[def.id] || 0;
    if (lvl >= def.maxLevel) continue;
    if (lvl === 0 && passiveCount >= 6) continue; // 새 패시브는 슬롯 제한
    // 진화 재료 힌트: 현재 보유 무기 중 이 패시브가 진화 조건인 경우
    const evoWeapon = weapons.owned.find(w => w.def.evoPassive === def.id);
    const hint = evoWeapon ? `⚡ ${evoWeapon.def.name} 진화 재료` : undefined;
    pool.push({
      title: `${def.name}${lvl > 0 ? ` Lv.${lvl + 1}` : ''}`, desc: def.desc, color: def.color,
      hint, apply: () => onPassive(def.id),
    });
  }

  Phaser.Utils.Array.Shuffle(pool);
  while (out.length < 3 && pool.length) out.push(pool.shift()!);

  // 완전 고갈 시 회복 카드
  if (out.length === 0) {
    out.push({ title: 'Hotfix', desc: '체력 50 회복', color: 0xce9178, apply: healFallback });
  }
  return out.slice(0, 3);
}
