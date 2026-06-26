import Phaser from 'phaser';
import { BALANCE } from '../data/balance';

// 미니언(npm install / Pair Programming 분신). 근처 떠다니며 가장 가까운 적에 자동 사격.
// ponytail: 미니언은 적과 충돌 안 함(불멸), 수명으로만 소멸 — 단순화.
export class Minion extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  private life = 0;
  private lastFire = 0;
  private orbitAngle = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'minion');
    this.setDepth(9);
  }

  activate(damage: number, durationMs: number, color: number, angle: number) {
    this.enableBody(true, this.x, this.y, true, true);
    this.setActive(true).setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.damage = damage;
    this.life = durationMs;
    this.lastFire = 0;
    this.orbitAngle = angle;
    this.setTint(color);
  }

  // 플레이어 주위 공전. 쿨다운마다 fire 콜백 호출. 수명 끝 false.
  update2(px: number, py: number, delta: number, now: number, fire: (x: number, y: number) => void): boolean {
    if (this.life !== Infinity) {
      this.life -= delta;
      if (this.life <= 0) { this.kill(); return false; }
    }
    this.orbitAngle += 0.02;
    const r = 70;
    this.setPosition(px + Math.cos(this.orbitAngle) * r, py + Math.sin(this.orbitAngle) * r);
    if (now - this.lastFire >= BALANCE.minion.cooldown) {
      this.lastFire = now;
      fire(this.x, this.y);
    }
    return true;
  }

  kill() { this.disableBody(true, true); }
}
