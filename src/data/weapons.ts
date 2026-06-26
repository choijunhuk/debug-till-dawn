import type { WeaponDef } from './types';

// 무기 전체. Lv1 기준값 + 레벨당 공식 강화(아래 computeWeaponStats).
// icon = brandAssets 키(13번). 진화는 evolvesTo/evoPassive 로 정의(6번).
export const WEAPONS: Record<string, WeaponDef> = {
  consolelog: { id: 'consolelog', name: 'console.log()', behavior: 'projectile', icon: 'js',
    color: 0xdcdcaa, maxLevel: 6, damage: 7, cooldown: 680, count: 1, speed: 440, area: 0,
    evolvesTo: 'consolespam', evoPassive: 'lowlatency' },

  forloop: { id: 'forloop', name: 'for-loop', behavior: 'orbit', icon: 'ts',
    color: 0x4ec9b0, maxLevel: 6, damage: 6, cooldown: 0, count: 2, speed: 2.4, area: 90,
    duration: 0, evolvesTo: 'whiletrue', evoPassive: 'multithread' },

  regex: { id: 'regex', name: 'RegEx', behavior: 'whip', icon: 'regex',
    color: 0xc586c0, maxLevel: 6, damage: 12, cooldown: 900, count: 1, speed: 0, area: 130,
    duration: 180, evolvesTo: 'regexhell', evoPassive: 'refactor' },

  gitpush: { id: 'gitpush', name: 'git push', behavior: 'projectile', icon: 'git',
    color: 0xf05033, maxLevel: 6, damage: 10, cooldown: 800, count: 1, speed: 380, area: 0,
    knockback: 260, evolvesTo: 'forcepush', evoPassive: 'hotfix' },

  nullptr: { id: 'nullptr', name: 'nullptr', behavior: 'pierce', icon: 'cpp',
    color: 0x659ad2, maxLevel: 6, damage: 9, cooldown: 720, count: 1, speed: 520, area: 0, pierce: 5 },

  recursion: { id: 'recursion', name: 'recursion', behavior: 'bounce', icon: 'py',
    color: 0xffd43b, maxLevel: 6, damage: 8, cooldown: 760, count: 1, speed: 480, area: 0, bounces: 4,
    evolvesTo: 'forkbomb', evoPassive: 'multithread' },

  gc: { id: 'gc', name: 'GC', behavior: 'aura', icon: 'java',
    color: 0x6a9955, maxLevel: 6, damage: 5, cooldown: 0, count: 1, speed: 0, area: 110,
    vacuum: true, duration: 0, evolvesTo: 'oomkiller', evoPassive: 'ram' },

  npminstall: { id: 'npminstall', name: 'npm install', behavior: 'summon', icon: 'npm',
    color: 0xcb3837, maxLevel: 6, damage: 8, cooldown: 4000, count: 1, speed: 160, area: 0,
    duration: 9000, evolvesTo: 'nodemodules', evoPassive: 'overclock' },

  pointer: { id: 'pointer', name: 'pointer', behavior: 'homing', icon: 'c',
    color: 0xa8b9cc, maxLevel: 6, damage: 9, cooldown: 900, count: 1, speed: 300, area: 0 },

  binarysearch: { id: 'binarysearch', name: 'binary search', behavior: 'pierce', icon: 'rust',
    color: 0xce422b, maxLevel: 6, damage: 14, cooldown: 1300, count: 1, speed: 900, area: 0, pierce: 99 },

  cronjob: { id: 'cronjob', name: 'cron job', behavior: 'bomb', icon: 'cron',
    color: 0xce9178, maxLevel: 6, damage: 16, cooldown: 1600, count: 1, speed: 0, area: 80, duration: 350,
    evolvesTo: 'kubernetes', evoPassive: 'refactor' },

  docker: { id: 'docker', name: 'Docker', behavior: 'aura', icon: 'docker',
    color: 0x2496ed, maxLevel: 6, damage: 3, cooldown: 0, count: 1, speed: 0, area: 100, slow: 0.6,
    evolvesTo: 'kubernetes', evoPassive: 'ram' },

  notfound: { id: 'notfound', name: '404', behavior: 'projectile', icon: 'http',
    color: 0xff5555, maxLevel: 6, damage: 6, cooldown: 1000, count: 1, speed: 460, area: 0, instakill: 0.12 },

  sudo: { id: 'sudo', name: 'sudo', behavior: 'nuke', icon: 'linux',
    color: 0xffffff, maxLevel: 6, damage: 40, cooldown: 12000, count: 1, speed: 0, area: 99999,
    evolvesTo: 'sudormrf', evoPassive: 'stacktrace' },

  // 진화 무기 (레벨업 카드 풀엔 안 뜸, 진화로만 획득)
  consolespam: { id: 'consolespam', name: 'console.spam()', behavior: 'projectile', icon: 'js',
    color: 0xffe066, maxLevel: 1, damage: 14, cooldown: 120, count: 3, speed: 560, area: 0 },
  whiletrue: { id: 'whiletrue', name: 'while(true)', behavior: 'orbit', icon: 'ts',
    color: 0x39ffce, maxLevel: 1, damage: 16, cooldown: 0, count: 8, speed: 3.4, area: 120 },
  regexhell: { id: 'regexhell', name: 'RegEx Hell', behavior: 'whip', icon: 'regex',
    color: 0xff6ad5, maxLevel: 1, damage: 30, cooldown: 500, count: 1, speed: 0, area: 280, duration: 220 },
  forcepush: { id: 'forcepush', name: 'Force Push', behavior: 'projectile', icon: 'git',
    color: 0xff7b54, maxLevel: 1, damage: 26, cooldown: 500, count: 2, speed: 460, area: 0, knockback: 420 },
  forkbomb: { id: 'forkbomb', name: 'Fork Bomb', behavior: 'bounce', icon: 'py',
    color: 0xfff06a, maxLevel: 1, damage: 20, cooldown: 400, count: 3, speed: 560, area: 0, bounces: 10 },
  oomkiller: { id: 'oomkiller', name: 'OOM Killer', behavior: 'aura', icon: 'java',
    color: 0x9cff6a, maxLevel: 1, damage: 16, cooldown: 0, count: 1, speed: 0, area: 180, vacuum: true },
  nodemodules: { id: 'nodemodules', name: 'node_modules', behavior: 'summon', icon: 'npm',
    color: 0xff5e5e, maxLevel: 1, damage: 12, cooldown: 2500, count: 4, speed: 180, area: 0, duration: 12000 },
  kubernetes: { id: 'kubernetes', name: 'Kubernetes', behavior: 'bomb', icon: 'k8s',
    color: 0x326ce5, maxLevel: 1, damage: 26, cooldown: 900, count: 3, speed: 0, area: 110, duration: 300 },
  sudormrf: { id: 'sudormrf', name: 'sudo rm -rf /', behavior: 'nuke', icon: 'linux',
    color: 0xff2222, maxLevel: 1, damage: 120, cooldown: 9000, count: 1, speed: 0, area: 99999 },
};
