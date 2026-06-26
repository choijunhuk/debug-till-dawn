import Phaser from 'phaser';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { PlayerStats } from '../systems/PlayerStats';
import { PASSIVES } from '../data/passives';
import { availableEvolutions } from '../systems/EvolutionSystem';

const FONT = 'monospace';
const PANEL_W = 240;

// 인-런 빌드 패널: 현재 로드아웃(무기/패시브/진화/부활)을 보여주는 읽기전용 오버레이.
// 카메라 고정, 기본 숨김. TAB 토글. 게임은 멈추지 않음.
export class BuildPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private texts: Phaser.GameObjects.Text[] = [];
  private hint: Phaser.GameObjects.Text;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width: W, height: H } = scene.scale;
    // 우측 가장자리 반투명 사이드 패널(좌측 HUD와 겹치지 않게).
    const bg = scene.add.rectangle(0, 0, PANEL_W, H, 0x0d1117, 0.88)
      .setOrigin(0, 0).setStrokeStyle(1, 0x4ec9b0);
    this.container = scene.add.container(W - PANEL_W, 0, [bg])
      .setScrollFactor(0).setDepth(150).setVisible(false);
    // 닫혀있을 때만 보이는 안내 힌트.
    this.hint = scene.add.text(12, H - 34, '[TAB] 빌드', {
      fontFamily: FONT, fontSize: '12px', color: '#6e7681',
    }).setScrollFactor(0).setDepth(101);
  }

  private hex(c: number) { return '#' + c.toString(16).padStart(6, '0'); }

  toggle() { this.visible ? this.hide() : this.show(); }

  private show() {
    this.visible = true;
    this.container.setVisible(true);
    this.hint.setVisible(false);
  }
  private hide() {
    this.visible = false;
    this.container.setVisible(false);
    this.hint.setVisible(true);
  }

  // 텍스트 자식을 매번 파기 후 재생성. 열려있을 때만 호출하면 충분(닫힘 시 비용 0).
  refresh(weapons: WeaponSystem, stats: PlayerStats) {
    this.texts.forEach((t) => t.destroy());
    this.texts = [];

    const pad = 14;
    let y = 16;
    const add = (txt: string, color = '#dcdcaa', size = 13) => {
      const t = this.scene.add.text(pad, y, txt, { fontFamily: FONT, fontSize: `${size}px`, color });
      this.container.add(t);
      this.texts.push(t);
      y += size + 7;
    };
    const header = (txt: string) => { y += 6; add(txt, '#4ec9b0', 13); };

    add('// BUILD', '#6e7681', 12);

    header('무기');
    for (const w of weapons.owned) {
      const evo = w.def.evolvesTo ? ' ⚡' : '';
      add(`${w.def.name} Lv.${w.level}/${w.def.maxLevel}${evo}`, this.hex(w.def.color));
    }

    header('패시브');
    const passives = Object.entries(stats.passiveLevels);
    if (passives.length === 0) add('없음', '#6e7681', 12);
    else for (const [id, lvl] of passives) {
      const def = PASSIVES[id];
      add(`${def?.name ?? id} Lv.${lvl}`, this.hex(def?.color ?? 0xdcdcaa));
    }

    header('진화 준비');
    const evos = availableEvolutions(weapons, stats);
    if (evos.length === 0) add('없음', '#6e7681', 12);
    else for (const e of evos) add(`⚡ ${e.name}`, this.hex(e.color));

    y += 8;
    add(`부활: ${stats.reviveAvailable ? '보유' : '없음'}`, stats.reviveAvailable ? '#ffd700' : '#6e7681');
  }
}
