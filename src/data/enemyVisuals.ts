import Phaser from 'phaser';

// 적을 이름에 맞는 모양으로 절차적 드로잉(SVG 금지 → 색·크기·애니메 코드 제어).
// 48x48 박스 중앙(24,24)에 그림. Preload 에서 generateTexture 로 캐싱('eshape_<id>').
// 멀리서도 실루엣+색으로 종류 구분되게 단순/강하게.
export const ESHAPE_SIZE = 48;
const C = 24; // center
const DARK = 0x0d1117;

// 보스는 디테일 위해 큰 박스(96)에 그림.
const BOSS_SHAPES = ['boss_onsquared', 'boss_segfault', 'boss_prodbug'];
export function shapeSize(shape: string) { return BOSS_SHAPES.includes(shape) ? 96 : ESHAPE_SIZE; }

export function drawEnemyShape(g: Phaser.GameObjects.Graphics, shape: string) {
  switch (shape) {
    case 'bug': return drawBug(g);
    case 'syntax': return drawSyntax(g);
    case 'null': return drawNull(g);
    case 'memleak': return drawMemleak(g);
    case 'mergeconf': return drawMergeConflict(g);
    case 'infloop': return drawInfLoop(g);
    case 'legacy': return drawLegacy(g);
    case 'deadlock': return drawDeadlock(g);
    case 'todo': return drawTodo(g);
    case 'heisenbug': return drawHeisenbug(g);
    case 'boss_onsquared': return drawBossOnSquared(g);
    case 'boss_segfault': return drawBossSegfault(g);
    case 'boss_prodbug': return drawBossProdBug(g);
  }
}

// Bug: 둥근 초록 몸 + 머리 + 더듬이 + 다리 6 + 검은 눈
function drawBug(g: Phaser.GameObjects.Graphics) {
  const green = 0x6ee7a0;
  g.lineStyle(2, DARK, 1);
  for (let i = 0; i < 3; i++) { // 다리 6 (양쪽 3)
    const y = 20 + i * 6;
    g.lineBetween(C - 9, y, C - 18, y - 2);
    g.lineBetween(C + 9, y, C + 18, y - 2);
  }
  g.lineBetween(C - 4, 12, C - 8, 4); // 더듬이
  g.lineBetween(C + 4, 12, C + 8, 4);
  g.fillStyle(green, 1).fillCircle(C, 27, 12); // 몸
  g.fillStyle(green, 1).fillCircle(C, 14, 7);  // 머리
  g.fillStyle(DARK, 1).fillCircle(C - 3, 13, 1.6).fillCircle(C + 3, 13, 1.6); // 눈
}

// Syntax Error: 회색 코드 라인 2 + 빨간 물결 밑줄
function drawSyntax(g: Phaser.GameObjects.Graphics) {
  const gray = 0x6e7681, red = 0xff5c5c;
  g.fillStyle(gray, 1).fillRect(10, 15, 26, 4).fillRect(10, 23, 18, 4);
  g.lineStyle(2.5, red, 1).beginPath();
  g.moveTo(8, 33);
  for (let x = 8; x <= 40; x += 4) g.lineTo(x, 33 + (((x / 4) % 2) ? 4 : -4));
  g.strokePath();
}

// null: 점선 사각 + 가운데 ∅
function drawNull(g: Phaser.GameObjects.Graphics) {
  const gray = 0x8b949e;
  g.lineStyle(2, gray, 1);
  const a = 8, b = 40, step = 6;
  for (let x = a; x < b; x += step) { g.lineBetween(x, a, x + 3, a); g.lineBetween(x, b, x + 3, b); }
  for (let y = a; y < b; y += step) { g.lineBetween(a, y, a, y + 3); g.lineBetween(b, y, b, y + 3); }
  g.lineStyle(2.5, gray, 1).strokeCircle(C, C, 8); // ∅
  g.lineBetween(C - 6, C + 6, C + 6, C - 6);
}

// Memory Leak: 둥근 슬라임 블롭 + 아래 방울
function drawMemleak(g: Phaser.GameObjects.Graphics) {
  const green = 0x7bb661;
  g.fillStyle(green, 1).fillCircle(C, 20, 13);
  g.fillStyle(green, 0.95).fillCircle(C - 7, 30, 4).fillCircle(C + 6, 32, 5).fillCircle(C, 38, 3); // 흐르는 방울
  g.fillStyle(0x0d1117, 0.4).fillCircle(C - 4, 17, 2).fillCircle(C + 5, 19, 1.5); // 음영
}

// Merge Conflict: 갈라진 두 색 + 지그재그 경계
function drawMergeConflict(g: Phaser.GameObjects.Graphics) {
  const purple = 0xc586c0, orange = 0xce9178;
  g.fillStyle(purple, 1).fillRect(9, 11, 15, 26);
  g.fillStyle(orange, 1).fillRect(24, 11, 15, 26);
  g.lineStyle(2.5, 0x0d1117, 1).beginPath();
  g.moveTo(24, 11);
  for (let y = 11, k = 0; y <= 37; y += 6, k++) g.lineTo(24 + (k % 2 ? 4 : -4), y);
  g.strokePath();
}

// Infinite Loop: 회전 화살표 고리(↻). 실제 회전은 step 에서.
function drawInfLoop(g: Phaser.GameObjects.Graphics) {
  const cyan = 0x4ec9b0;
  g.lineStyle(4, cyan, 1).beginPath();
  g.arc(C, C, 13, Phaser.Math.DegToRad(55), Phaser.Math.DegToRad(360), false);
  g.strokePath();
  const ang = Phaser.Math.DegToRad(55);
  const ex = C + Math.cos(ang) * 13, ey = C + Math.sin(ang) * 13;
  g.fillStyle(cyan, 1).fillTriangle(ex + 6, ey, ex - 4, ey - 6, ex - 4, ey + 6); // 화살촉
}

// Legacy Code: 아이소메트릭 큐브(3면 음영) + 균열
function drawLegacy(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x8b949e, 1).fillPoints([{ x: C, y: 8 }, { x: 40, y: 17 }, { x: C, y: 26 }, { x: 8, y: 17 }], true); // 윗면
  g.fillStyle(0x6e7681, 1).fillPoints([{ x: 8, y: 17 }, { x: C, y: 26 }, { x: C, y: 42 }, { x: 8, y: 33 }], true); // 좌면
  g.fillStyle(0x484f58, 1).fillPoints([{ x: 40, y: 17 }, { x: C, y: 26 }, { x: C, y: 42 }, { x: 40, y: 33 }], true); // 우면
  g.lineStyle(1.5, 0x0d1117, 0.7).lineBetween(C, 26, 18, 36).lineBetween(C, 12, 30, 20); // 균열
}

// Deadlock: 맞물린 톱니 두 개
function drawDeadlock(g: Phaser.GameObjects.Graphics) {
  const o = 0xce9178;
  for (const [gx] of [[18], [30]] as [number][]) {
    g.lineStyle(2.5, o, 1).strokeCircle(gx, C, 7);
    for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; g.lineBetween(gx + Math.cos(ang) * 7, C + Math.sin(ang) * 7, gx + Math.cos(ang) * 10, C + Math.sin(ang) * 10); }
    g.fillStyle(o, 1).fillCircle(gx, C, 2);
  }
}

// TODO: 빈 체크박스 + 텍스트 라인(faux)
function drawTodo(g: Phaser.GameObjects.Graphics) {
  const y = 0xdcdcaa;
  g.lineStyle(2.5, y, 1).strokeRect(11, 16, 13, 13);
  g.fillStyle(0x6e7681, 1).fillRect(28, 18, 12, 3).fillRect(28, 24, 9, 3);
}

// Heisenbug: 흐릿하게 깜빡이는 형체(저알파 겹침)
function drawHeisenbug(g: Phaser.GameObjects.Graphics) {
  const p = 0xb392f0;
  g.fillStyle(p, 0.5).fillCircle(C, C, 11);
  g.fillStyle(p, 0.3).fillCircle(C - 4, C - 2, 12);
  g.fillStyle(p, 0.3).fillCircle(C + 4, C + 2, 12);
}

// ── 보스(96px 박스, 중심 48) ──
const BC = 48;

// O(n²): 노드 격자 + 연결선
function drawBossOnSquared(g: Phaser.GameObjects.Graphics) {
  const purple = 0xc586c0;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push({ x: 24 + i * 24, y: 24 + j * 24 });
  g.lineStyle(2, purple, 0.5);
  for (const a of pts) for (const b of pts) if (a !== b) g.lineBetween(a.x, a.y, b.x, b.y);
  g.fillStyle(purple, 1);
  for (const p of pts) g.fillCircle(p.x, p.y, 6);
}

// Segfault: 깨진 메모리 블록 + 균열
function drawBossSegfault(g: Phaser.GameObjects.Graphics) {
  const red = 0xff5c5c;
  g.fillStyle(red, 1);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if ((i * 3 + j) % 4 === 0) continue; g.fillRect(14 + i * 18, 14 + j * 18, 14, 14); }
  g.lineStyle(3, 0x0d1117, 1).lineBetween(18, 48, 78, 38).lineBetween(48, 14, 54, 82);
}

// Production Bug: 거대 버그/스컬 + 다리
function drawBossProdBug(g: Phaser.GameObjects.Graphics) {
  const pink = 0xff0066;
  g.lineStyle(4, pink, 1);
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; g.lineBetween(BC + Math.cos(ang) * 28, BC + 4 + Math.sin(ang) * 28, BC + Math.cos(ang) * 40, BC + 4 + Math.sin(ang) * 40); }
  g.fillStyle(pink, 1).fillCircle(BC, BC + 4, 28);
  g.fillStyle(0x0d1117, 1).fillCircle(BC - 10, BC, 8).fillCircle(BC + 10, BC, 8); // 눈
  g.fillStyle(0xffffff, 1).fillCircle(BC - 10, BC, 3).fillCircle(BC + 10, BC, 3);
}
