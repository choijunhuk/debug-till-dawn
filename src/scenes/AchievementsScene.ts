import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../data/metaUpgrades';
import { MetaProgress } from '../systems/MetaProgress';
import { AudioSystem } from '../systems/AudioSystem';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#0d1117');

    const unlocked = ACHIEVEMENTS.filter(a => MetaProgress.hasAchievement(a.id)).length;
    const total = ACHIEVEMENTS.length;

    // 제목
    this.add.text(W / 2, 36, '🏆 업적', {
      fontFamily: 'monospace', fontSize: '28px', color: '#e3b341',
    }).setOrigin(0.5);

    // 획득 카운트 헤더
    this.add.text(W / 2, 74, `획득 ${unlocked} / ${total}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#6e7681',
    }).setOrigin(0.5);

    // 업적 목록
    let y = 120;
    for (const a of ACHIEVEMENTS) {
      const has = MetaProgress.hasAchievement(a.id);

      if (has) {
        // 잠금 해제: 이름 강조 + 설명 + ✓ 마크
        this.add.text(60, y, `✓ ${a.name}`, {
          fontFamily: 'monospace', fontSize: '16px', color: '#e3b341',
        });
        this.add.text(60, y + 20, a.desc, {
          fontFamily: 'monospace', fontSize: '13px', color: '#c9d1d9',
        });
      } else {
        // 잠금: 흐리게 표시
        this.add.text(60, y, `🔒 ${a.name}`, {
          fontFamily: 'monospace', fontSize: '16px', color: '#6e7681',
        });
        this.add.text(60, y + 20, a.desc, {
          fontFamily: 'monospace', fontSize: '13px', color: '#6e7681',
        });
      }

      y += 60;
    }

    // 뒤로 가기 힌트
    this.add.text(W / 2, H - 30, '[ESC] 메뉴로', {
      fontFamily: 'monospace', fontSize: '16px', color: '#6a9955',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { AudioSystem.play('ui_click'); this.scene.start('Menu'); });

    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Menu'));
  }
}
