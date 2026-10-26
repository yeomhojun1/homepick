# Homepick — 소규모 집수리 중개 플랫폼

**수도꼭지 교체나 방문 손잡이 수리처럼 작은 집수리를, 동네 기사에게 견적을 받아 맡길 수 있게 이어 주는 웹 서비스입니다.**

## 누가 어떤 불편을 겪나요?

- **집에 사는 사람(고객)**: 5만~30만 원 정도의 작은 수리는 맡길 곳을 찾기 어렵습니다. 업체에 일일이 전화해야 하고, 가격이 적당한지 비교하기도 힘듭니다.
- **수리 기사**: 작은 일감은 건당 수익이 적어서, 일감을 찾는 데 드는 비용(광고비, 코인 등)을 내고 나면 남는 게 별로 없습니다.

Homepick은 고객이 수리 내용을 올리면 여러 기사가 견적을 내고, 고객이 견적을 비교해 한 명을 고르는 흐름으로 이 문제를 줄이려고 합니다.

## 바로 써 보기

**https://yeomhojun1.github.io/homepick/**

- 설치나 회원가입 없이 링크만 누르면 됩니다. 처음 들어가면 **고객 계정으로 자동 로그인**되어 있습니다.
- 화면 맨 위 노란 띠에서 **[고객 김민지] / [기사 박성수]** 버튼으로 고객과 기사 화면을 바로 바꿔 볼 수 있습니다.
- 이 데모는 실제 서버 없이 **브라우저 안에서 가짜 데이터로** 동작합니다. 입력한 내용은 내 브라우저에만 저장되고, [데이터 초기화]를 누르면 처음 상태로 돌아갑니다.

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 고객 | `customer@demo.homepick` | `demo1234` |
| 기사 | `worker@demo.homepick` | `demo1234` |

## 화면에서 할 수 있는 것

1. **수리 의뢰 올리기** — 고객으로 [의뢰 등록]을 눌러 수리 종류, 내용, 주소를 적습니다.
2. **견적 내기** — 기사로 바꿔서 방금 올린 의뢰를 열고 금액과 설명을 적어 [견적 제출]을 누릅니다.
3. **견적 고르기** — 다시 고객으로 바꿔 [내 의뢰]에서 받은 견적을 비교하고 [수락]하면 예약이 잡힙니다.
4. **작업 완료 처리** — 기사로 [예약] 메뉴에서 [완료 처리]를 누릅니다.
5. **리뷰 남기기** — 고객으로 [예약] 메뉴에서 별점과 후기를 남기면, 기사의 프로필 화면에 리뷰가 쌓입니다.

## AI 에이전트로 점검·수정한 과정

점검과 수정은 Claude Code(AI 코딩 에이전트)로 진행했습니다. 에이전트가 기능 49개를 실제로 실행해 점검했고(통과 30 / 실패 11 / 환경 없어 확인 불가 8, [`feature-test-report.md`](feature-test-report.md)), 그때 찾은 문제 B1~B14(백엔드가 켜지지 않던 문제, 비밀번호 해시 노출, 역할 권한 누락 등)를 고친 뒤 백엔드 단위 테스트 23개를 새로 붙였습니다([`fix-report.md`](fix-report.md)). 위 데모는 의뢰 등록부터 리뷰까지의 흐름을 브라우저 자동화(Playwright)로 끝까지 눌러 보고 확인했습니다.

---

> 아래부터는 개발자용 안내입니다.

## 왜 Homepick인가?

| 문제 | 기존 서비스 | Homepick |
|------|-----------|---------|
| 소액 수리 기피 | 숨고·크몽은 코인 비용 대비 수익 낮아 전문가 기피 | 성사 후 수수료 — 기사 진입 장벽 없음 |
| 견적 불투명 | 전화 상담 기본, 편차 큼 | 사진 업로드 → 비대면 견적 + 표준 요금 가이드 |
| 대기 시간 | 평균 2~24시간 응답 | 근거리 가용 기사 즉시 알림 |
| 바가지 우려 | 비교 견적 없음 | 최대 3개 견적 비교 후 선택 |

---

## 주요 기능

### 고객 (의뢰인)
- 카테고리 선택 후 수리 요청 등록 (사진 첨부)
- 복수 견적 수신 및 비교
- 기사 선택 → 결제 (에스크로) → 완료 확인
- 작업 완료 후 리뷰 작성

### 기사 (전문가)
- 담당 카테고리 & 서비스 지역 설정
- 신규 의뢰 알림 수신
- 견적 제출 (금액 + 메시지 + 예상 소요시간)
- 작업 완료 처리 → 자동 정산 (수수료 15% 차감)

---

## 기술 스택

### Frontend
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat-square)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)

### Backend
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### Infra
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 프로젝트 구조

```
repair-app/
├── backend/
│   └── src/
│       ├── auth/              # JWT 인증, 회원가입/로그인
│       ├── categories/        # 수리 카테고리, 기사 담당 카테고리
│       ├── service-requests/  # 수리 의뢰 CRUD
│       ├── quotes/            # 견적 제출/수락/거절
│       ├── bookings/          # 예약 관리, 완료 처리
│       ├── reviews/           # 상호 리뷰
│       ├── notifications/     # 알림 목록
│       └── common/            # 가드, 인터셉터, 필터, 데코레이터
├── frontend/
│   └── src/
│       ├── pages/             # 라우팅 단위 페이지
│       ├── components/        # 레이아웃 등 공통 컴포넌트
│       ├── api/               # axios 클라이언트 & API 함수
│       ├── store/             # Zustand 인증 상태
│       └── types/             # 공유 TypeScript 타입
└── docker-compose.yml
```

---

## 시작하기

### 요구사항
- Node.js **20.19+** (NestJS 11 / TypeORM / Fastify 5 가 요구. Node 18 에서는 부팅 불가)
- PostgreSQL 16 (로컬 설치 또는 Docker & Docker Compose)

### 환경변수 설정

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` (로컬 PostgreSQL 기준. `<db-user>`/`<db-password>` 는 실제 값으로 교체)
```env
PORT=4001
DATABASE_URL=postgresql://<db-user>:<db-password>@localhost:5432/homepick
JWT_SECRET=<change-me-to-a-long-random-string>
ALLOWED_ORIGINS=http://localhost:3001
NODE_ENV=development
```

`frontend/.env`
```env
VITE_API_URL=http://localhost:4001
```

### 실행

```bash
# 1) DB 준비 — 로컬 PostgreSQL 에 homepick 데이터베이스를 만들거나 Docker 사용
docker compose up postgres -d    # (Docker 를 쓸 경우, 포트는 5433)

# 2) 백엔드 의존성 설치
cd backend && npm install

# 3) 카테고리 시드 — 최초 1회 필수.
#    테이블 생성(synchronize) 과 기본 카테고리 8종 INSERT 를 함께 수행한다.
#    카테고리가 없으면 프론트 의뢰 등록 폼의 카테고리 select 가 비어 의뢰 등록 자체가 불가능하다.
#    이름 기준으로 중복을 건너뛰므로 여러 번 실행해도 안전하다.
npm run seed

# 4) 백엔드 실행
npm run start:dev                # :4001

# 5) 프론트엔드 실행 (다른 터미널)
cd frontend && npm install && npm run dev   # :3001
```

> Docker 로 전체를 띄우려면 `docker compose up --build` 를 쓴다.
> 이 경우 백엔드는 컨테이너 안에서 3000 포트를 쓰므로 `docker-compose.yml` 의 포트 설정을 따른다.

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3001 |
| 백엔드 API | http://localhost:4001 |
| Swagger 문서 | http://localhost:4001/api/docs |
| PostgreSQL | localhost:5432 (Docker 사용 시 5433) |

### 데모 모드로 실행 (백엔드·DB 없이)

`VITE_DEMO=true` 로 빌드하면 axios 요청을 브라우저 안의 가짜 API(`frontend/src/demo/`)가 처리하고, 데이터는 localStorage 에 저장된다. GitHub Pages 배포(`.github/workflows/pages.yml`)가 이 방식으로 빌드한다. 평소 빌드(`npm run build`)에는 데모 코드가 포함되지 않는다.

```bash
cd frontend
npm run build:demo            # = VITE_DEMO=true 빌드, base 경로 /homepick/
npx vite preview --mode demo  # http://localhost:4173/homepick/
```

---

## 매칭 흐름

```
1. 고객이 수리 요청 등록 (카테고리 + 사진 + 주소)
        ↓
2. 해당 지역·카테고리 기사에게 알림 발송
        ↓
3. 기사가 견적 제출 (24시간 내, 최대 3개)
        ↓
4. 고객이 견적 비교 후 선택 → 결제 에스크로
        ↓
5. 작업 완료 → 고객 확인 → 기사 정산 (수수료 15% 차감)
        ↓
6. 상호 리뷰 작성
```

---

## API 엔드포인트

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
PATCH  /api/v1/auth/me

GET    /api/v1/categories

POST   /api/v1/service-requests
GET    /api/v1/service-requests
GET    /api/v1/service-requests/my
GET    /api/v1/service-requests/:id
PATCH  /api/v1/service-requests/:id/cancel

POST   /api/v1/service-requests/:id/quotes
GET    /api/v1/service-requests/:id/quotes
PATCH  /api/v1/quotes/:id/accept
PATCH  /api/v1/quotes/:id/reject

GET    /api/v1/bookings/my
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/complete

POST   /api/v1/bookings/:id/reviews
GET    /api/v1/users/:userId/reviews

GET    /api/v1/notifications
PATCH  /api/v1/notifications/read-all
```

---

## 로드맵

- [x] MVP — 인증, 의뢰, 견적, 예약, 리뷰
- [ ] 실시간 채팅 (Socket.io)
- [ ] 카카오맵 위치 기반 필터
- [ ] 포트원 결제 에스크로 연동
- [ ] FCM 푸시 알림
- [ ] 기사 등급제 & 포트폴리오

---

## 라이선스

MIT
