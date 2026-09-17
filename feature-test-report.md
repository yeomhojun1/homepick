# homepick 기능 테스트 보고 (2026-09-16)

> 5개 프로젝트 전체 현황: https://claude.ai/artifact/PvWqAcbkvtL8VSNHZhL48e

## 한 줄 요약: 전체 기능 49개 중 PASS 30 / FAIL 11 / 환경없음 8

- **백엔드는 현재 상태로는 부팅 자체가 안 된다** (차단 요인 3개, 아래 버그 B1~B3). DB가 있어도 동일.
- API 21개는 컴파일된 `dist/`를 그대로 쓰고 TypeORM 리포지토리만 인메모리로 바꾼 하네스로 실제 HTTP 호출 검증(73개 시나리오 67 PASS / 6 FAIL). 6 FAIL은 모두 하네스 문제가 아닌 **앱 로직 결함**(B4~B8).
- 프론트는 빌드(tsc 포함) 통과, 3001 dev 서버 정상 응답. 단 `.env`가 없어 API 요청이 3001 자기 자신으로 가고 있음(B11), 새로고침 시 사용자 정보가 사라짐(B10).
- 테스트 환경: Windows 11, **Node v18.20.8**(프로젝트 의존성은 Node ^20.19 요구), Postgres·docker 없음, 3000 포트는 다른 프로젝트(yeonae-ai Next.js)가 점유 중.
- 소스 수정·커밋 없음(`git status --porcelain` → 추적 파일 변경 0). 생성한 산출물은 이 보고서, `backend/node_modules`·`backend/dist`·`frontend/dist`(모두 gitignore 대상)뿐. 하네스 스크립트·로그는 프로젝트 밖(세션 스크래치패드 `…\scratchpad\homepick-harness.js`, `homepick-harness.log`, `nodb-err.log`)에 둠.

---

## 기능 목록과 결과

범례: `PASS(하네스)` = 실제 컨트롤러·서비스·가드·파이프·필터·Swagger 코드로 HTTP 호출 성공, DB만 인메모리 대체. `PASS(코드)` = 실행 불가 영역이라 코드 검토로 확인.

### A. 빌드 / 기동

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 1 | 백엔드 의존성 설치 | 빌드 | `cd backend && npm install --no-audit --no-fund` | PASS | 814 packages, 2m, exit 0. EBADENGINE 경고 12건(`@nestjs/core@11.1.27`, `typeorm@1.0.0`, `find-my-way@9.6.0` 등이 `node ^20.19.0 || ^22.12.0 || >=23` 요구, 현재 v18.20.8). bcrypt 네이티브 로드 OK |
| 2 | 백엔드 빌드·타입체크 | 빌드 | `npm run build` (nest build) | PASS | 35s, exit 0, `dist/main.js` 생성. 타입 오류 없음 |
| 3 | 백엔드 단위 테스트 | 테스트 | `npm test` (jest) | FAIL | `No tests found, exiting with code 1` — `src/**/*.spec.ts` 0개. 단위 테스트가 하나도 없음 |
| 4 | 백엔드 e2e 테스트 | 테스트 | `npm run test:e2e` (DATABASE_URL=localhost:5433, 120s 제한) | FAIL | 120s 동안 출력 없이 타임아웃(exit 124). 내용도 Nest 템플릿 그대로(`GET /` → `Hello World!` 기대, 해당 라우트 없음)라 DB가 있어도 실패 |
| 5 | 백엔드 실기동(DB 없음) | 기동 | `PORT=3300 DATABASE_URL=postgresql://…@localhost:5433/homepick node dist/main.js` (PowerShell Start-Process, 55s 관찰) | FAIL | 37s 후 종료. stderr: `node_modules\@nestjs\typeorm\dist\common\typeorm.utils.js:144 … ReferenceError: crypto is not defined` — `typeorm-core.module.js:93`의 `generateString()`이 모듈 정의 단계에서 호출되므로 **DB 접속 시도 이전**에 죽음. HTTP 포트 미개방 → Swagger/헬스 응답 확인 불가(B3). Git Bash `timeout 90 node dist/main.js`로도 동일(무출력 종료) |
| 6 | 프론트 빌드·타입체크 | 빌드 | `cd frontend && npm run build` (tsc && vite build) | PASS | 13.7s, exit 0. `dist/index.html` 0.47kB, JS 293kB(gzip 94.6kB) |
| 7 | 프론트 dev 서버(3001) | UI | `curl -s -D - http://localhost:3001/` 및 `/login`, `/profile`, `/nonexistent-route` | PASS | 모두 `200 text/html`(SPA 폴백). `<div id="root">` + `/src/main.tsx` 로드. 서버는 종료하지 않음 |

### B. 백엔드 공통 계층

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 8 | Swagger 문서 `/api/docs`, `/api/docs-json` | API | 하네스 `GET /api/docs`, `GET /api/docs-json` | FAIL(실기동) / PASS(하네스) | 실기동 조건에서는 `[PackageLoader] The "@fastify/static" package is missing … FastifyAdapter.useStaticAssets()` 로그 후 exit 1 — `package.json`에 `@fastify/static` 없음(B2). 스크래치패드에 `@fastify/static@8.3.0`을 설치해 `NODE_PATH`로 주입하면 UI 200(HTML 3126B), JSON에 **엔드포인트 21개**, 태그 7개(auth, categories, service-requests, quotes, bookings, reviews, notifications), BearerAuth 적용 18/21 — README 목록 21개와 1:1 일치 |
| 9 | 전역 ValidationPipe(whitelist, forbidNonWhitelisted, transform) | API | 하네스: 잘못된 email/6자 미만 비번/enum 외 role, 미정의 필드 `hacker` | PASS(하네스) | 400 + `"email must be an email, password must be longer than or equal to 6 characters, role must be one of the following values: customer, worker"`, `"property hacker should not exist"` |
| 10 | 공통 응답 봉투 `{data,message,statusCode}` + `HttpExceptionFilter` | API | 하네스: 정상 응답, 404(`/nope`), 4xx 예외 | PASS(하네스) | 성공 `{"data":…,"message":"success","statusCode":200/201}`, 오류 `{"data":null,"message":"Cannot GET /nope","statusCode":404}`. class-validator 메시지 배열은 `, `로 join |
| 11 | CORS(`ALLOWED_ORIGINS`, credentials) | API | 하네스 OPTIONS preflight, Origin `http://localhost:3001` vs `http://evil.example` | PASS(하네스) | 204, `access-control-allow-origin: http://localhost:3001`, `allow-credentials: true`; 타 origin은 ACAO 미설정 |
| 12 | JWT 인증 가드(`JwtAuthGuard`) + `JwtStrategy`(사용자 존재 재확인) | 인증 | 하네스: 토큰 없음 / 깨진 토큰 / 다른 secret 서명 / 서명은 맞지만 sub=9999 | PASS(하네스) | 4경우 모두 401. 삭제된 사용자 토큰은 `"유효하지 않은 토큰입니다."` — DB 조회로 재검증함. 만료 7d, HS256, payload `{sub,email,role}` |

### C. 인증 API (`/api/v1/auth`)

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 13 | `POST /auth/register` 회원가입 | API/인증 | 하네스: customer, worker, 중복 이메일 | PASS(하네스) | 201 + `accessToken` + `user`(passwordHash 제거됨). worker면 `worker_profiles` 행 자동 생성(rating 0, reviewCount 0). 중복 → 409 `"이미 사용 중인 이메일입니다."`. 저장 비번 `$2b$10$…` bcrypt |
| 14 | `POST /auth/login` | API/인증 | 하네스: 오답 비번 / 없는 이메일 / 정답 | PASS(하네스) | 401(두 경우 동일 문구로 계정 존재 여부 비노출), 정답 200(`@HttpCode(OK)`) |
| 15 | `GET /auth/me` | API/인증 | 하네스: worker 토큰 | PASS(하네스) | 200, `workerProfile` 포함, `passwordHash` 제거 |
| 16 | `PATCH /auth/me` (name/phone/fcmToken) | API/인증 | 하네스: name+phone 수정, `email` 필드 전송 | PASS(하네스) | 200 반영. `email` → 400 `"property email should not exist"` |

### D. 카테고리

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 17 | `GET /api/v1/categories` (공개) | API | 하네스: 활성 2 + 비활성 1 시드 | PASS(하네스) | 토큰 없이 200, `isActive=true`만 `sortOrder ASC`로 2건 |

### E. 수리 의뢰 (`/api/v1/service-requests`, 전부 JWT 필요)

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 18 | `POST /service-requests` 의뢰 등록 | API | 하네스: 유효/무효 body, customer/worker 토큰 | PASS(하네스) | 201 `status=open`, `imageUrls=[]`, `preferredDate` ISO 변환. `title<2`/`description<10` → 400. **worker 토큰으로도 201** (역할 가드 없음, B5) |
| 19 | `GET /service-requests` 모집중 목록 | API | 하네스 | PASS(하네스) | `status=open`만, `customer`·`category` 조인, `createdAt DESC`. **`customer.passwordHash` 그대로 노출**(B4) |
| 20 | `GET /service-requests/my` 내 의뢰 | API | 하네스 | PASS(하네스) | 본인 `customerId`만, 상태 무관 |
| 21 | `GET /service-requests/:id` | API | 하네스: 존재/9999/`abc` | PASS(하네스) | 200 / 404 `"의뢰를 찾을 수 없습니다."` / 400 `ParseIntPipe` |
| 22 | `PATCH /service-requests/:id/cancel` | API | 하네스: 타인/완료건/본인 open | PASS(하네스) | 타인 403 `"취소 권한이 없습니다."`, 완료건 403 `"완료된 의뢰는…"`, 본인 open → 200 `cancelled` |

### F. 견적 (`QuotesController`) — **원본은 `@Controller()` 누락으로 미등록(B1)**, 하네스에서 런타임 데코레이터 적용 후 검증

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 23 | `POST /service-requests/:id/quotes` 견적 제출 | API | 하네스: worker, 중복, price 0, 없는 의뢰, 취소된 의뢰, customer 토큰, booked 의뢰 | PASS(하네스) | 201 `status=pending`; 중복 400 `"이미 견적을 제출했습니다."`; price<1 400; 없는 의뢰 404; 취소건 400. **customer도 201**(B5), **booked 의뢰에도 201**(B7) |
| 24 | `GET /service-requests/:id/quotes` | API | 하네스 | PASS(하네스) | `worker` 조인, `createdAt ASC`. **`worker.passwordHash` 노출**(B4) |
| 25 | `PATCH /quotes/:id/accept` 수락→예약 생성(트랜잭션) | API | 하네스: 비소유자, 소유자, 재수락 | PASS(하네스) | 비소유자 403; 소유자 200 → `bookings` 행 `confirmed`, `scheduledAt = preferredDate`, 의뢰 `booked`; 재수락 400 `"이미 처리된 견적입니다."` |
| 26 | `PATCH /quotes/:id/reject` | API | 하네스: pending 거절, **accepted 거절** | FAIL | pending → 200 `rejected` 정상. 그러나 **이미 accepted(예약 생성됨)인 견적도 200 `rejected`** — 예약은 남고 견적만 거절 상태가 되는 데이터 불일치(B6) |

### G. 예약 (`/api/v1/bookings`)

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 27 | `GET /bookings/my` (고객·기사 양쪽) | API | 하네스: customer/worker/무관 사용자 | PASS(하네스) | 각각 1/1/0건, `serviceRequest`·`worker`·`customer` 조인(QueryBuilder OR 조건) |
| 28 | `GET /bookings/:id` | API | 하네스: 무관한 제3자 토큰 | FAIL | **제3자에게도 200 전체 반환**(고객·기사 개인정보+passwordHash 포함). 권한 체크 없음(B8). 없는 id는 404 |
| 29 | `PATCH /bookings/:id/complete` | API | 하네스: 고객/기사 | PASS(하네스) | 고객 403 `"완료 처리 권한이 없습니다."`, 기사 200 `completed` + 의뢰 `completed`. 단 `worker_profiles.completedCount`는 0 그대로(B9) |

### H. 리뷰 (`ReviewsController`) — **원본 `@Controller()` 누락(B1)**, 하네스 패치 후 검증

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 30 | `POST /bookings/:id/reviews` (상호 리뷰, 평점 집계) | API | 하네스: 완료 전, rating 6, 제3자, 고객→기사, 중복, 기사→고객 | PASS(하네스) | 완료 전 400 `"완료된 예약만…"`, rating 6 → 400, 제3자 403, 고객 201, 중복 400 `"이미 리뷰를…"`, 기사→고객 201. 이후 기사 프로필 `rating=4, reviewCount=1` 갱신 확인 |
| 31 | `GET /users/:userId/reviews` | API | 하네스 | PASS(하네스) | 200, `reviewer` 조인, comment 포함 |

### I. 알림 (`/api/v1/notifications`)

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 32 | `GET /notifications` | API | 하네스 | PASS(하네스) | 200 `[]`. 토큰 없으면 401. **프로젝트 어디에도 알림을 생성하는 코드가 없음**(README 흐름 2단계 "기사에게 알림 발송" 미구현, B9) |
| 33 | `PATCH /notifications/read-all` | API | 하네스 | PASS(하네스) | 200 `{"message":"알림을 모두 읽음 처리했습니다."}` |

### J. 데이터 모델

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 34 | 엔티티 9종(`users`, `worker_profiles`, `categories`, `user_categories`, `service_requests`, `quotes`, `bookings`, `reviews`, `notifications`), `synchronize: true`, `autoLoadEntities` | 모델 | 코드 검토 + 하네스에서 TypeORM 메타데이터(`getMetadataArgsStorage`)로 컬럼 default 적용 | 환경없음 | Postgres 없어 실제 DDL/enum/array(`text[]`)/decimal 동작 미검증. 메타데이터상 default(`status=pending/open/confirmed`, `rating=0`, `imageUrls=[]`)는 하네스에서 적용돼 흐름 정상. `user_categories`(기사 담당 카테고리)는 엔티티만 있고 API 없음 |
| 35 | 카테고리 시드 데이터 | 모델 | `grep -rn "categories" backend/src` + docker-compose 확인 | FAIL | 시드 스크립트·마이그레이션·초기 INSERT가 전혀 없음. 빈 DB로 띄우면 `GET /categories`가 `[]` → 프론트 의뢰 등록 폼의 `<select required>`에 선택지가 없어 **의뢰 등록 자체가 불가능**(B9) |

### K. 프론트엔드 (Vite+React, `http://localhost:3001`)

| # | 기능 | 종류 | 테스트 방법(명령) | 결과 | 관찰/근거 |
|---|------|------|------------------|------|-----------|
| 36 | `PrivateRoute` 보호 라우트 리다이렉트 | UI/인증 | 코드 검토 `src/App.tsx` + curl | PASS(코드) | `/`, `/requests/:id`, `/my-requests`, `/my-bookings`, `/profile`는 `isAuthenticated`(=`localStorage.accessToken` 존재) 아니면 `<Navigate to="/login" replace>`; `*` → `/` → 결과적으로 `/login`. 공개 라우트는 `/login`, `/register`뿐 |
| 37 | 401 인터셉터(토큰 폐기 후 `/login`) | UI/인증 | 코드 검토 `src/api/client.ts` | PASS(코드) | axios response 401 → `localStorage.removeItem('accessToken')` + `window.location.href='/login'`. request 인터셉터가 Bearer 자동 첨부 |
| 38 | 인증 상태 영속(새로고침 후 사용자 정보) | UI/인증 | 코드 검토 `useAuthStore.ts`, `grep getMe` | FAIL | 토큰만 localStorage에 저장하고 `user`는 메모리. 새로고침하면 `isAuthenticated=true`인데 `user=null` → 네비에 이름·"내 의뢰" 링크 사라짐, 홈 "의뢰 등록" 버튼 사라짐(`user?.role==='customer'` 조건), `/profile`은 "로그인이 필요합니다." 표시. `getMe()`는 정의만 되고 어디서도 호출 안 됨(B10) |
| 39 | API 베이스 URL 설정(`VITE_API_URL`) | UI | `curl http://localhost:3001/src/config/env.ts`, `curl -D - http://localhost:3001/api/v1/categories`, `curl -X POST …/auth/login` | FAIL | `frontend/.env` 없음 → `import.meta.env = {BASE_URL,MODE,DEV,PROD,SSR}`만 주입, `apiUrl: undefined` → axios가 상대경로로 **3001 자기 자신에 요청**. GET은 Vite SPA 폴백으로 `200 text/html`(index.html 634B)을 받아 조용히 빈 목록 처리, POST는 `404`(B11). `.env.example`의 3000 포트는 현재 yeonae-ai Next.js가 점유 |
| 40 | `/login` 로그인 화면 | UI | 코드 검토 + HTML curl | 환경없음 | 이메일(type=email, required)·비밀번호(required), 로딩 중 버튼 비활성, 실패 시 고정 문구 "이메일 또는 비밀번호가 올바르지 않습니다."(원인 무관 동일 문구), 회원가입 링크. 백엔드 없어 성공 경로 미검증 |
| 41 | `/register` 회원가입 화면 | UI | 코드 검토 | 환경없음 | email/password(minLength 6)/name 필수, phone 선택, role select(고객/기사). 실패 시 "회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다." 고정 문구(400 검증 실패도 동일 문구) |
| 42 | `/` 홈: 모집중 의뢰 목록 + 의뢰 등록 폼(고객만) | UI | 코드 검토 | 환경없음 | react-query `['service-requests']`, 카테고리 select(API 의존), title minLength 2, description minLength 10, datetime-local. 빈 상태 "등록된 의뢰가 없습니다.", 상태 뱃지 한글 라벨 5종 |
| 43 | `/requests/:id` 의뢰 상세: 견적 목록·제출(기사)·수락/거절(소유자)·의뢰 취소 | UI | 코드 검토 | 환경없음 | 수락/거절 버튼은 `isOwner && quote.pending && request.open`일 때만, 견적 제출은 `worker && open`. 상태 뱃지는 라벨 없이 raw 영문(`request.status`) 표시. 뮤테이션 실패 시 사용자에게 에러 표시 없음(onError 미처리) |
| 44 | `/my-requests` 내 의뢰 | UI | 코드 검토 | 환경없음 | 빈 상태 "등록한 의뢰가 없습니다." + "의뢰 등록하기" 링크. 네비 링크는 customer에게만 노출되나 URL 직접 접근은 worker도 가능(백엔드도 허용) |
| 45 | `/my-bookings` 내 예약 + 완료 처리(기사) | UI | 코드 검토 | 환경없음 | 역할별 상대방 이름 표시, `worker && confirmed`일 때 "완료 처리" 버튼. 고객 측 "완료 확인" 단계는 없음(README와 다름) |
| 46 | `/profile` 프로필 수정 + 로그아웃 | UI | 코드 검토 | 환경없음 | name/phone 수정 → `setAuth(updatedUser, token)`, 2초 "저장되었습니다." 배너. 로그아웃 → `clearAuth` + `/login` |
| 47 | 리뷰 작성/조회 UI | UI | `grep -rn createReview\|getUserReviews frontend/src --include=*.tsx` | FAIL | `api/reviews.api.ts`에 함수만 있고 **어느 페이지에서도 사용하지 않음**. README "작업 완료 후 리뷰 작성"이 화면에 없음(B12) |
| 48 | 알림 UI | UI | `ls frontend/src/api`, grep | FAIL | 알림 API 클라이언트 파일·화면 모두 없음(B12) |
| 49 | `Layout` 네비게이션(비로그인: 로그인/회원가입, 로그인: 역할별 링크+로그아웃) | UI | 코드 검토 + HTML | PASS(코드) | `isAuthenticated` 분기, customer만 "내 의뢰". `index.html` `<title>`은 "Vite + React + TS" 그대로 |

---

## 발견한 버그·문제 (재현법 포함)

### 부팅 차단 (이 3개를 고치기 전엔 백엔드가 뜨지 않음)

**B1. `QuotesController`, `ReviewsController`에 `@Controller()` 데코레이터 누락 → Nest 부팅 예외 (치명)**
- 근거: `grep -c '^@Controller' backend/src/*/*.controller.ts` → `quotes/quotes.controller.ts 0`, `reviews/reviews.controller.ts 0`(나머지 5개는 1). 두 파일 모두 `Controller`를 import만 하고 `@ApiTags`/`@UseGuards`/`@ApiBearerAuth`만 붙어 있음.
- 재현: 컨트롤러 7개를 모듈에 넣고 `NestFactory.create` → `UnknownRequestMappingException: An invalid controller has been detected. "QuotesController" does not have the @Controller() decorator but it is being listed in the "controllers" array of some module.` (하네스 1차 실행 로그). 실제 `AppModule`도 `QuotesModule`/`ReviewsModule`를 import하므로 동일하게 죽는다.
- 영향: 견적 4개·리뷰 2개 엔드포인트가 아예 없고, 그 전에 프로세스가 종료됨. 하네스는 두 클래스에 런타임으로 `Controller()(cls)`를 적용해 나머지를 검증했다(`HARNESS_PATCHED_CONTROLLERS QuotesController,ReviewsController`).

**B2. `@fastify/static` 미설치 → `SwaggerModule.setup('api/docs')`에서 프로세스 종료**
- 근거: `ls backend/node_modules/@fastify/` 에 `static` 없음, `package.json` dependencies에도 없음(lock에는 `@nestjs/swagger`의 optional peer로만 언급).
- 재현: B1을 우회한 뒤 `NODE_PATH` 없이 하네스 실행 → `[Nest] ERROR [PackageLoader] The "@fastify/static" package is missing. Please, make sure to install it to take advantage of FastifyAdapter.useStaticAssets().` → exit 1. `@nestjs/swagger/dist/swagger-module.js:105,112`에서 `app.useStaticAssets` 호출.
- 조치 힌트(미적용): `npm i @fastify/static@8` (fastify 5 호환). 하네스에서는 스크래치패드에 설치 후 `NODE_PATH`로 주입하니 Swagger UI/JSON 정상.

**B3. Node 18에서 `@nestjs/typeorm`이 전역 `crypto` 참조로 크래시 (환경 + 의존성 요구사항 불일치)**
- 재현: `PORT=3300 node dist/main.js` → 37s 뒤 `ReferenceError: crypto is not defined` (`@nestjs/typeorm/dist/common/typeorm.utils.js:144`, 호출부 `typeorm-core.module.js:93 useValue: generateString()`). 이 코드는 `TypeOrmModule.forRootAsync` 프로바이더 정의 시점에 실행되므로 DB 존재 여부와 무관.
- 검증: 파일로 실행한 스크립트에서 `typeof globalThis.crypto → undefined`(Node 18은 `node -e`/REPL에서만 `crypto`가 보임). 설치 시 EBADENGINE 12건이 이미 경고. **Node ≥ 20.19 필요**.
- 참고: README "요구사항 Node.js 18+"는 현재 의존성(NestJS 11, TypeORM 1.0, Fastify 5)과 맞지 않음.

### API 로직 결함 (하네스 FAIL 6건 + 코드 확인)

**B4. `passwordHash` 응답 노출 (보안)**
- `GET /service-requests`(customer), `GET /service-requests/:id`(customer), `GET …/quotes`(worker), `GET /bookings/my`, `GET /bookings/:id`(customer/worker), `GET /users/:id/reviews`(reviewer) — 관계로 로드된 `User` 엔티티가 그대로 직렬화됨. `AuthService.sanitizeUser`는 auth 응답에만 적용.
- 하네스 근거: `[관찰] GET /service-requests leaks customer.passwordHash | passwordHash present=true`, `GET quotes … passwordHash present=true`.
- 조치 힌트: `User.passwordHash`에 `@Column({ select: false })` 또는 `class-transformer @Exclude` + 전역 `ClassSerializerInterceptor`.

**B5. 역할(role) 가드 부재**
- worker 토큰으로 `POST /service-requests` → 201, customer 토큰으로 `POST …/quotes` → 201 (자기 의뢰에 자기 견적도 가능). JWT payload에 `role`이 있지만 어떤 엔드포인트도 검사하지 않음. 프론트는 버튼만 숨김.

**B6. 이미 수락된(예약 생성된) 견적을 `reject` 가능 → 데이터 불일치**
- 재현: 견적 accept(200, booking 생성) → 같은 견적 `PATCH /quotes/:id/reject` → 200 `status: rejected`. `QuotesService.reject`에 `status !== PENDING` 검사 없음(accept에는 있음). booking은 `confirmed`로 남음.

**B7. `booked`/`completed` 의뢰에도 견적 제출 가능**
- `QuotesService.create`는 `CANCELLED`만 차단. 재현: 예약 완료된 의뢰에 다른 기사가 견적 → 201. README "최대 3개 견적" 제한도 없음. `ServiceRequestStatus.QUOTED` 상태는 어디서도 설정되지 않음.

**B8. `GET /bookings/:id` 권한 검사 없음**
- 재현: 예약과 무관한 사용자 토큰으로 조회 → 200 전체(고객·기사 개인정보 + passwordHash). `BookingsService.findOne`은 존재 여부만 확인.

**B9. README와 구현 불일치 / 미구현**
- 알림 생성 로직 전무(`Notification` insert 코드 0곳) — 알림 API는 항상 `[]`.
- 완료 처리 시 `worker_profiles.completedCount` 미증가(하네스 `completedCount=0`).
- 수수료 15% 정산·에스크로 결제·고객 "완료 확인" 단계 없음(완료는 기사가 단독 처리).
- `user_categories`(기사 담당 카테고리)·`serviceArea`·`bio`를 설정하는 API 없음.
- 카테고리 시드 없음(#35) → 빈 DB에서는 의뢰 등록 불가.
- 이미지 업로드 엔드포인트 없음(`imageUrls`는 문자열 배열을 그대로 받기만 함).

### 프론트엔드

**B10. 새로고침하면 사용자 정보 소실 (`user` 미영속, `getMe` 미호출)**
- 재현: 로그인 → F5. `isAuthenticated=true`(토큰 있음)라 보호 라우트는 통과하지만 `user=null` → 홈 "의뢰 등록" 버튼·네비 "내 의뢰"·이름 사라짐, `/profile`은 "로그인이 필요합니다." 표시, 의뢰 상세에서 `isOwner`/`isWorker` 모두 false라 모든 액션 버튼 숨김.
- 근거: `useAuthStore.ts`는 `accessToken`만 localStorage; `getMe`는 `api/auth.api.ts`에 정의만 되고 사용처 0(`grep -rn getMe --include=*.tsx` → 없음).

**B11. `frontend/.env` 없음 → API가 3001 자기 자신으로 감 (현재 떠 있는 서버 상태)**
- 재현: `curl http://localhost:3001/src/config/env.ts` → `apiUrl: import.meta.env.VITE_API_URL`이고 주입된 env에 `VITE_API_URL` 없음. `curl -D - http://localhost:3001/api/v1/categories` → `200 text/html`(index.html). `curl -X POST http://localhost:3001/api/v1/auth/login` → `404`.
- 증상: 로그인 시 항상 "이메일 또는 비밀번호가 올바르지 않습니다."(실제로는 404), 목록 화면은 HTML을 받고도 에러 없이 빈 상태로 표시(`data.data`가 undefined → 기본값 `[]`).
- 추가: `.env.example`은 `http://localhost:3000`인데 이 PC의 3000은 `C:\개인프로젝트\yeonae-ai` Next.js(PID 25248)가 사용 중 → `.env`를 복사해도 잘못된 서버로 요청. 백엔드 포트를 바꾸면 `ALLOWED_ORIGINS`·`VITE_API_URL` 둘 다 맞춰야 함.

**B12. 리뷰·알림 화면 없음** — `createReview`, `getUserReviews`, `getBooking`, `getMe` 4개 API 함수 미사용, 알림 API 클라이언트 자체 없음. README "고객: 작업 완료 후 리뷰 작성"이 UI에 없음.

**B13. 사소한 UI 문제** — `RequestDetailPage` 상태 뱃지가 `open/booked` 영문 raw 값; 로그인/회원가입 실패 문구가 원인 불문 고정(400 검증 오류도 "이미 사용 중인 이메일일 수 있습니다"); 뮤테이션 실패 시 화면 피드백 없음(onError 없음); `index.html` `<title>` "Vite + React + TS".

### 테스트 자산

**B14.** 단위 테스트 0개(`npm test` exit 1), e2e는 Nest 템플릿(`GET / → Hello World!`) 그대로라 실제 앱과 무관 — CI에 붙이면 항상 실패.

---

## 브라우저에서 직접 눌러봐야 할 UI 시나리오 (백엔드 없이 확인 가능)

현재 3001 상태(`.env` 없음, 백엔드 없음)에서 그대로 재현 가능한 것만 골랐다.

1. **비로그인 라우팅 가드** — 주소창에 `http://localhost:3001/`, `/my-requests`, `/profile`, `/requests/1`, `/아무거나` 를 차례로 입력. 기대: 전부 `/login`으로 replace 리다이렉트(뒤로가기 히스토리 안 남음), 상단 네비는 "로그인 / 회원가입" 버튼만. `/register`는 그대로 열림.
2. **로그인 폼 브라우저 검증 + 실패 메시지** — `/login`에서 빈 칸 제출 → 브라우저 required 툴팁; `abc` 입력 → 이메일 형식 툴팁; `a@b.com`/`123456` 제출 → 버튼이 "로그인 중..."으로 잠깐 바뀐 뒤 빨간 박스 "이메일 또는 비밀번호가 올바르지 않습니다." (실제 원인은 3001로 간 POST의 404 — 개발자도구 Network 탭에서 `POST /api/v1/auth/login 404` 확인 가능 → B11 재현). "회원가입" 링크 → `/register`, 거기서 "로그인" 링크 → `/login` 왕복.
3. **회원가입 폼 검증** — `/register`에서 비밀번호 5자 입력 → minLength 브라우저 툴팁; 역할 select에 "고객 (의뢰인)/기사 (시공사)" 2개; 전화번호 비워도 제출 가능; 제출 시 "회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다."(역시 404 때문, 문구 오도 확인).
4. **가짜 토큰으로 보호 화면·빈 상태·B10 재현** — 개발자도구 콘솔에서 `localStorage.setItem('accessToken','x')` 후 새로고침. 기대: `/` 진입 성공, 네비에 "의뢰 목록 / 예약 / 로그아웃"만 보이고 이름·"내 의뢰"·"의뢰 등록" 버튼 없음(user=null). 홈 본문 "등록된 의뢰가 없습니다."(HTML 200을 삼킨 결과), `/my-requests` → "등록한 의뢰가 없습니다." + "의뢰 등록하기" 링크, `/my-bookings` → "예약 내역이 없습니다.", `/profile` → "로그인이 필요합니다."(토큰은 있는데!). Network 탭엔 `GET /api/v1/service-requests 200 text/html`. 마지막으로 네비 "로그아웃" → `/login`으로 이동하고 localStorage 토큰 삭제 확인.
5. **의뢰 상세 없는 id** — 위 가짜 토큰 상태에서 `/requests/999` → "로딩 중..." 후 "의뢰를 찾을 수 없습니다."(응답이 HTML이라 `request` undefined). `/requests/abc`도 동일. 정상 백엔드가 붙으면 999는 404 봉투로 같은 문구가 나와야 하므로 문구 일관성 체크용.

---

## 환경 한계

### 이번에 실행하지 못한 것(DB·환경 필요)
- 실제 Postgres 위에서의 TypeORM `synchronize` DDL 생성(enum 5종·`text[]`·decimal(3,2)/(5,2)·unique email), 트랜잭션(`accept`) 원자성, QueryBuilder OR 조건, 동시성.
- 실제 `main.ts` 부팅 및 Swagger UI 서빙(B1~B3 때문에 원천 차단).
- e2e 테스트(`test:e2e`).
- 프론트 ↔ 백엔드 연동 전체 흐름(로그인 → 의뢰 등록 → 견적 → 수락 → 완료 → 리뷰), 카테고리 select 채워짐, 401 인터셉터 실동작, react-query invalidate 후 화면 갱신.
- 알림 생성(코드 자체가 없음), 이미지 업로드(엔드포인트 없음).

### 로컬에서 실제로 돌리려면 필요한 것 (순서대로)
1. **Node ≥ 20.19** (현재 18.20.8; nvm/fnm 미설치, `C:\Program Files\nodejs`만 있음). 18로는 B3 때문에 백엔드 부팅 불가.
2. **Postgres 16** — `docker compose up postgres -d`(docker 없음) 또는 로컬 설치 후 `homepick` DB 생성, `backend/.env`의 `DATABASE_URL` 포트 맞추기(compose는 5433).
3. 코드 수정 2건 + 패키지 1건: `quotes.controller.ts`·`reviews.controller.ts`에 `@Controller()` 추가(B1), `npm i @fastify/static@8`(B2). (이번 작업에서는 금지 항목이라 적용하지 않음.)
4. `backend/.env` 작성 — 3000은 yeonae-ai가 점유 중이므로 `PORT=3300` 등으로, `ALLOWED_ORIGINS=http://localhost:3001`.
5. `frontend/.env`에 `VITE_API_URL=http://localhost:3300`(4번과 동일 포트) 작성 후 **Vite 재시작**(env는 기동 시 주입).
6. 카테고리 최소 1행 수동 INSERT(`INSERT INTO categories(name, "sortOrder") VALUES ('수도/배관',1);`) — 없으면 의뢰 등록 폼이 막힘.
7. 그 다음 하네스에서 확인된 21개 API가 그대로 동작할 것으로 예상되나, B4~B8은 그대로 남는다.

### 이번 테스트에서 쓴 우회 수단(재현용)
- 하네스: `…\scratchpad\harness.js` — `backend/dist`의 컨트롤러·서비스·가드·필터·인터셉터·Swagger를 원본 그대로 사용, `getRepositoryToken(Entity)`/`DataSource`만 인메모리 가짜로 제공, TypeORM 메타데이터로 컬럼 default 적용. 실행: `cd backend && NODE_PATH=<scratchpad>/extra/node_modules PORT=3390 JWT_SECRET=test node <scratchpad>/homepick-harness.js` → `SUMMARY: 67 PASS / 6 FAIL / 73 total`.
- 하네스가 원본과 다르게 한 것 2가지뿐: (a) `QuotesController`·`ReviewsController`에 `Controller()` 런타임 적용, (b) `@fastify/static`을 프로젝트 밖에 설치해 `NODE_PATH`로 주입. 둘 다 프로젝트 파일은 건드리지 않음.
