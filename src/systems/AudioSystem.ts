// 절차 생성 오디오 — 오디오 파일 0개.
// SFX: OfflineAudioContext로 1회 렌더 → AudioBuffer 캐싱 → 재생 시 BufferSource만 생성(성능).
// BGM: 16스텝 시퀀서(베이스+리드+노이즈 햇), 룩어헤드 스케줄링으로 탭 스로틀링에도 박자 유지.
// AudioContext는 첫 유저 입력(pointerdown/keydown)에서 생성(브라우저 autoplay 정책).
// 볼륨 설정은 MetaProgress 와 같은 방식으로 localStorage 저장.

type Wave = OscillatorType;

export interface SfxDef {
  wave: Wave | 'noise';
  freq: number;
  freqEnd?: number;      // 지정 시 duration 동안 지수 슬라이드
  duration: number;      // 초
  attack?: number;       // 초 (기본 0.002)
  volume?: number;       // 0..1 (기본 0.2)
  noiseMix?: number;     // 0..1: 노이즈 레이어 추가
  arp?: number[];        // 주파수 배율 시퀀스(duration 균등 분할) — 아르페지오
  lowpass?: number;      // 로우패스 컷오프(Hz)
}

export const SFX_DEFS = {
  // 무기 발사 — 계열별 톤 구분(투사체/채찍/오라/소환/광역)
  fire_projectile: { wave: 'square', freq: 880, freqEnd: 620, duration: 0.05, volume: 0.14 },
  fire_whip:       { wave: 'sawtooth', freq: 240, freqEnd: 130, duration: 0.09, volume: 0.18 },
  fire_aura:       { wave: 'sine', freq: 520, freqEnd: 470, duration: 0.07, volume: 0.1 },
  fire_summon:     { wave: 'triangle', freq: 440, freqEnd: 700, duration: 0.08, volume: 0.16 },
  fire_heavy:      { wave: 'sawtooth', freq: 180, freqEnd: 50, duration: 0.3, volume: 0.28, noiseMix: 0.3 },
  // 전투
  enemy_hit:       { wave: 'square', freq: 150, freqEnd: 90, duration: 0.06, volume: 0.2, noiseMix: 0.5, lowpass: 900 },
  enemy_die:       { wave: 'square', freq: 620, freqEnd: 110, duration: 0.16, volume: 0.2 },
  player_hit:      { wave: 'sawtooth', freq: 130, freqEnd: 60, duration: 0.22, volume: 0.34, noiseMix: 0.7, lowpass: 700 },
  boss_spawn:      { wave: 'sawtooth', freq: 65, duration: 1.0, volume: 0.32, arp: [1, 1, 5, 1, 1, 5, 1, 1], lowpass: 2400 },
  // 성장
  xp:              { wave: 'sine', freq: 880, freqEnd: 1320, duration: 0.07, volume: 0.13 },
  levelup:         { wave: 'square', freq: 523, duration: 0.55, volume: 0.22, arp: [1, 1.26, 1.5, 2, 1.5, 2] },
  evolve:          { wave: 'triangle', freq: 440, duration: 0.7, volume: 0.24, arp: [1, 1.26, 1.5, 2, 2.52, 3, 4], noiseMix: 0.06 },
  // 픽업
  pickup_coffee:   { wave: 'sine', freq: 660, duration: 0.16, volume: 0.2, arp: [1, 1.5, 1.25, 2] },
  pickup_bomb:     { wave: 'noise', freq: 100, duration: 0.4, volume: 0.34, lowpass: 500 },
  pickup_magnet:   { wave: 'sine', freq: 300, freqEnd: 1500, duration: 0.28, volume: 0.18 },
  // UI
  ui_click:        { wave: 'square', freq: 1800, freqEnd: 1400, duration: 0.03, volume: 0.1 },
  ui_hover:        { wave: 'square', freq: 1300, duration: 0.02, volume: 0.05 },
} satisfies Record<string, SfxDef>;

export type SfxKey = keyof typeof SFX_DEFS;

// 스팸 방지: 키별 최소 재생 간격(ms). 적 200마리 상황에서 소스 노드 폭주 방지.
const MIN_INTERVAL: Partial<Record<SfxKey, number>> = {
  enemy_hit: 50, enemy_die: 60, xp: 35, fire_projectile: 40,
};
const DEFAULT_MIN_INTERVAL = 30;

// BGM 트랙: 16스텝 패턴, midi 노트 번호(0=쉼표)
export interface BgmTrack {
  bpm: number;
  bassWave: Wave; leadWave: Wave;
  bass: number[]; lead: number[]; hat: number[];
  bassVol: number; leadVol: number; hatVol: number;
}

export const BGM_TRACKS: Record<string, BgmTrack> = {
  // 느긋한 로파이 — C 장조 펜타토닉
  localhost: {
    bpm: 84, bassWave: 'triangle', leadWave: 'triangle',
    bass: [36, 0, 0, 0, 43, 0, 0, 0, 36, 0, 0, 0, 41, 0, 43, 0],
    lead: [72, 0, 76, 0, 79, 0, 0, 74, 72, 0, 0, 0, 76, 0, 74, 0],
    hat:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    bassVol: 0.16, leadVol: 0.1, hatVol: 0.05,
  },
  // 미들 템포, 긴장 살짝 — A 도리안
  staging: {
    bpm: 112, bassWave: 'square', leadWave: 'square',
    bass: [33, 0, 33, 0, 36, 0, 33, 0, 33, 0, 33, 0, 40, 0, 38, 0],
    lead: [69, 0, 72, 74, 0, 76, 0, 74, 72, 0, 69, 0, 74, 0, 76, 0],
    hat:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
    bassVol: 0.14, leadVol: 0.08, hatVol: 0.06,
  },
  // 빠른 BPM, 단조 드라이브 — E 단조
  production: {
    bpm: 144, bassWave: 'sawtooth', leadWave: 'square',
    bass: [28, 28, 0, 28, 28, 0, 28, 0, 28, 28, 0, 28, 31, 0, 26, 0],
    lead: [76, 0, 79, 0, 82, 79, 0, 76, 74, 0, 76, 0, 79, 0, 83, 0],
    hat:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bassVol: 0.15, leadVol: 0.08, hatVol: 0.07,
  },
  // 보스전 — 저역 드론 + 경고 스탭
  boss: {
    bpm: 152, bassWave: 'sawtooth', leadWave: 'square',
    bass: [24, 24, 0, 24, 24, 0, 24, 24, 24, 24, 0, 24, 27, 0, 23, 0],
    lead: [0, 0, 0, 0, 84, 0, 0, 0, 0, 0, 0, 0, 90, 0, 84, 0],
    hat:  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    bassVol: 0.17, leadVol: 0.09, hatVol: 0.07,
  },
  // 메뉴/상점 — 잔잔한 앰비언트
  ambient: {
    bpm: 70, bassWave: 'triangle', leadWave: 'sine',
    bass: [36, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0],
    lead: [0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 74, 0, 0, 0, 79, 0],
    hat:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassVol: 0.1, leadVol: 0.06, hatVol: 0,
  },
};

export interface AudioSettings { master: number; bgm: number; sfx: number; }
const SETTINGS_KEY = 'dtd_audio_v1';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// XP 연속 픽업 콤보 피치: 개당 +4.5%, 2배 상한
export const xpComboRate = (combo: number) => Math.min(2, 1 + combo * 0.045);

const midiFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioSystem {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode;
  private static bgmGain: GainNode;
  private static sfxGain: GainNode;
  private static buffers = new Map<SfxKey, AudioBuffer>();
  private static noiseBuf: AudioBuffer | null = null;
  private static settings: AudioSettings = { master: 0.8, bgm: 0.6, sfx: 0.8 };
  private static lastPlay = new Map<SfxKey, number>();
  private static xpCombo = 0;
  private static lastXpAt = 0;
  // BGM 시퀀서 상태
  private static currentBgm: string | null = null;
  private static step = 0;
  private static nextStepTime = 0;
  private static schedTimer: ReturnType<typeof setInterval> | null = null;

  static init() {
    this.loadSettings();
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  private static unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC() as AudioContext;
    this.masterGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.applyVolumes();
    // 햇 퍼커션용 공용 노이즈 버퍼(0.05s) 1회 생성
    const sr = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, Math.ceil(sr * 0.05), sr);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    void this.renderAll();
    if (this.currentBgm) this.startScheduler();
  }

  private static async renderAll() {
    for (const [key, def] of Object.entries(SFX_DEFS) as [SfxKey, SfxDef][]) {
      try { this.buffers.set(key, await this.renderSfx(def)); }
      catch { /* OfflineAudioContext 미지원 → 해당 SFX 없이 진행 */ }
    }
  }

  // jsfxr 스타일 미니 신스: osc(+arp/slide) + 노이즈 레이어 + 게인 엔벨로프 + 로우패스
  private static renderSfx(def: SfxDef): Promise<AudioBuffer> {
    const sr = 22050;
    const len = Math.max(1, Math.ceil(def.duration * sr));
    const off = new OfflineAudioContext(1, len, sr);
    const out = off.createGain();
    const vol = def.volume ?? 0.2;
    out.gain.setValueAtTime(0, 0);
    out.gain.linearRampToValueAtTime(vol, def.attack ?? 0.002);
    out.gain.exponentialRampToValueAtTime(0.001, def.duration);
    let tail: AudioNode = out;
    if (def.lowpass) {
      const f = off.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = def.lowpass;
      tail.connect(f); tail = f;
    }
    tail.connect(off.destination);

    if (def.wave !== 'noise') {
      const osc = off.createOscillator();
      osc.type = def.wave;
      if (def.arp) {
        const stepDur = def.duration / def.arp.length;
        def.arp.forEach((m, i) => osc.frequency.setValueAtTime(def.freq * m, i * stepDur));
      } else {
        osc.frequency.setValueAtTime(def.freq, 0);
        if (def.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, def.freqEnd), def.duration);
      }
      osc.connect(out);
      osc.start(0); osc.stop(def.duration);
    }
    if (def.wave === 'noise' || def.noiseMix) {
      const nb = off.createBuffer(1, len, sr);
      const d = nb.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = off.createBufferSource();
      src.buffer = nb;
      const ng = off.createGain();
      ng.gain.value = def.wave === 'noise' ? 1 : (def.noiseMix ?? 0);
      src.connect(ng); ng.connect(out);
      src.start(0);
    }
    return off.startRendering();
  }

  // ---- SFX 재생 ----
  static play(key: SfxKey, opts?: { rate?: number; volume?: number }) {
    if (!this.ctx || this.settings.master === 0 || this.settings.sfx === 0) return;
    const buf = this.buffers.get(key);
    if (!buf) return;
    const now = performance.now();
    if (now - (this.lastPlay.get(key) ?? -Infinity) < (MIN_INTERVAL[key] ?? DEFAULT_MIN_INTERVAL)) return;
    this.lastPlay.set(key, now);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts?.rate ?? 1;
    if (opts?.volume != null) {
      const g = this.ctx.createGain();
      g.gain.value = opts.volume;
      src.connect(g); g.connect(this.sfxGain);
    } else {
      src.connect(this.sfxGain);
    }
    src.start();
  }

  // 무기 계열별 발사음 라우팅(투사체 계열은 behavior 별 피치 변주)
  static playFire(behavior: string) {
    switch (behavior) {
      case 'whip': this.play('fire_whip'); break;
      case 'aura': this.play('fire_aura'); break;
      case 'summon': this.play('fire_summon'); break;
      case 'nuke': case 'bomb': this.play('fire_heavy'); break;
      default: {
        const rate = behavior === 'pierce' ? 0.8 : behavior === 'homing' ? 1.15 : behavior === 'bounce' ? 1.06 : 1;
        this.play('fire_projectile', { rate: rate * (0.97 + Math.random() * 0.06) });
      }
    }
  }

  // XP 픽업: 800ms 내 연속 픽업 시 피치 상승(콤보)
  static playXp() {
    const now = performance.now();
    if (now - this.lastXpAt > 800) this.xpCombo = 0;
    this.lastXpAt = now;
    this.play('xp', { rate: xpComboRate(this.xpCombo) });
    this.xpCombo++;
  }

  // ---- BGM ----
  static playBgm(id: string) {
    const key = BGM_TRACKS[id] ? id : 'ambient';
    if (this.currentBgm === key) return;
    this.haltScheduler();
    this.currentBgm = key;
    if (this.ctx) this.startScheduler();
    // ctx 없으면(첫 입력 전) currentBgm 만 기억 → unlock 시 시작
  }

  static stopBgm() {
    this.haltScheduler();
    this.currentBgm = null;
  }

  private static haltScheduler() {
    if (this.schedTimer != null) { clearInterval(this.schedTimer); this.schedTimer = null; }
  }

  private static startScheduler() {
    this.step = 0;
    this.nextStepTime = this.ctx!.currentTime + 0.05;
    this.schedTimer = setInterval(() => this.scheduleAhead(), 60);
  }

  private static scheduleAhead() {
    const ctx = this.ctx!;
    const track = this.currentBgm ? BGM_TRACKS[this.currentBgm] : null;
    if (!track) return;
    const stepDur = 60 / track.bpm / 4; // 16분음표
    while (this.nextStepTime < ctx.currentTime + 0.2) {
      this.scheduleStep(track, this.step % 16, this.nextStepTime, stepDur);
      this.step++;
      this.nextStepTime += stepDur;
    }
  }

  private static scheduleStep(t: BgmTrack, i: number, when: number, stepDur: number) {
    const ctx = this.ctx!;
    const note = (midi: number, wave: Wave, vol: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = midiFreq(midi);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      osc.connect(g); g.connect(this.bgmGain);
      osc.start(when); osc.stop(when + dur);
    };
    if (t.bass[i]) note(t.bass[i], t.bassWave, t.bassVol, stepDur * 1.8);
    if (t.lead[i]) note(t.lead[i], t.leadWave, t.leadVol, stepDur * 0.9);
    if (t.hat[i] && t.hatVol > 0 && this.noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(t.hatVol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.03);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 6000;
      src.connect(hp); hp.connect(g); g.connect(this.bgmGain);
      src.start(when); src.stop(when + 0.05);
    }
  }

  // ---- 볼륨 설정 (Phase 6 설정 메뉴 연동 지점) ----
  static getVolume(ch: keyof AudioSettings) { return this.settings[ch]; }
  static setVolume(ch: keyof AudioSettings, v: number) {
    this.settings[ch] = clamp01(v);
    this.applyVolumes();
    this.saveSettings();
  }
  static effectiveVolume(ch: 'bgm' | 'sfx') { return this.settings.master * this.settings[ch]; }

  private static applyVolumes() {
    if (!this.ctx) return;
    this.masterGain.gain.value = this.settings.master;
    this.bgmGain.gain.value = this.settings.bgm;
    this.sfxGain.gain.value = this.settings.sfx;
  }

  private static loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      for (const k of ['master', 'bgm', 'sfx'] as const) {
        if (typeof p[k] === 'number' && isFinite(p[k])) this.settings[k] = clamp01(p[k]);
      }
    } catch { /* 손상 설정 무시 → 기본값 */ }
  }
  private static saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* 저장 실패 무시 */ }
  }
}
