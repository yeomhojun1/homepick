import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { ServiceRequestStatus } from '../service-requests/entities/service-request.entity';

function createService() {
  const bookingRepository = {
    findOne: jest.fn(),
    save: jest.fn((entity: Booking) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn(),
  };
  const serviceRequestRepository = {
    findOne: jest.fn(),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
  };
  const workerProfileRepository = {
    findOne: jest.fn(),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
  };
  const service = new BookingsService(
    bookingRepository as never,
    serviceRequestRepository as never,
    workerProfileRepository as never,
  );
  return {
    service,
    bookingRepository,
    serviceRequestRepository,
    workerProfileRepository,
  };
}

function confirmedBooking(): Booking {
  return {
    id: 7,
    quoteId: 1,
    serviceRequestId: 10,
    customerId: 2,
    workerId: 5,
    status: BookingStatus.CONFIRMED,
  } as Booking;
}

describe('BookingsService.findOne (B8: 소유자 검사)', () => {
  it('예약과 무관한 사용자는 403', async () => {
    const { service, bookingRepository } = createService();
    bookingRepository.findOne.mockResolvedValue(confirmedBooking());

    await expect(service.findOne(7, 999)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('고객 본인은 조회할 수 있다', async () => {
    const { service, bookingRepository } = createService();
    bookingRepository.findOne.mockResolvedValue(confirmedBooking());

    await expect(service.findOne(7, 2)).resolves.toMatchObject({ id: 7 });
  });

  it('담당 기사는 조회할 수 있다', async () => {
    const { service, bookingRepository } = createService();
    bookingRepository.findOne.mockResolvedValue(confirmedBooking());

    await expect(service.findOne(7, 5)).resolves.toMatchObject({ id: 7 });
  });

  it('없는 예약은 404', async () => {
    const { service, bookingRepository } = createService();
    bookingRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(7, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('BookingsService.complete (B9: completedCount 증가)', () => {
  it('기사가 완료하면 의뢰가 completed 가 되고 completedCount 가 1 늘어난다', async () => {
    const {
      service,
      bookingRepository,
      serviceRequestRepository,
      workerProfileRepository,
    } = createService();
    bookingRepository.findOne.mockResolvedValue(confirmedBooking());
    const serviceRequest = { id: 10, status: ServiceRequestStatus.BOOKED };
    serviceRequestRepository.findOne.mockResolvedValue(serviceRequest);
    const profile = { id: 3, userId: 5, completedCount: 2 };
    workerProfileRepository.findOne.mockResolvedValue(profile);

    const saved = await service.complete(7, 5);

    expect(saved.status).toBe(BookingStatus.COMPLETED);
    expect(serviceRequest.status).toBe(ServiceRequestStatus.COMPLETED);
    expect(profile.completedCount).toBe(3);
    expect(workerProfileRepository.save).toHaveBeenCalledWith(profile);
  });

  it('담당 기사가 아니면 403 이고 completedCount 는 그대로다', async () => {
    const { service, bookingRepository, workerProfileRepository } =
      createService();
    bookingRepository.findOne.mockResolvedValue(confirmedBooking());

    await expect(service.complete(7, 2)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(workerProfileRepository.save).not.toHaveBeenCalled();
  });
});
