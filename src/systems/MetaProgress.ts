import { META_UPGRADES, UNLOCKS } from '../data/metaUpgrades';

// 영구 저장(localStorage). RP, 업그레이드 레벨, 해금, 업적.
// 스키마 버전은 SaveData.version 필드로 관리.
interface SaveData {
  version: number;
  rp: number;
  upgrades: Record<string, number>;
  unlocks: string[];
  achievements: string[];
}

// 키 이름(dtd_save_v1)은 역사적 이름으로 변경하지 않음. 스키마 버전은 version 필드로 추적.
const KEY = 'dtd_save_v1';
const SCHEMA_VERSION = 2;

export class MetaProgress {
  private static data: SaveData = MetaProgress.fresh();

  private static fresh(): SaveData {
    return { version: SCHEMA_VERSION, rp: 0, upgrades: {}, unlocks: ['localhost', 'fullstack', 'frontend', 'backend'], achievements: [] };
  }

  // localStorage에서 파싱된 raw 객체를 현재 스키마로 마이그레이션.
  // 미래 버전 추가법: case 2: /* v2→v3 마이그레이션 */ 를 switch에 추가.
  private static migrate(raw: any): SaveData {
    const base: SaveData = { ...this.fresh(), ...raw };

    // 타입 보정 — 손상된 필드를 fresh() 기본값으로 복구
    if (typeof base.rp !== 'number' || !isFinite(base.rp) || base.rp < 0) base.rp = 0;
    if (typeof base.upgrades !== 'object' || Array.isArray(base.upgrades) || base.upgrades === null) base.upgrades = {};
    if (!Array.isArray(base.unlocks)) base.unlocks = this.fresh().unlocks;
    if (!Array.isArray(base.achievements)) base.achievements = [];

    const fromVersion: number = typeof raw.version === 'number' ? raw.version : 1;

    switch (fromVersion) {
      case 1:
        // v1→v2: 구조 호환. 위 타입 보정으로 충분. 향후 case 2: /* v2→v3 */ 를 추가.
        break;
    }

    base.version = SCHEMA_VERSION;
    return base;
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const prevVersion: number = typeof parsed.version === 'number' ? parsed.version : 1;
        this.data = this.migrate(parsed);
        // 마이그레이션으로 버전이 올라갔으면 즉시 재저장하여 업그레이드를 영속화
        if (prevVersion < SCHEMA_VERSION) this.save();
      }
    } catch { /* 손상 세이브는 무시하고 새로 시작 */ }
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
