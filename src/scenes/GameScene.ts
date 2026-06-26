import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile, FireOpts } from '../entities/Projectile';
import { Orb } from '../entities/Orb';
import { Minion } from '../entities/Minion';
import { XPGem } from '../entities/XPGem';
import { Pickup } from '../entities/Pickup';
import { HUD } from '../ui/HUD';
import { LevelUpCards } from '../ui/LevelUpCards';
import { BuildPanel } from '../ui/BuildPanel';
import { GameFx } from '../ui/GameFx';
import { BALANCE, xpForLevel } from '../data/balance';
import { CLASSES } from '../data/classes';
import { STAGES } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { ACHIEVEMENTS } from '../data/metaUpgrades';
import { PlayerStats } from '../systems/PlayerStats';
import { WeaponSystem, WeaponCtx } from '../systems/WeaponSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { MetaProgress } from '../systems/MetaProgress';
import { buildUpgradeOptions } from '../systems/UpgradePool';

// 메인 씬: 모든 시스템 오케스트레이션. 데미지/사망 처리 중앙화.
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private stats!: PlayerStats;
  private weapons!: WeaponSystem;
  private spawner!: SpawnSystem;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private orbs!: Phaser.Physics.Arcade.Group;
  private minions!: Phaser.Physics.Arcade.Group;
  private gems!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private grid!: Phaser.GameObjects.TileSprite;
  private fx!: GameFx;
  private enemyHpBars!: Phaser.GameObjects.Graphics;
  private bossOutline?: Phaser.GameObjects.Arc;
  private bossBadge?: Phaser.GameObjects.Text;
  private hud!: HUD;
  private cards!: LevelUpCards;
  private buildPanel!: BuildPanel;

  private stageId = 'localhost';
  private xp = 0; private level = 1; private kills = 0;
  private startTime = 0; private elapsedMin = 0;
  private paused = false; private over = false;
  private currentBoss: Enemy | null = null;
  private bossesKilled = 0;
  private lastHitTime = 0;       // 마지막 피격(무중단 배포 업적)
  private lastRegen = 0;
  private clonesSpawned = 0;
  private newAchievements: string[] = [];
  private bossSummonAt = 0;

  constructor() { super('Game'); }

  create() {
    // Phaser 는 씬 인스턴스를 재사용 → 필드 초기값은 생성자에서 1회만 실행됨.
    // 재시작 시 상태를 명시적으로 리셋(안 하면 over=true 가 남아 멈춤).
    this.xp = 0; this.level = 1; this.kills = 0; this.elapsedMin = 0;
    this.paused = false; this.over = false;
    this.currentBoss = null; this.bossesKilled = 0; this.bossSummonAt = 0;
    this.clonesSpawned = 0; this.newAchievements = [];
    this.bossOutline = undefined; this.bossBadge = undefined;

    const classId = (this.registry.get('classId') as string) || 'fullstack';
    this.stageId = (this.registry.get('stageId') as string) || 'localhost';
    const cls = CLASSES[classId] || CLASSES.fullstack;
    const stage = STAGES[this.stageId] || STAGES.localhost;

    this.cameras.main.setBackgroundColor(stage.bgTint);
    // 카메라 블룸: 어두운 배경에 네온이 뜨게(전체 1패스 → 모든 밝은 요소 글로우, 풀별 글로우보다 쌈)
    const cam = this.cameras.main as any;
    if (cam.postFX) cam.postFX.addBloom(0xffffff, 1, 1, 1.1, 1.05);
    const { width: W, height: H } = this.scale;
    this.grid = this.add.tileSprite(W / 2, H / 2, W, H, 'grid').setScrollFactor(0).setDepth(0).setAlpha(0.5);
    this.fx = new GameFx(this);
    this.fx.setupMapFx(this.stageId, W, H);

    this.stats = new PlayerStats(cls);
    this.player = new Player(this, 0, 0, this.stats, cls.color);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.weapons = new WeaponSystem();
    this.weapons.add(cls.startWeapon);
    this.spawner = new SpawnSystem(stage);

    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: 500, runChildUpdate: false });
    this.projectiles = this.physics.add.group({ classType: Projectile, maxSize: 400, runChildUpdate: false });
    this.orbs = this.physics.add.group({ classType: Orb, maxSize: 40, runChildUpdate: false });
    this.minions = this.physics.add.group({ classType: Minion, maxSize: 30, runChildUpdate: false });
    this.gems = this.physics.add.group({ classType: XPGem, maxSize: 600, runChildUpdate: false });
    this.pickups = this.physics.add.group({ classType: Pickup, maxSize: 30, runChildUpdate: false });

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjHit, undefined, this);
    this.physics.add.overlap(this.orbs, this.enemies, this.onOrbHit, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHit, undefined, this);
    this.physics.add.overlap(this.player, this.gems, this.onPickupGem, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickupItem, undefined, this);

    this.enemyHpBars = this.add.graphics().setDepth(6);
    this.hud = new HUD(this, stage.name);
    this.cards = new LevelUpCards(this);
    this.buildPanel = new BuildPanel(this);
    // TAB: 빌드 패널 토글(읽기전용 오버레이, 게임 미정지). 페이지 스크롤 방지.
    this.input.keyboard!.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault?.();
      this.buildPanel.toggle();
      this.buildPanel.refresh(this.weapons, this.stats);
    });

    this.startTime = this.time.now;
    this.lastHitTime = this.time.now;
    this.lastRegen = this.time.now;

    this.showTutorial();
  }

  // 첫 플레이 온보딩: 브라우저당 1회(localStorage). 게임은 뒤에서 계속 진행(일시정지 X).
  private showTutorial() {
    if (localStorage.getItem('dtd_seen_tutorial')) return;
    localStorage.setItem('dtd_seen_tutorial', '1');

    const { width: W, height: H } = this.scale;
    const lines = [
      'WASD / 방향키 — 이동',
      '무기는 자동 발사',
      '초록 XP 젬 수집 → 레벨업',
      '보스를 모두 처치하면 클리어',
    ].join('\n');

    const panel = this.add.rectangle(W / 2, H / 2, 360, 150, 0x0d1117, 0.85)
      .setStrokeStyle(1, 0x4ec9b0).setScrollFactor(0).setDepth(300);
    const text = this.add.text(W / 2, H / 2, lines, {
      fontFamily: 'monospace', fontSize: '15px', color: '#dcdcaa', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    const dismiss = () => {
      if (!panel.active) return;
      this.tweens.add({
        targets: [panel, text], alpha: 0, duration: 400,
        onComplete: () => { panel.destroy(); text.destroy(); },
      });
    };
    // 첫 이동키 또는 클릭 시 즉시 해제, 아니면 ~5초 후 자동 페이드아웃.
    this.input.keyboard?.once('keydown-W', dismiss);
    this.input.keyboard?.once('keydown-A', dismiss);
    this.input.keyboard?.once('keydown-S', dismiss);
    this.input.keyboard?.once('keydown-D', dismiss);
    this.input.keyboard?.once('keydown-UP', dismiss);
    this.input.keyboard?.once('keydown-LEFT', dismiss);
    this.input.keyboard?.once('keydown-DOWN', dismiss);
    this.input.keyboard?.once('keydown-RIGHT', dismiss);
    this.input.once('pointerdown', dismiss);
    this.time.delayedCall(5000, dismiss);
  }

  update(_: number, delta: number) {
    if (this.over) return;
    this.grid.tilePositionX = this.cameras.main.scrollX;
    this.grid.tilePositionY = this.cameras.main.scrollY;
    // 살아있는 배경: 스캔라인 + 코드 레인 드리프트(일시정지 중에도)
    this.fx.tickAmbient();
    if (this.paused) { this.player.setVelocity(0, 0); return; }

    const now = this.time.now;
    const elapsed = now - this.startTime;
    this.elapsedMin = elapsed / 60000;
    const px = this.player.x, py = this.player.y;

    this.player.move();
    this.ensureClones();

    // 적
    (this.enemies.getChildren() as Enemy[]).forEach((e) => { if (e.active) e.step(px, py, now); });
    // 젬
    (this.gems.getChildren() as XPGem[]).forEach((g) => { if (g.active) g.pull(px, py, this.player.pickupRadius); });
    // 투사체(유도 조향)
    (this.projectiles.getChildren() as Projectile[]).forEach((p) => {
      if (!p.active) return;
      p.tick(delta, p.homing ? this.nearestEnemy(p.x, p.y) : null);
    });
    // 미니언/분신
    (this.minions.getChildren() as Minion[]).forEach((m) => {
      if (!m.active) return;
      m.update2(px, py, delta, now, (mx, my) => {
        const t = this.nearestEnemy(mx, my);
        if (t) this.fireProjectile({ x: mx, y: my, angle: Phaser.Math.Angle.Between(mx, my, t.x, t.y), speed: 460, damage: m.damage, color: 0x7ee787 });
      });
    });

    this.weapons.update(this.ctx(now), delta);
    this.spawner.update(now, this.elapsedMin, px, py, (id, x, y) => this.spawnEnemy(id, x, y), (id) => this.spawnBoss(id));

    this.drawEnemyHpBars();

    // 보스 HP/소환/장식
    if (this.currentBoss && this.currentBoss.active) {
      const b = this.currentBoss;
      this.hud.updateBoss(b.hp / b.maxHp);
      this.bossOutline?.setPosition(b.x, b.y);
      this.bossBadge?.setPosition(b.x, b.y - b.displayHeight * 0.6 - 14);
      if (this.currentBoss.def.summon && now > this.bossSummonAt) {
        this.bossSummonAt = now + 3000;
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          this.spawnEnemy('bug', this.currentBoss.x + Math.cos(a) * 80, this.currentBoss.y + Math.sin(a) * 80);
        }
      }
    }

    // 패시브 자동회복(Hotfix)
    if (this.stats.regen > 0 && now - this.lastRegen >= 1000) {
      this.lastRegen = now;
      this.player.heal(this.stats.regen);
    }

    this.checkAchievements(elapsed, now);
    // 목표 HUD: 아직 안 나온 보스 중 가장 이른 것까지의 카운트다운.
    const bosses = STAGES[this.stageId].bosses;
    let nextBossInMs: number | null = null;
    for (const b of bosses) {
      if (b.time > elapsed && (nextBossInMs == null || b.time - elapsed < nextBossInMs)) nextBossInMs = b.time - elapsed;
    }
    this.hud.updateObjective(nextBossInMs, this.bossesKilled, bosses.length);
    this.hud.update(this.player.hp, this.player.maxHp, this.xp, xpForLevel(this.level), this.level, this.kills, elapsed);
    if (this.player.hp <= 0) this.onDeath(elapsed);
  }

  // ---- WeaponSystem 컨텍스트 ----
  private ctx(now: number): WeaponCtx {
    return {
      scene: this, px: this.player.x, py: this.player.y, now, elapsedMin: this.elapsedMin, stats: this.stats,
      orbs: this.orbs, minions: this.minions,
      nearestEnemy: (x, y) => this.nearestEnemy(x, y),
      enemiesInRadius: (x, y, r) => this.enemiesInRadius(x, y, r),
      hitEnemy: (e, dmg, opts) => this.hitEnemy(e, dmg, opts),
      explode: (x, y, r, dmg, color) => this.explode(x, y, r, dmg, color),
      fireProjectile: (o) => this.fireProjectile(o),
    };
  }

  private nearestEnemy(x: number, y: number): Enemy | null {
    let best: Enemy | null = null, bestD = Infinity;
    (this.enemies.getChildren() as Enemy[]).forEach((e) => {
      if (!e.active || e.harmless) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }
  private enemiesInRadius(x: number, y: number, r: number): Enemy[] {
    const out: Enemy[] = [];
    (this.enemies.getChildren() as Enemy[]).forEach((e) => {
      if (e.active && !e.harmless && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= r) out.push(e);
    });
    return out;
  }

  private fireProjectile(o: FireOpts) {
    const p = this.projectiles.get() as Projectile | null;
    if (p) p.fire(o);
  }

  // ---- 데미지/사망 중앙화 ----
  private hitEnemy(e: Enemy, baseDamage: number, opts?: { knock?: number; from?: { x: number; y: number }; instakill?: number }) {
    if (!e.active) return;
    if (opts?.instakill && Math.random() < opts.instakill && !e.def.boss) { this.killEnemy(e); return; }
    const { amount, crit } = this.stats.rollDamage(baseDamage, this.elapsedMin);
    if (opts?.knock && opts.from) {
      const a = Phaser.Math.Angle.Between(opts.from.x, opts.from.y, e.x, e.y);
      e.x += Math.cos(a) * opts.knock * 0.06; e.y += Math.sin(a) * opts.knock * 0.06;
    }
    if (crit || e.def.boss) this.fx.addDmgText(e.x, e.y, amount, crit);
    if (e.takeDamage(amount)) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    const def = e.def;
    const x = e.x, y = e.y, pscale = e.scaleX;
    e.kill();
    this.kills++;
    this.gems.get()?.drop(x, y, def.xp);
    this.rollPickup(x, y);

    // 분열: 같은 종류를 절반 크기로(무한분열 방지 위해 최소 크기 가드).
    if (def.splitOnDeath && !def.boss && pscale > 0.5) {
      for (let i = 0; i < def.splitOnDeath; i++) {
        const a = Math.random() * Math.PI * 2;
        const child = this.spawnEnemy(def.id, x + Math.cos(a) * 20, y + Math.sin(a) * 20, pscale * 0.58);
        if (child) { child.maxHp *= 0.5; child.hp = child.maxHp; }
      }
    }
    if (def.boss) this.onBossKilled(def.id);
    this.fx.killBurst(x, y, def.color);
    this.fx.emitBits(x, y, def.color);
  }

  private onBossKilled(id: string) {
    this.currentBoss = null;
    this.hud.clearBoss();
    this.bossOutline?.destroy(); this.bossOutline = undefined;
    this.bossBadge?.destroy(); this.bossBadge = undefined;
    this.bossesKilled++;
    this.fx.hitstop(90, () => !this.paused && !this.over); // 보스 처치 묵직하게
    this.cameras.main.flash(200, 80, 255, 80);
    this.cameras.main.shake(300, 0.01);
    if (id === 'prodbug') this.grant('incident');
    const stage = STAGES[this.stageId];
    if (this.bossesKilled >= stage.bosses.length) this.victory();
  }

  // ---- 적 스폰 ----
  private spawnEnemy(id: string, x: number, y: number, scaleOverride?: number): Enemy | null {
    const e = this.enemies.get() as Enemy | null;
    if (e) {
      e.spawn(id, x, y, this.elapsedMin, STAGES[this.stageId].hpMul);
      if (scaleOverride) e.setScale(scaleOverride);
    }
    return e;
  }
  private spawnBoss(id: string) {
    const e = this.enemies.get() as Enemy | null;
    if (!e) return;
    e.spawn(id, this.player.x + 400, this.player.y - 400, this.elapsedMin, STAGES[this.stageId].hpMul);
    this.currentBoss = e;
    this.bossSummonAt = this.time.now + 3000;
    this.hud.setBoss(ENEMIES[id].name);
    // 격 다른 등장: 외곽 링 + BOSS 뱃지 + 셰이크/플래시
    this.bossOutline?.destroy(); this.bossBadge?.destroy();
    const col = ENEMIES[id].color;
    this.bossOutline = this.add.circle(e.x, e.y, e.displayWidth * 0.62, 0xffffff, 0).setStrokeStyle(3, col, 0.9).setDepth(6);
    this.bossBadge = this.add.text(e.x, e.y, 'BOSS', { fontFamily: 'monospace', fontSize: '14px', color: '#ff5c5c' }).setOrigin(0.5).setDepth(101);
    this.tweens.add({ targets: this.bossOutline, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
    this.cameras.main.shake(400, 0.008);
    this.cameras.main.flash(160, 255, 80, 80);
  }

  // ---- 픽업 ----
  private rollPickup(x: number, y: number) {
    const p = BALANCE.pickups, r = Math.random();
    let kind: 'coffee' | 'bomb' | 'magnet' | null = null;
    if (r < p.dropBomb) kind = 'bomb';
    else if (r < p.dropBomb + p.dropMagnet) kind = 'magnet';
    else if (r < p.dropBomb + p.dropMagnet + p.dropCoffee) kind = 'coffee';
    if (kind) this.pickups.get()?.drop(kind, x, y);
  }
  private onPickupItem = (_p: any, item: any) => {
    const it = item as Pickup;
    if (!it.active) return;
    const kind = it.kind; it.kill();
    if (kind === 'coffee') this.player.heal(BALANCE.pickups.coffeeHeal);
    else if (kind === 'magnet') (this.gems.getChildren() as XPGem[]).forEach((g) => { if (g.active) g.forceMagnet(); });
    else if (kind === 'bomb') { // rm -rf: 화면 내 적 일소
      this.cameras.main.flash(250, 255, 80, 80);
      this.enemiesInRadius(this.player.x, this.player.y, 700).forEach((e) => { if (!e.def.boss) this.killEnemy(e); });
    }
  };

  // ---- 충돌 콜백 ----
  private onProjHit = (proj: any, enemy: any) => {
    const p = proj as Projectile, e = enemy as Enemy;
    if (!p.active || !e.active || e.harmless) return;
    if (p.hitSet.has(e.uid)) return; // 이미 맞힌 적(관통/튕김 중복 방지)
    this.hitEnemy(e, p.damage, { knock: p.knockback, from: { x: this.player.x, y: this.player.y }, instakill: p.instakill });
    const alive = p.onHit(e.uid);
    if (alive && p.bouncer) { // 튕김: 안 맞은 다음 적으로 방향 전환
      const next = this.nearestEnemyExcept(p.x, p.y, p.hitSet);
      if (next) {
        const a = Phaser.Math.Angle.Between(p.x, p.y, next.x, next.y);
        const sp = p.body!.velocity.length();
        p.setRotation(a); p.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp);
      }
    }
  };
  private nearestEnemyExcept(x: number, y: number, exclude: Set<number>): Enemy | null {
    let best: Enemy | null = null, bestD = Infinity;
    (this.enemies.getChildren() as Enemy[]).forEach((e) => {
      if (!e.active || e.harmless || exclude.has(e.uid)) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }

  private onOrbHit = (orb: any, enemy: any) => {
    const o = orb as Orb, e = enemy as Enemy;
    if (!o.active || !e.active || e.harmless) return;
    const now = this.time.now;
    if (now - e.lastDot < 180) return; // 지속뎀 throttle
    e.lastDot = now;
    this.hitEnemy(e, o.damage);
  };

  private onPlayerHit = (_player: any, enemy: any) => {
    const e = enemy as Enemy;
    if (!e.active || e.harmless) return;
    const now = this.time.now;
    if (now - e.lastTouch < BALANCE.enemy.touchCooldown) return;
    e.lastTouch = now;
    if (this.player.takeDamage(e.damage, now)) {
      this.lastHitTime = now;
      this.cameras.main.shake(80, 0.004); // 피격 미세 셰이크
    }
  };

  private onPickupGem = (_player: any, gem: any) => {
    const g = gem as XPGem;
    if (!g.active) return;
    this.xp += g.value; g.kill();
    if (this.xp >= xpForLevel(this.level)) this.levelUp();
  };

  // ---- 레벨업 ----
  private levelUp() {
    this.xp -= xpForLevel(this.level);
    this.level++;
    this.paused = true;
    this.physics.pause();
    const slots = CLASSES[(this.registry.get('classId') as string) || 'fullstack'].weaponSlots;
    const opts = buildUpgradeOptions(
      this.weapons, this.stats, slots,
      (id) => { this.weapons.has(id) ? this.weapons.levelUp(id) : this.weapons.add(id); },
      (id) => { this.stats.addPassive(id); this.player.applyStats(); },
      (mat, res) => this.weapons.evolve(mat, res),
      () => this.player.heal(50),
    );
    this.cards.show(opts, () => {
      this.paused = false;
      this.physics.resume();
      if (this.xp >= xpForLevel(this.level)) this.levelUp(); // 연속 레벨업
    });
  }

  // ---- 분신(Pair Programming) ----
  private ensureClones() {
    while (this.clonesSpawned < this.stats.cloneCount) {
      const m = this.minions.get() as Minion | null;
      if (!m) break;
      m.setPosition(this.player.x, this.player.y);
      m.activate(7, Infinity, 0x7ee787, this.clonesSpawned * 2); // 영구 분신
      this.clonesSpawned++;
    }
  }

  // ---- 폭발 ----
  private explode(x: number, y: number, r: number, baseDamage: number, color: number) {
    this.enemiesInRadius(x, y, r).forEach((e) => this.hitEnemy(e, baseDamage));
    this.fx.explodeVisual(x, y, r, color);
  }

  // 적 체력바: 단일 Graphics 1회 redraw(수백 마리 perf). 풀피/보스는 숨김.
  private drawEnemyHpBars() {
    const g = this.enemyHpBars;
    g.clear();
    (this.enemies.getChildren() as Enemy[]).forEach((e) => {
      if (!e.active || e.def.boss || e.hp >= e.maxHp) return;
      const w = e.displayWidth * 0.7;
      const x = e.x - w / 2, y = e.y - e.displayHeight * 0.55 - 5;
      const r = Phaser.Math.Clamp(e.hp / e.maxHp, 0, 1);
      g.fillStyle(0x0d1117, 0.85).fillRect(x - 1, y - 1, w + 2, 5);
      g.fillStyle(r > 0.3 ? 0x6ee7a0 : 0xff5c5c, 1).fillRect(x, y, w * r, 3);
    });
  }

  // ---- 업적 ----
  private checkAchievements(elapsed: number, now: number) {
    if (now - this.lastHitTime >= 120000) this.grant('nodowntime');
    if (elapsed >= 300000) this.grant('allnighter');
  }
  private grant(id: string) {
    if (MetaProgress.grantAchievement(id)) {
      const name = ACHIEVEMENTS.find((a) => a.id === id)?.name || id;
      this.newAchievements.push(name);
    }
  }

  // ---- 종료 ----
  private onDeath(elapsed: number) {
    if (this.stats.reviveAvailable) { // Stack Trace / git revert
      this.stats.reviveAvailable = false;
      this.player.hp = this.player.maxHp * 0.5;
      this.player.invuln = this.time.now + 1500;
      this.cameras.main.flash(400, 120, 255, 120);
      this.enemiesInRadius(this.player.x, this.player.y, 250).forEach((e) => { if (!e.def.boss) this.killEnemy(e); });
      return;
    }
    this.finish(elapsed, false);
  }
  private victory() { this.finish(this.time.now - this.startTime, true); }

  private finish(elapsed: number, victory: boolean) {
    if (this.over) return;
    this.over = true;
    this.physics.pause();
    const baseRP = Math.floor(elapsed / 1000 + this.kills * 2 + this.level * 5 + this.bossesKilled * 20 + (victory ? 100 : 0));
    const rpGained = MetaProgress.addRP(baseRP);
    this.scene.start('GameOver', {
      time: elapsed, kills: this.kills, level: this.level, rpGained,
      newAchievements: this.newAchievements, victory,
    });
  }
}
