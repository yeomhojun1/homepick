import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { Booking, Quote, Review, ServiceRequest, User } from '@/types';
import { createSeedDb } from './seed';
import type { DemoDb, DemoUser } from './seed';

const STORAGE_KEY = 'homepick-demo-db-v1';
const TOKEN_PREFIX = 'demo-token-';
const LATENCY_MS = 150;

export function loadDb(): DemoDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch {
    // 손상된 데이터는 새 시드로 덮어쓴다.
  }
  const db = createSeedDb();
  saveDb(db);
  return db;
}

function saveDb(db: DemoDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // 저장 공간을 못 쓰는 환경(시크릿 모드 등)에서는 메모리 상태로만 동작한다.
  }
}

export function resetDemoDb(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}

export function demoTokenFor(userId: number): string {
  return `${TOKEN_PREFIX}${userId}`;
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

function publicUser(u: DemoUser): User {
  const { password: _password, ...rest } = u;
  void _password;
  return rest;
}

function findUser(db: DemoDb, id: number): User | undefined {
  const u = db.users.find((x) => x.id === id);
  return u ? publicUser(u) : undefined;
}

function withRequestRelations(db: DemoDb, r: DemoDb['serviceRequests'][number]): ServiceRequest {
  return {
    ...r,
    customer: findUser(db, r.customerId),
    category: db.categories.find((c) => c.id === r.categoryId),
  };
}

function withQuoteRelations(db: DemoDb, q: DemoDb['quotes'][number]): Quote {
  return { ...q, worker: findUser(db, q.workerId) };
}

function withBookingRelations(db: DemoDb, b: DemoDb['bookings'][number]): Booking {
  const sr = db.serviceRequests.find((r) => r.id === b.serviceRequestId);
  const q = db.quotes.find((x) => x.id === b.quoteId);
  return {
    ...b,
    serviceRequest: sr ? withRequestRelations(db, sr) : undefined,
    worker: findUser(db, b.workerId),
    customer: findUser(db, b.customerId),
    quote: q ? withQuoteRelations(db, q) : undefined,
  };
}

function byCreatedDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function requireUser(db: DemoDb, config: InternalAxiosRequestConfig): DemoUser {
  const header = AxiosHeaders.from(config.headers).get('Authorization');
  const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
  const id = token.startsWith(TOKEN_PREFIX) ? Number(token.slice(TOKEN_PREFIX.length)) : NaN;
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new HttpError(401, '로그인이 필요합니다.');
  return u;
}

function requireRole(u: DemoUser, role: User['role']): void {
  if (u.role !== role) throw new HttpError(403, '이 작업을 수행할 권한이 없습니다.');
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

type Body = Record<string, unknown>;
type Handler = (db: DemoDb, body: Body, config: InternalAxiosRequestConfig, params: number[]) => {
  status?: number;
  data: unknown;
};

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

function route(method: string, path: string, handler: Handler): void {
  const pattern = new RegExp(`^${path.replace(/:\w+/g, '(\\d+)')}$`);
  routes.push({ method, pattern, handler });
}

// ---------- 인증 ----------
route('post', '/api/v1/auth/login', (db, body) => {
  const u = db.users.find((x) => x.email === str(body.email));
  if (!u || u.password !== body.password) {
    throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  return { data: { accessToken: demoTokenFor(u.id), user: publicUser(u) } };
});

route('post', '/api/v1/auth/register', (db, body) => {
  const email = str(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const name = str(body.name);
  const role = body.role === 'worker' ? 'worker' : 'customer';
  if (!email || password.length < 6 || !name) {
    throw new HttpError(400, '입력값을 다시 확인해 주세요.');
  }
  if (db.users.some((x) => x.email === email)) {
    throw new HttpError(409, '이미 사용 중인 이메일입니다.');
  }
  const ts = nowIso();
  const u: DemoUser = {
    id: nextId(db.users),
    email,
    password,
    name,
    phone: str(body.phone) || null,
    role,
    fcmToken: null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.users.push(u);
  return { status: 201, data: { accessToken: demoTokenFor(u.id), user: publicUser(u) } };
});

route('get', '/api/v1/auth/me', (db, _b, config) => ({ data: publicUser(requireUser(db, config)) }));

route('patch', '/api/v1/auth/me', (db, body, config) => {
  const u = requireUser(db, config);
  if (typeof body.name === 'string' && body.name.trim()) u.name = body.name.trim();
  if (typeof body.phone === 'string') u.phone = body.phone.trim() || null;
  u.updatedAt = nowIso();
  return { data: publicUser(u) };
});

// ---------- 카테고리 ----------
route('get', '/api/v1/categories', (db) => ({
  data: db.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
}));

// ---------- 의뢰 ----------
route('get', '/api/v1/service-requests', (db, _b, config) => {
  requireUser(db, config);
  return {
    data: db.serviceRequests
      .filter((r) => r.status === 'open')
      .sort(byCreatedDesc)
      .map((r) => withRequestRelations(db, r)),
  };
});

route('get', '/api/v1/service-requests/my', (db, _b, config) => {
  const u = requireUser(db, config);
  return {
    data: db.serviceRequests
      .filter((r) => r.customerId === u.id)
      .sort(byCreatedDesc)
      .map((r) => withRequestRelations(db, r)),
  };
});

route('post', '/api/v1/service-requests', (db, body, config) => {
  const u = requireUser(db, config);
  requireRole(u, 'customer');
  const title = str(body.title);
  const description = str(body.description);
  const address = str(body.address);
  const categoryId = Number(body.categoryId);
  if (title.length < 2 || description.length < 10 || !address || !db.categories.some((c) => c.id === categoryId)) {
    throw new HttpError(400, '입력값을 다시 확인해 주세요.');
  }
  const ts = nowIso();
  const preferred = str(body.preferredDate);
  const r: DemoDb['serviceRequests'][number] = {
    id: nextId(db.serviceRequests),
    customerId: u.id,
    categoryId,
    title,
    description,
    address,
    imageUrls: [],
    preferredDate: preferred ? new Date(preferred).toISOString() : null,
    status: 'open',
    createdAt: ts,
    updatedAt: ts,
  };
  db.serviceRequests.push(r);
  return { status: 201, data: withRequestRelations(db, r) };
});

function findRequest(db: DemoDb, id: number): DemoDb['serviceRequests'][number] {
  const r = db.serviceRequests.find((x) => x.id === id);
  if (!r) throw new HttpError(404, '의뢰를 찾을 수 없습니다.');
  return r;
}

route('get', '/api/v1/service-requests/:id', (db, _b, config, [id]) => {
  requireUser(db, config);
  return { data: withRequestRelations(db, findRequest(db, id)) };
});

route('patch', '/api/v1/service-requests/:id/cancel', (db, _b, config, [id]) => {
  const u = requireUser(db, config);
  const r = findRequest(db, id);
  if (r.customerId !== u.id) throw new HttpError(403, '취소 권한이 없습니다.');
  if (r.status === 'completed') throw new HttpError(403, '완료된 의뢰는 취소할 수 없습니다.');
  r.status = 'cancelled';
  r.updatedAt = nowIso();
  return { data: withRequestRelations(db, r) };
});

// ---------- 견적 ----------
route('get', '/api/v1/service-requests/:id/quotes', (db, _b, config, [id]) => {
  requireUser(db, config);
  return {
    data: db.quotes
      .filter((q) => q.serviceRequestId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((q) => withQuoteRelations(db, q)),
  };
});

route('post', '/api/v1/service-requests/:id/quotes', (db, body, config, [id]) => {
  const u = requireUser(db, config);
  requireRole(u, 'worker');
  const r = findRequest(db, id);
  if (r.status === 'cancelled') throw new HttpError(400, '취소된 의뢰에는 견적을 제출할 수 없습니다.');
  if (r.status === 'booked' || r.status === 'completed') {
    throw new HttpError(400, '이미 예약이 확정된 의뢰에는 견적을 제출할 수 없습니다.');
  }
  if (db.quotes.some((q) => q.serviceRequestId === id && q.workerId === u.id)) {
    throw new HttpError(400, '이미 견적을 제출했습니다.');
  }
  const price = Number(body.price);
  const message = str(body.message);
  if (!Number.isFinite(price) || price < 1 || !message) {
    throw new HttpError(400, '입력값을 다시 확인해 주세요.');
  }
  const hours = Number(body.estimatedHours);
  const ts = nowIso();
  const q: DemoDb['quotes'][number] = {
    id: nextId(db.quotes),
    serviceRequestId: id,
    workerId: u.id,
    price: Math.round(price),
    message,
    estimatedHours: Number.isFinite(hours) && hours > 0 ? hours : null,
    status: 'pending',
    createdAt: ts,
    updatedAt: ts,
  };
  db.quotes.push(q);
  return { status: 201, data: withQuoteRelations(db, q) };
});

function findOwnedPendingQuote(db: DemoDb, quoteId: number, userId: number, action: string): DemoDb['quotes'][number] {
  const q = db.quotes.find((x) => x.id === quoteId);
  if (!q) throw new HttpError(404, '견적을 찾을 수 없습니다.');
  const r = findRequest(db, q.serviceRequestId);
  if (r.customerId !== userId) throw new HttpError(403, `${action} 권한이 없습니다.`);
  if (q.status !== 'pending') throw new HttpError(400, '이미 처리된 견적입니다.');
  return q;
}

route('patch', '/api/v1/quotes/:id/accept', (db, _b, config, [id]) => {
  const u = requireUser(db, config);
  const q = findOwnedPendingQuote(db, id, u.id, '수락');
  const r = findRequest(db, q.serviceRequestId);
  const ts = nowIso();
  q.status = 'accepted';
  q.updatedAt = ts;
  r.status = 'booked';
  r.updatedAt = ts;
  const b: DemoDb['bookings'][number] = {
    id: nextId(db.bookings),
    quoteId: q.id,
    serviceRequestId: r.id,
    customerId: r.customerId,
    workerId: q.workerId,
    scheduledAt: r.preferredDate ?? ts,
    status: 'confirmed',
    createdAt: ts,
    updatedAt: ts,
  };
  db.bookings.push(b);
  return { data: withBookingRelations(db, b) };
});

route('patch', '/api/v1/quotes/:id/reject', (db, _b, config, [id]) => {
  const u = requireUser(db, config);
  const q = findOwnedPendingQuote(db, id, u.id, '거절');
  q.status = 'rejected';
  q.updatedAt = nowIso();
  return { data: withQuoteRelations(db, q) };
});

// ---------- 예약 ----------
route('get', '/api/v1/bookings/my', (db, _b, config) => {
  const u = requireUser(db, config);
  return {
    data: db.bookings
      .filter((b) => b.customerId === u.id || b.workerId === u.id)
      .sort(byCreatedDesc)
      .map((b) => withBookingRelations(db, b)),
  };
});

function findBooking(db: DemoDb, id: number): DemoDb['bookings'][number] {
  const b = db.bookings.find((x) => x.id === id);
  if (!b) throw new HttpError(404, '예약을 찾을 수 없습니다.');
  return b;
}

route('get', '/api/v1/bookings/:id', (db, _b, config, [id]) => {
  const u = requireUser(db, config);
  const b = findBooking(db, id);
  if (b.customerId !== u.id && b.workerId !== u.id) throw new HttpError(403, '예약 조회 권한이 없습니다.');
  return { data: withBookingRelations(db, b) };
});

route('patch', '/api/v1/bookings/:id/complete', (db, _b, config, [id]) => {
  const u = requireUser(db, config);
  const b = findBooking(db, id);
  if (b.workerId !== u.id) throw new HttpError(403, '완료 처리 권한이 없습니다.');
  const ts = nowIso();
  b.status = 'completed';
  b.updatedAt = ts;
  const r = db.serviceRequests.find((x) => x.id === b.serviceRequestId);
  if (r) {
    r.status = 'completed';
    r.updatedAt = ts;
  }
  return { data: withBookingRelations(db, b) };
});

// ---------- 리뷰 ----------
route('post', '/api/v1/bookings/:id/reviews', (db, body, config, [id]) => {
  const u = requireUser(db, config);
  const b = findBooking(db, id);
  if (b.status !== 'completed') throw new HttpError(400, '완료된 예약만 리뷰를 작성할 수 있습니다.');
  if (b.customerId !== u.id && b.workerId !== u.id) throw new HttpError(403, '리뷰 작성 권한이 없습니다.');
  if (db.reviews.some((r) => r.bookingId === id && r.reviewerId === u.id)) {
    throw new HttpError(400, '이미 리뷰를 작성했습니다.');
  }
  const rating = Number(body.rating);
  const targetId = Number(body.targetId);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !Number.isInteger(targetId)) {
    throw new HttpError(400, '입력값을 다시 확인해 주세요.');
  }
  const ts = nowIso();
  const review: DemoDb['reviews'][number] = {
    id: nextId(db.reviews),
    bookingId: id,
    reviewerId: u.id,
    targetId,
    rating,
    comment: str(body.comment) || null,
    createdAt: ts,
    updatedAt: ts,
  };
  db.reviews.push(review);
  return { status: 201, data: { ...review, reviewer: publicUser(u) } satisfies Review };
});

route('get', '/api/v1/users/:id/reviews', (db, _b, config, [id]) => {
  requireUser(db, config);
  return {
    data: db.reviews
      .filter((r) => r.targetId === id)
      .sort(byCreatedDesc)
      .map((r) => ({ ...r, reviewer: findUser(db, r.reviewerId) })),
  };
});

// ---------- 어댑터 ----------
function parseBody(data: unknown): Body {
  if (typeof data === 'string' && data) {
    try {
      return JSON.parse(data) as Body;
    } catch {
      return {};
    }
  }
  return data && typeof data === 'object' ? (data as Body) : {};
}

function toPath(url: string | undefined): string {
  const raw = url ?? '';
  try {
    return new URL(raw, 'http://demo.local').pathname.replace(/\/+$/, '') || '/';
  } catch {
    return raw;
  }
}

/**
 * 데모 모드 전용 axios 어댑터. 네트워크 요청 대신 localStorage 에 저장된 가짜 DB 를 읽고 쓴다.
 * 응답 형태는 실제 백엔드와 같은 `{ data, message, statusCode }` 봉투를 따른다.
 */
export async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const method = (config.method ?? 'get').toLowerCase();
  const path = toPath(config.url);
  const db = loadDb();

  let status = 200;
  let payload: unknown;
  try {
    const matched = routes.find((r) => r.method === method && r.pattern.test(path));
    if (!matched) throw new HttpError(404, `Cannot ${method.toUpperCase()} ${path}`);
    const params = (path.match(matched.pattern) ?? []).slice(1).map(Number);
    const result = matched.handler(db, parseBody(config.data), config, params);
    status = result.status ?? 200;
    payload = { data: result.data, message: 'success', statusCode: status };
    if (method !== 'get') saveDb(db);
  } catch (err) {
    status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    payload = { data: null, message, statusCode: status };
  }

  const response: AxiosResponse = {
    data: payload,
    status,
    statusText: String(status),
    headers: {},
    config,
    request: {},
  };
  if (status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      response,
    );
  }
  return response;
}
