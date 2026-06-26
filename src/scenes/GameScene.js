import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Orb } from '../entities/Orb';
import { Minion } from '../entities/Minion';
import { XPGem } from '../entities/XPGem';
import { Pickup } from '../entities/Pickup';
import { HUD } from '../ui/HUD';
import { LevelUpCards } from '../ui/LevelUpCards';
import { BALANCE, xpForLevel } from '../data/balance';
import { CLASSES } from '../data/classes';
import { STAGES } from '../data/stages';
import { ENEMIES } from '../data/enemies';
import { ACHIEVEMENTS } from '../data/metaUpgrades';
import { PlayerStats } from '../systems/PlayerStats';
import { WeaponSystem } from '../systems/WeaponSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { MetaProgress } from '../systems/MetaProgress';
import { buildUpgradeOptions } from '../systems/UpgradePool';
// 메인 씬: 모든 시스템 오케스트레이션. 데미지/사망 처리 중앙화.
export class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
        this.codeBits = [];
        this.stageId = 'localhost';
        this.xp = 0;
        this.level = 1;
        this.kills = 0;
        this.startTime = 0;
        this.elapsedMin = 0;
        this.paused = false;
        this.over = false;
        this.currentBoss = null;
        this.bossesKilled = 0;
        this.lastHitTime = 0; // 마지막 피격(무중단 배포 업적)
        this.lastRegen = 0;
        this.clonesSpawned = 0;
        this.newAchievements = [];
        this.bossSummonAt = 0;
        this.onPickupItem = (_p, item) => {
            const it = item;
            if (!it.active)
                return;
            const kind = it.kind;
            it.kill();
            if (kind === 'coffee')
                this.player.heal(BALANCE.pickups.coffeeHeal);
            else if (kind === 'magnet')
                this.gems.getChildren().forEach((g) => { if (g.active)
                    g.forceMagnet(); });
            else if (kind === 'bomb') { // rm -rf: 화면 내 적 일소
                this.cameras.main.flash(250, 255, 80, 80);
                this.enemiesInRadius(this.player.x, this.player.y, 700).forEach((e) => { if (!e.def.boss)
                    this.killEnemy(e); });
            }
        };
        // ---- 충돌 콜백 ----
        this.onProjHit = (proj, enemy) => {
            const p = proj, e = enemy;
            if (!p.active || !e.active || e.harmless)
                return;
            if (p.hitSet.has(e.uid))
                return; // 이미 맞힌 적(관통/튕김 중복 방지)
            this.hitEnemy(e, p.damage, { knock: p.knockback, from: { x: this.player.x, y: this.player.y }, instakill: p.instakill });
            const alive = p.onHit(e.uid);
            if (alive && p.bouncer) { // 튕김: 안 맞은 다음 적으로 방향 전환
                const next = this.nearestEnemyExcept(p.x, p.y, p.hitSet);
                if (next) {
                    const a = Phaser.Math.Angle.Between(p.x, p.y, next.x, next.y);
                    const sp = p.body.velocity.length();
                    p.setRotation(a);
                    p.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp);
                }
            }
        };
        this.onOrbHit = (orb, enemy) => {
            const o = orb, e = enemy;
            if (!o.active || !e.active || e.harmless)
                return;
            const now = this.time.now;
            if (now - e.lastDot < 180)
                return; // 지속뎀 throttle
            e.lastDot = now;
            this.hitEnemy(e, o.damage);
        };
        this.onPlayerHit = (_player, enemy) => {
            const e = enemy;
            if (!e.active || e.harmless)
                return;
            const now = this.time.now;
            if (now - e.lastTouch < BALANCE.enemy.touchCooldown)
                return;
            e.lastTouch = now;
            if (this.player.takeDamage(e.damage, now)) {
                this.lastHitTime = now;
                this.cameras.main.shake(80, 0.004); // 피격 미세 셰이크
            }
        };
        this.onPickupGem = (_player, gem) => {
            const g = gem;
            if (!g.active)
                return;
            this.xp += g.value;
            g.kill();
            if (this.xp >= xpForLevel(this.level))
                this.levelUp();
        };
    }
    create() {
        // Phaser 는 씬 인스턴스를 재사용 → 필드 초기값은 생성자에서 1회만 실행됨.
        // 재시작 시 상태를 명시적으로 리셋(안 하면 over=true 가 남아 멈춤).
        this.xp = 0;
        this.level = 1;
        this.kills = 0;
        this.elapsedMin = 0;
        this.paused = false;
        this.over = false;
        this.currentBoss = null;
        this.bossesKilled = 0;
        this.bossSummonAt = 0;
        this.clonesSpawned = 0;
        this.newAchievements = [];
        this.bossOutline = undefined;
        this.bossBadge = undefined;
        const classId = this.registry.get('classId') || 'fullstack';
        this.stageId = this.registry.get('stageId') || 'localhost';
        const cls = CLASSES[classId] || CLASSES.fullstack;
        const stage = STAGES[this.stageId] || STAGES.localhost;
        this.cameras.main.setBackgroundColor(stage.bgTint);
        // 카메라 블룸: 어두운 배경에 네온이 뜨게(전체 1패스 → 모든 밝은 요소 글로우, 풀별 글로우보다 쌈)
        const cam = this.cameras.main;
        if (cam.postFX)
            cam.postFX.addBloom(0xffffff, 1, 1, 1.1, 1.05);
        const { width: W, height: H } = this.scale;
        this.grid = this.add.tileSprite(W / 2, H / 2, W, H, 'grid').setScrollFactor(0).setDepth(0).setAlpha(0.5);
        this.setupMapFx(this.stageId, W, H);
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
        this.startTime = this.time.now;
        this.lastHitTime = this.time.now;
        this.lastRegen = this.time.now;
    }
    update(_, delta) {
        if (this.over)
            return;
        this.grid.tilePositionX = this.cameras.main.scrollX;
        this.grid.tilePositionY = this.cameras.main.scrollY;
        // 살아있는 배경: 스캔라인 + 코드 레인 드리프트(일시정지 중에도)
        this.scanlines.tilePositionY += 0.3;
        const Hh = this.scale.height, Ww = this.scale.width;
        for (const b of this.codeBits) {
            b.t.y += b.sp;
            if (b.t.y > Hh + 12) {
                b.t.y = -12;
                b.t.x = Math.random() * Ww;
            }
        }
        if (this.paused) {
            this.player.setVelocity(0, 0);
            return;
        }
        const now = this.time.now;
        const elapsed = now - this.startTime;
        this.elapsedMin = elapsed / 60000;
        const px = this.player.x, py = this.player.y;
        this.player.move();
        this.ensureClones();
        // 적
        this.enemies.getChildren().forEach((e) => { if (e.active)
            e.step(px, py, now); });
        // 젬
        this.gems.getChildren().forEach((g) => { if (g.active)
            g.pull(px, py, this.player.pickupRadius); });
        // 투사체(유도 조향)
        this.projectiles.getChildren().forEach((p) => {
            if (!p.active)
                return;
            p.tick(delta, p.homing ? this.nearestEnemy(p.x, p.y) : null);
        });
        // 미니언/분신
        this.minions.getChildren().forEach((m) => {
            if (!m.active)
                return;
            m.update2(px, py, delta, now, (mx, my) => {
                const t = this.nearestEnemy(mx, my);
                if (t)
                    this.fireProjectile({ x: mx, y: my, angle: Phaser.Math.Angle.Between(mx, my, t.x, t.y), speed: 460, damage: m.damage, color: 0x7ee787 });
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
        this.hud.update(this.player.hp, this.player.maxHp, this.xp, xpForLevel(this.level), this.level, this.kills, elapsed);
        if (this.player.hp <= 0)
            this.onDeath(elapsed);
    }
    // ---- WeaponSystem 컨텍스트 ----
    ctx(now) {
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
    nearestEnemy(x, y) {
        let best = null, bestD = Infinity;
        this.enemies.getChildren().forEach((e) => {
            if (!e.active || e.harmless)
                return;
            const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
            if (d < bestD) {
                bestD = d;
                best = e;
            }
        });
        return best;
    }
    enemiesInRadius(x, y, r) {
        const out = [];
        this.enemies.getChildren().forEach((e) => {
            if (e.active && !e.harmless && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= r)
                out.push(e);
        });
        return out;
    }
    fireProjectile(o) {
        const p = this.projectiles.get();
        if (p)
            p.fire(o);
    }
    // ---- 데미지/사망 중앙화 ----
    hitEnemy(e, baseDamage, opts) {
        if (!e.active)
            return;
        if (opts?.instakill && Math.random() < opts.instakill && !e.def.boss) {
            this.killEnemy(e);
            return;
        }
        const { amount, crit } = this.stats.rollDamage(baseDamage, this.elapsedMin);
        if (opts?.knock && opts.from) {
            const a = Phaser.Math.Angle.Between(opts.from.x, opts.from.y, e.x, e.y);
            e.x += Math.cos(a) * opts.knock * 0.06;
            e.y += Math.sin(a) * opts.knock * 0.06;
        }
        if (crit || e.def.boss)
            this.addDmgText(e.x, e.y, amount, crit);
        if (e.takeDamage(amount))
            this.killEnemy(e);
    }
    killEnemy(e) {
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
                if (child) {
                    child.maxHp *= 0.5;
                    child.hp = child.maxHp;
                }
            }
        }
        if (def.boss)
            this.onBossKilled(def.id);
        this.killBurst(x, y, def.color);
        this.emitBits(x, y, def.color);
    }
    // 사망 = 0/1 텍스트가 흩어짐. ponytail: 3개/킬, 대량킬(nuke) 시 누적되면 줄일 것.
    emitBits(x, y, color) {
        const hex = '#' + color.toString(16).padStart(6, '0');
        for (let i = 0; i < 3; i++) {
            const t = this.add.text(x, y, Math.random() < 0.5 ? '0' : '1', {
                fontFamily: 'monospace', fontSize: '12px', color: hex,
            }).setOrigin(0.5).setDepth(15);
            const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 24;
            this.tweens.add({
                targets: t, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0,
                duration: 280 + Math.random() * 220, ease: 'Quad.easeOut', onComplete: () => t.destroy(),
            });
        }
    }
    // 히트스톱: 큰 순간(보스 사망)만. 물리 일시정지 후 실시간 타이머로 복귀(timeScale 함정 회피).
    hitstop(ms = 60) {
        if (this.paused || this.over)
            return;
        this.physics.pause();
        window.setTimeout(() => { if (!this.paused && !this.over)
            this.physics.resume(); }, ms);
    }
    onBossKilled(id) {
        this.currentBoss = null;
        this.hud.clearBoss();
        this.bossOutline?.destroy();
        this.bossOutline = undefined;
        this.bossBadge?.destroy();
        this.bossBadge = undefined;
        this.bossesKilled++;
        this.hitstop(90); // 보스 처치 묵직하게
        this.cameras.main.flash(200, 80, 255, 80);
        this.cameras.main.shake(300, 0.01);
        if (id === 'prodbug')
            this.grant('incident');
        const stage = STAGES[this.stageId];
        if (this.bossesKilled >= stage.bosses.length)
            this.victory();
    }
    // ---- 적 스폰 ----
    spawnEnemy(id, x, y, scaleOverride) {
        const e = this.enemies.get();
        if (e) {
            e.spawn(id, x, y, this.elapsedMin, STAGES[this.stageId].hpMul);
            if (scaleOverride)
                e.setScale(scaleOverride);
        }
        return e;
    }
    spawnBoss(id) {
        const e = this.enemies.get();
        if (!e)
            return;
        e.spawn(id, this.player.x + 400, this.player.y - 400, this.elapsedMin, STAGES[this.stageId].hpMul);
        this.currentBoss = e;
        this.bossSummonAt = this.time.now + 3000;
        this.hud.setBoss(ENEMIES[id].name);
        // 격 다른 등장: 외곽 링 + BOSS 뱃지 + 셰이크/플래시
        this.bossOutline?.destroy();
        this.bossBadge?.destroy();
        const col = ENEMIES[id].color;
        this.bossOutline = this.add.circle(e.x, e.y, e.displayWidth * 0.62, 0xffffff, 0).setStrokeStyle(3, col, 0.9).setDepth(6);
        this.bossBadge = this.add.text(e.x, e.y, 'BOSS', { fontFamily: 'monospace', fontSize: '14px', color: '#ff5c5c' }).setOrigin(0.5).setDepth(101);
        this.tweens.add({ targets: this.bossOutline, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
        this.cameras.main.shake(400, 0.008);
        this.cameras.main.flash(160, 255, 80, 80);
    }
    // ---- 픽업 ----
    rollPickup(x, y) {
        const p = BALANCE.pickups, r = Math.random();
        let kind = null;
        if (r < p.dropBomb)
            kind = 'bomb';
        else if (r < p.dropBomb + p.dropMagnet)
            kind = 'magnet';
        else if (r < p.dropBomb + p.dropMagnet + p.dropCoffee)
            kind = 'coffee';
        if (kind)
            this.pickups.get()?.drop(kind, x, y);
    }
    nearestEnemyExcept(x, y, exclude) {
        let best = null, bestD = Infinity;
        this.enemies.getChildren().forEach((e) => {
            if (!e.active || e.harmless || exclude.has(e.uid))
                return;
            const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
            if (d < bestD) {
                bestD = d;
                best = e;
            }
        });
        return best;
    }
    // ---- 레벨업 ----
    levelUp() {
        this.xp -= xpForLevel(this.level);
        this.level++;
        this.paused = true;
        this.physics.pause();
        const slots = CLASSES[this.registry.get('classId') || 'fullstack'].weaponSlots;
        const opts = buildUpgradeOptions(this.weapons, this.stats, slots, (id) => { this.weapons.has(id) ? this.weapons.levelUp(id) : this.weapons.add(id); }, (id) => { this.stats.addPassive(id); this.player.applyStats(); }, (mat, res) => this.weapons.evolve(mat, res), () => this.player.heal(50));
        this.cards.show(opts, () => {
            this.paused = false;
            this.physics.resume();
            if (this.xp >= xpForLevel(this.level))
                this.levelUp(); // 연속 레벨업
        });
    }
    // ---- 분신(Pair Programming) ----
    ensureClones() {
        while (this.clonesSpawned < this.stats.cloneCount) {
            const m = this.minions.get();
            if (!m)
                break;
            m.setPosition(this.player.x, this.player.y);
            m.activate(7, Infinity, 0x7ee787, this.clonesSpawned * 2); // 영구 분신
            this.clonesSpawned++;
        }
    }
    // ---- 폭발/이펙트 ----
    explode(x, y, r, baseDamage, color) {
        this.enemiesInRadius(x, y, r).forEach((e) => this.hitEnemy(e, baseDamage));
        const radius = Math.min(r, 400);
        const c = this.add.circle(x, y, radius, color, 0.3).setDepth(6).setScale(0.2);
        this.tweens.add({ targets: c, scale: 1, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    }
    killBurst(x, y, color) {
        const c = this.add.circle(x, y, 6, color, 0.9).setDepth(6);
        this.tweens.add({ targets: c, scale: 2, alpha: 0, duration: 180, onComplete: () => c.destroy() });
    }
    // 맵별 정체성: 스캔라인 + 비네팅 + 떠다니는 코드 글리프(parallax 코드 레인).
    setupMapFx(stageId, W, H) {
        const cfg = {
            localhost: { p: 0x6a9955, scan: 0.05, vig: 0.50, count: 16 },
            staging: { p: 0x4ec9b0, scan: 0.07, vig: 0.55, count: 20 },
            production: { p: 0xff5c5c, scan: 0.11, vig: 0.72, count: 26 },
        }[stageId]
            || { p: 0x6a9955, scan: 0.05, vig: 0.50, count: 16 };
        this.scanlines = this.add.tileSprite(W / 2, H / 2, W, H, 'scanline').setScrollFactor(0).setDepth(49).setAlpha(cfg.scan);
        this.add.image(W / 2, H / 2, 'vignette').setScrollFactor(0).setDepth(50).setDisplaySize(W * 1.05, H * 1.05).setAlpha(cfg.vig);
        const hex = '#' + cfg.p.toString(16).padStart(6, '0');
        const glyphs = ['0', '1', '{ }', '( )', '=>', ';', '</>', '&&', '||', '#', 'fn', '01'];
        this.codeBits = [];
        for (let i = 0; i < cfg.count; i++) {
            const t = this.add.text(Math.random() * W, Math.random() * H, glyphs[i % glyphs.length], {
                fontFamily: 'monospace', fontSize: (10 + (Math.random() * 8 | 0)) + 'px', color: hex,
            }).setScrollFactor(0).setDepth(1).setAlpha(0.08 + Math.random() * 0.10);
            this.codeBits.push({ t, sp: 0.2 + Math.random() * 0.6 });
        }
    }
    // 적 체력바: 단일 Graphics 1회 redraw(수백 마리 perf). 풀피/보스는 숨김.
    drawEnemyHpBars() {
        const g = this.enemyHpBars;
        g.clear();
        this.enemies.getChildren().forEach((e) => {
            if (!e.active || e.def.boss || e.hp >= e.maxHp)
                return;
            const w = e.displayWidth * 0.7;
            const x = e.x - w / 2, y = e.y - e.displayHeight * 0.55 - 5;
            const r = Phaser.Math.Clamp(e.hp / e.maxHp, 0, 1);
            g.fillStyle(0x0d1117, 0.85).fillRect(x - 1, y - 1, w + 2, 5);
            g.fillStyle(r > 0.3 ? 0x6ee7a0 : 0xff5c5c, 1).fillRect(x, y, w * r, 3);
        });
    }
    addDmgText(x, y, amount, crit) {
        const t = this.add.text(x, y, `${amount}`, {
            fontFamily: 'monospace', fontSize: crit ? '18px' : '13px', color: crit ? '#ffd700' : '#ffffff',
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 600, onComplete: () => t.destroy() });
    }
    // ---- 업적 ----
    checkAchievements(elapsed, now) {
        if (now - this.lastHitTime >= 120000)
            this.grant('nodowntime');
        if (elapsed >= 300000)
            this.grant('allnighter');
    }
    grant(id) {
        if (MetaProgress.grantAchievement(id)) {
            const name = ACHIEVEMENTS.find((a) => a.id === id)?.name || id;
            this.newAchievements.push(name);
        }
    }
    // ---- 종료 ----
    onDeath(elapsed) {
        if (this.stats.reviveAvailable) { // Stack Trace / git revert
            this.stats.reviveAvailable = false;
            this.player.hp = this.player.maxHp * 0.5;
            this.player.invuln = this.time.now + 1500;
            this.cameras.main.flash(400, 120, 255, 120);
            this.enemiesInRadius(this.player.x, this.player.y, 250).forEach((e) => { if (!e.def.boss)
                this.killEnemy(e); });
            return;
        }
        this.finish(elapsed, false);
    }
    victory() { this.finish(this.time.now - this.startTime, true); }
    finish(elapsed, victory) {
        if (this.over)
            return;
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
