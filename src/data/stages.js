// 배포환경 = 맵. 적 풀/보스 타이밍/밀도/모디파이어/배경 톤.
export const STAGES = {
    localhost: {
        id: 'localhost', name: 'localhost', desc: '튜토리얼 — 느린 적, 기본기', bgTint: 0x0d1117,
        enemyPool: ['bug', 'syntax', 'nullenemy'],
        bosses: [{ time: 120000, id: 'segfault' }],
        spawnMul: 0.8, hpMul: 1,
    },
    staging: {
        id: 'staging', name: 'Staging', desc: '중간 — 적 구성 다양', bgTint: 0x111a14,
        enemyPool: ['bug', 'syntax', 'nullenemy', 'infloop', 'memleak', 'mergeconf', 'deadlock'],
        bosses: [{ time: 90000, id: 'onsquared' }, { time: 210000, id: 'segfault' }],
        spawnMul: 1, hpMul: 1.15, locked: true,
    },
    production: {
        id: 'production', name: 'Production', desc: '하드 — 금요일 오후 배포', bgTint: 0x1a0d12,
        enemyPool: ['bug', 'syntax', 'infloop', 'memleak', 'mergeconf', 'legacy', 'deadlock', 'heisenbug', 'techdebt', 'todo'],
        bosses: [{ time: 60000, id: 'onsquared' }, { time: 150000, id: 'prodbug' }, { time: 270000, id: 'segfault' }],
        spawnMul: 1.4, hpMul: 1.4, locked: true,
    },
};
