# YouQuiz 작업 인계

## 프로젝트 기준

- YouTube 공개 영상을 영어 기본 퀴즈로 변환한다.
- 대상 나이는 5~20세이며, 한국어 출제로 변경할 수 있다.
- Next.js, Cloud Firestore(저장소), Gemini, YouTube Data API, Vercel을 사용한다.
- 가족 전용 서비스이므로 Google 로그인이 아니라 **가족 공용 비밀번호** 하나로 사이트 전체를 보호한다. 로그인하면 모든 기능을 공유하며 사용자별 구분은 없다.
- Firestore는 서버(Firebase Admin SDK)만 접근하고, 클라이언트는 Firestore에 직접 연결하지 않는다.

## 현재 상태

- 마지막 갱신: 2026-08-19 KST
- 브랜치: `claude/code-review-md-files-ggzay6` (원격 `feature/youquiz-v1`에서 분기)
- 마지막 검증된 커밋: 아직 없음 (커밋 예정)
- 현재 단계: 사용자가 실제 Firebase/Gemini/YouTube 자격 증명으로 로컬에서 **퀴즈 생성 → 저장 → 응시 화면까지 전 과정 성공을 확인**함. 남은 건 Vercel 배포와 세부 다듬기.

## 인증 구조 (중요)

Google 로그인은 완전히 제거했다. 대신:

- `SITE_PASSWORD` 환경 변수에 초기 비밀번호를 설정한다.
- `/login`에서 비밀번호를 입력하면 서버가 서명한(HMAC-SHA256) 세션 쿠키(`youquiz_session`, httpOnly, 30일)를 발급한다.
- `src/proxy.ts`(Next.js 16의 Proxy — 예전 middleware)가 모든 요청을 가로채 세션 쿠키를 검사하고, 없으면 `/login`으로 리다이렉트(API는 401 JSON)한다.
- 로그인 후 `/account`에서 현재 비밀번호를 확인하고 새 비밀번호로 바꿀 수 있다. 새 비밀번호는 Firestore(`settings/auth` 문서, salt + scrypt 해시)에 저장되며, 이후부터는 `SITE_PASSWORD` 대신 이 저장된 값이 우선한다. **비밀번호를 바꾸면 그 순간 서명 비밀키도 바뀌므로 기존에 로그인해 있던 다른 기기의 세션은 자동으로 만료된다** (의도된 동작).
- Firestore가 아직 설정되지 않았어도 `SITE_PASSWORD`만 있으면 로그인 자체는 정상 동작한다 (비밀번호 변경 기능만 Firebase 설정이 필요).
- 로그인 이후의 모든 API는 고정된 `uid = "family"`로 Firestore에 저장한다 (가족이 기록을 공유).

## 완료된 작업

- 빈 원격 저장소를 로컬 작업 공간에 복제하고 기능 브랜치를 만들었다.
- 프로젝트 요구사항과 환경 변수 이름을 확정했다.
- 입력 검증, 연령별 출제 기준, YouTube URL 처리, 문항 배분, 통계 집계, 세션 서명/검증의 단위 테스트를 작성했다 (19개).
- Firebase Admin(Firestore), YouTube 조회, Gemini 생성·채점 서버 모듈을 추가했다.
- URL·검색·출제 설정 화면과 History, Review, Stats 화면을 추가하고 실제 API에 연결했다.
- 대상 나이 범위를 5~20세로 좁혔다 (스키마, UI, 테스트, 문서 동시 반영).
- 코드 리뷰로 발견한 버그를 수정했다: Gemini `response_format`/`response_mime_type` 필드가 실제 `@google/genai` SDK 계약과 달라 구조화 출력이 깨질 수 있던 문제, 답안 저장 API가 유효성 오류를 401로 잘못 반환하던 문제, 채점 시 일부 문항만 답해도 시도가 "완료" 처리되던 문제, YouTube 영상 길이 파싱 실패 시 60분 제한을 우회하던 문제.
- `/api/attempts/[attemptId]` GET을 추가하고 `/quiz/[attemptId]` 응시 화면에서 답안 저장·현재 결과 보기·계속 풀기를 연결했다.
- `/quiz/[attemptId]/print` 인쇄 화면(A4 문제지 + 정답지, 인쇄용 페이지 나눔 CSS)을 추가했다.
- Google 로그인(Firebase Authentication, `NEXT_PUBLIC_FIREBASE_*`)을 전부 제거하고, 가족 공용 비밀번호 로그인(세션 쿠키 + Proxy 가드)으로 교체했다. 로그인 화면(`/login`), 로그아웃(`/api/logout`), 비밀번호 변경 화면(`/account`)을 추가했다. 사용하지 않게 된 `firebase`(클라이언트 SDK) 의존성을 제거했다.
- Playwright e2e를 실제 로그인 플로우 기준으로 재작성했다 (미로그인 리다이렉트, 오답 비밀번호 거부, 로그인 후 원래 페이지로 복귀, 로그아웃까지 4개 통과).
- 사용자가 실제 자격 증명으로 로컬 실행 중 `POST /api/quizzes/generate`에서 "The legacy Interactions API schema is no longer supported" 오류를 재현해 알려줬다. `@google/genai`를 `^1.0.0`(설치 1.52.0)에서 `^2.18.0`으로 올리고, v2 타입 정의를 직접 확인해 `response_format`을 `{ type: "text", mime_type, schema }` 단일 객체로 되돌렸다(`response_mime_type`은 v2에서 deprecated). 응답 파싱도 `interaction.outputs`에서 `interaction.steps`(`type: "model_output"`의 `content` 배열)로 바꿨다 — v2에서 응답 스키마 자체가 바뀌었다. `as never` 캐스트 없이도 타입체크가 통과해 실제 SDK 계약과 일치함을 확인했다.
- 제네릭 에러 메시지 뒤에서 원인이 안 보이던 문제를 해결하려고, 인증 오류가 아닌 모든 API 라우트의 폴백 catch에 `console.error`를 추가했다 (덕분에 위 Gemini 오류를 로컬 터미널에서 바로 찾아낼 수 있었다).
- 이어서 `INVALID_MODEL_OUTPUT` 오류(문항 타입별 필수 필드를 모델이 가끔 빼먹음)를 발견해, JSON 스키마에서 8개 필드를 전부 required로 만들고 프롬프트에 "해당 없는 필드는 빈 값으로 채우라"는 지시를 추가해 해결했다.
- 사용자가 로컬에서 **실제 Gemini/Firebase 자격 증명으로 퀴즈 생성 → Firestore 저장 → 응시 화면 로드까지 전체 성공**을 확인했다 (`POST /api/quizzes/generate 200`, `GET /quiz/[attemptId] 200`). Firestore API 미활성화(`SERVICE_DISABLED`) 오류였던 것도 Firebase 콘솔에서 데이터베이스 생성으로 해결됨을 확인.
- Gemini 무료 등급 사용량 제한(429, 분당/일일 요청 수 초과)에 걸리는 걸 확인해, `generate`/`grade` 라우트에서 이 경우를 감지해 "AI 사용량 한도, 잠시 후 재시도" 같은 명확한 메시지로 안내하도록 추가했다 (이전엔 일반 오류로만 보였음).
- 영상을 저해상도(`resolution: "low"`)로 Gemini에 전달해 생성 속도를 개선했다 (생성이 Vercel 60초 함수 제한에 근접했던 것을 확인). "Create quiz" 버튼에 "최대 1분 걸릴 수 있음" 안내를 추가했다.

## 진행 중인 작업

- 로컬에서는 퀴즈 생성 골든 패스가 실제로 동작함을 확인했지만, **Vercel 배포는 아직 안 함** (환경 변수도 아직 미등록).
- 채점(`gradeShortAnswers`, 서술형 답안 채점)은 아직 실 자격 증명으로 성공 사례를 확인받지 못했다 (퀴즈 생성만 확인됨).
- `/account`의 비밀번호 변경 기능은 코드 경로만 확인했고(설정 안 된 상태에서 에러 메시지로 안전하게 실패함을 확인), 실제 Firestore 저장까지는 검증하지 못했다.
- 인쇄 화면은 브라우저의 실제 인쇄 미리보기로는 아직 확인하지 못했다 (수동 확인 필요).
- Gemini 무료 등급은 하루/분당 요청 수가 매우 적어(`generate_content_free_tier_requests` 한도 20) 가족 여러 명이 쓰면 금방 429에 걸릴 수 있다. 유료 결제(Billing 활성화)로 전환할지는 사용자가 결정할 사안.

## 다음 작업

1. Vercel에 프로젝트를 연결하고 환경 변수(`SITE_PASSWORD` 포함 6개)를 등록해 배포한다.
2. 배포된 사이트에서 `/account`의 비밀번호 변경이 실제로 Firestore에 저장되고 다른 기기의 세션이 만료되는지 확인한다.
3. 서술형 문항 채점(`gradeShortAnswers`)이 실 자격 증명으로 정상 동작하는지 확인한다.
4. 로그인 뒤 `/quiz/[attemptId]/print`를 브라우저 인쇄 미리보기로 확인하고 필요하면 페이지 나눔·여백을 조정한다.
5. 실 자격 증명 확보 후 Playwright e2e에 퀴즈 생성·응시·채점 골든 패스를 추가한다.
6. Gemini 무료 등급 한도로 충분한지, 유료 전환이 필요한지 판단한다.

## 환경 설정

- `SITE_PASSWORD`: 가족이 로그인할 초기 공용 비밀번호 (필수, 미설정 시 아무도 로그인 불가 — 기본이 차단).
- Firebase 전용 프로젝트 생성 필요 (Firestore만 사용, Authentication은 불필요).
- 프로젝트 설정 → 서비스 계정에서 비공개 키를 발급해 `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`를 채운다.
- Gemini API 및 YouTube Data API 키 설정 필요.
- Vercel에도 동일한 환경 변수를 등록해야 배포된 사이트에서 가족들이 접속할 수 있다.
- 배포 후에는 `/account`에서 비밀번호를 원하는 값으로 바꿀 수 있다 (env var를 다시 건드릴 필요 없음).

## 검증 기록

- ESLint 9: 통과 확인 (Next.js 16.3.1 + eslint-config-next 16.3.1)
- 단위 테스트: 19개 통과 확인
- TypeScript 검사: 통과 확인
- Next.js 16.3.1 Production build (Turbopack): 통과 확인 (Proxy 포함)
- Playwright e2e: 4개 통과 확인 (미로그인 리다이렉트, 오답 비밀번호, 로그인 후 원래 경로 복귀, 로그아웃)
- **실 환경 수동 검증(사용자 로컬)**: Google 로그인 제거 후 비밀번호 로그인, YouTube 검색, Gemini 퀴즈 생성, Firestore 저장, 응시 화면 로드까지 전체 골든 패스 성공 확인

## 작업 기록

- 2026-08-18 KST | 초기 설정 | 기능 브랜치와 인계 기준 준비 | 다음: 테스트 작성
- 2026-08-18 KST | 도메인·API·초기 UI | 단위 테스트 16개와 Next.js 15 build 통과 | 다음: 응시·기록·PDF 및 최신 의존성 재검증
- 2026-08-19 KST | 코드 리뷰·버그 수정·응시 화면 | 대상 나이 5~20세로 조정, Gemini 응답 스키마 버그 등 4건 수정, 응시·기록·오답·통계 화면을 API에 연결, Next.js 16/ESLint 9 전체 검증 통과 | 다음: 실 Firebase·Gemini 연동 검증과 PDF 인쇄 화면
- 2026-08-19 KST | 인쇄 화면·e2e | A4 문제지·정답지 인쇄 화면 추가, Playwright 설정 및 스모크 테스트 통과 | 다음: 실 자격 증명 설정 후 로그인 골든 패스 e2e 확장
- 2026-08-19 KST | 로그인 방식 전면 교체 | Google 로그인/화이트리스트를 제거하고 가족 공용 비밀번호 + 세션 쿠키 + Proxy 가드로 교체, `/account`에서 자체 비밀번호 변경 가능(Firestore 저장, 변경 시 기존 세션 자동 만료), e2e를 실제 로그인 플로우로 재작성 | 다음: 실 Firebase 설정 후 비밀번호 변경 End-to-End 검증
- 2026-08-20 KST | Gemini SDK v2 업그레이드 | 사용자가 로컬에서 재현한 "legacy Interactions API schema" 오류를 원인 분석해 `@google/genai`를 v2.18.0으로 업그레이드하고 `response_format`/응답 파싱을 v2 타입에 맞춰 수정, 에러 로깅 추가 | 다음: 사용자 로컬 환경에서 퀴즈 생성 성공 여부 확인
- 2026-08-20 KST | 골든 패스 실증·속도·429 처리 | `INVALID_MODEL_OUTPUT` 수정(필드 전부 required화), 사용자가 실 자격 증명으로 생성→저장→응시 전체 성공 확인, 영상 저해상도 처리로 속도 개선, Gemini 429(무료 등급 한도) 감지 시 명확한 안내 메시지 추가 | 다음: Vercel 배포 및 채점 플로우 검증
