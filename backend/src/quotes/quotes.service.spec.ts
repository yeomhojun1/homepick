import 'reflect-metadata';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { Quote, QuoteStatus } from './entities/quote.entity';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '../service-requests/entities/service-request.entity';
import { BookingStatus } from '../bookings/entities/booking.entity';

function createService() {
  const quoteRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data: Partial<Quote>) => ({ ...data })),
    save: jest.fn((entity: Quote) => Promise.resolve(entity)),
  };
  const serviceRequestRepository = { findOne: jest.fn() };
  const bookingRepository = { findOne: jest.fn() };
  const manager = {
    findOne: jest.fn(),
    save: jest.fn((_entity: unknown, value: unknown) => Promise.resolve(value)),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  };

  const service = new QuotesService(
    quoteRepository as never,
    serviceRequestRepository as never,
    bookingRepository as never,
    dataSource as never,
  );
  return {
    service,
    quoteRepository,
    serviceRequestRepository,
    bookingRepository,
    manager,
  };
}

function pendingQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 1,
    serviceRequestId: 10,
    workerId: 5,
    price: 100000,
    message: '가능합니다',
    estimatedHours: null,
    status: QuoteStatus.PENDING,
    serviceRequest: {
      id: 10,
      customerId: 2,
      status: ServiceRequestStatus.OPEN,
      preferredDate: new Date('2026-03-01T09:00:00.000Z'),
    } as ServiceRequest,
    ...overrides,
  } as Quote;
}

describe('QuotesService.create (B7: 예약/완료 의뢰 차단)', () => {
  it('booked 상태 의뢰에는 견적을 제출할 수 없다', async () => {
    const { service, serviceRequestRepository } = createService();
    serviceRequestRepository.findOne.mockResolvedValue({
      id: 10,
      status: ServiceRequestStatus.BOOKED,
    });

    await expect(
      service.create(10, 5, { price: 1000, message: 'ok' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('completed 상태 의뢰에는 견적을 제출할 수 없다', async () => {
    const { service, serviceRequestRepository } = createService();
    serviceRequestRepository.findOne.mockResolvedValue({
      id: 10,
      status: ServiceRequestStatus.COMPLETED,
    });

    await expect(
      service.create(10, 5, { price: 1000, message: 'ok' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('open 상태 의뢰에는 견적을 제출할 수 있다', async () => {
    const { service, serviceRequestRepository, quoteRepository } =
      createService();
    serviceRequestRepository.findOne.mockResolvedValue({
      id: 10,
      status: ServiceRequestStatus.OPEN,
    });
    quoteRepository.findOne.mockResolvedValue(null);

    const created = await service.create(10, 5, { price: 1000, message: 'ok' });
    expect(created).toMatchObject({
      serviceRequestId: 10,
      workerId: 5,
      price: 1000,
    });
  });
});

describe('QuotesService.accept (수락 트랜잭션)', () => {
  it('트랜잭션 안에서 견적/의뢰 상태를 바꾸고 예약을 만든다', async () => {
    const { service, manager } = createService();
    const quote = pendingQuote();
    manager.findOne.mockResolvedValue(quote);

    const booking = await service.accept(1, 2);

    expect(quote.status).toBe(QuoteStatus.ACCEPTED);
    expect(quote.serviceRequest.status).toBe(ServiceRequestStatus.BOOKED);
    expect(booking).toMatchObject({
      quoteId: 1,
      serviceRequestId: 10,
      customerId: 2,
      workerId: 5,
      status: BookingStatus.CONFIRMED,
    });
    expect(booking.scheduledAt).toEqual(new Date('2026-03-01T09:00:00.000Z'));
    // Quote / ServiceRequest / Booking 3건이 모두 같은 트랜잭션 매니저로 저장돼야 한다
    expect(manager.save).toHaveBeenCalledTimes(3);
  });

  it('의뢰 소유자가 아니면 403', async () => {
    const { service, manager } = createService();
    manager.findOne.mockResolvedValue(pendingQuote());

    await expect(service.accept(1, 999)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('이미 처리된 견적이면 400', async () => {
    const { service, manager } = createService();
    manager.findOne.mockResolvedValue(
      pendingQuote({ status: QuoteStatus.ACCEPTED }),
    );

    await expect(service.accept(1, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('QuotesService.reject (B6: 상태 검사)', () => {
  it('이미 수락된 견적은 거절할 수 없다', async () => {
    const { service, quoteRepository } = createService();
    quoteRepository.findOne.mockResolvedValue(
      pendingQuote({ status: QuoteStatus.ACCEPTED }),
    );

    await expect(service.reject(1, 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(quoteRepository.save).not.toHaveBeenCalled();
  });

  it('pending 견적은 정상적으로 거절된다', async () => {
    const { service, quoteRepository } = createService();
    quoteRepository.findOne.mockResolvedValue(pendingQuote());

    const rejected = await service.reject(1, 2);
    expect(rejected.status).toBe(QuoteStatus.REJECTED);
  });

  it('의뢰 소유자가 아니면 403', async () => {
    const { service, quoteRepository } = createService();
    quoteRepository.findOne.mockResolvedValue(pendingQuote());

    await expect(service.reject(1, 999)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
