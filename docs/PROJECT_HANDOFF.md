# YouQuiz 작업 인계

## 프로젝트 기준

- YouTube 공개 영상을 영어 기본 퀴즈로 변환한다.
- 대상 나이는 5~100세이며, 한국어 출제로 변경할 수 있다.
- Next.js, Firebase Authentication, Cloud Firestore, Gemini, YouTube Data API, Vercel을 사용한다.
- Firestore는 서버만 접근하며 API는 Firebase ID 토큰으로 사용자를 확인한다.

## 현재 상태

- 마지막 갱신: 2026-08-18 KST
- 브랜치: `feature/youquiz-v1`
- 마지막 검증된 커밋: 아직 없음
- 현재 단계: 서버 API와 초기 화면 구현, 최종 통합 검증 대기

## 완료된 작업

- 빈 원격 저장소를 로컬 작업 공간에 복제했다.
- 기능 브랜치를 만들었다.
- 프로젝트 요구사항과 환경 변수 이름을 확정했다.
- 입력 검증, 연령별 출제 기준, YouTube URL 처리, 문항 배분, 통계 집계의 단위 테스트를 작성했다.
- Firebase Admin 인증, YouTube 조회, Gemini 생성·채점, Firestore 저장소의 서버 모듈을 추가했다.
- URL·검색·출제 설정 화면과 기본 History, Review, Stats 화면을 추가했다.

## 진행 중인 작업

- 실제 퀴즈 응시 화면, 기록·오답·통계의 데이터 연결, PDF 인쇄 화면을 구현해야 한다.
- Firebase와 Gemini·YouTube 실제 환경 변수는 아직 설정하지 않았다.
- Next.js 16 및 ESLint 9 업데이트 뒤 전체 검증 명령을 다시 끝까지 실행해야 한다.

## 다음 작업

1. `npm run lint && npm run typecheck && npm test && npm run build`를 실행해 최신 의존성 호환성을 확인한다.
2. `/quiz/[attemptId]` 응시 화면에서 답안 저장·현재 결과 보기·계속 풀기를 연결한다.
3. History, Review, Stats 화면을 인증 API에 연결한다.
4. A4 문제지·선택형 정답지 인쇄 화면과 PDF 렌더링 검증을 추가한다.
5. Firebase 프로젝트와 Vercel 환경 변수를 설정한 뒤 외부 API 실연동을 확인한다.

## 환경 설정

- Firebase 전용 프로젝트 생성 필요
- Google 로그인 제공자와 승인 도메인 설정 필요
- Gemini API 및 YouTube Data API 키 설정 필요
- Vercel 환경 변수 설정 필요

## 검증 기록

- 단위 테스트: 16개 통과 확인
- TypeScript 검사: 통과 확인
- Next.js 15.5.23 Production build: 통과 확인
- Next.js 16.3.1 업그레이드 후 전체 검증: 다시 실행 필요

## 작업 기록

- 2026-08-18 KST | 초기 설정 | 기능 브랜치와 인계 기준 준비 | 다음: 테스트 작성
- 2026-08-18 KST | 도메인·API·초기 UI | 단위 테스트 16개와 Next.js 15 build 통과 | 다음: 응시·기록·PDF 및 최신 의존성 재검증
