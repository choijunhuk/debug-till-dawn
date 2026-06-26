import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
// 플레이어 = 깜빡이는 커서(직군별 색). 스탯은 PlayerStats 가 집계.
export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, stats, color) {
        super(scene, x, y, 'player');
        this.invuln = 0; // 무적 종료 시각(ms)
        this.stats = stats;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCircle(BALANCE.player.bodyRadius);
        this.baseColor = color;
        this.setDepth(10).setTint(color);
        // 플레이어 네온 글로우(단일 오브젝트 → 저비용). 나머지는 카메라 블룸이 처리.
        const fx = this.postFX;
        if (fx)
            fx.addGlow(color, 4, 0);
        this.maxHp = BALANCE.player.maxHp + stats.maxHpBonus;
        this.hp = this.maxHp;
        this.speed = BALANCE.player.speed * stats.speedMul;
        this.pickupRadius = BALANCE.player.pickupRadius * stats.pickupMul;
        const kb = scene.input.keyboard;
        this.keys = {
            W: kb.addKey('W'), A: kb.addKey('A'), S: kb.addKey('S'), D: kb.addKey('D'),
            up: kb.addKey('UP'), down: kb.addKey('DOWN'), left: kb.addKey('LEFT'), right: kb.addKey('RIGHT'),
        };
        scene.tweens.add({ targets: this, alpha: 0.45, duration: 500, yoyo: true, repeat: -1 });
    }
    // 패시브/메타 변경 후 스탯 재반영
    applyStats() {
        const newMax = BALANCE.player.maxHp + this.stats.maxHpBonus;
        this.hp += Math.max(0, newMax - this.maxHp); // 늘어난 만큼 회복
        this.maxHp = newMax;
        this.speed = BALANCE.player.speed * this.stats.speedMul;
        this.pickupRadius = BALANCE.player.pickupRadius * this.stats.pickupMul;
    }
    move() {
        const k = this.keys;
        let vx = 0, vy = 0;
        if (k.A.isDown || k.left.isDown)
            vx -= 1;
        if (k.D.isDown || k.right.isDown)
            vx += 1;
        if (k.W.isDown || k.up.isDown)
            vy -= 1;
        if (k.S.isDown || k.down.isDown)
            vy += 1;
        const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.speed);
        this.setVelocity(v.x, v.y);
    }
    takeDamage(amount, now) {
        if (now < this.invuln)
            return false;
        this.hp = Math.max(0, this.hp - amount);
        this.invuln = now + 250; // 짧은 무적
        this.scene.tweens.add({ targets: this, duration: 70, yoyo: true,
            onStart: () => this.setTintFill(0xff5555), onComplete: () => this.setTint(this.baseColor) });
        return true;
    }
    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
}
