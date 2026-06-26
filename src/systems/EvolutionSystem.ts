import { WEAPONS } from '../data/weapons';
import type { WeaponSystem } from './WeaponSystem';
import type { PlayerStats } from './PlayerStats';

export interface EvoOffer { materialId: string; resultId: string; name: string; color: number; }

// 진화 가능 목록: 재료 무기 최대레벨 + 필요 패시브 보유.
export function availableEvolutions(weapons: WeaponSystem, stats: PlayerStats): EvoOffer[] {
  const offers: EvoOffer[] = [];
  for (const w of weapons.owned) {
    const def = w.def;
    if (!def.evolvesTo || !def.evoPassive) continue;
    if (w.level < def.maxLevel) continue;
    if (!stats.hasPassive(def.evoPassive)) continue;
    if (weapons.has(def.evolvesTo)) continue;
    const res = WEAPONS[def.evolvesTo];
    offers.push({ materialId: def.id, resultId: def.evolvesTo, name: res.name, color: res.color });
  }
  return offers;
}
