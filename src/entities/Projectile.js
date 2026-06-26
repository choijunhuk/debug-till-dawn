import Phaser from 'phaser';
import { logoTexture } from '../data/brandAssets';
// 투사체. 관통/튕김/유도/넉백 지원. 풀링.
export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'proj');
        this.damage = 0;
        this.knockback = 0;
        this.pierceLeft = 0;
        this.bouncesLeft = 0;
        this.homing = false;
        this.instakill = 0;
        this.crit = false;
        this.bouncer = false; // 튕김 무기 여부
        this.hitSet = new Set(); // 중복타격 방지(관통/튕김)
        this.life = 0;
        this.setDepth(8);
    }
    fire(o) {
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
        if (logo) {
            this.setDisplaySize(22 * (o.scale ?? 1), 22 * (o.scale ?? 1));
            this.setCircle(28, 4, 4);
        } // 로고 64→22px, body 도 축소
        else
            this.setScale(o.scale ?? 1);
        this.setTint(o.color);
        this.setRotation(logo ? 0 : o.angle); // 로고는 회전 안함(가독성)
        this.setVelocity(Math.cos(o.angle) * o.speed, Math.sin(o.angle) * o.speed);
    }
    // 수명 + 유도 조향. 회수면 false.
    tick(delta, steer) {
        this.life -= delta;
        if (this.life <= 0) {
            this.kill();
            return false;
        }
        if (this.homing && steer) {
            const a = Phaser.Math.Angle.Between(this.x, this.y, steer.x, steer.y);
            const speed = this.body.velocity.length();
            const cur = this.rotation;
            const na = Phaser.Math.Angle.RotateTo(cur, a, 0.08); // 부드러운 추적
            this.setRotation(na);
            this.setVelocity(Math.cos(na) * speed, Math.sin(na) * speed);
        }
        return true;
    }
    // 적 명중 처리. 계속 살아있으면 true.
    onHit(enemyId) {
        if (this.hitSet.has(enemyId))
            return true; // 이미 맞은 적
        this.hitSet.add(enemyId);
        if (this.pierceLeft > 0) {
            this.pierceLeft--;
            return true;
        }
        if (this.bouncesLeft > 0) {
            this.bouncesLeft--;
            return true;
        } // 방향전환은 scene 에서
        this.kill();
        return false;
    }
    kill() { this.disableBody(true, true); }
}
