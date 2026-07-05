import Phaser from 'phaser';
import type { WeaponDef } from '../data/types';
import { WEAPONS } from '../data/weapons';
import { BALANCE } from '../data/balance';
import { Enemy } from '../entities/Enemy';
import { Orb } from '../entities/Orb';
import { Minion } from '../entities/Minion';
import type { FireOpts } from '../entities/Projectile';
import type { PlayerStats } from './PlayerStats';
import { AudioSystem } from './AudioSystem';

// scene 이 구현해 넘기는 컨텍스트. 데미지/사망 처리는 전부 여기 통해 중앙화.
export interface WeaponCtx {
  scene: Phaser.Scene;
  px: number; py: number;
  now: number; elapsedMin: number;
  stats: PlayerStats;
  orbs: Phaser.Physics.Arcade.Group;
  minions: Phaser.Physics.Arcade.Group;
  nearestEnemy: (x: number, y: number) => Enemy | null;
  enemiesInRadius: (x: number, y: number, r: number) => Enemy[];
  hitEnemy: (e: Enemy, baseDamage: number, opts?: { knock?: number; from?: { x: number; y: number }; instakill?: number }) => void;
  explode: (x: number, y: number, r: number, baseDamage: number, color: number) => void;
  fireProjectile: (o: FireOpts) => void;
}

interface Owned { def: WeaponDef; level: number; lastFire: number; orbAngle: number; orbList: Orb[]; aura?: Phaser.GameObjects.Arc; }

export class WeaponSystem {
  owned: Owned[] = [];

  add(weaponId: string) {
    this.owned.push({ def: WEAPONS[weaponId], level: 1, lastFire: 0, orbAngle: 0, orbList: [] });
  }
  has(weaponId: string) { return this.owned.some((w) => w.def.id === weaponId); }
  get(weaponId: string) { return this.owned.find((w) => w.def.id === weaponId); }
  levelUp(weaponId: string) { const w = this.get(weaponId); if (w && w.level < w.def.maxLevel) w.level++; }
  isMaxed(weaponId: string) { const w = this.get(weaponId); return !!w && w.level >= w.def.maxLevel; }

  // 진화: 재료 무기 제거 + 결과 무기 추가
  evolve(materialId: string, resultId: string) {
    const w = this.get(materialId);
    if (w) w.orbList.forEach((o) => o.kill());
    if (w?.aura) w.aura.destroy();
    this.owned = this.owned.filter((o) => o.def.id !== materialId);
    this.add(resultId);
  }

  private statsFor(w: Owned, ctx: WeaponCtx) {
    const b = BALANCE.weapon;
    const lv = w.level - 1;
    const d = w.def;
    const projExtra = (d.behavior === 'orbit')
      ? lv + ctx.stats.extraCount
      : Math.floor(lv / b.countEvery) + ctx.stats.extraCount;
    return {
      damage: d.damage * (1 + b.damageGrowth * lv),
      cooldown: Math.max(80, d.cooldown * (1 - b.cooldownGrowth * lv) * ctx.stats.cooldownMul),
      count: d.count + projExtra,
      speed: d.speed,
      area: d.area * (1 + 0.08 * lv),
      duration: d.duration ?? 0,
    };
  }

  update(ctx: WeaponCtx, delta: number) {
    for (const w of this.owned) {
      switch (w.def.behavior) {
        case 'projectile': case 'pierce': case 'homing': this.fireRanged(w, ctx); break;
        case 'bounce': this.fireRanged(w, ctx); break;
        case 'orbit': this.updateOrbit(w, ctx, delta); break;
        case 'whip': this.fireWhip(w, ctx); break;
        case 'aura': this.updateAura(w, ctx); break;
        case 'summon': this.fireSummon(w, ctx); break;
        case 'nuke': this.fireNuke(w, ctx); break;
        case 'bomb': this.fireBomb(w, ctx); break;
      }
    }
  }

  private fireRanged(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (ctx.now - w.lastFire < s.cooldown) return;
    const target = ctx.nearestEnemy(ctx.px, ctx.py);
    if (!target) return;
    w.lastFire = ctx.now;
    AudioSystem.playFire(w.def.behavior);
    const base = Phaser.Math.Angle.Between(ctx.px, ctx.py, target.x, target.y);
    const spread = 0.16;
    for (let i = 0; i < s.count; i++) {
      const off = (i - (s.count - 1) / 2) * spread;
      ctx.fireProjectile({
        x: ctx.px, y: ctx.py, angle: base + off, speed: s.speed, damage: s.damage, color: w.def.color,
        pierce: w.def.pierce, bounces: w.def.bounces, knockback: w.def.knockback,
        homing: w.def.behavior === 'homing', instakill: w.def.instakill,
        scale: w.def.behavior === 'pierce' ? 1.6 : 1, icon: w.def.icon,
      });
    }
  }

  private updateOrbit(w: Owned, ctx: WeaponCtx, delta: number) {
    const s = this.statsFor(w, ctx);
    // 오브 개수 맞추기
    while (w.orbList.length < s.count) {
      const o = ctx.orbs.get() as Orb | null;
      if (!o) break;
      o.activate(s.damage, w.def.color, w.def.icon);
      (o as any)._dmg = s.damage;
      w.orbList.push(o);
    }
    while (w.orbList.length > s.count) { w.orbList.pop()?.kill(); }
    w.orbAngle += (w.def.speed) * delta / 1000;
    const r = s.area;
    w.orbList.forEach((o, i) => {
      o.damage = s.damage;
      const a = w.orbAngle + (i / s.count) * Math.PI * 2;
      o.place(ctx.px + Math.cos(a) * r, ctx.py + Math.sin(a) * r);
    });
  }

  private fireWhip(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (ctx.now - w.lastFire < s.cooldown) return;
    w.lastFire = ctx.now;
    AudioSystem.playFire('whip');
    // 좌우 번갈아 광역 베기
    const side = (Math.floor(ctx.now / 100) % 2 === 0) ? 1 : -1;
    const cx = ctx.px + side * s.area * 0.4;
    ctx.enemiesInRadius(cx, ctx.py, s.area).forEach((e) => ctx.hitEnemy(e, s.damage));
    // 슬래시 비주얼
    const g = ctx.scene.add.ellipse(cx, ctx.py, s.area * 1.6, s.area, w.def.color, 0.25).setDepth(7);
    ctx.scene.tweens.add({ targets: g, alpha: 0, scaleX: 1.3, duration: 160, onComplete: () => g.destroy() });
  }

  private updateAura(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (!w.aura) {
      w.aura = ctx.scene.add.circle(ctx.px, ctx.py, s.area, w.def.color, 0.10).setDepth(3);
    }
    w.aura.setPosition(ctx.px, ctx.py).setRadius(s.area);
    const enemies = ctx.enemiesInRadius(ctx.px, ctx.py, s.area);
    // 오라는 지속형이라 발사 이벤트가 없음 → lastFire(오라에선 미사용)로 SFX 만 스로틀
    if (enemies.length && ctx.now - w.lastFire > 900) {
      w.lastFire = ctx.now;
      AudioSystem.playFire('aura');
    }
    for (const e of enemies) {
      if (w.def.slow) e.slowUntil = ctx.now + 400; // Docker 속박
      if (w.def.vacuum) { // GC 흡입
        const a = Phaser.Math.Angle.Between(e.x, e.y, ctx.px, ctx.py);
        e.x += Math.cos(a) * 1.4; e.y += Math.sin(a) * 1.4;
      }
      if (ctx.now - e.lastDot >= 200) { // 0.2s 마다 지속뎀
        e.lastDot = ctx.now;
        ctx.hitEnemy(e, s.damage);
      }
    }
  }

  private fireSummon(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (ctx.now - w.lastFire < s.cooldown) return;
    w.lastFire = ctx.now;
    AudioSystem.playFire('summon');
    for (let i = 0; i < s.count; i++) {
      const m = ctx.minions.get() as Minion | null;
      if (!m) break;
      m.setPosition(ctx.px, ctx.py);
      m.activate(s.damage, s.duration, w.def.color, (i / s.count) * Math.PI * 2);
    }
  }

  private fireNuke(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (ctx.now - w.lastFire < s.cooldown) return;
    w.lastFire = ctx.now;
    AudioSystem.playFire('nuke');
    ctx.scene.cameras.main.flash(300, 255, 255, 255);
    ctx.scene.cameras.main.shake(200, 0.01);
    ctx.explode(ctx.px, ctx.py, 99999, s.damage, w.def.color);
  }

  private fireBomb(w: Owned, ctx: WeaponCtx) {
    const s = this.statsFor(w, ctx);
    if (ctx.now - w.lastFire < s.cooldown) return;
    w.lastFire = ctx.now;
    AudioSystem.playFire('bomb');
    for (let i = 0; i < s.count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 220;
      const bx = ctx.px + Math.cos(ang) * dist, by = ctx.py + Math.sin(ang) * dist;
      // 짧은 점멸 후 폭발
      const marker = ctx.scene.add.circle(bx, by, s.area, w.def.color, 0.2).setDepth(3);
      ctx.scene.time.delayedCall(s.duration, () => {
        marker.destroy();
        ctx.explode(bx, by, s.area, s.damage, w.def.color);
      });
    }
  }
}
