import Phaser from 'phaser';
import { logoTexture } from '../data/brandAssets';

export interface FireOpts {
  x: number; y: number; angle: number; speed: number; damage: number; color: number;
  pierce?: number; bounces?: number; knockback?: number; homing?: boolean;
  instakill?: number; crit?: boolean; scale?: number; icon?: string;
}

// 투사체. 관통/튕김/유도/넉백 지원. 풀링.
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  knockback = 0;
  pierceLeft = 0;
  bouncesLeft = 0;
  homing = false;
  instakill = 0;
  crit = false;
  bouncer = false; // 튕김 무기 여부
  hitSet = new Set<number>(); // 중복타격 방지(관통/튕김)
  private life = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'proj');
    this.setDepth(8);
  }

  fire(o: FireOpts) {
    this.enableBody(true, o.x, o.y, true, true);
    this.setActive(true).setVisible(true);
    this.damage = o.damage;
    this.knockback = o.knockback ?? 0;
    this.pierceLeft = o.pierce ?? 0;
    this.bouncesLeft = o.bounces ?? 0;
    this.homing = o.homing ?? false;
    this.instakill = o.instakill ?? 0;
    this.crit = o.crit ?? false;
    this.bouncer = (o.bounces ?? 0) > 0;
    this.hitSet.clear();
    this.life = 2000;
    const logo = logoTexture(o.icon);
    this.setTexture(logo ?? 'proj');
    if (logo) { this.setDisplaySize(22 * (o.scale ?? 1), 22 * (o.scale ?? 1)); this.setCircle(28, 4, 4); } // 로고 64→22px, body 도 축소
    else this.setScale(o.scale ?? 1);
    this.setTint(o.color);
    this.setRotation(logo ? 0 : o.angle); // 로고는 회전 안함(가독성)
    this.setVelocity(Math.cos(o.angle) * o.speed, Math.sin(o.angle) * o.speed);
  }

  // 수명 + 유도 조향. 회수면 false.
  tick(delta: number, steer?: { x: number; y: number } | null): boolean {
    this.life -= delta;
    if (this.life <= 0) { this.kill(); return false; }
    if (this.homing && steer) {
      const a = Phaser.Math.Angle.Between(this.x, this.y, steer.x, steer.y);
      const speed = this.body!.velocity.length();
      const cur = this.rotation;
      const na = Phaser.Math.Angle.RotateTo(cur, a, 0.08); // 부드러운 추적
      this.setRotation(na);
      this.setVelocity(Math.cos(na) * speed, Math.sin(na) * speed);
    }
    return true;
  }

  // 적 명중 처리. 계속 살아있으면 true.
  onHit(enemyId: number): boolean {
    if (this.hitSet.has(enemyId)) return true; // 이미 맞은 적
    this.hitSet.add(enemyId);
    if (this.pierceLeft > 0) { this.pierceLeft--; return true; }
    if (this.bouncesLeft > 0) { this.bouncesLeft--; return true; } // 방향전환은 scene 에서
    this.kill();
    return false;
  }

  kill() { this.disableBody(true, true); }
}
