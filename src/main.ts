import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { ClassSelectScene } from './scenes/ClassSelectScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MetaShopScene } from './scenes/MetaShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { AudioSystem } from './systems/AudioSystem';

AudioSystem.init(); // 첫 유저 입력 시 AudioContext 생성(autoplay 정책)

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [PreloadScene, MenuScene, ClassSelectScene, GameScene, GameOverScene, MetaShopScene, AchievementsScene],
});
if (import.meta.env.DEV) (window as any).game = game; // ponytail: 디버그용 핸들 (juice 검증 끝나면 제거 가능)
