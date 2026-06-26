import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import { logoTexture } from '../data/brandAssets';

// XP 젬 = 커밋 조각(초록 네모). 픽업 반경 안이면 자석.
export class XPGem extends Phaser.Physics.Arcade.Sprite {
  value = 1;
  private magnet = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gem');
    this.setDepth(4);
  }

  drop(x: number, y: number, value: number) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setVelocity(0, 0);
    this.value = value;
    this.magnet = false;
    // 커밋 = github 잔디. 로고 흰 실루엣을 잔디 초록으로 tint.
    const logo = logoTexture('github');
    this.setTexture(logo ?? 'gem');
    const sz = value >= 3 ? 18 : value >= 2 ? 15 : 12;
    if (logo) { this.setDisplaySize(sz, sz); this.setCircle(28, 4, 4); } else this.setScale(value >= 3 ? 1.5 : value >= 2 ? 1.2 : 1);
    this.setTint(value >= 3 ? 0x39d353 : value >= 2 ? 0x26a641 : 0x6a9955);
  }

  forceMagnet() { this.magnet = true; }

  pull(px: number, py: number, radius: number) {
    const d = Phaser.Math.Distance.Between(this.x, this.y, px, py);
    if (this.magnet || d < radius) {
      this.magnet = true;
      const a = Phaser.Math.Angle.Between(this.x, this.y, px, py);
      this.setVelocity(Math.cos(a) * BALANCE.xp.magnetSpeed, Math.sin(a) * BALANCE.xp.magnetSpeed);
    }
  }

  kill() { this.disableBody(true, true); }
}
