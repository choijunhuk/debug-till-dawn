import Phaser from 'phaser';
import { MetaProgress } from '../systems/MetaProgress';
import { UNLOCKS } from '../data/metaUpgrades';
import { AudioSystem } from '../systems/AudioSystem';

interface GOData {
  time: number; kills: number; level: number; rpGained: number;
  newAchievements: string[]; victory?: boolean;
}

// 게임오버 = Build Failed / 클리어. RP/업적 정산은 GameScene 에서 끝냄.
export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GOData) {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#0d1117');
    AudioSystem.playBgm('ambient');
    const s = Math.floor(data.time / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');

    const title = data.victory ? 'Deploy Successful ✓' : 'Segmentation fault (core dumped)';
    this.add.text(W / 2, H * 0.22, title, {
      fontFamily: 'monospace', fontSize: '26px', color: data.victory ? '#7ee787' : '#f85149',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.3, data.victory ? 'Build Passed' : 'Build Failed', {
      fontFamily: 'monospace', fontSize: '18px', color: '#8b949e',
    }).setOrigin(0.5);

    const lines = [
      `uptime    ${mm}:${ss}`,
      `kills     ${data.kills}`,
      `level     ${data.level}`,
      `RP gained ${data.rpGained}`,
    ];
    this.add.text(W / 2, H * 0.48, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '18px', color: '#dcdcaa', align: 'left', lineSpacing: 8,
    }).setOrigin(0.5);

    if (data.newAchievements.length) {
      this.add.text(W / 2, H * 0.64, '🏆 ' + data.newAchievements.join(', '), {
        fontFamily: 'monospace', fontSize: '15px', color: '#e3b341', align: 'center', wordWrap: { width: W * 0.7 },
      }).setOrigin(0.5);
    }

    // RP 현황 및 다음 해금 목표
    const totalRp = MetaProgress.rp;
    const locked = Object.entries(UNLOCKS).filter(([id]) => !MetaProgress.isUnlocked(id));
    locked.sort((a, b) => a[1].cost - b[1].cost);
    const nextLine = locked.length > 0
      ? `다음 해금: ${locked[0][1].name} — 앞으로 ${Math.max(0, locked[0][1].cost - totalRp)} RP`
      : '해금 완료!';
    this.add.text(W / 2, H * 0.7, `보유 RP: ${totalRp}   ${nextLine}`, {
      fontFamily: 'monospace', fontSize: '15px', color: '#79c0ff', align: 'center',
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.8, '[SPACE] 다시  ·  [M] 상점  ·  [ESC] 메뉴', {
      fontFamily: 'monospace', fontSize: '18px', color: '#6a9955',
    }).setOrigin(0.5);
    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('ClassSelect'));
    this.input.keyboard!.once('keydown-M', () => this.scene.start('MetaShop'));
    this.input.keyboard!.once('keydown-ESC', () => this.scene.start('Menu'));
  }
}
