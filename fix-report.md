# homepick 버그 수정 보고 (2026-09-17)

> 5개 프로젝트 전체 현황: https://claude.ai/artifact/PvWqAcbkvtL8VSNHZhL48e

`feature-test-report.md` 의 B1~B14 + 추가 준비물 3건(백엔드 `.env.example`, 카테고리 시드, 테스트 자산)을 수정했다.
**커밋하지 않았다.** 모든 변경은 워킹트리에 미스테이징/미커밋 상태로 남아 있다 (`git add`/`commit`/`push` 일절 실행 안 함).

## 한 줄 요약

| 항목 | 결과 |
|---|---|
| `backend npm run build` | PASS (exit 0) |
| `backend npm test` | PASS — **4 suites / 23 tests** (기존 0개 → 23개) |
| `backend npm run lint` | PASS (0 errors, 1 warning) — 단, 아래 "주의" 참고 |
| `frontend npm run build` (tsc 포함) | PASS |
| `frontend npm run lint` (`--max-warnings 0`) | PASS |
| 오프라인 하네스 검증 | **15 PASS / 0 FAIL** (라우트 21개, passwordHash, 역할 가드, Swagger) |
| 실제 4001 기동 / DB 연동 | **검증 보류** — Node 24·PostgreSQL 미설치 |

---

## 1. 고친 항목별 상세

### 부팅 차단 3건

**B1. `@Controller()` 누락 — `quotes.controller.ts:22`, `reviews.controller.ts:18`**
- 두 컨트롤러는 메서드 데코레이터에 **전체 경로를 하드코딩**하고 있었다(`@Post('api/v1/service-requests/:requestId/quotes')`). 이 프로젝트에는 `setGlobalPrefix('api/v1')` 가 없고 다른 컨트롤러도 `@Controller('api/v1/...')` 로 전체 경로를 직접 쓴다.
- 따라서 **경로 인자 없는 `@Controller()`** 를 붙여 기존 6개 경로를 1바이트도 바꾸지 않았다.
- 검증: 하네스가 Swagger 문서에서 뽑은 21개 경로가 README 목록과 1:1 일치. (`GET/POST /api/v1/service-requests/{requestId}/quotes`, `PATCH /api/v1/quotes/{id}/accept|reject`, `POST /api/v1/bookings/{bookingId}/reviews`, `GET /api/v1/users/{userId}/reviews` 모두 등록됨)

**B2. `@fastify/static` 미설치 — `backend/package.json` dependencies**
- `"@fastify/static": "^8.2.0"` 추가 후 `npm install` → 실제 설치 버전 **8.3.0** (fastify 5 호환). lock 파일 갱신됨.
- 검증: 하네스에서 `SwaggerModule.setup('api/docs')` 후 `GET /api/docs` 200, `GET /api/docs-json` 200. (이전에는 PackageLoader 에러로 exit 1)

**B3. Node 버전 요구사항 — `backend/package.json`, `README.md`**
- `"engines": { "node": ">=20.19" }` 추가.
- README 요구사항을 `Node.js 18+` → `Node.js 20.19+ (Node 18 에서는 부팅 불가)` 로 수정하고 PostgreSQL 16 요구사항을 명시.

### 보안 · 로직 (B4~B9)

**B4. `passwordHash` 응답 노출 — 엔티티 레벨로 일원화**
- `auth/entities/user.entity.ts:25` — `passwordHash` 에 `@Exclude()` (class-transformer).
- `main.ts:6,33-35` — 전역 인터셉터에 `ClassSerializerInterceptor` 추가.
  ```ts
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  ```
  순서 주의: Nest 전역 인터셉터는 **먼저 등록한 쪽이 바깥**이다. `ResponseInterceptor` 를 먼저 둬야 ClassSerializer 가 엔티티를 먼저 직렬화하고, 그 결과를 `{data,message,statusCode}` 봉투가 감싼다.
- `auth.service.ts` — 중복 제거를 위해 **`sanitizeUser` 를 통째로 삭제**하고 `register/login/getMe/updateMe` 가 `User` 엔티티를 그대로 반환하도록 반환 타입도 `Omit<User,'passwordHash'>` → `User` 로 변경.
- `select: false` 대신 `@Exclude` 를 고른 이유: `select:false` 면 `login()` 의 bcrypt 비교를 위해 QueryBuilder `addSelect` 가 따로 필요하고, `register()` 는 메모리상 엔티티를 반환하므로 어차피 수동 제거가 남는다. `@Exclude` 는 중첩 객체(`{accessToken, user}`)와 배열(관계 조인 목록) 모두에 적용되는 것을 실측으로 확인했다.
- 검증: 하네스 `GET /api/v1/service-requests`(customer 관계 조인), `GET /api/v1/service-requests/:id` 응답 본문에 `passwordHash` 문자열과 해시값이 모두 없고, `customer.name` 등 나머지 필드는 정상. 단위 테스트 `user.entity.spec.ts` 3건(단독/감싸진 객체/배열 관계).

**B5. 역할 가드 — 신규 `common/roles.decorator.ts`, `common/roles.guard.ts`**
- `RolesGuard` 는 `Reflector.getAllAndOverride(ROLES_KEY, [handler, class])` 로 요구 역할을 읽고, 메타데이터가 없으면 통과, JWT payload 의 `role` 과 불일치하면 `403 '이 작업을 수행할 권한이 없습니다.'`.
- 적용: `service-requests.controller.ts:23,29` — 클래스 `@UseGuards(JwtAuthGuard, RolesGuard)` + `POST` 에 `@Roles(UserRole.CUSTOMER)`.
- 적용: `quotes.controller.ts:23,29` — 동일 가드 + 견적 제출에 `@Roles(UserRole.WORKER)`.
- 검증: 하네스 — worker 토큰 의뢰 등록 **403**, customer 토큰 의뢰 등록 201, customer 토큰 견적 제출 **403**, worker 토큰 견적 제출 201. 단위 테스트 `roles.guard.spec.ts` 5건.

**B6. `QuotesService.reject` 상태 검사 — `quotes.service.ts:119-121`**
- 소유자 검사 뒤에 `if (quote.status !== QuoteStatus.PENDING) throw new BadRequestException('이미 처리된 견적입니다.')` 추가 (accept 와 동일 문구).
- 검증: 단위 테스트 — accepted 견적 reject 시 `BadRequestException` 이고 `save` 가 아예 호출되지 않음(예약/견적 불일치 차단).

**B7. booked/completed 의뢰 견적 제출 차단 — `quotes.service.ts:40-47`**
- 기존 CANCELLED 검사 아래에 BOOKED/COMPLETED 검사 추가 → `400 '이미 예약이 확정된 의뢰에는 견적을 제출할 수 없습니다.'`
- 검증: 단위 테스트 3건(booked 400 / completed 400 / open 201).

**B8. `GET /bookings/:id` 소유자 검사 — `bookings.service.ts:34,42-48` + `bookings.controller.ts:28-33`**
- `findOne(id, requesterId?)` 로 선택 인자를 추가하고, 값이 있을 때만 `customerId`/`workerId` 와 대조해 아니면 `403 '예약 조회 권한이 없습니다.'`.
- 컨트롤러가 `@CurrentUser()` 를 받아 `findOne(id, user.sub)` 로 호출. 내부 호출인 `complete()` 는 인자를 넘기지 않으므로 기존 동작(기사 본인 검사)이 그대로 유지된다.
- 검증: 단위 테스트 4건(제3자 403 / 고객 200 / 기사 200 / 없는 id 404).

**B9. 완료 시 `completedCount` 증가 — `bookings.service.ts:70-76`, `bookings.module.ts`**
- `BookingsService` 에 `WorkerProfile` 리포지토리를 주입하고(모듈 `forFeature` 에도 추가), 완료 처리 후 해당 기사 프로필의 `completedCount += 1`.
- 검증: 단위 테스트 — 완료 시 2 → 3, 권한 없는 사용자면 `save` 미호출.

### 프론트엔드 (B10~B13)

**B10. 새로고침 세션 복원 — `store/useAuthStore.ts`, `App.tsx`**
- 스토어에 `isBootstrapping`(초기값 = 토큰 존재 여부), `setUser`, `finishBootstrap` 추가. `setAuth`/`clearAuth` 도 `isBootstrapping:false` 로 내린다.
- `App.tsx` 의 `useEffect` 가 부팅 시 1회 `getMe()` 를 호출해 `user` 복원, 실패하면 `clearAuth()`.
- 깜빡임 방지: `PrivateRoute` 가 `isBootstrapping` 동안에는 `/login` 리다이렉트 대신 "불러오는 중..." 을 렌더한다. (기존에는 `user=null` 상태로 홈이 그려져 "의뢰 등록" 버튼·"내 의뢰" 링크가 사라졌다)
- 검증: tsc + vite build + eslint 통과. **실제 새로고침 동작은 백엔드 없이 확인 불가 → 검증 보류.**

**B11. API 주소 — `config/env.ts`, `frontend/.env`, `frontend/.env.example`**
- `apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4001'` — env 가 없어도 3001 자기 자신으로 가지 않는다.
- `frontend/.env.example`, `frontend/.env` 둘 다 `VITE_API_URL=http://localhost:4001` 로 작성. `.env` 는 루트 `.gitignore` 3번째 줄 `.env` 에 걸려 추적되지 않음을 `git check-ignore -v` 로 확인했다.
- 검증: `npm run build` 산출물 `dist/assets/index-*.js` 에 `localhost:4001` 이 들어간 것을 확인.

**B12. 오류 문구 구분 — `api/client.ts`, `LoginPage.tsx`, `RegisterPage.tsx`**
- `client.ts` 에 `getErrorStatus(error)` / `getErrorMessage(error)` 를 export. 응답이 없으면(네트워크 오류·서버 미기동) status 가 `undefined` 다.
- 로그인: status 없음 → "서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.", 401 → "이메일 또는 비밀번호가 올바르지 않습니다.", 그 외 → 서버 message.
- 회원가입: status 없음 → 연결 실패 문구, 409 → "이미 사용 중인 이메일입니다.", 400 → 서버의 class-validator 메시지, 그 외 → 일반 실패 문구.
- **보고서에 없던 추가 수정**: 401 응답 인터셉터가 **로그인/회원가입 요청까지** `localStorage` 비우고 `window.location.href='/login'` 로 새로고침시키고 있었다. 이러면 위의 401 문구가 화면에 남지 못한다. `/api/v1/auth/login`, `/api/v1/auth/register` 요청일 때는 리다이렉트하지 않도록 예외 처리했다.

**B13. 사소한 UI — `RequestDetailPage.tsx`, `index.html`, 신규 `constants/status.ts`**
- 홈/내 의뢰에 중복돼 있던 상태 라벨·색상 맵을 `src/constants/status.ts` 로 빼고(`SERVICE_REQUEST_STATUS_LABELS`, `SERVICE_REQUEST_STATUS_COLORS`), `HomePage`·`MyRequestsPage`·`RequestDetailPage` 가 재사용하도록 했다. 의뢰 상세의 `{request.status}` 영문 raw 값이 "모집중/예약완료/..." 한글 라벨 + 상태별 색으로 바뀐다.
- 뮤테이션 실패 표시: cancel/quote/accept/reject 네 뮤테이션의 `error` 중 첫 번째를 빨간 박스로 상단에 표시(서버 message 우선, 없으면 "요청을 처리하지 못했습니다.").
- `index.html` `<title>` → `Homepick`.

### 준비물 (보고서에 없던 항목)

**14. `backend/.env.example`** — (참고: 비어 있진 않았고 PORT=3000 / 5433 의 옛 값이었다) 확정된 설정으로 교체:
```
PORT=4001
DATABASE_URL=postgresql://<db-user>:<db-password>@localhost:5432/homepick
JWT_SECRET=<change-me-to-a-long-random-string>
ALLOWED_ORIGINS=http://localhost:3001
NODE_ENV=development
```
user/password 는 요청대로 placeholder 로만 뒀다. 같이 `main.ts:45` 와 `config/configuration.ts:2` 의 기본 포트도 3000 → 4001 로 맞췄다(.env 없이 떠도 4001).

**15. 카테고리 시드 — 신규 `backend/src/seed.ts`, `npm run seed`**
- `NestFactory.createApplicationContext(AppModule)` 로 띄워서 `ConfigModule` 의 `.env` 로딩과 TypeORM `synchronize` 를 그대로 재사용한다. 즉 `npm run seed` 한 번이 **테이블 생성 + 카테고리 INSERT** 를 같이 끝낸다.
- 카테고리 8종: 수도/배관, 전기/조명, 도배/벽지, 에어컨, 보일러/난방, 욕실/타일, 문/창호/방충망, 가구/조립.
- 이름 기준으로 이미 있으면 건너뛰므로 여러 번 돌려도 안전하다. 실행 결과를 `생성 n건 / 기존 유지 m건` 으로 출력한다.
- README "실행" 절에 1) DB 준비 → 2) `npm install` → 3) `npm run seed` → 4) `npm run start:dev` (:4001) → 5) 프론트 `npm run dev` (:3001) 순서를 적었다.

**16. 테스트 자산 — 신규 spec 4개(23 테스트)**
| 파일 | 내용 |
|---|---|
| `src/quotes/quotes.service.spec.ts` | 견적 수락 트랜잭션(견적/의뢰 상태 변경 + 예약 생성 + 같은 매니저로 3회 save), 비소유자 403, 재수락 400, **reject 상태 검사(B6)**, **booked/completed 견적 차단(B7)** — 9건 |
| `src/bookings/bookings.service.spec.ts` | **예약 조회 권한(B8)** 4건, **completedCount 증가(B9)** 2건 — 6건 |
| `src/common/roles.guard.spec.ts` | **역할 가드(B5)** 5건 |
| `src/auth/entities/user.entity.spec.ts` | **passwordHash 제외(B4)** 3건 |
- 전부 리포지토리/DataSource/Reflector 를 jest mock 으로 주입하는 DB 없는 테스트다. Nest TestingModule 도 쓰지 않고 생성자에 직접 주입해서 빠르다(전체 5초).
- `test/app.e2e-spec.ts` — Nest 템플릿(`GET / → Hello World!`)을 실제 앱에 맞게 다시 썼다(`GET /api/v1/categories` 봉투 검증, 토큰 없는 `GET /api/v1/service-requests` → 401). 단 `AppModule` 이 부팅 시 실제 DB 에 붙으므로 **`describe.skip` 처리했고, 이유와 해제 방법을 파일 상단 주석에 남겼다.** (`npm test` 는 `rootDir: src` 라 e2e 를 집지 않으므로 `npm test` 결과에는 영향 없음)

---

## 2. 검증 방법과 결과

### 2-1. 빌드 / 테스트 / 린트 (실제 실행)
```
backend>  npm run build   → exit 0
backend>  npm test        → 4 suites / 23 tests 전부 PASS (5.2s)
backend>  npx eslint "{src,apps,libs,test}/**/*.ts" --fix-dry-run → 0 errors, 1 warning, exit 0
frontend> npm run build   → exit 0 (tsc + vite, 294.68 kB)
frontend> npm run lint    → exit 0 (--max-warnings 0)
```

### 2-2. 오프라인 하네스 (DB·Node24 없이 실제 HTTP 호출)
스크래치패드의 `verify.js` 로 `backend/dist` 의 **실제** 모듈·컨트롤러·가드·파이프·필터·인터셉터·Swagger 를 그대로 부팅하고, TypeORM 의 `DataSource`/리포지토리만 인메모리 가짜로 교체했다. 프로젝트 파일은 건드리지 않았다(Node 18 의 `crypto is not defined` 만 폴리필로 우회).

```
[A] 부팅 / 라우트 등록         PASS  Nest 부팅 예외 없음
                              PASS  Swagger 엔드포인트 21개 (README 목록과 1:1 일치)
                              PASS  견적 4개 / 리뷰 2개 라우트 등록
[B] passwordHash              PASS  GET /service-requests 200, 본문에 passwordHash·해시값 없음
                              PASS  customer.name 등 나머지 관계 필드는 정상
                              PASS  GET /service-requests/:id 도 동일
[C] 역할 가드                  PASS  worker 의뢰 등록 403 / customer 201
                              PASS  customer 견적 제출 403 / worker 201
[D] 기타                       PASS  GET /categories 공개 200
                              PASS  GET /api/docs-json 200, GET /api/docs 200
SUMMARY: 15 PASS / 0 FAIL
```

---

## 3. 검증 보류 항목 (이유 명시)

작업 내내 `node -v` 는 **v18.20.8** 이었고 `C:\Program Files\PostgreSQL` 도 없었다. 설치가 아직 끝나지 않아 아래는 **코드 수정만 하고 실행 검증을 못 했다.**

| # | 항목 | 필요 조건 | 비고 |
|---|---|---|---|
| 1 | 백엔드 4001 실기동, `/api/docs` 브라우저 응답, 헬스 | Node ≥ 20.19 | B3 그대로. Node 18 에서는 `@nestjs/typeorm` 이 DB 접속 전에 `ReferenceError: crypto is not defined` 로 죽는다. 하네스에서 라우트/Swagger 는 확인했다 |
| 2 | `npm run seed` 실제 실행 | Node ≥ 20.19 + PostgreSQL | 스크립트 구문·타입은 `nest build` 로 컴파일 검증됨. DDL 생성(enum 5종, `text[]`, decimal)과 INSERT 는 미실행 |
| 3 | 회원가입/로그인 실제 호출, 프론트↔백엔드 연동 전체 흐름 | Node + DB | 로그인 → 의뢰 등록 → 견적 → 수락 → 완료 → 리뷰 |
| 4 | B10 새로고침 세션 복원 육안 확인 | 백엔드 기동 | 코드/빌드/린트는 통과 |
| 5 | B12 오류 문구 3종 분기 육안 확인 | 백엔드 기동 | 네트워크오류 / 401 / 409·400 |
| 6 | `npm run test:e2e` | Node + DB | 위 16번대로 `describe.skip` 상태. DB 준비되면 `.skip` 만 떼면 된다 |
| 7 | 프론트 dev 서버(3001)의 새 `VITE_API_URL` 반영 | Vite 재시작 | **Vite 는 기동 시점에만 .env 를 주입한다.** 지금 떠 있는 3001 서버는 종료 금지 지시에 따라 건드리지 않았으므로 여전히 옛 설정이다. 사용자가 직접 재시작해야 반영된다 (`npm run build` 산출물에는 4001 이 정상 반영됨을 확인) |

---

## 4. 손대지 않은 것과 이유

- **B9 중 알림 생성 로직, 수수료 15% 정산/에스크로, 고객 "완료 확인" 단계, `user_categories`/`serviceArea`/`bio` 설정 API, 이미지 업로드** — 지시 범위가 `completedCount` 증가로 한정돼 있었고, 나머지는 버그가 아니라 미구현 기능(신규 설계)이다. README 로드맵 수준의 작업이라 임의로 만들지 않았다.
- **B12(리뷰·알림 화면 없음)** — 지시 목록에 없었다. `createReview`/`getUserReviews`/`getBooking` API 함수는 여전히 미사용이다.
- **`docker-compose.yml`** — 백엔드 컨테이너는 내부적으로 3000, DB 는 5433 을 쓴다. 이번에 확정된 값(4001 / 5432)은 **로컬 실행 기준**이고, 이 PC 에 docker 가 없어 변경해도 검증이 불가능하다. 그대로 두고 README 에 "Docker 로 띄우면 compose 의 포트 설정을 따른다" 는 주석을 달았다. 컨테이너 쪽도 4001 로 통일하고 싶으면 알려달라.
- **`response.interceptor.ts` 의 `getResponse()` 타입** — 원래부터 lint 에러(`no-unsafe-member-access`)였다. `npm run lint` 를 통과시키기 위해 `getResponse<{ statusCode: number }>()` 로 1줄만 고쳤다(동작 동일).
- **`main.ts:52` 의 `bootstrap()` floating promise 경고** — 기존 warning 그대로 뒀다. error 가 아니라 lint 통과에 영향이 없고, Nest CLI 가 생성한 원형이라 임의로 건드리지 않았다.
- **`backend/README.md`, `frontend/README.md`** — 각각 NestJS·Vite 템플릿 원문이고 포트/Node 버전 언급이 없어 수정할 게 없었다.

### ⚠️ `npm run lint` 주의
`backend` 의 lint 스크립트는 `eslint ... --fix` 라서, 실행하면 **prettier 규칙에 따라 기존 파일들을 대량 재포매팅한다.** 이 저장소의 원본 코드가 prettier 포맷이 아니기 때문이다. 작업 중 한 번 실행돼 `register.dto.ts`, `jwt.strategy.ts`, `booking.entity.ts`, `current-user.decorator.ts`, `reviews.service.ts` 등 **내가 고칠 필요 없는 파일 6개까지 재포매팅됐길래 전부 원상복구했다.** "최소 diff" 원칙을 지키려고 검증은 `--fix-dry-run` 으로 했다(결과 동일: 0 errors). 포매팅을 정리하고 싶다면 그건 별도 커밋으로 하는 편이 좋다.

---

## 5. 사용자가 직접 해야 할 남은 작업

1. **Node 24 LTS 설치 마무리** → 새 터미널에서 `node -v` 가 v24 인지 확인. 그다음 `cd backend && npm install` 을 한 번 더 돌리면 EBADENGINE 경고 12건이 사라진다.
2. **PostgreSQL 16 설치 후 DB 생성** — `createdb homepick` (또는 psql 에서 `CREATE DATABASE homepick;`).
3. **`backend/.env` 작성** — `.env.example` 을 복사하고 `<db-user>`/`<db-password>`/`<change-me-...>` 3곳을 실제 값으로 채운다. (DB 비밀번호를 몰라 `.env` 는 만들지 않았다)
   ```
   copy backend\.env.example backend\.env
   ```
4. **시드 실행** — `cd backend && npm run seed` → "카테고리 완료 — 생성 8건" 이 나오면 성공.
5. **백엔드 기동 & 확인** — `npm run start:dev` 후 `http://localhost:4001/api/docs` 에서 21개 엔드포인트 확인.
6. **프론트 dev 서버 재시작** — 지금 떠 있는 3001 서버는 옛 env 를 물고 있다. Ctrl+C 후 `npm run dev` 로 다시 띄워야 `VITE_API_URL=http://localhost:4001` 이 먹는다.
7. **연동 확인** — 회원가입(고객/기사 각각) → 의뢰 등록 → 견적 제출 → 수락 → 완료. 이때 검증 보류 4·5번(세션 복원, 오류 문구 분기)도 같이 눈으로 확인하면 된다.
8. **e2e 살리기(선택)** — DB 가 붙은 뒤 `test/app.e2e-spec.ts` 의 `describe.skip` → `describe` 로 바꾸고 `npm run test:e2e`.
9. **커밋** — 변경은 전부 미커밋 상태다. Eclipse/VS Code 의 Git 뷰에서 검토 후 직접 커밋하면 된다. 신규 파일 8개(`roles.guard.ts`, `roles.decorator.ts`, `seed.ts`, spec 4개, `frontend/src/constants/status.ts`)는 untracked 이니 add 를 빠뜨리지 않도록 주의. `frontend/.env` 는 의도적으로 gitignore 대상이다.
