import Phaser from 'phaser';

// 화면 장식/이펙트 모음(fire-and-forget). GameScene 의 책임을 줄이기 위해 분리.
// 게임플레이 로직은 일절 없음 — 순수 비주얼 + 타이밍.
export class GameFx {
  private scanlines!: Phaser.GameObjects.TileSprite;
  private codeBits: { t: Phaser.GameObjects.Text; sp: number }[] = [];

  constructor(private scene: Phaser.Scene) {}

  // 맵별 정체성: 스캔라인 + 비네팅 + 떠다니는 코드 글리프(parallax 코드 레인).
  setupMapFx(stageId: string, W: number, H: number) {
    const cfg = ({
      localhost: { p: 0x6a9955, scan: 0.04, vig: 0.32, count: 16 },
      staging: { p: 0x4ec9b0, scan: 0.05, vig: 0.38, count: 20 },
      production: { p: 0xff5c5c, scan: 0.08, vig: 0.50, count: 26 },
    } as Record<string, { p: number; scan: number; vig: number; count: number }>)[stageId]
      || { p: 0x6a9955, scan: 0.04, vig: 0.32, count: 16 };

    this.scanlines = this.scene.add.tileSprite(W / 2, H / 2, W, H, 'scanline').setScrollFactor(0).setDepth(49).setAlpha(cfg.scan);
    this.scene.add.image(W / 2, H / 2, 'vignette').setScrollFactor(0).setDepth(50).setDisplaySize(W * 1.05, H * 1.05).setAlpha(cfg.vig);

    const hex = '#' + cfg.p.toString(16).padStart(6, '0');
    const glyphs = ['0', '1', '{ }', '( )', '=>', ';', '</>', '&&', '||', '#', 'fn', '01'];
    this.codeBits = [];
    for (let i = 0; i < cfg.count; i++) {
      const t = this.scene.add.text(Math.random() * W, Math.random() * H, glyphs[i % glyphs.length], {
        fontFamily: 'monospace', fontSize: (10 + (Math.random() * 8 | 0)) + 'px', color: hex,
      }).setScrollFactor(0).setDepth(1).setAlpha(0.08 + Math.random() * 0.10);
      this.codeBits.push({ t, sp: 0.2 + Math.random() * 0.6 });
    }
  }

  // 살아있는 배경: 스캔라인 + 코드 레인 드리프트(일시정지 중에도). 매 프레임 호출.
  tickAmbient() {
    this.scanlines.tilePositionY += 0.3;
    const Hh = this.scene.scale.height, Ww = this.scene.scale.width;
    for (const b of this.codeBits) { b.t.y += b.sp; if (b.t.y > Hh + 12) { b.t.y = -12; b.t.x = Math.random() * Ww; } }
  }

  // 사망 = 0/1 텍스트가 흩어짐. ponytail: 3개/킬, 대량킬(nuke) 시 누적되면 줄일 것.
  emitBits(x: number, y: number, color: number) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    for (let i = 0; i < 3; i++) {
      const t = this.scene.add.text(x, y, Math.random() < 0.5 ? '0' : '1', {
        fontFamily: 'monospace', fontSize: '12px', color: hex,
      }).setOrigin(0.5).setDepth(15);
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 24;
      this.scene.tweens.add({
        targets: t, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0,
        duration: 280 + Math.random() * 220, ease: 'Quad.easeOut', onComplete: () => t.destroy(),
      });
    }
  }

  killBurst(x: number, y: number, color: number) {
    const c = this.scene.add.circle(x, y, 6, color, 0.9).setDepth(6);
    this.scene.tweens.add({ targets: c, scale: 2, alpha: 0, duration: 180, onComplete: () => c.destroy() });
  }

  // 폭발의 비주얼 링만(데미지 처리는 GameScene.explode 에 남음).
  explodeVisual(x: number, y: number, r: number, color: number) {
    const radius = Math.min(r, 400);
    const c = this.scene.add.circle(x, y, radius, color, 0.3).setDepth(6).setScale(0.2);
    this.scene.tweens.add({ targets: c, scale: 1, alpha: 0, duration: 300, onComplete: () => c.destroy() });
  }

  addDmgText(x: number, y: number, amount: number, crit: boolean) {
    const t = this.scene.add.text(x, y, `${amount}`, {
      fontFamily: 'monospace', fontSize: crit ? '18px' : '13px', color: crit ? '#ffd700' : '#ffffff',
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  // 히트스톱: 큰 순간(보스 사망)만. 물리 일시정지 후 실시간 타이머로 복귀(timeScale 함정 회피).
  hitstop(ms: number, canRun: () => boolean) {
    if (!canRun()) return;
    this.scene.physics.pause();
    window.setTimeout(() => { if (canRun()) this.scene.physics.resume(); }, ms);
  }
}
