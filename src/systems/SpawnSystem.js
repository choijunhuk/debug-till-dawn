import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
// 시간 기반 스폰 + 보스 스케줄. 스폰 자체는 콜백으로 위임(scene 가 풀 관리).
export class SpawnSystem {
    constructor(stage) {
        this.nextSpawn = 0;
        this.bossesSpawned = new Set();
        this.stage = stage;
    }
    update(now, elapsedMin, px, py, 
    // now: 잡몹 스폰 타이밍용, elapsedMin: 보스 스케줄용
    spawn, spawnBoss) {
        const b = BALANCE.enemy;
        const elapsedMs = elapsedMin * 60000;
        // 보스
        this.stage.bosses.forEach((boss, i) => {
            if (!this.bossesSpawned.has(i) && elapsedMs >= boss.time) {
                this.bossesSpawned.add(i);
                spawnBoss(boss.id);
            }
        });
        // 잡몹
        if (now < this.nextSpawn)
            return;
        const interval = Math.max(b.spawnIntervalMin, (b.spawnIntervalStart - b.spawnIntervalDecayPerMin * elapsedMin) / this.stage.spawnMul);
        this.nextSpawn = now + interval;
        const burst = Math.ceil((1 + elapsedMin) * this.stage.spawnMul);
        for (let i = 0; i < burst; i++) {
            const id = Phaser.Utils.Array.GetRandom(this.stage.enemyPool);
            const ang = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(b.spawnRingMin, b.spawnRingMax);
            spawn(id, px + Math.cos(ang) * dist, py + Math.sin(ang) * dist);
        }
    }
}
