# Homepick 리서치 보고서

작성일: 2026-06-18

---

## 1. 유사 서비스 분석

### 국내 서비스

#### 숨고 (Soomgo)
- **모델**: 역경매형 — 의뢰인이 요청 올리면 전문가 최대 5인이 견적 제시
- **강점**: 카테고리 다양성(300+), 검증된 리뷰 시스템, 앱 UX 성숙도
- **약점**: 전문가가 견적 제시에 "코인" 비용 지불 → 소액 수리는 수익성 낮아 전문가 기피, 응답률 저하
- **수익 구조**: 전문가 코인 구매(건당 500~5,000원 상당), 프리미엄 노출
- **소규모 수리 문제**: 수도꼭지 5만원 수리에 코인 2,000원 쓰는 전문가 없음 → 실질적 공백

#### 크몽 (Kmong)
- **모델**: 패키지 상품 판매형 — 전문가가 서비스를 상품으로 등록
- **강점**: IT/디자인/마케팅 강세, 결제 에스크로 내장
- **약점**: 오프라인 방문 수리에 최적화 안 됨, 위치 기반 매칭 없음
- **수익 구조**: 거래액의 20% 플랫폼 수수료
- **소규모 수리 문제**: 카테고리 구조가 온라인 디지털 서비스 중심

#### 당근마켓 홈서비스
- **모델**: 지역 기반 전문가 탐색 + 채팅 연결
- **강점**: 이미 5,000만 MAU 확보, 동네 신뢰 기반, 광고 노출 비용 저렴
- **약점**: 매칭 자동화 없음(사용자가 직접 탐색), 견적 비교 불가, 결제 미통합
- **수익 구조**: 전문가 광고 노출료
- **소규모 수리 문제**: UX가 중개보다 "광고판"에 가까움, 바가지 방어 불가

#### 오늘의집 (집수리 카테고리)
- **모델**: 인테리어 커머스 + 시공 중개
- **강점**: 자재·가구·시공 원스톱, 포트폴리오 기반 신뢰
- **약점**: 100만원 이하 소액 수리는 등록 전문가 없음, 대형 시공 중심 수수료 구조
- **소규모 수리 문제**: 타깃 미스매치 (리모델링 앱)

### 해외 서비스

#### TaskRabbit (미국, Ikea 인수)
- **모델**: 즉시 예약형 — 작업 선택 → 가능한 Tasker 목록 → 시급 확인 → 즉시 예약
- **강점**: 당일 예약 가능, 시간당 요금 투명 공개, 보험 내장(사고 시 커버)
- **약점**: 한국 미진출, 시급제라 소액 작업도 최소 1시간 과금
- **수익 구조**: 거래액의 15% + 서비스 수수료 $7.99 고정
- **시사점**: 투명 요금제 + 즉시 예약이 핵심 UX 성공 요인

#### Angi (구 Angie's List, 미국)
- **모델**: 리드 판매형 — 전문가에게 의뢰인 정보를 건당 판매
- **강점**: 전문가 리뷰 DB 방대, HomeAdvisor와 합병으로 규모
- **약점**: 전문가가 리드비 지불 → 비용 소비자 전가, 스팸 콜 많음
- **수익 구조**: 전문가 리드 구매(건당 $15~$100), 멤버십
- **시사점**: 리드 판매 모델은 품질 저하 리스크

#### Thumbtack (미국)
- **모델**: 수요 기반 역경매 (숨고와 유사)
- **강점**: ML 기반 자동 매칭, 즉시 견적 기능
- **약점**: 전문가 코인 모델 동일한 문제
- **시사점**: AI 자동 매칭이 UX 차별화 포인트

---

### Homepick 차별화 포인트

| 차별점 | 기존 서비스 | Homepick |
|---|---|---|
| 소액 수리 특화 | 5만~30만원 수리 기피 | 이 구간만 집중 |
| 전문가 수수료 구조 | 코인/리드비 선불 | 성사 후 수수료 (리스크 없음) |
| 요금 투명성 | 견적 편차 큼 | 카테고리별 표준 요금 가이드 제공 |
| 즉시 매칭 | 평균 2~24시간 대기 | 근거리 가용 기사 즉시 연결 목표 |
| 방문 전 사진 견적 | 전화 상담 기본 | 사진/동영상 업로드 → 비대면 견적 |

---

## 2. 핵심 기능 정의 (MVP)

### P0 — 런칭 필수

#### 고객(의뢰인) 사이드
- 회원가입/로그인 (이메일 + 카카오 소셜)
- 수리 카테고리 선택 (수도/전기/목공/가전/기타)
- 작업 요청 등록 (제목, 설명, 사진 최대 5장, 주소, 희망 일정)
- 견적 수신 및 비교 (최대 3개)
- 기사 선택 및 예약 확정
- 작업 완료 후 리뷰 작성
- 결제 (카드/카카오페이)

#### 기사(전문가) 사이드
- 기사 회원가입 + 서비스 지역/카테고리 설정
- 신규 의뢰 알림 수신 (푸시)
- 견적 제출 (금액 + 메시지 + 예상 소요시간)
- 예약 확정 알림 수신
- 작업 완료 처리
- 정산 내역 확인

#### 매칭/결제 흐름
1. 의뢰 등록 → 해당 지역+카테고리 기사에게 푸시 알림
2. 기사가 견적 제출 (24시간 내)
3. 고객이 견적 비교 후 선택
4. 결제 에스크로 선입금
5. 작업 완료 → 고객 확인 → 기사 정산 (수수료 15% 차감)
6. 리뷰 교환

### P1 — 초기 성장 단계

- 실시간 채팅 (예약 확정 후 기사-고객 1:1)
- 작업 상태 트래킹 (이동중 / 작업중 / 완료)
- 즐겨찾는 기사 재예약
- 기사 포트폴리오 (완료 작업 사진)
- 표준 요금 가이드 페이지

### P2 — 성숙 단계

- AI 견적 자동 추천 (사진 분석)
- 구독 멤버십 (월 1만원, 수수료 10%로 할인)
- 기업 고객 (부동산 관리업체 계정)
- 기사 등급제 (일반/인증/파트너)

---

## 3. 기술 스택 결정

### 확정 스택 (기존 세금앱 동일)

```
Frontend  : React 18 + TypeScript + Vite + Tailwind CSS + Zustand + TanStack Query
Backend   : NestJS + Fastify + TypeORM + PostgreSQL
Infra     : Docker Compose
```

### 추가 기술 결정

#### 실시간 채팅: Socket.io

- **근거**: P1 기능이므로 MVP에서 바로 구현 불필요하나, NestJS Gateway 지원이 공식적
- **아키텍처**: `@nestjs/websockets` + `socket.io-adapter-redis` (멀티 인스턴스 대비)
- **MVP 대안**: SSE(Server-Sent Events) — 채팅 없이 알림만 필요한 초기엔 충분

```
MVP:   SSE (단방향 알림)
P1:    Socket.io + Redis Pub/Sub
```

#### 지도/위치: 카카오맵 API

- **근거**: 한국 서비스 기준 Kakao Map이 도로명 주소 정확도 최고, 무료 쿼터 관대
- **사용처**: 기사 서비스 지역 설정, 의뢰 위치 표시, 근거리 기사 검색
- **키 관리**: `KAKAO_MAP_API_KEY` 환경변수, 프론트엔드 `VITE_KAKAO_MAP_KEY`

```bash
# Frontend
npm install react-kakao-maps-sdk

# Backend (좌표 → 주소 변환)
# Kakao Local API HTTP 호출 (별도 SDK 없음)
```

#### 결제: 포트원 v2 (구 아임포트)

- **근거**: 국내 카드사 + 카카오페이 + 네이버페이 단일 연동, 에스크로 지원
- **에스크로 흐름**: 고객 선결제 → 포트원 에스크로 보관 → 작업 완료 확인 → 기사 정산
- **수수료**: 카드 2.6%, 간편결제 1.5%

```bash
npm install portone  # Backend SDK
```

#### 이미지 업로드: AWS S3 (또는 초기엔 로컬)

- **MVP 전략**: `multer` + 로컬 디스크 저장 → Docker volume 마운트
- **프로덕션**: AWS S3 + CloudFront CDN (이미지 리사이징은 Sharp.js)
- **전환 비용 최소화**: 업로드 서비스를 추상화 레이어로 분리

```bash
npm install @aws-sdk/client-s3 multer sharp
```

#### 푸시 알림: Firebase Cloud Messaging (FCM)

- **근거**: iOS/Android/Web 크로스 플랫폼, 무료
- **사용처**: 신규 의뢰 알림(기사), 견적 도착(고객), 예약 확정

```bash
npm install firebase-admin  # Backend
```

#### 스택 전체 그림

```
Client (Web/PWA)
  React 18 + Vite + Tailwind
  Zustand (UI 상태) + TanStack Query (서버 상태)
  Kakao Map SDK + Socket.io-client (P1)

API Server
  NestJS + Fastify
  TypeORM + PostgreSQL
  Socket.io Gateway (P1)
  포트원 v2 SDK
  FCM (firebase-admin)
  AWS S3 SDK

Infrastructure (Docker Compose)
  postgres:16
  redis:7 (세션 + Socket.io Pub/Sub, P1)
  nginx (리버스 프록시)
```

---

## 4. DB 스키마 초안

### ERD 관계 요약

```
User (1) ──< ServiceRequest (N)
User (1) ──< Quote (N)          ← 기사가 제출한 견적
ServiceRequest (1) ──< Quote (N)
Quote (1) ──── Booking (1)      ← 선택된 견적 = 예약
Booking (1) ──< Review (2)      ← 고객→기사, 기사→고객 상호 리뷰
Booking (1) ──── Payment (1)
Category (1) ──< ServiceRequest (N)
User (1) ──< UserCategory (N) ──> Category (1)  ← 기사 담당 카테고리
```

### 엔티티 상세

```typescript
// users 테이블
User {
  id              : integer PK
  email           : varchar(255) UNIQUE NOT NULL
  passwordHash    : varchar(255) NULL          // 소셜 로그인 시 null
  name            : varchar(100) NOT NULL
  phone           : varchar(20) NULL
  profileImageUrl : varchar(500) NULL
  role            : enum('customer', 'worker', 'admin') DEFAULT 'customer'
  isVerified      : boolean DEFAULT false       // 기사 본인확인 여부
  fcmToken        : varchar(500) NULL
  createdAt       : timestamp
  updatedAt       : timestamp
}

// categories 테이블
Category {
  id          : integer PK
  name        : varchar(100) NOT NULL           // '수도/배관', '전기', '목공' 등
  iconUrl     : varchar(500) NULL
  sortOrder   : integer DEFAULT 0
  isActive    : boolean DEFAULT true
}

// user_categories (기사-카테고리 M:N)
UserCategory {
  id         : integer PK
  userId     : integer FK → User
  categoryId : integer FK → Category
}

// worker_profiles 테이블 (기사 전용 추가 정보)
WorkerProfile {
  id              : integer PK
  userId          : integer FK → User UNIQUE
  bio             : text NULL
  serviceArea     : varchar(255) NOT NULL      // '서울 강남구, 서초구'
  latitude        : decimal(10,8) NULL         // 현재 위치 (실시간 업데이트)
  longitude       : decimal(11,8) NULL
  rating          : decimal(3,2) DEFAULT 0.00
  reviewCount     : integer DEFAULT 0
  completedCount  : integer DEFAULT 0
  bankName        : varchar(50) NULL           // 정산 계좌
  bankAccount     : varchar(30) NULL
  bankHolder      : varchar(50) NULL
}

// service_requests 테이블
ServiceRequest {
  id              : integer PK
  customerId      : integer FK → User
  categoryId      : integer FK → Category
  title           : varchar(200) NOT NULL
  description     : text NOT NULL
  address         : varchar(500) NOT NULL
  addressDetail   : varchar(200) NULL
  latitude        : decimal(10,8) NULL
  longitude       : decimal(11,8) NULL
  imageUrls       : text[] NULL                // PostgreSQL 배열
  preferredDate   : date NULL
  preferredTime   : varchar(50) NULL           // '오전', '오후', '저녁'
  status          : enum('open', 'quoted', 'booked', 'completed', 'cancelled')
                    DEFAULT 'open'
  createdAt       : timestamp
  updatedAt       : timestamp
}

// quotes 테이블
Quote {
  id              : integer PK
  serviceRequestId: integer FK → ServiceRequest
  workerId        : integer FK → User
  price           : integer NOT NULL           // 원 단위
  message         : text NULL
  estimatedHours  : decimal(4,1) NULL
  status          : enum('pending', 'accepted', 'rejected', 'cancelled')
                    DEFAULT 'pending'
  createdAt       : timestamp
  updatedAt       : timestamp
}

// bookings 테이블
Booking {
  id              : integer PK
  quoteId         : integer FK → Quote UNIQUE
  serviceRequestId: integer FK → ServiceRequest
  customerId      : integer FK → User
  workerId        : integer FK → User
  scheduledAt     : timestamp NOT NULL
  status          : enum('confirmed', 'in_progress', 'completed', 'cancelled')
                    DEFAULT 'confirmed'
  completedAt     : timestamp NULL
  createdAt       : timestamp
  updatedAt       : timestamp
}

// payments 테이블
Payment {
  id              : integer PK
  bookingId       : integer FK → Booking UNIQUE
  customerId      : integer FK → User
  amount          : integer NOT NULL           // 결제 금액 (원)
  platformFee     : integer NOT NULL           // 수수료 (amount × 0.15)
  workerAmount    : integer NOT NULL           // 기사 정산액
  portoneId       : varchar(200) UNIQUE        // 포트원 imp_uid
  method          : varchar(50) NULL           // 'card', 'kakaopay' 등
  status          : enum('pending', 'paid', 'settled', 'refunded')
                    DEFAULT 'pending'
  paidAt          : timestamp NULL
  settledAt       : timestamp NULL
  createdAt       : timestamp
  updatedAt       : timestamp
}

// reviews 테이블
Review {
  id              : integer PK
  bookingId       : integer FK → Booking
  reviewerId      : integer FK → User          // 작성자
  targetId        : integer FK → User          // 대상
  rating          : integer NOT NULL           // 1~5
  comment         : text NULL
  imageUrls       : text[] NULL
  createdAt       : timestamp
  updatedAt       : timestamp
  -- UNIQUE(bookingId, reviewerId)
}

// chat_messages 테이블 (P1)
ChatMessage {
  id              : integer PK
  bookingId       : integer FK → Booking
  senderId        : integer FK → User
  content         : text NOT NULL
  isRead          : boolean DEFAULT false
  createdAt       : timestamp
}

// notifications 테이블
Notification {
  id              : integer PK
  userId          : integer FK → User
  type            : varchar(50) NOT NULL       // 'new_request', 'quote_received' 등
  title           : varchar(200) NOT NULL
  body            : text NOT NULL
  referenceId     : integer NULL               // 관련 엔티티 ID
  referenceType   : varchar(50) NULL           // 'booking', 'quote' 등
  isRead          : boolean DEFAULT false
  createdAt       : timestamp
}
```

---

## 5. API 엔드포인트 초안

Base URL: `/api/v1`

### 인증 (Auth)

```
POST   /api/v1/auth/signup              회원가입
POST   /api/v1/auth/login               이메일 로그인
POST   /api/v1/auth/kakao               카카오 소셜 로그인
POST   /api/v1/auth/refresh             토큰 갱신
POST   /api/v1/auth/logout              로그아웃
```

### 사용자 (Users)

```
GET    /api/v1/users/me                 내 정보 조회
PATCH  /api/v1/users/me                 내 정보 수정
PATCH  /api/v1/users/me/fcm-token       FCM 토큰 등록
GET    /api/v1/users/:id/profile        공개 프로필 조회 (기사)
```

### 기사 프로필 (Worker Profiles)

```
POST   /api/v1/worker-profiles          기사 프로필 생성 (기사 전환)
PATCH  /api/v1/worker-profiles/me       내 기사 프로필 수정
GET    /api/v1/worker-profiles/me/stats 내 통계 (완료건수, 수익 등)
```

### 카테고리 (Categories)

```
GET    /api/v1/categories               카테고리 전체 목록
```

### 수리 요청 (Service Requests)

```
POST   /api/v1/service-requests                      의뢰 등록
GET    /api/v1/service-requests                      의뢰 목록 (기사용 — 내 지역/카테고리)
GET    /api/v1/service-requests/my                   내 의뢰 목록 (고객용)
GET    /api/v1/service-requests/:id                  의뢰 상세
PATCH  /api/v1/service-requests/:id                  의뢰 수정 (open 상태만)
DELETE /api/v1/service-requests/:id                  의뢰 취소
```

### 견적 (Quotes)

```
POST   /api/v1/service-requests/:requestId/quotes    견적 제출 (기사)
GET    /api/v1/service-requests/:requestId/quotes    견적 목록 (고객 — 본인 의뢰만)
GET    /api/v1/quotes/my                             내가 제출한 견적 목록 (기사)
PATCH  /api/v1/quotes/:id/accept                     견적 수락 (고객) → 예약 생성
PATCH  /api/v1/quotes/:id/reject                     견적 거절
```

### 예약 (Bookings)

```
GET    /api/v1/bookings/my                           내 예약 목록
GET    /api/v1/bookings/:id                          예약 상세
PATCH  /api/v1/bookings/:id/complete                 작업 완료 처리 (기사)
PATCH  /api/v1/bookings/:id/confirm-complete         완료 확인 (고객) → 정산 트리거
PATCH  /api/v1/bookings/:id/cancel                   예약 취소
```

### 결제 (Payments)

```
POST   /api/v1/payments                              결제 요청 생성 (포트원 연동)
POST   /api/v1/payments/webhook                      포트원 웹훅 수신
GET    /api/v1/payments/:bookingId                   결제 정보 조회
POST   /api/v1/payments/:id/refund                   환불 요청
```

### 리뷰 (Reviews)

```
POST   /api/v1/bookings/:bookingId/reviews           리뷰 작성
GET    /api/v1/users/:userId/reviews                 특정 유저 리뷰 목록
```

### 채팅 (Chat) — P1

```
GET    /api/v1/bookings/:bookingId/messages          채팅 이력 조회
POST   /api/v1/bookings/:bookingId/messages          메시지 전송 (REST fallback)
# 실시간: WS /chat namespace, event: 'message', 'read'
```

### 알림 (Notifications)

```
GET    /api/v1/notifications                         내 알림 목록
PATCH  /api/v1/notifications/:id/read                알림 읽음 처리
PATCH  /api/v1/notifications/read-all                전체 읽음
GET    /api/v1/notifications/stream                  SSE 스트림 (MVP 실시간 알림)
```

### 이미지 업로드 (Upload)

```
POST   /api/v1/uploads/images                        이미지 업로드 (multipart)
                                                     응답: { urls: string[] }
```

### 관리자 (Admin) — P1

```
GET    /api/v1/admin/users                           회원 목록
PATCH  /api/v1/admin/users/:id/verify                기사 인증 승인
GET    /api/v1/admin/payments/settlements            정산 현황
```

---

## 6. 개발 우선순위 로드맵

### Phase 1 — MVP (4~6주)
1. 인증 모듈 (이메일 + 카카오)
2. 수리 요청 CRUD
3. 견적 제출/수락
4. 결제 (포트원 에스크로)
5. 리뷰
6. SSE 알림
7. 이미지 업로드 (로컬)

### Phase 2 — 성장 (2~3주)
1. 실시간 채팅 (Socket.io)
2. 카카오맵 위치 기반 필터
3. 기사 포트폴리오
4. FCM 푸시 알림

### Phase 3 — 고도화
1. 표준 요금 가이드
2. AI 견적 추천
3. 기사 등급제
4. 어드민 대시보드

---

## 7. 리스크 & 고려사항

| 리스크 | 내용 | 대응 |
|---|---|---|
| 공급 부족 | 초기 기사 수 부족 | 직접 리크루팅 (5개 주요 카테고리 × 구별 1명 목표) |
| 바가지 방지 | 표준 요금 없으면 불신 | 카테고리별 평균 요금 가이드 노출 |
| 노쇼 | 기사/고객 예약 불이행 | 패널티 시스템 + 에스크로 규정 |
| 법적 이슈 | 전기/가스는 자격증 필수 | 카테고리별 자격증 인증 필드 |
| 이탈 | 직거래 유도 | 보험 + 리뷰 + 에스크로 가치 강조 |
