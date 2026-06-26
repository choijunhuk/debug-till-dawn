import Phaser from 'phaser';
import { BALANCE } from '../data/balance';

// 에디터 패널 HUD + 보스 HP바. 카메라 고정.
export class HUD {
  private scene: Phaser.Scene;
  private hpBar: Phaser.GameObjects.Graphics;
  private xpBar: Phaser.GameObjects.Graphics;
  private bossBar: Phaser.GameObjects.Graphics;
  private timerText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private killText: Phaser.GameObjects.Text;
  private bossName: Phaser.GameObjects.Text;
  private objectiveText: Phaser.GameObjects.Text;
  private W: number;
  private bossRatio = -1;

  constructor(scene: Phaser.Scene, stageName: string) {
    this.scene = scene;
    this.W = scene.scale.width;
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(100);
    this.xpBar = scene.add.graphics().setScrollFactor(0).setDepth(100);
    this.bossBar = scene.add.graphics().setScrollFactor(0).setDepth(100);

    const style = { fontFamily: 'monospace', fontSize: '16px', color: '#dcdcaa' };
    this.timerText = scene.add.text(this.W / 2, 14, 'uptime 00:00', style).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    this.levelText = scene.add.text(12, 12, 'Lv.1', { ...style, color: '#4ec9b0' }).setScrollFactor(0).setDepth(101);
    this.killText = scene.add.text(this.W - 12, 12, 'kills 0', { ...style, color: '#ce9178' }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    scene.add.text(12, 56, `@${stageName}`, { ...style, fontSize: '13px', color: '#6e7681' }).setScrollFactor(0).setDepth(101);
    this.bossName = scene.add.text(this.W / 2, 40, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ff5555' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    // 목표 안내: 타이머 아래 중앙. 보스 등장 중엔 숨김(보스 HP바와 겹침 방지).
    this.objectiveText = scene.add.text(this.W / 2, 58, '', { fontFamily: 'monospace', fontSize: '12px', color: '#8b949e' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
  }

  // 다음 보스 카운트다운 + 처치 현황. 보스 활성 중엔 숨김.
  updateObjective(nextBossInMs: number | null, bossesKilled: number, totalBosses: number) {
    if (this.bossRatio >= 0) { this.objectiveText.setText(''); return; }
    const done = bossesKilled >= totalBosses;
    if (done) { this.objectiveText.setText('All clear — survive!'); return; }
    const counter = `Bosses ${bossesKilled}/${totalBosses}`;
    if (nextBossInMs == null) { this.objectiveText.setText(counter); return; }
    const s = Math.max(0, Math.floor(nextBossInMs / 1000));
    const mmss = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    this.objectiveText.setText(`Next Incident ${mmss}   ${counter}`);
  }

  setBoss(name: string) { this.bossRatio = 1; this.bossName.setText('☠ ' + name); }
  updateBoss(ratio: number) { this.bossRatio = ratio; }
  clearBoss() { this.bossRatio = -1; this.bossName.setText(''); this.bossBar.clear(); }

  update(hp: number, maxHp: number, xp: number, xpNeed: number, level: number, kills: number, elapsedMs: number) {
    this.hpBar.clear();
    this.hpBar.fillStyle(0x222a33).fillRect(12, 36, 220, 14);
    this.hpBar.fillStyle(0x6a9955).fillRect(12, 36, 220 * Math.max(0, hp / maxHp), 14);
    this.hpBar.lineStyle(1, 0x4ec9b0).strokeRect(12, 36, 220, 14);

    const y = this.scene.scale.height - 18;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x222a33).fillRect(0, y, this.W, 6);
    this.xpBar.fillStyle(0xc586c0).fillRect(0, y, this.W * Math.min(1, xp / xpNeed), 6);

    if (this.bossRatio >= 0) {
      const bw = BALANCE.boss.hpBarW, bx = this.W / 2 - bw / 2, by = 58;
      this.bossBar.clear();
      this.bossBar.fillStyle(0x330000).fillRect(bx, by, bw, 8);
      this.bossBar.fillStyle(0xff2222).fillRect(bx, by, bw * Math.max(0, this.bossRatio), 8);
    }

    const s = Math.floor(elapsedMs / 1000);
    this.timerText.setText(`uptime ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    this.levelText.setText(`Lv.${level}`);
    this.killText.setText(`kills ${kills}`);
  }
}
