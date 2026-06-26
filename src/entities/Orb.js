import Phaser from 'phaser';
import { logoTexture } from '../data/brandAssets';
// 회전 오브(for-loop). WeaponSystem 이 매 프레임 위치 갱신. 접촉 지속뎀.
export class Orb extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'orb');
        this.damage = 0;
        this.color = 0xffffff;
        this.setDepth(7);
    }
    activate(damage, color, icon) {
        this.enableBody(true, this.x, this.y, true, true);
        this.setActive(true).setVisible(true);
        this.damage = damage;
        this.color = color;
        const logo = logoTexture(icon);
        this.setTexture(logo ?? 'orb');
        if (logo) {
            this.setDisplaySize(24, 24);
            this.setCircle(28, 4, 4);
        }
        else
            this.setScale(1);
        this.setTint(color);
        this.body.setAllowGravity(false);
    }
    place(x, y) { this.setPosition(x, y); }
    kill() { this.disableBody(true, true); }
}
