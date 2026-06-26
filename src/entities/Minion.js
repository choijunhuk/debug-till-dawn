import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
// 미니언(npm install / Pair Programming 분신). 근처 떠다니며 가장 가까운 적에 자동 사격.
// ponytail: 미니언은 적과 충돌 안 함(불멸), 수명으로만 소멸 — 단순화.
export class Minion extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'minion');
        this.damage = 0;
        this.life = 0;
        this.lastFire = 0;
        this.orbitAngle = 0;
        this.setDepth(9);
    }
    activate(damage, durationMs, color, angle) {
        this.enableBody(true, this.x, this.y, true, true);
        this.setActive(true).setVisible(true);
        this.body.setAllowGravity(false);
        this.damage = damage;
        this.life = durationMs;
        this.lastFire = 0;
        this.orbitAngle = angle;
        this.setTint(color);
    }
    // 플레이어 주위 공전. 쿨다운마다 fire 콜백 호출. 수명 끝 false.
    update2(px, py, delta, now, fire) {
        if (this.life !== Infinity) {
            this.life -= delta;
            if (this.life <= 0) {
                this.kill();
                return false;
            }
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
