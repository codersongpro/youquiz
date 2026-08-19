# YouQuiz 작업 인계

## 프로젝트 기준

- YouTube 공개 영상을 영어 기본 퀴즈로 변환한다.
- 대상 나이는 5~20세이며, 한국어 출제로 변경할 수 있다.
- Next.js, Firebase Authentication, Cloud Firestore, Gemini, YouTube Data API, Vercel을 사용한다.
- Firestore는 서버만 접근하며 API는 Firebase ID 토큰으로 사용자를 확인한다.

## 현재 상태

- 마지막 갱신: 2026-08-19 KST
- 브랜치: `claude/code-review-md-files-ggzay6` (원격 `feature/youquiz-v1`에서 분기)
- 마지막 검증된 커밋: 아직 없음 (커밋 예정)
- 현재 단계: 응시·기록·오답·통계 화면과 인쇄 화면 구현 완료, Firebase 실 연동 대기

## 완료된 작업

- 빈 원격 저장소를 로컬 작업 공간에 복제했다.
- 기능 브랜치를 만들었다.
- 프로젝트 요구사항과 환경 변수 이름을 확정했다.
- 입력 검증, 연령별 출제 기준, YouTube URL 처리, 문항 배분, 통계 집계의 단위 테스트를 작성했다.
- Firebase Admin 인증, YouTube 조회, Gemini 생성·채점, Firestore 저장소의 서버 모듈을 추가했다.
- URL·검색·출제 설정 화면과 기본 History, Review, Stats 화면을 추가했다.
- 대상 나이 범위를 5~20세로 좁혔다 (스키마, UI, 테스트, 문서 동시 반영).
- 코드 리뷰로 발견한 버그를 수정했다: Gemini `response_format`/`response_mime_type` 필드가 실제 `@google/genai` SDK 계약과 달라 구조화 출력이 깨질 수 있던 문제, 답안 저장 API가 유효성 오류를 401로 잘못 반환하던 문제, 채점 시 일부 문항만 답해도 시도가 "완료" 처리되던 문제, YouTube 영상 길이 파싱 실패 시 60분 제한을 우회하던 문제.
- `/api/attempts/[attemptId]` GET을 추가하고 `/quiz/[attemptId]` 응시 화면에서 답안 저장·현재 결과 보기·계속 풀기를 연결했다.
- History, Review, Stats 화면을 인증 API에 연결했다 (오답 기록에 문항·해설을 함께 저장해 다시 조회하지 않도록 비정규화).
- 클라이언트 번들에 서버 비밀 스키마가 섞이지 않도록 공개용 Firebase 설정 읽기를 `lib/public-env.ts`로 분리했다.
- `/quiz/[attemptId]/print` 인쇄 화면(A4 문제지 + 정답지, 인쇄용 페이지 나눔 CSS)을 추가하고 응시 화면에서 연결했다.
- Playwright 설정과 e2e 스모크 테스트를 추가했다 (미설정 상태의 홈·History·Review·Stats 화면 검증, 3개 통과). 크로스 오리진 개발 리소스 경고를 없애기 위해 `next.config.ts`에 `allowedDevOrigins`를 추가했다.

## 진행 중인 작업

- Firebase와 Gemini·YouTube 실제 환경 변수는 아직 설정하지 않았다 (로컬 검증은 목/타입 수준까지만 완료).
- Gemini `interactions.create` 실 API 호출은 실제 자격 증명으로 아직 검증하지 못했다 (구조화 출력 파싱까지 통합 테스트 필요).
- Playwright e2e는 미설정(Firebase 미연동) 상태의 화면만 검증한다. 로그인 이후 골든 패스(응시·채점·기록)는 실 자격 증명 없이는 자동화할 수 없다.
- 인쇄 화면은 브라우저의 실제 인쇄 미리보기로는 아직 확인하지 못했다 (수동 확인 필요).

## 다음 작업

1. Firebase 프로젝트와 Vercel 환경 변수를 설정한 뒤, Gemini 실 호출로 `generateQuiz`/`gradeShortAnswers`의 `response_format` 계약을 실제 응답으로 검증한다.
2. 로그인 뒤 `/quiz/[attemptId]/print`를 브라우저 인쇄 미리보기로 확인하고 필요하면 페이지 나눔·여백을 조정한다.
3. 실 자격 증명 확보 후 Playwright e2e를 로그인부터 응시·채점까지 골든 패스로 확장한다.

## 환경 설정

- Firebase 전용 프로젝트 생성 필요
- Google 로그인 제공자와 승인 도메인 설정 필요
- Gemini API 및 YouTube Data API 키 설정 필요
- Vercel 환경 변수 설정 필요

## 검증 기록

- ESLint 9: 통과 확인 (Next.js 16.3.1 + eslint-config-next 16.3.1)
- 단위 테스트: 16개 통과 확인
- TypeScript 검사: 통과 확인
- Next.js 16.3.1 Production build (Turbopack): 통과 확인
- Playwright e2e: 스모크 테스트 3개 통과 확인 (미설정 상태 화면만; 로그인 이후 플로우는 미검증)

## 작업 기록

- 2026-08-18 KST | 초기 설정 | 기능 브랜치와 인계 기준 준비 | 다음: 테스트 작성
- 2026-08-18 KST | 도메인·API·초기 UI | 단위 테스트 16개와 Next.js 15 build 통과 | 다음: 응시·기록·PDF 및 최신 의존성 재검증
- 2026-08-19 KST | 코드 리뷰·버그 수정·응시 화면 | 대상 나이 5~20세로 조정, Gemini 응답 스키마 버그 등 4건 수정, 응시·기록·오답·통계 화면을 API에 연결, Next.js 16/ESLint 9 전체 검증 통과 | 다음: 실 Firebase·Gemini 연동 검증과 PDF 인쇄 화면
- 2026-08-19 KST | 인쇄 화면·e2e | A4 문제지·정답지 인쇄 화면 추가, Playwright 설정 및 미설정 상태 스모크 테스트 3개 통과 | 다음: 실 자격 증명 설정 후 로그인 골든 패스 e2e 확장
