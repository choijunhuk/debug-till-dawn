import { describe, it, expect, vi } from 'vitest'

// Must be called before importing anything that imports Phaser.
// UpgradePool.ts does `import Phaser from 'phaser'` and calls
// Phaser.Utils.Array.Shuffle — mock it to be a deterministic identity.
vi.mock('phaser', () => ({
  default: {
    Utils: {
      Array: {
        Shuffle: <T>(arr: T[]): T[] => arr,
      },
    },
  },
}))

import { buildUpgradeOptions } from './UpgradePool'
import { WEAPONS } from '../data/weapons'
import { PASSIVES } from '../data/passives'

// Minimal duck-typed stubs that satisfy what buildUpgradeOptions actually
// accesses on WeaponSystem and PlayerStats — avoids importing those classes
// (which transitively import Phaser entity classes).
type WeaponsStub = {
  owned: Array<{ def: (typeof WEAPONS)[string]; level: number; lastFire: number; orbAngle: number; orbList: [] }>
  has: (id: string) => boolean
}

type StatsStub = {
  passiveLevels: Record<string, number>
  hasPassive: (id: string) => boolean
}

function makeWeapons(entries: Array<{ id: string; level: number }>): WeaponsStub {
  const owned = entries.map(({ id, level }) => ({
    def: WEAPONS[id],
    level,
    lastFire: 0,
    orbAngle: 0,
    orbList: [] as [],
  }))
  const ownedIds = new Set(entries.map(e => e.id))
  return { owned, has: (id) => ownedIds.has(id) }
}

function makeStats(passiveLevels: Record<string, number> = {}): StatsStub {
  return {
    passiveLevels,
    hasPassive: (id) => (passiveLevels[id] ?? 0) > 0,
  }
}

const noop = () => {}

describe('buildUpgradeOptions', () => {
  it('returns at most 3 options in a normal early-game scenario', () => {
    const weapons = makeWeapons([{ id: 'consolelog', level: 1 }])
    const stats = makeStats()
    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 6,
      noop, noop, noop, noop,
    )
    expect(opts.length).toBeLessThanOrEqual(3)
  })

  it('returns at least one option when weapons and passives are available', () => {
    const weapons = makeWeapons([{ id: 'consolelog', level: 1 }])
    const stats = makeStats()
    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 6,
      noop, noop, noop, noop,
    )
    expect(opts.length).toBeGreaterThan(0)
  })

  it('evolution option (gold) appears when weapon is maxed and its evoPassive is owned', () => {
    // consolelog: maxLevel=6, evolvesTo='consolespam', evoPassive='lowlatency'
    const weapons = makeWeapons([{ id: 'consolelog', level: 6 }])
    // consolespam is NOT in ownedIds → evolution has not been performed yet
    const stats = makeStats({ lowlatency: 1 })

    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 6,
      noop, noop, noop, noop,
    )

    const evo = opts.find(o => o.gold === true)
    expect(evo).toBeDefined()
    expect(evo!.title).toContain('console.spam()')
  })

  it('evolution option is absent when the required evoPassive is not owned', () => {
    const weapons = makeWeapons([{ id: 'consolelog', level: 6 }])
    const stats = makeStats() // lowlatency not owned

    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 6,
      noop, noop, noop, noop,
    )

    const evo = opts.find(o => o.gold === true)
    expect(evo).toBeUndefined()
  })

  it('evolution option is absent when weapon is not yet maxed', () => {
    const weapons = makeWeapons([{ id: 'consolelog', level: 3 }]) // not maxed (max=6)
    const stats = makeStats({ lowlatency: 1 })

    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 6,
      noop, noop, noop, noop,
    )

    const evo = opts.find(o => o.gold === true)
    expect(evo).toBeUndefined()
  })

  it('falls back to a single Hotfix heal card when the upgrade pool is fully exhausted', () => {
    // Conditions for total exhaustion:
    //   - No owned weapons → no weapon upgrades
    //   - weaponSlots = 0 → no new weapons
    //   - All passives at maxLevel → no passive upgrades
    //   - No evolutions possible (no weapons owned)
    const weapons = makeWeapons([])
    const allMaxed: Record<string, number> = {}
    for (const [id, def] of Object.entries(PASSIVES)) {
      allMaxed[id] = def.maxLevel
    }
    const stats = makeStats(allMaxed)

    const opts = buildUpgradeOptions(
      weapons as any, stats as any, 0,
      noop, noop, noop, noop,
    )

    expect(opts).toHaveLength(1)
    expect(opts[0].title).toBe('Hotfix')
  })
})
