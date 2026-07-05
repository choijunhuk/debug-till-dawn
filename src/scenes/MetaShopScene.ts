import Phaser from 'phaser';
import { META_UPGRADES, UNLOCKS } from '../data/metaUpgrades';
import { MetaProgress } from '../systems/MetaProgress';
import { AudioSystem } from '../systems/AudioSystem';

// RP 영구 업그레이드 + 해금 상점.
export class MetaShopScene extends Phaser.Scene {
  private rpText!: Phaser.GameObjects.Text;
  private rows: { redraw: () => void }[] = [];

  constructor() { super('MetaShop'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#0d1117');
    this.rows = [];
    AudioSystem.playBgm('ambient');

    this.add.text(W / 2, 30, '⚙ MetaShop — 리팩토링 포인트', { fontFamily: 'monospace', fontSize: '22px', color: '#58a6ff' }).setOrigin(0.5);
    this.rpText = this.add.text(W / 2, 60, '', { fontFamily: 'monospace', fontSize: '18px', color: '#dcdcaa' }).setOrigin(0.5);

    let y = 110;
    for (const def of Object.values(META_UPGRADES)) {
      this.shopRow(def.id, () => {
        const lvl = MetaProgress.upgradeLevel(def.id);
        const maxed = lvl >= def.maxLevel;
        return { label: `${def.name} (Lv.${lvl}/${def.maxLevel})  ${def.desc}`, cost: maxed ? -1 : MetaProgress.upgradeCost(def.id), buy: () => MetaProgress.buyUpgrade(def.id) };
      }, y); y += 44;
    }
    y += 14;
    this.add.text(W / 2, y, '— 해금 —', { fontFamily: 'monospace', fontSize: '14px', color: '#6e7681' }).setOrigin(0.5); y += 30;
    for (const [id, u] of Object.entries(UNLOCKS)) {
      this.shopRow(id, () => {
        const owned = MetaProgress.isUnlocked(id);
        return { label: `${u.name}`, cost: owned ? -1 : u.cost, buy: () => MetaProgress.buyUnlock(id) };
      }, y); y += 44;
    }

    this.add.text(W / 2, H - 30, '[ESC] 메뉴로', { fontFamily: 'monospace', fontSize: '16px', color: '#6a9955' }).setOrigin(0.5);
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Menu'));
    this.refresh();
  }

  private shopRow(_id: string, state: () => { label: string; cost: number; buy: () => boolean }, y: number) {
    const { width: W } = this.scale;
    const label = this.add.text(60, y, '', { fontFamily: 'monospace', fontSize: '14px', color: '#c9d1d9' });
    const btn = this.add.text(W - 60, y, '', { fontFamily: 'monospace', fontSize: '14px', color: '#dcdcaa' })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { if (state().buy()) { AudioSystem.play('ui_click'); this.refresh(); } });
    const redraw = () => {
      const s = state();
      label.setText(s.label);
      if (s.cost < 0) { btn.setText('MAX').setColor('#6e7681'); }
      else {
        const afford = MetaProgress.rp >= s.cost;
        btn.setText(`구매 ${s.cost} RP`).setColor(afford ? '#7ee787' : '#f85149');
      }
    };
    this.rows.push({ redraw });
  }

  private refresh() {
    this.rpText.setText(`보유 RP: ${MetaProgress.rp}`);
    this.rows.forEach((r) => r.redraw());
  }
}
