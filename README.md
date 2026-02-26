# Underground Hold'em

3D 텍사스 홀덤 웹 게임.

## 게임 화면

![Underground Hold'em Gameplay](image/poker.png)

## 실행 방법

### 1) 싱글플레이만 빠르게 확인

`src` 폴더를 정적 서버로 띄우면 됩니다.

```bash
cd src
python3 -m http.server 4173
```

브라우저: `http://localhost:4173`

### 2) 멀티플레이(서버 권한) 포함 실행

프로젝트 루트에서 Wrangler로 실행해야 WebSocket + Durable Object가 동작합니다.

```bash
npx wrangler dev --port 4173
```

브라우저: `http://localhost:4173`

## 멀티플레이 구조 (상용형 방향)

- 서버 권한(authoritative): Durable Object가 턴/덱/쇼다운/액션 검증을 처리
- 클라이언트: 액션 입력(`action`, `command`)만 전송
- 동기화: `snapshot + delta` + 서버 `seq` + 클라이언트 `ack`
- 재접속 복구: 세션 토큰 + `last_ack` 기반 복구, 클라이언트 자동 재접속 시도
- 보안: 서버 셔플/RNG, 홀카드 마스킹, 액션 유효성 검증, 클라이언트 시퀀스 재전송 방어
- 운영: 레이트 리밋, 구조화 로그, 메트릭 엔드포인트

## 멀티 사용법

1. 하단 멀티패널에서 이름 입력
2. 코드 공유 없이 자동 매칭하려면 `Quick Match` 사용
3. 직접 초대하려면 `Create Room` 또는 코드 입력 후 `Join Room`
4. 호스트가 `Start Game` / `Next Hand` / `Back To Lobby`를 제어
5. 각 플레이어는 본인 좌석 턴에만 `Fold / Check(Call) / Raise` 가능
6. 호스트 이탈 시 남은 인원 중 1명이 자동으로 새 호스트로 승격

## 운영 확인 엔드포인트

- `GET /api/multiplayer/health`
- `GET /api/multiplayer/metrics`
