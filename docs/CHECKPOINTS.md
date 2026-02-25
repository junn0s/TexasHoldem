# Checkpoints

아래 번호로 체크포인트를 고정했습니다.

## 빠른 이동 방법

- 안전하게 확인만 할 때:
  - `git switch -c restore-cp-08 cp-08`
- 현재 브랜치를 해당 시점으로 강제 롤백할 때(주의):
  - `git reset --hard cp-08`

## 체크포인트 목록

| 번호 | 태그 | 커밋 | 날짜 | 설명 |
|---|---|---|---|---|
| 1 | `cp-01` | `10db75e` | 2026-02-18 | Initial poker game build |
| 2 | `cp-02` | `34561c2` | 2026-02-18 | Trim README to project summary only |
| 3 | `cp-03` | `4fb84dc` | 2026-02-18 | Remove redundant notes and update table description |
| 4 | `cp-04` | `4ca3546` | 2026-02-18 | Add wrangler assets config for Cloudflare deploy |
| 5 | `cp-05` | `ff6a194` | 2026-02-19 | Move web assets into src and remove MVP image |
| 6 | `cp-06` | `c00f409` | 2026-02-21 | feat: upgrade 3D table mood, stage cues, and sound |
| 7 | `cp-07` | `d5b7674` | 2026-02-21 | feat: add corner card HUD and 3D action badges |
| 8 | `cp-08` | `eeeb22a` | 2026-02-21 | feat: add per-turn analog timer and zoomed-out 3D camera |
| 9 | `cp-09` | `2cc1deb` | 2026-02-21 | feat: tune action timer behavior and 3d visibility |
| 10 | `cp-10` | `1ae23c5` | 2026-02-21 | feat: auto-advance hands and reposition pot HUD |
| 11 | `cp-11` | `ed24930` | 2026-02-21 | feat: refine table UI layout and add home screen flow |
| 12 | `cp-12` | `2543ed4` | 2026-02-22 | feat: add bgm playlists and alternate 3d scene files |
| 13 | `cp-13` | `df81c6c` | 2026-02-22 | feat: improve audio UX, peek visibility, lighting, and docs |
| 14 | `cp-14` | `7e2a104` | 2026-02-22 | feat: improve turn pacing, game over flow, and 3D HUD readability |
| 15 | `cp-15` | `7125de0` | 2026-02-22 | feat: tune stage difficulty and timer/card presentation |

## 로컬 WIP 스냅샷

`CP-16`은 아직 커밋되지 않은 최신 작업 스냅샷입니다.

- 스냅샷 위치:
  - `.checkpoints/cp-16-wip/src/`
- 포함 파일:
  - `src/game.js`
  - `src/index.html`
  - `src/poker3d3.js`
  - `src/styles.css`
  - `src/game-config/`
  - `src/game-modules/`
- 복원 예시:
  - `cp .checkpoints/cp-16-wip/src/game.js src/game.js`
  - `cp .checkpoints/cp-16-wip/src/index.html src/index.html`
  - `cp .checkpoints/cp-16-wip/src/poker3d3.js src/poker3d3.js`
  - `cp .checkpoints/cp-16-wip/src/styles.css src/styles.css`
  - `rm -rf src/game-config src/game-modules && cp -R .checkpoints/cp-16-wip/src/game-config src/ && cp -R .checkpoints/cp-16-wip/src/game-modules src/`
