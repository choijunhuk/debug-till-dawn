import Phaser from 'phaser';
import { MetaProgress } from '../systems/MetaProgress';
import { logoTexture } from '../data/brandAssets';
export class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const { width: W, height: H } = this.scale;
        this.cameras.main.setBackgroundColor('#0d1117');
        const gh = logoTexture('github');
        if (gh)
            this.add.image(W / 2, H * 0.16, gh).setDisplaySize(56, 56).setTint(0x39d353);
        this.add.text(W / 2, H * 0.28, 'DEBUG TILL DAWN', {
            fontFamily: 'monospace', fontSize: '48px', color: '#c586c0',
        }).setOrigin(0.5);
        this.add.text(W / 2, H * 0.28 + 50, '// 끝없는 버그와 자동전투', {
            fontFamily: 'monospace', fontSize: '16px', color: '#6a9955',
        }).setOrigin(0.5);
        this.add.text(W / 2, H * 0.5, `RP: ${MetaProgress.rp}`, {
            fontFamily: 'monospace', fontSize: '20px', color: '#dcdcaa',
        }).setOrigin(0.5);
        this.button(W / 2, H * 0.62, '▶ npm run dev  [ENTER]', 0x6a9955, () => this.scene.start('ClassSelect'));
        this.button(W / 2, H * 0.72, '⚙ MetaShop  [M]', 0x58a6ff, () => this.scene.start('MetaShop'));
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('ClassSelect'));
        this.input.keyboard.once('keydown-M', () => this.scene.start('MetaShop'));
    }
    button(x, y, label, color, cb) {
        const t = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '22px', color: '#' + color.toString(16).padStart(6, '0'),
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerover', () => t.setScale(1.1));
        t.on('pointerout', () => t.setScale(1));
        t.on('pointerdown', cb);
    }
}
