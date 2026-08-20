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
- 현재 단계: 비밀번호 로그인 기반 접근 제어, 응시·기록·오답·통계·인쇄 화면 구현 완료, Firebase/Gemini/YouTube 실 연동 대기

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

## 진행 중인 작업

- Firebase(Firestore)와 Gemini·YouTube 실제 환경 변수는 아직 설정하지 않았다. 로그인 자체는 `SITE_PASSWORD`만으로 동작하지만, 비밀번호 변경·퀴즈 저장·기록 조회는 Firebase 설정이 끝나야 실제로 검증된다.
- Gemini `interactions.create` 실 API 호출은 실제 자격 증명으로 아직 검증하지 못했다 (구조화 출력 파싱까지 통합 테스트 필요).
- `/account`의 비밀번호 변경 기능은 코드 경로만 확인했고(설정 안 된 상태에서 에러 메시지로 안전하게 실패함을 확인), 실제 Firestore 저장까지는 검증하지 못했다.
- 인쇄 화면은 브라우저의 실제 인쇄 미리보기로는 아직 확인하지 못했다 (수동 확인 필요).

## 다음 작업

1. Firebase 프로젝트(Firestore)와 Vercel 환경 변수(`SITE_PASSWORD` 포함)를 설정한 뒤, `/account`에서 비밀번호 변경이 실제로 Firestore에 저장되고 다른 기기의 세션이 만료되는지 확인한다.
2. Gemini 실 호출로 `generateQuiz`/`gradeShortAnswers`의 `response_format` 계약을 실제 응답으로 검증한다.
3. 로그인 뒤 `/quiz/[attemptId]/print`를 브라우저 인쇄 미리보기로 확인하고 필요하면 페이지 나눔·여백을 조정한다.
4. 실 자격 증명 확보 후 Playwright e2e에 퀴즈 생성·응시·채점 골든 패스를 추가한다.

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
- Playwright e2e: 4개 통과 확인 (미로그인 리다이렉트, 오답 비밀번호, 로그인 후 원래 경로 복귀, 로그아웃) — 퀴즈 생성 등 Firebase/Gemini 의존 플로우는 실 자격 증명 없이는 미검증

## 작업 기록

- 2026-08-18 KST | 초기 설정 | 기능 브랜치와 인계 기준 준비 | 다음: 테스트 작성
- 2026-08-18 KST | 도메인·API·초기 UI | 단위 테스트 16개와 Next.js 15 build 통과 | 다음: 응시·기록·PDF 및 최신 의존성 재검증
- 2026-08-19 KST | 코드 리뷰·버그 수정·응시 화면 | 대상 나이 5~20세로 조정, Gemini 응답 스키마 버그 등 4건 수정, 응시·기록·오답·통계 화면을 API에 연결, Next.js 16/ESLint 9 전체 검증 통과 | 다음: 실 Firebase·Gemini 연동 검증과 PDF 인쇄 화면
- 2026-08-19 KST | 인쇄 화면·e2e | A4 문제지·정답지 인쇄 화면 추가, Playwright 설정 및 스모크 테스트 통과 | 다음: 실 자격 증명 설정 후 로그인 골든 패스 e2e 확장
- 2026-08-19 KST | 로그인 방식 전면 교체 | Google 로그인/화이트리스트를 제거하고 가족 공용 비밀번호 + 세션 쿠키 + Proxy 가드로 교체, `/account`에서 자체 비밀번호 변경 가능(Firestore 저장, 변경 시 기존 세션 자동 만료), e2e를 실제 로그인 플로우로 재작성 | 다음: 실 Firebase 설정 후 비밀번호 변경 End-to-End 검증
