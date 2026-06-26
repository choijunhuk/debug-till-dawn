import { META_UPGRADES, UNLOCKS } from '../data/metaUpgrades';

// 영구 저장(localStorage). RP, 업그레이드 레벨, 해금, 업적.
interface SaveData {
  rp: number;
  upgrades: Record<string, number>;
  unlocks: string[];
  achievements: string[];
}

const KEY = 'dtd_save_v1';

export class MetaProgress {
  private static data: SaveData = MetaProgress.fresh();

  private static fresh(): SaveData {
    return { rp: 0, upgrades: {}, unlocks: ['localhost', 'fullstack', 'frontend', 'backend'], achievements: [] };
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...this.fresh(), ...JSON.parse(raw) };
    } catch { /* ponytail: 손상 세이브는 무시하고 새로 시작 */ }
  }

  static save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* 저장 실패 무시 */ }
  }

  static get rp() { return this.data.rp; }
  static addRP(amount: number): number {
    const bonus = 1 + this.upgradeLevel('rpBonus') * META_UPGRADES.rpBonus.value;
    const granted = Math.floor(amount * bonus);
    this.data.rp += granted;
    this.save();
    return granted;
  }

  static upgradeLevel(id: string) { return this.data.upgrades[id] || 0; }
  static upgradeCost(id: string) {
    const def = META_UPGRADES[id];
    return def.cost * (this.upgradeLevel(id) + 1); // 레벨당 비용 증가
  }
  static buyUpgrade(id: string): boolean {
    const def = META_UPGRADES[id];
    const lvl = this.upgradeLevel(id);
    if (lvl >= def.maxLevel) return false;
    const cost = this.upgradeCost(id);
    if (this.data.rp < cost) return false;
    this.data.rp -= cost;
    this.data.upgrades[id] = lvl + 1;
    if (id === 'revive') this.unlock('reviveBase');
    this.save();
    return true;
  }

  static isUnlocked(id: string) { return this.data.unlocks.includes(id); }
  static unlock(id: string) {
    if (!this.data.unlocks.includes(id)) { this.data.unlocks.push(id); this.save(); }
  }
  static buyUnlock(id: string): boolean {
    const u = UNLOCKS[id];
    if (!u || this.isUnlocked(id)) return false;
    if (this.data.rp < u.cost) return false;
    this.data.rp -= u.cost;
    this.unlock(id);
    return true;
  }

  static hasAchievement(id: string) { return this.data.achievements.includes(id); }
  static grantAchievement(id: string): boolean {
    if (this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.save();
    return true;
  }

  // 메타 → 게임 시작 보정값
  static startBonuses() {
    return {
      hp: this.upgradeLevel('startHp') * META_UPGRADES.startHp.value,
      damageMul: this.upgradeLevel('startDmg') * META_UPGRADES.startDmg.value,
      pickupMul: this.upgradeLevel('pickup') * META_UPGRADES.pickup.value,
      revive: this.upgradeLevel('revive') > 0,
    };
  }
}
