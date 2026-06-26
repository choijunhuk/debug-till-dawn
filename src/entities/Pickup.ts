import Phaser from 'phaser';

export type PickupKind = 'coffee' | 'bomb' | 'magnet';

// 랜덤 드랍 아이템. 커피(회복) / rm -rf(화면폭탄) / 자석(전체 XP 흡수).
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  kind: PickupKind = 'coffee';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coffee');
    this.setDepth(6);
  }

  drop(kind: PickupKind, x: number, y: number) {
    this.kind = kind;
    const tex = kind === 'coffee' ? 'coffee' : kind === 'bomb' ? 'bomb' : 'magnetItem';
    this.setTexture(tex);
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.scene.tweens.add({ targets: this, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });
  }

  kill() { this.scene.tweens.killTweensOf(this); this.setScale(1); this.disableBody(true, true); }
}
