import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import type { EnemyDef } from '../data/types';

// 적 = 데이터 주도 행동. 풀링(Phaser Group). 보스도 같은 클래스.
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  static counter = 0;
  uid = ++Enemy.counter; // 투사체 중복타격 추적용 고유 id
  def!: EnemyDef;
  hp = 0;
  maxHp = 0;
  baseSpeed = 0;
  damage = 0;
  lastTouch = 0;
  lastDot = 0;      // 오브/장판 지속뎀 throttle
  slowUntil = 0;    // Docker 속박 종료 시각
  harmless = false; // Heisenbug 관측 중엔 무해
  baked = false;    // 절차 텍스처(색 내장) 여부 → 피격 복구 시 clearTint
  private bornAt = 0;
  private dashState = 0; // 0 대기, 1 돌진
  private dashAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');
    this.setDepth(5);
  }

  spawn(defId: string, x: number, y: number, elapsedMin: number, stageHpMul: number) {
    const def = ENEMIES[defId];
    this.def = def;
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    const b = BALANCE.enemy;
    this.maxHp = (b.baseHp + b.hpPerMin * elapsedMin) * def.hpMul * stageHpMul;
    this.hp = this.maxHp;
    this.baseSpeed = (b.baseSpeed + b.speedPerMin * elapsedMin) * def.speedMul;
    this.damage = b.baseDamage * def.damageMul;
    this.lastTouch = 0;
    this.harmless = false;
    this.bornAt = this.scene.time.now;
    this.dashState = 0;
    this.dashAt = this.scene.time.now + 1200;
    // 절차 모양 텍스처(있으면) → 색 내장. 없으면 원형 도형 + tint fallback.
    const shapeTex = `eshape_${defId}`;
    this.baked = this.scene.textures.exists(shapeTex);
    this.setTexture(this.baked ? shapeTex : 'enemy');
    this.setScale(def.scale);
    this.setRotation(0);
    if (this.baked) { const w = this.width; this.setCircle(w * 0.36, w * 0.14, w * 0.14); this.clearTint(); } // 텍스처 크기 비례 body
    else { this.setCircle(10, 6, 6); this.setTint(def.color); }      // 32x32 fallback
    this.setAlpha(def.phase ? 0.5 : 1);
  }

  // 매 프레임 행동 + 추적
  step(px: number, py: number, now: number) {
    const d = this.def;
    let speed = this.baseSpeed;
    const life = now - this.bornAt;

    if (d.phase) this.setAlpha(0.28 + 0.34 * Math.abs(Math.sin(now / 220))); // null 깜빡임(통과 연출)
    if (d.shape === 'infloop') this.rotation += 0.05 + (d.accel ? life / 90000 : 0); // 실제 회전(가속)
    if (now < this.slowUntil) speed *= 0.45;          // Docker 속박
    if (d.accel) speed *= 1 + life / 8000;            // 가속
    if (d.grow) {                                      // 성장(체력/크기)
      const g = 1 + Math.min(life / 12000, 1.2);
      this.setScale(d.scale * g);
    }
    if (d.vanishNear) {                                // Heisenbug: 가까우면 사라짐
      const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
      const near = dist < 150;
      this.harmless = near;
      this.setAlpha(near ? 0.08 : 1);
      if (near) { this.setVelocity(0, 0); return; }    // 관측되면 정지
    }
    if (d.dash) {                                      // Deadlock/dash: 대기 후 돌진
      if (this.dashState === 0 && now > this.dashAt) { this.dashState = 1; this.dashAt = now + 600; }
      else if (this.dashState === 1 && now > this.dashAt) { this.dashState = 0; this.dashAt = now + 1400; }
      if (this.dashState === 0) { this.setVelocity(0, 0); return; }
      if (d.shape === 'deadlock') this.rotation += 0.35; // 돌진 시 톱니 가속 회전
      speed *= 3.2;
    }

    const a = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    this.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.scene.tweens.add({ targets: this, duration: 50,
      onStart: () => this.setTintFill(0xffffff),
      onComplete: () => { if (this.baked) this.clearTint(); else this.setTint(this.def.color); } });
    return this.hp <= 0;
  }

  kill() { this.disableBody(true, true); }
}
