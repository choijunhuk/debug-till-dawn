import { describe, it, expect } from 'vitest'
import { WEAPONS } from './weapons'
import { PASSIVES } from './passives'
import { ENEMIES } from './enemies'
import { CLASSES } from './classes'
import { STAGES } from './stages'
import { META_UPGRADES, UNLOCKS, ACHIEVEMENTS } from './metaUpgrades'

describe('data integrity', () => {
  it('every CLASSES startWeapon exists in WEAPONS', () => {
    for (const [key, cls] of Object.entries(CLASSES)) {
      expect(
        WEAPONS,
        `class "${key}" startWeapon "${cls.startWeapon}" missing from WEAPONS`,
      ).toHaveProperty(cls.startWeapon)
    }
  })

  it('every WEAPONS evolvesTo target exists in WEAPONS', () => {
    for (const [key, w] of Object.entries(WEAPONS)) {
      if (w.evolvesTo) {
        expect(
          WEAPONS,
          `weapon "${key}" evolvesTo "${w.evolvesTo}" missing from WEAPONS`,
        ).toHaveProperty(w.evolvesTo)
      }
    }
  })

  it('every WEAPONS evoPassive exists in PASSIVES', () => {
    for (const [key, w] of Object.entries(WEAPONS)) {
      if (w.evoPassive) {
        expect(
          PASSIVES,
          `weapon "${key}" evoPassive "${w.evoPassive}" missing from PASSIVES`,
        ).toHaveProperty(w.evoPassive)
      }
    }
  })

  it('every STAGES enemyPool id exists in ENEMIES', () => {
    for (const [stageKey, stage] of Object.entries(STAGES)) {
      for (const enemyId of stage.enemyPool) {
        expect(
          ENEMIES,
          `stage "${stageKey}" enemyPool id "${enemyId}" missing from ENEMIES`,
        ).toHaveProperty(enemyId)
      }
    }
  })

  it('every STAGES boss id exists in ENEMIES and has boss:true', () => {
    for (const [stageKey, stage] of Object.entries(STAGES)) {
      for (const boss of stage.bosses) {
        expect(
          ENEMIES,
          `stage "${stageKey}" boss id "${boss.id}" missing from ENEMIES`,
        ).toHaveProperty(boss.id)
        expect(
          ENEMIES[boss.id].boss,
          `stage "${stageKey}" boss "${boss.id}" missing boss:true flag`,
        ).toBe(true)
      }
    }
  })

  it('every WEAPONS record key matches its id field', () => {
    for (const [key, w] of Object.entries(WEAPONS)) {
      expect(w.id, `WEAPONS["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every PASSIVES record key matches its id field', () => {
    for (const [key, p] of Object.entries(PASSIVES)) {
      expect(p.id, `PASSIVES["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every ENEMIES record key matches its id field', () => {
    for (const [key, e] of Object.entries(ENEMIES)) {
      expect(e.id, `ENEMIES["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every CLASSES record key matches its id field', () => {
    for (const [key, c] of Object.entries(CLASSES)) {
      expect(c.id, `CLASSES["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every STAGES record key matches its id field', () => {
    for (const [key, s] of Object.entries(STAGES)) {
      expect(s.id, `STAGES["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every META_UPGRADES record key matches its id field', () => {
    for (const [key, u] of Object.entries(META_UPGRADES)) {
      expect(u.id, `META_UPGRADES["${key}"].id mismatch`).toBe(key)
    }
  })

  it('every UNLOCKS entry of type "class" has a matching key in CLASSES', () => {
    for (const [key, u] of Object.entries(UNLOCKS)) {
      if (u.type === 'class') {
        expect(
          CLASSES,
          `unlock "${key}" (type class) not found in CLASSES`,
        ).toHaveProperty(key)
      }
    }
  })

  it('every UNLOCKS entry of type "stage" has a matching key in STAGES', () => {
    for (const [key, u] of Object.entries(UNLOCKS)) {
      if (u.type === 'stage') {
        expect(
          STAGES,
          `unlock "${key}" (type stage) not found in STAGES`,
        ).toHaveProperty(key)
      }
    }
  })

  it('achievement ids are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    const uniqueCount = new Set(ids).size
    expect(uniqueCount).toBe(ids.length)
  })
})
