import Phaser from 'phaser';
import { CLASSES } from '../data/classes';
import { STAGES } from '../data/stages';
import { MetaProgress } from '../systems/MetaProgress';
import { UNLOCKS } from '../data/metaUpgrades';

// 직군 + 배포환경(맵) 선택 → Game. 잠긴 항목은 메타에서 해금.
export class ClassSelectScene extends Phaser.Scene {
  private classId = 'fullstack';
  private stageId = 'localhost';

  constructor() { super('ClassSelect'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#0d1117');

    this.add.text(W / 2, 40, '> 직군 선택', { fontFamily: 'monospace', fontSize: '22px', color: '#4ec9b0' }).setOrigin(0.5);
    this.row(Object.values(CLASSES).map((c) => ({
      id: c.id, name: c.name, desc: c.desc, color: c.color, locked: !MetaProgress.isUnlocked(c.id),
    })), H * 0.28, (id) => { this.classId = id; this.redraw(); }, () => this.classId);

    this.add.text(W / 2, H * 0.52, '> 배포환경(맵)', { fontFamily: 'monospace', fontSize: '22px', color: '#ce9178' }).setOrigin(0.5);
    this.row(Object.values(STAGES).map((s) => ({
      id: s.id, name: s.name, desc: s.desc, color: s.bgTint === 0x0d1117 ? 0x6a9955 : 0xff7b72, locked: !MetaProgress.isUnlocked(s.id),
    })), H * 0.66, (id) => { this.stageId = id; this.redraw(); }, () => this.stageId);

    const start = this.add.text(W / 2, H * 0.86, '▶ START  [ENTER]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#dcdcaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerdown', () => this.launch());
    this.input.keyboard!.once('keydown-ENTER', () => this.launch());
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Menu'));

    this.redraw();
  }

  private cardRefs: { id: string; box: Phaser.GameObjects.Rectangle; group: () => string }[] = [];

  private row(items: { id: string; name: string; desc: string; color: number; locked: boolean }[],
              y: number, pick: (id: string) => void, sel: () => string) {
    const { width: W } = this.scale;
    const cw = 150, gap = 16;
    const total = items.length * cw + (items.length - 1) * gap;
    const startX = W / 2 - total / 2 + cw / 2;
    items.forEach((it, i) => {
      const x = startX + i * (cw + gap);
      const box = this.add.rectangle(x, y, cw, 90, 0x161b22).setStrokeStyle(2, it.color);
      this.add.text(x, y - 22, it.name + (it.locked ? ' 🔒' : ''), {
        fontFamily: 'monospace', fontSize: '16px', color: '#' + it.color.toString(16).padStart(6, '0'),
      }).setOrigin(0.5);
      this.add.text(x, y + 14, it.desc, {
        fontFamily: 'monospace', fontSize: '10px', color: '#8b949e', align: 'center', wordWrap: { width: cw - 14 },
      }).setOrigin(0.5);
      if (!it.locked) {
        box.setInteractive({ useHandCursor: true }).on('pointerdown', () => pick(it.id));
        this.cardRefs.push({ id: it.id, box, group: sel });
      } else {
        const entry = UNLOCKS[it.id];
        const costLabel = entry ? `🔒 ${entry.cost} RP · 상점에서 해금` : '🔒';
        this.add.text(x, y + 30, costLabel, {
          fontFamily: 'monospace', fontSize: '11px', color: '#f0883e',
        }).setOrigin(0.5);
        box.setAlpha(0.4);
      }
    });
  }

  private redraw() {
    for (const r of this.cardRefs) {
      const selected = r.group() === r.id;
      r.box.setFillStyle(selected ? 0x243040 : 0x161b22);
      r.box.setScale(selected ? 1.06 : 1);
    }
  }

  private launch() {
    this.registry.set('classId', this.classId);
    this.registry.set('stageId', this.stageId);
    this.scene.start('Game');
  }
}
