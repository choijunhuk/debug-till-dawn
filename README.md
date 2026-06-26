# DEBUG TILL DAWN

프로그래밍을 테마로 한 **뱀파이어 서바이버류 로그라이크** 게임. 새벽까지 밀려드는 버그 떼를 무기(코드)로 쓸어담으며 버티는 생존 게임이다. Phaser 3 + TypeScript + Vite로 제작했다.

> WASD/방향키로 캐릭터를 이동하면 무기는 자동 발사. 적을 처치해 XP를 모으고 레벨업마다 무기·패시브를 골라 빌드를 완성한다.

## 게임 특징

- **직군(클래스) 5종** — Fullstack / Frontend / Backend / DevOps / QA. 각자 시작 무기와 스탯 보정(속도·체력·데미지·크리·무기 슬롯)이 다르다. DevOps·QA는 메타 재화로 해금.
- **무기 23종** — `console.log()`, `for-loop`, `RegEx`, `git push`, `nullptr`, `recursion`, `GC` 등. 투사체·궤도·채찍·관통·튕김·오라 등 거동(behavior)이 제각각이고 레벨업으로 강화된다.
- **무기 진화** — 특정 무기 최대 레벨 + 짝 패시브를 갖추면 상위 무기로 진화 (예: `console.log()` → `console spam`, `RegEx` → `RegEx Hell`).
- **패시브 11종** — 빌드를 떠받치는 보조 강화.
- **적 14종** — Bug, Syntax Error, null, Infinite Loop, Memory Leak, Merge Conflict(죽을 때 분열), Legacy Code(탱커), Heisenbug(접근 시 사라짐), Tech Debt 등 행동 패턴이 다양하다. 보스는 Segfault·Prod Bug·O(n²) 등.
- **스테이지 3종 = 배포 환경** — `localhost`(튜토리얼) → `Staging`(중급) → `Production`(하드, "금요일 오후 배포"). 맵마다 적 풀·보스 타이밍·밀도·난이도가 다르다.
- **메타 진행(영구 성장)** — 런이 끝나면 RP를 모아 상점에서 시작 체력/데미지/픽업 반경/RP 보너스/부활(Stack Trace) 영구 업그레이드를 구매하고 직군·맵을 해금한다.

## 실행

```bash
npm install
npm run dev      # 개발 서버 실행
npm run build    # 타입체크 + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 기술 스택

- **Phaser 3** — 게임 엔진
- **TypeScript** — 게임 로직
- **Vite** — 번들러 / 개발 서버

## 구조

```
src/
  scenes/    Preload · Menu · ClassSelect · Game · GameOver · MetaShop
  entities/  Player · Enemy · Projectile · Orb · Minion · Pickup · XPGem
  systems/   Spawn · Weapon · Evolution · Upgrade · PlayerStats · MetaProgress
  data/      classes · weapons · enemies · passives · stages · metaUpgrades · balance
  ui/        HUD · LevelUpCards
```
