// 메타 영구 업그레이드(RP 상점). 해금은 unlocks 로 별도 관리.
export const META_UPGRADES = {
    startHp: { id: 'startHp', name: '시작 체력', desc: '시작 최대 체력 +20', maxLevel: 5, cost: 30, apply: 'startHp', value: 20 },
    startDmg: { id: 'startDmg', name: '시작 데미지', desc: '전체 데미지 +5%', maxLevel: 5, cost: 40, apply: 'startDamage', value: 0.05 },
    pickup: { id: 'pickup', name: '픽업 반경', desc: '픽업 반경 +15%', maxLevel: 4, cost: 35, apply: 'pickup', value: 0.15 },
    rpBonus: { id: 'rpBonus', name: 'RP 보너스', desc: '획득 RP +10%', maxLevel: 5, cost: 50, apply: 'rpBonus', value: 0.10 },
    revive: { id: 'revive', name: 'Stack Trace 기본 부활', desc: '시작 시 1회 부활 해금', maxLevel: 1, cost: 200, apply: 'reviveUnlock', value: 1 },
};
// RP로 해금하는 콘텐츠(직군/맵)
export const UNLOCKS = {
    devops: { name: '직군: DevOps', cost: 120, type: 'class' },
    qa: { name: '직군: QA', cost: 120, type: 'class' },
    staging: { name: '맵: Staging', cost: 80, type: 'stage' },
    production: { name: '맵: Production', cost: 250, type: 'stage' },
};
export const ACHIEVEMENTS = [
    { id: 'nodowntime', name: '무중단 배포', desc: '2분간 노 데미지 생존' },
    { id: 'allnighter', name: '밤샘 디버깅', desc: '5분 생존' },
    { id: 'incident', name: '프로덕션 장애 대응', desc: 'Production 보스 처치' },
];
