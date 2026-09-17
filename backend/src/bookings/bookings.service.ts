import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { ServiceRequest, ServiceRequestStatus } from '../service-requests/entities/service-request.entity';
import { WorkerProfile } from '../auth/entities/worker-profile.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(WorkerProfile)
    private readonly workerProfileRepository: Repository<WorkerProfile>,
  ) {}

  async findMy(userId: number): Promise<Booking[]> {
    return this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.serviceRequest', 'serviceRequest')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.customer', 'customer')
      .where('booking.customerId = :userId OR booking.workerId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number, requesterId?: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { serviceRequest: true, worker: true, customer: true, quote: true },
    });
    if (!booking) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    if (
      requesterId !== undefined &&
      booking.customerId !== requesterId &&
      booking.workerId !== requesterId
    ) {
      throw new ForbiddenException('예약 조회 권한이 없습니다.');
    }
    return booking;
  }

  async complete(id: number, workerId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    if (booking.workerId !== workerId) {
      throw new ForbiddenException('완료 처리 권한이 없습니다.');
    }
    booking.status = BookingStatus.COMPLETED;
    const saved = await this.bookingRepository.save(booking);

    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: booking.serviceRequestId },
    });
    if (serviceRequest) {
      serviceRequest.status = ServiceRequestStatus.COMPLETED;
      await this.serviceRequestRepository.save(serviceRequest);
    }

    const workerProfile = await this.workerProfileRepository.findOne({
      where: { userId: booking.workerId },
    });
    if (workerProfile) {
      workerProfile.completedCount += 1;
      await this.workerProfileRepository.save(workerProfile);
    }

    return saved;
  }
}
