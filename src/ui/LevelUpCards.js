import { logoTexture } from '../data/brandAssets';
// 레벨업 = git commit. IDE 자동완성 팝업처럼 3장 카드. 1/2/3 키 또는 클릭.
export class LevelUpCards {
    constructor(scene) {
        this.scene = scene;
    }
    show(options, onPick) {
        const { width: W, height: H } = this.scene.scale;
        const c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(200);
        this.container = c;
        const dim = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x0d1117, 0.82);
        c.add(dim);
        const title = this.scene.add.text(W / 2, H * 0.2, '> git commit --level-up', {
            fontFamily: 'monospace', fontSize: '24px', color: '#6a9955',
        }).setOrigin(0.5);
        c.add(title);
        const cardW = 220, cardH = 260, gap = 30;
        const totalW = options.length * cardW + (options.length - 1) * gap;
        const startX = W / 2 - totalW / 2 + cardW / 2;
        options.forEach((opt, i) => {
            const x = startX + i * (cardW + gap);
            const y = H / 2 + 20;
            const card = this.scene.add.container(x, y);
            const bg = this.scene.add.rectangle(0, 0, cardW, cardH, opt.gold ? 0x2a2410 : 0x161b22)
                .setStrokeStyle(opt.gold ? 3 : 2, opt.color).setInteractive({ useHandCursor: true });
            if (opt.gold)
                this.scene.tweens.add({ targets: bg, alpha: 0.7, duration: 400, yoyo: true, repeat: -1 });
            const num = this.scene.add.text(0, -cardH / 2 + 22, `[${i + 1}]`, {
                fontFamily: 'monospace', fontSize: '18px', color: '#8b949e',
            }).setOrigin(0.5);
            // 무기 로고(있으면). 흰 실루엣 → 카드 색으로 tint.
            const logo = logoTexture(opt.icon);
            if (logo) {
                const img = this.scene.add.image(0, -76, logo).setDisplaySize(44, 44).setTint(opt.color);
                card.add(img);
            }
            const name = this.scene.add.text(0, -30, opt.title, {
                fontFamily: 'monospace', fontSize: '20px', color: '#' + opt.color.toString(16).padStart(6, '0'),
                align: 'center', wordWrap: { width: cardW - 24 },
            }).setOrigin(0.5);
            const desc = this.scene.add.text(0, 60, opt.desc, {
                fontFamily: 'monospace', fontSize: '14px', color: '#c9d1d9',
                align: 'center', wordWrap: { width: cardW - 30 },
            }).setOrigin(0.5);
            bg.on('pointerover', () => bg.setFillStyle(0x1f2630));
            bg.on('pointerout', () => bg.setFillStyle(opt.gold ? 0x2a2410 : 0x161b22));
            bg.on('pointerdown', () => this.pick(opt, onPick));
            card.add([bg, num, name, desc]);
            c.add(card);
        });
        this.keyHandler = (e) => {
            const idx = parseInt(e.key, 10) - 1;
            if (idx >= 0 && idx < options.length)
                this.pick(options[idx], onPick);
        };
        window.addEventListener('keydown', this.keyHandler);
    }
    pick(opt, onPick) {
        opt.apply();
        this.close();
        onPick();
    }
    close() {
        if (this.keyHandler)
            window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = undefined;
        this.container?.destroy(true);
        this.container = undefined;
    }
}
