import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioSystem, SFX_DEFS, BGM_TRACKS, clamp01, xpComboRate } from './AudioSystem'
import type { SfxKey } from './AudioSystem'

// AudioContext 없는 node 환경에서 순수 로직만 검증.
// init()은 window가 없으면 리스너 등록을 건너뛰고 설정 로드만 수행한다.

const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
})

beforeEach(() => {
  store.clear()
  // 이전 테스트의 정적 상태 초기화
  AudioSystem.setVolume('master', 0.8)
  AudioSystem.setVolume('bgm', 0.6)
  AudioSystem.setVolume('sfx', 0.8)
  store.clear()
})

describe('SFX 정의', () => {
  const required: SfxKey[] = [
    'fire_projectile', 'fire_whip', 'fire_aura', 'fire_summon', 'fire_heavy',
    'enemy_hit', 'enemy_die', 'player_hit', 'boss_spawn',
    'xp', 'levelup', 'evolve',
    'pickup_coffee', 'pickup_bomb', 'pickup_magnet',
    'ui_click', 'ui_hover',
  ]

  it('스펙의 모든 SFX 키가 존재한다', () => {
    for (const key of required) expect(SFX_DEFS[key]).toBeDefined()
  })

  it('모든 SFX가 유효한 duration/volume/freq를 가진다', () => {
    for (const def of Object.values(SFX_DEFS)) {
      expect(def.duration).toBeGreaterThan(0)
      expect(def.duration).toBeLessThanOrEqual(2) // 짧은 SFX만(렌더 버퍼 상한)
      expect(def.freq).toBeGreaterThan(0)
      const vol = def.volume ?? 0.2
      expect(vol).toBeGreaterThan(0)
      expect(vol).toBeLessThanOrEqual(1)
    }
  })
})

describe('BGM 트랙 정의', () => {
  it('스테이지 3종 + boss + ambient 트랙이 존재한다', () => {
    for (const id of ['localhost', 'staging', 'production', 'boss', 'ambient']) {
      expect(BGM_TRACKS[id]).toBeDefined()
    }
  })

  it('모든 패턴은 16스텝이고 bpm이 양수다', () => {
    for (const t of Object.values(BGM_TRACKS)) {
      expect(t.bass).toHaveLength(16)
      expect(t.lead).toHaveLength(16)
      expect(t.hat).toHaveLength(16)
      expect(t.bpm).toBeGreaterThan(0)
    }
  })

  it('스테이지 분위기: localhost는 느리고 production은 빠르다', () => {
    expect(BGM_TRACKS.localhost.bpm).toBeLessThan(BGM_TRACKS.staging.bpm)
    expect(BGM_TRACKS.staging.bpm).toBeLessThan(BGM_TRACKS.production.bpm)
  })
})

describe('볼륨 설정', () => {
  it('setVolume은 0..1로 클램프한다', () => {
    AudioSystem.setVolume('master', 2)
    expect(AudioSystem.getVolume('master')).toBe(1)
    AudioSystem.setVolume('master', -0.5)
    expect(AudioSystem.getVolume('master')).toBe(0)
  })

  it('effectiveVolume = master × 채널', () => {
    AudioSystem.setVolume('master', 0.5)
    AudioSystem.setVolume('sfx', 0.8)
    expect(AudioSystem.effectiveVolume('sfx')).toBeCloseTo(0.4, 10)
  })

  it('master 0이면 뮤트(effectiveVolume 0)', () => {
    AudioSystem.setVolume('master', 0)
    expect(AudioSystem.effectiveVolume('bgm')).toBe(0)
    expect(AudioSystem.effectiveVolume('sfx')).toBe(0)
  })

  it('setVolume은 localStorage에 저장된다', () => {
    AudioSystem.setVolume('bgm', 0.35)
    const saved = JSON.parse(store.get('dtd_audio_v1')!)
    expect(saved.bgm).toBeCloseTo(0.35, 10)
  })

  it('init()은 저장된 설정을 로드하고 손상 값은 클램프/무시한다', () => {
    store.set('dtd_audio_v1', JSON.stringify({ master: 0.3, bgm: 5, sfx: 'bad' }))
    AudioSystem.init()
    expect(AudioSystem.getVolume('master')).toBeCloseTo(0.3, 10)
    expect(AudioSystem.getVolume('bgm')).toBe(1)      // 5 → 클램프
    expect(AudioSystem.getVolume('sfx')).toBe(0.8)    // 문자열 → 기존값 유지
  })

  it('init()은 손상된 JSON을 무시한다', () => {
    store.set('dtd_audio_v1', '{corrupt')
    expect(() => AudioSystem.init()).not.toThrow()
    expect(AudioSystem.getVolume('master')).toBe(0.8)
  })
})

describe('재생 안전성 (AudioContext 없음)', () => {
  it('unlock 전 play/playBgm/stopBgm은 throw 없이 no-op', () => {
    expect(() => AudioSystem.play('enemy_hit')).not.toThrow()
    expect(() => AudioSystem.playFire('projectile')).not.toThrow()
    expect(() => AudioSystem.playXp()).not.toThrow()
    expect(() => AudioSystem.playBgm('production')).not.toThrow()
    expect(() => AudioSystem.stopBgm()).not.toThrow()
  })

  it('미정의 BGM id는 ambient로 폴백해도 throw하지 않는다', () => {
    expect(() => AudioSystem.playBgm('no_such_stage')).not.toThrow()
  })
})

describe('순수 헬퍼', () => {
  it('clamp01', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1.5)).toBe(1)
  })

  it('xpComboRate: 1.0에서 시작, 단조 증가, 2.0 상한', () => {
    expect(xpComboRate(0)).toBe(1)
    expect(xpComboRate(5)).toBeGreaterThan(xpComboRate(1))
    expect(xpComboRate(1000)).toBe(2)
  })
})
