// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { MetaProgress } from './MetaProgress'

// In-memory localStorage shim — avoids jsdom dep while letting save()/load()
// round-trip correctly within tests.
const store: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem:    (k: string)           => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string)           => { delete store[k] },
    clear:      ()                    => { Object.keys(store).forEach(k => delete store[k]) },
  },
  writable: true,
  configurable: true,
})

// Reset the singleton's in-memory state and the localStorage shim before each test.
// MetaProgress.data is a private static field; we bypass TypeScript's access
// restriction with `as any` since the field is compiled as a plain JS property.
function resetMeta() {
  Object.keys(store).forEach(k => delete store[k])
  ;(MetaProgress as any).data = {
    rp: 0,
    upgrades: {},
    unlocks: ['localhost', 'fullstack', 'frontend', 'backend'],
    achievements: [],
  }
}

beforeEach(resetMeta)

describe('MetaProgress', () => {
  describe('addRP', () => {
    it('increases rp by the exact amount when no rpBonus upgrade is active', () => {
      MetaProgress.addRP(100)
      expect(MetaProgress.rp).toBe(100)
    })

    it('returns the granted amount', () => {
      const granted = MetaProgress.addRP(50)
      expect(granted).toBe(50)
    })

    it('applies rpBonus multiplier after purchasing rpBonus upgrade', () => {
      // Give enough RP to buy rpBonus (cost = 50 × (0+1) = 50 at level 0)
      ;(MetaProgress as any).data.rp = 200
      MetaProgress.buyUpgrade('rpBonus') // level 0→1, costs 50 → rp becomes 150
      // bonus = 1 + 1 * 0.10 = 1.10
      const granted = MetaProgress.addRP(10)
      expect(granted).toBe(Math.floor(10 * 1.1)) // 11
      expect(MetaProgress.rp).toBe(150 + 11)     // 161
    })
  })

  describe('buyUpgrade', () => {
    it('returns false and leaves rp unchanged when RP is insufficient', () => {
      // rp = 0; startHp costs 30 at level 0
      const result = MetaProgress.buyUpgrade('startHp')
      expect(result).toBe(false)
      expect(MetaProgress.rp).toBe(0)
      expect(MetaProgress.upgradeLevel('startHp')).toBe(0)
    })

    it('returns true, increments upgrade level, and deducts cost when affordable', () => {
      ;(MetaProgress as any).data.rp = 100
      const result = MetaProgress.buyUpgrade('startHp') // costs 30×1 = 30
      expect(result).toBe(true)
      expect(MetaProgress.rp).toBe(70)
      expect(MetaProgress.upgradeLevel('startHp')).toBe(1)
    })

    it('cost scales with the current level (cost = baseCost × (level + 1))', () => {
      ;(MetaProgress as any).data.rp = 300
      MetaProgress.buyUpgrade('startHp') // level 0→1, cost = 30×1 = 30 → rp 270
      expect(MetaProgress.rp).toBe(270)
      MetaProgress.buyUpgrade('startHp') // level 1→2, cost = 30×2 = 60 → rp 210
      expect(MetaProgress.rp).toBe(210)
    })

    it('returns false and does not go beyond maxLevel', () => {
      // revive has maxLevel 1; cost = 200×1 = 200
      ;(MetaProgress as any).data.rp = 1000
      MetaProgress.buyUpgrade('revive') // succeeds → level 1
      expect(MetaProgress.upgradeLevel('revive')).toBe(1)

      const result = MetaProgress.buyUpgrade('revive') // already at maxLevel
      expect(result).toBe(false)
      expect(MetaProgress.upgradeLevel('revive')).toBe(1)
    })
  })

  describe('buyUnlock', () => {
    it('returns false when the content is already unlocked', () => {
      ;(MetaProgress as any).data.rp = 1000
      // 'localhost' is unlocked in the fresh state
      const result = MetaProgress.buyUnlock('localhost')
      expect(result).toBe(false)
    })

    it('unlocks content, deducts RP, and returns true when affordable', () => {
      ;(MetaProgress as any).data.rp = 200
      const result = MetaProgress.buyUnlock('staging') // costs 80
      expect(result).toBe(true)
      expect(MetaProgress.isUnlocked('staging')).toBe(true)
      expect(MetaProgress.rp).toBe(120)
    })

    it('returns false and does not unlock when RP is insufficient', () => {
      ;(MetaProgress as any).data.rp = 50
      const result = MetaProgress.buyUnlock('staging') // costs 80
      expect(result).toBe(false)
      expect(MetaProgress.isUnlocked('staging')).toBe(false)
      expect(MetaProgress.rp).toBe(50)
    })
  })

  describe('grantAchievement', () => {
    it('returns true and records the achievement on first grant', () => {
      const result = MetaProgress.grantAchievement('nodowntime')
      expect(result).toBe(true)
      expect(MetaProgress.hasAchievement('nodowntime')).toBe(true)
    })

    it('is idempotent: returns false when the achievement is granted again', () => {
      MetaProgress.grantAchievement('nodowntime')
      const result = MetaProgress.grantAchievement('nodowntime')
      expect(result).toBe(false)
    })

    it('does not duplicate the achievement id in the internal list', () => {
      MetaProgress.grantAchievement('allnighter')
      MetaProgress.grantAchievement('allnighter')
      const achievements: string[] = (MetaProgress as any).data.achievements
      const count = achievements.filter(id => id === 'allnighter').length
      expect(count).toBe(1)
    })

    it('saves state so that load() can restore the achievement', () => {
      MetaProgress.grantAchievement('incident')
      // Force a reload from the shim
      ;(MetaProgress as any).data = (MetaProgress as any).fresh()
      MetaProgress.load()
      expect(MetaProgress.hasAchievement('incident')).toBe(true)
    })
  })
})
