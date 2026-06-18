# Homepick — 소규모 집수리 중개 플랫폼

수도꼭지 교체, 문짝 수리 같은 **소액 집수리**를 빠르고 투명하게 연결합니다.  
기존 인테리어 앱들이 외면하는 5만~30만원 구간 소규모 수리에 특화된 중개 서비스입니다.

---

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
- Docker & Docker Compose
- Node.js 18+

### 환경변수 설정

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/homepick
JWT_SECRET=homepick-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3001
PORT=3000
```

`frontend/.env`
```env
VITE_API_URL=http://localhost:3000
```

### 실행

```bash
# 전체 실행 (DB + 백엔드 + 프론트엔드)
docker compose up --build

# DB만 Docker로 띄우고 로컬 개발
docker compose up postgres -d
cd backend && npm run start:dev   # :3000
cd frontend && npm run dev        # :3001
```

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3001 |
| 백엔드 API | http://localhost:3000 |
| Swagger 문서 | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5433 |

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
