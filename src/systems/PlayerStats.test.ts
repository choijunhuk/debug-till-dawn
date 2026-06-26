import { describe, it, expect, vi, afterEach } from 'vitest'
import { PlayerStats } from './PlayerStats'
import { CLASSES } from '../data/classes'
import { BALANCE } from '../data/balance'

// PlayerStats calls MetaProgress.startBonuses() in its constructor.
// MetaProgress.startBonuses() only reads in-memory static state (no localStorage
// access), so no localStorage shim is needed here. save()/load() calls silently
// catch any ReferenceError in node environment.

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PlayerStats', () => {
  describe('addPassive accumulation', () => {
    it('increments passiveLevel by one per call', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('overclock')
      expect(stats.passiveLevels['overclock']).toBe(1)
      stats.addPassive('overclock')
      expect(stats.passiveLevels['overclock']).toBe(2)
    })

    it('caps passiveLevel at the passive maxLevel and does not exceed it', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      // stacktrace has maxLevel 1
      stats.addPassive('stacktrace')
      stats.addPassive('stacktrace') // second call must stay at 1
      expect(stats.passiveLevels['stacktrace']).toBe(1)
    })

    it('accumulates different passives independently', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('overclock')
      stats.addPassive('refactor')
      expect(stats.passiveLevels['overclock']).toBe(1)
      expect(stats.passiveLevels['refactor']).toBe(1)
    })

    it('recompute updates speedMul after adding overclock', () => {
      const stats = new PlayerStats(CLASSES.fullstack) // speedMul = 1
      stats.addPassive('overclock') // +0.12
      expect(stats.speedMul).toBeCloseTo(1.12, 5)
    })
  })

  describe('recompute caps', () => {
    it('caps crit at 0.9 when class crit exceeds the ceiling', () => {
      // Construct a class def with crit above the 0.9 cap
      const highCritCls = { ...CLASSES.fullstack, crit: 0.95 }
      const stats = new PlayerStats(highCritCls)
      expect(stats.crit).toBe(0.9)
    })

    it('does not cap crit that is within the allowed range', () => {
      const stats = new PlayerStats(CLASSES.fullstack) // crit = 0.05
      stats.addPassive('codereview') // +0.08 → 0.13
      expect(stats.crit).toBeCloseTo(0.13, 5)
      expect(stats.crit).toBeLessThan(0.9)
    })

    it('caps cooldownMul at 0.25 when passives push it below the floor', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      // lowlatency: cooldownMul 0.10/level. 8 levels → 0.80 reduction.
      // cd = 1 - 0.80 = 0.20, which is below the 0.25 floor.
      stats.passiveLevels['lowlatency'] = 8
      stats.recompute()
      expect(stats.cooldownMul).toBe(0.25)
    })

    it('cooldownMul is not capped when reduction stays above the floor', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('lowlatency') // 1 level → cd = 1 - 0.10 = 0.90
      expect(stats.cooldownMul).toBeCloseTo(0.90, 5)
      expect(stats.cooldownMul).toBeGreaterThan(0.25)
    })
  })

  describe('rollDamage', () => {
    it('returns a rounded integer amount and a boolean crit', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // above crit threshold → no crit
      const result = stats.rollDamage(10, 0)
      expect(typeof result.amount).toBe('number')
      expect(result.amount).toBe(Math.round(result.amount)) // must be an integer
      expect(typeof result.crit).toBe('boolean')
    })

    it('returns crit=false when Math.random is above the crit threshold', () => {
      const stats = new PlayerStats(CLASSES.fullstack) // crit = 0.05
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // 0.99 >= 0.05 → no crit
      const { crit } = stats.rollDamage(10, 0)
      expect(crit).toBe(false)
    })

    it('returns crit=true and applies critMul when Math.random is below crit threshold', () => {
      const stats = new PlayerStats(CLASSES.fullstack) // crit = 0.05, damageMulBase = 1
      vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < 0.05 → crit
      const { amount, crit } = stats.rollDamage(10, 0)
      expect(crit).toBe(true)
      expect(amount).toBe(Math.round(10 * 1 * BALANCE.weapon.critMul))
    })

    it('no-crit amount equals round(base * damageMul)', () => {
      const stats = new PlayerStats(CLASSES.fullstack) // damageMulBase = 1
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const { amount } = stats.rollDamage(15, 0)
      expect(amount).toBe(Math.round(15 * stats.damageMul(0)))
    })
  })

  describe('damageMul with lazyload passive', () => {
    it('damageMul increases with elapsed minutes when lazyload is present', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('lazyload') // lazyLoadLevel = 1
      const atZero = stats.damageMul(0)
      const atFive = stats.damageMul(5)
      expect(atFive).toBeGreaterThan(atZero)
    })

    it('damageMul is constant across elapsed time when lazyload is absent', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      expect(stats.damageMul(0)).toBe(stats.damageMul(10))
    })

    it('damageMul(10) equals damageMul(20) when lazyload is present (capped at 10 min)', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('lazyload')
      // Math.min(elapsedMin, 10) caps at 10
      expect(stats.damageMul(10)).toBeCloseTo(stats.damageMul(20), 10)
    })
  })

  describe('revive passive', () => {
    it('reviveAvailable starts false when no meta revive bonus exists', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      expect(stats.reviveAvailable).toBe(false)
    })

    it('sets reviveAvailable to true after adding the stacktrace passive', () => {
      const stats = new PlayerStats(CLASSES.fullstack)
      stats.addPassive('stacktrace')
      expect(stats.reviveAvailable).toBe(true)
    })
  })
})
