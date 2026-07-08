# 병아리 점프 (Chicken Jump)

화면을 터치하면 병아리가 점프해서 장애물을 넘는 세로 화면(갤럭시 기준) 모바일 미니게임입니다.

## 게임 규칙

- 화면을 터치(또는 에디터에서는 마우스 클릭)하면 병아리가 점프합니다.
- 장애물에 부딪히면 게임 오버됩니다.
- 장애물을 완전히 넘으면 점수가 1점 증가합니다.
- 최고 점수는 `PlayerPrefs`를 이용해 기기에 저장되며, 다음 실행에도 유지됩니다.
- 시작 화면 → 게임 화면 → 게임 오버 화면 순으로 진행되며, 다시하기로 반복 플레이할 수 있습니다.

## 프로젝트 구조

```
Assets/
  Scripts/
    GameManager.cs        게임 상태(시작/플레이/오버) 및 점수 관리
    HighScoreStorage.cs    PlayerPrefs 기반 최고 점수 저장/로드
    PlayerController.cs    터치 입력 처리, 점프, 충돌 판정
    Obstacle.cs             장애물 이동, 통과 판정(점수), 화면 밖 제거
    ObstacleSpawner.cs      장애물 생성 주기/속도 관리
    UIManager.cs            시작/게임/게임오버 패널 전환 및 텍스트 갱신
    Editor/
      GameSceneBuilder.cs   Scene/Prefab/Canvas 자동 생성 에디터 스크립트
Packages/manifest.json      최소 필수 패키지 목록
ProjectSettings/ProjectVersion.txt
```

모든 게임 로직 코드는 요청대로 `Assets/Scripts` 폴더 안에만 있습니다 (`Editor` 하위 폴더 포함).

## 프로젝트 여는 방법

1. Unity Hub에서 "열기 → 디스크에서 추가"로 이 저장소 폴더를 선택합니다.
   - `ProjectSettings/ProjectVersion.txt`에 `2022.3.50f1` (LTS)로 지정되어 있습니다.
     동일 버전이 없다면 Hub가 설치를 안내하거나, 보유 중인 2022.3 LTS 이상 버전으로
     그대로 열어도 정상 동작합니다 (없는 설정 파일은 Unity가 기본값으로 자동 생성합니다).
2. 프로젝트가 열리면 상단 메뉴에서
   **Tools → 병아리 점프 게임 → 게임 씬 자동 생성** 을 실행합니다.
3. 실행이 끝나면 `Assets/Scenes/GameScene.unity` 씬과
   `Assets/Prefabs/Obstacle.prefab`, `Assets/Sprites/Generated/*.png`,
   Canvas/UI/게임 오브젝트들이 모두 자동으로 만들어지고 Build Settings에도 씬이 등록됩니다.
4. 씬을 열고 Play 버튼을 눌러 테스트합니다 (에디터에서는 마우스 클릭 = 터치).

에디터 스크립트는 재실행해도 안전하도록 작성되어 있습니다 (이미 만들어진 스프라이트/프리팹은 재사용하고,
씬만 새로 구성합니다).

## 자동 생성되는 내용

- **Scene**: `GameScene` 하나로 시작/게임/게임오버 화면을 UI 패널 전환 방식으로 구성
- **Prefab**: `Obstacle.prefab` (장애물)
- **Canvas**: `CanvasScaler`를 세로 기준 해상도(1080x1920, Scale With Screen Size)로 설정
- **Tag**: `Player`, `Ground`, `Obstacle` 자동 등록
- **Player Settings**: 기본 화면 방향을 Portrait로 설정

## 튜닝 포인트 (Inspector에서 조정 가능)

- `PlayerController.jumpForce` : 점프 힘
- `ObstacleSpawner`의 `minSpawnInterval` / `maxSpawnInterval` / `baseSpeed` / `speedPerScore` /
  `maxSpeed` / `minHeightScale` / `maxHeightScale` : 장애물 생성 주기, 속도, 높이 범위
- `Rigidbody2D.gravityScale` (Chicken 오브젝트) : 중력 크기

## 콘솔 오류 관련 참고 사항

현재 실행 환경에는 실제 Unity 에디터가 설치되어 있지 않아, 이 저장소 안에서 직접 Play 모드를
실행해 콘솔 로그를 눈으로 확인할 수는 없었습니다. 대신 아래 항목을 코드 리뷰로 직접 점검했습니다.

- `Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf")` 사용 (최신 Unity에서 제거된 `Arial.ttf` 미사용)
- Unity 6 이상에서 `Rigidbody2D.velocity`가 `linearVelocity`로 대체된 것에 대응하는 조건부 컴파일 처리
- 모든 컴포넌트 간 참조는 에디터 스크립트가 씬 생성 시점에 직접 연결하며, 런타임 코드에서도
  참조가 비어 있을 경우를 대비해 null 체크 후 사용
- 폴더/태그/프리팹 생성 시 이미 존재하면 건너뛰어 스크립트를 여러 번 실행해도 에러가 나지 않도록 처리
- `Packages/manifest.json`은 코드에서 실제로 사용하는 최소한의 빌트인 모듈만 포함해
  패키지 버전 불일치로 인한 콘솔 오류 가능성을 최소화

실제 기기(갤럭시)에서 빌드하기 전에는 Unity 에디터에서 한 번 Play 모드로 직접 실행해
콘솔에 오류/경고가 없는지 최종 확인하는 것을 권장합니다.
