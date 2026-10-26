import type { Booking, Category, Quote, Review, ServiceRequest, User } from '@/types';

export interface DemoUser extends User {
  password: string;
}

export interface DemoDb {
  users: DemoUser[];
  categories: Category[];
  serviceRequests: Omit<ServiceRequest, 'customer' | 'category'>[];
  quotes: Omit<Quote, 'worker'>[];
  bookings: Omit<Booking, 'serviceRequest' | 'worker' | 'customer' | 'quote'>[];
  reviews: Omit<Review, 'reviewer'>[];
}

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_CUSTOMER_EMAIL = 'customer@demo.homepick';
export const DEMO_WORKER_EMAIL = 'worker@demo.homepick';

const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number, hour = 10): string {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function user(
  id: number,
  email: string,
  name: string,
  phone: string,
  role: User['role'],
): DemoUser {
  const createdAt = daysFromNow(-60);
  return {
    id,
    email,
    name,
    phone,
    role,
    fcmToken: null,
    password: DEMO_PASSWORD,
    createdAt,
    updatedAt: createdAt,
  };
}

const CATEGORY_NAMES = [
  '수도/배관',
  '전기/조명',
  '도배/벽지',
  '에어컨',
  '보일러/난방',
  '욕실/타일',
  '문/창호/방충망',
  '가구/조립',
];

export function createSeedDb(): DemoDb {
  const users: DemoUser[] = [
    user(1, DEMO_CUSTOMER_EMAIL, '김민지', '010-1234-5678', 'customer'),
    user(2, 'jh.lee@demo.homepick', '이정훈', '010-2345-6789', 'customer'),
    user(3, DEMO_WORKER_EMAIL, '박성수', '010-3456-7890', 'worker'),
    user(4, 'yh.choi@demo.homepick', '최영호', '010-4567-8901', 'worker'),
    user(5, 'jw.han@demo.homepick', '한지원', '010-5678-9012', 'worker'),
  ];

  const categories: Category[] = CATEGORY_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    iconUrl: null,
    sortOrder: i + 1,
    isActive: true,
  }));

  const req = (
    id: number,
    customerId: number,
    categoryId: number,
    title: string,
    description: string,
    address: string,
    status: ServiceRequest['status'],
    createdDaysAgo: number,
    preferredInDays: number | null,
  ): DemoDb['serviceRequests'][number] => ({
    id,
    customerId,
    categoryId,
    title,
    description,
    address,
    imageUrls: [],
    preferredDate: preferredInDays === null ? null : daysFromNow(preferredInDays, 14),
    status,
    createdAt: daysFromNow(-createdDaysAgo, 9),
    updatedAt: daysFromNow(-createdDaysAgo, 9),
  });

  const serviceRequests: DemoDb['serviceRequests'] = [
    req(1, 1, 1, '주방 싱크대 수전에서 물이 새요',
      '수전 손잡이 아래쪽에서 물이 조금씩 샙니다. 수전 교체가 필요한지 봐 주세요.',
      '서울 마포구 성산동', 'open', 1, 3),
    req(2, 1, 2, '거실 형광등을 LED 등으로 바꾸고 싶어요',
      '거실 천장 형광등 2개를 LED 평판등으로 교체하려고 합니다. 등은 따로 사 둘 수 있어요.',
      '서울 마포구 성산동', 'open', 0, 5),
    req(3, 2, 6, '욕실 실리콘 곰팡이 재시공',
      '욕조와 세면대 주변 실리콘이 까맣게 변했습니다. 제거하고 새로 쏴 주세요.',
      '경기 고양시 일산동구 장항동', 'open', 2, 4),
    req(4, 2, 7, '방문 손잡이가 헛돌아요',
      '안방 문 손잡이가 헛돌아서 문이 잘 안 열립니다. 손잡이 교체 부탁드립니다.',
      '경기 고양시 일산동구 장항동', 'open', 1, null),
    req(5, 1, 4, '벽걸이 에어컨 청소 및 점검',
      '여름 전에 벽걸이 에어컨 분해 청소를 하고 싶습니다. 냄새가 조금 납니다.',
      '서울 마포구 성산동', 'booked', 6, 2),
    req(6, 1, 7, '베란다 방충망 교체',
      '베란다 방충망이 찢어져서 벌레가 들어옵니다. 망만 교체하면 될 것 같아요.',
      '서울 마포구 성산동', 'completed', 20, -10),
    req(7, 2, 5, '보일러 온수가 미지근해요',
      '샤워할 때 온수가 충분히 뜨겁지 않습니다. 점검 부탁드립니다.',
      '경기 고양시 일산동구 장항동', 'completed', 30, -20),
  ];

  const quote = (
    id: number,
    serviceRequestId: number,
    workerId: number,
    price: number,
    message: string,
    estimatedHours: number | null,
    status: Quote['status'],
    createdDaysAgo: number,
  ): DemoDb['quotes'][number] => ({
    id,
    serviceRequestId,
    workerId,
    price,
    message,
    estimatedHours,
    status,
    createdAt: daysFromNow(-createdDaysAgo, 11),
    updatedAt: daysFromNow(-createdDaysAgo, 11),
  });

  const quotes: DemoDb['quotes'] = [
    quote(1, 1, 4, 45000, '카트리지 교체로 해결될 가능성이 큽니다. 부품비 포함 금액입니다.', 1, 'pending', 0),
    quote(2, 1, 5, 80000, '수전 전체 교체 기준 견적입니다. 원하시는 모델이 있으면 맞춰 드려요.', 1.5, 'pending', 0),
    quote(3, 3, 4, 120000, '기존 실리콘 제거 후 곰팡이 방지 실리콘으로 재시공합니다.', 3, 'pending', 1),
    quote(4, 5, 3, 70000, '분해 세척과 배수 호스 점검까지 해 드립니다.', 2, 'accepted', 5),
    quote(5, 6, 4, 60000, '알루미늄 방충망 망 교체 기준입니다.', 1, 'accepted', 19),
    quote(6, 7, 3, 50000, '온수 온도 센서와 분배기 점검 후 필요 시 부품 교체합니다.', 1.5, 'accepted', 29),
  ];

  const booking = (
    id: number,
    quoteId: number,
    serviceRequestId: number,
    customerId: number,
    workerId: number,
    scheduledInDays: number,
    status: Booking['status'],
  ): DemoDb['bookings'][number] => ({
    id,
    quoteId,
    serviceRequestId,
    customerId,
    workerId,
    scheduledAt: daysFromNow(scheduledInDays, 14),
    status,
    createdAt: daysFromNow(Math.min(scheduledInDays, 0) - 1, 12),
    updatedAt: daysFromNow(Math.min(scheduledInDays, 0) - 1, 12),
  });

  const bookings: DemoDb['bookings'] = [
    booking(1, 4, 5, 1, 3, 2, 'confirmed'),
    booking(2, 5, 6, 1, 4, -10, 'completed'),
    booking(3, 6, 7, 2, 3, -20, 'completed'),
  ];

  const reviews: DemoDb['reviews'] = [
    {
      id: 1,
      bookingId: 3,
      reviewerId: 2,
      targetId: 3,
      rating: 5,
      comment: '약속 시간에 맞춰 오셨고 원인을 차근차근 설명해 주셨어요.',
      createdAt: daysFromNow(-19, 18),
      updatedAt: daysFromNow(-19, 18),
    },
  ];

  return { users, categories, serviceRequests, quotes, bookings, reviews };
}
