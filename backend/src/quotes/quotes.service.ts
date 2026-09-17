import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { CreateQuoteDto } from './dtos/create-quote.dto';
import { ServiceRequest, ServiceRequestStatus } from '../service-requests/entities/service-request.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    requestId: number,
    workerId: number,
    dto: CreateQuoteDto,
  ): Promise<Quote> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: requestId },
    });
    if (!serviceRequest) {
      throw new NotFoundException('의뢰를 찾을 수 없습니다.');
    }
    if (serviceRequest.status === ServiceRequestStatus.CANCELLED) {
      throw new BadRequestException('취소된 의뢰에는 견적을 제출할 수 없습니다.');
    }
    if (
      serviceRequest.status === ServiceRequestStatus.BOOKED ||
      serviceRequest.status === ServiceRequestStatus.COMPLETED
    ) {
      throw new BadRequestException(
        '이미 예약이 확정된 의뢰에는 견적을 제출할 수 없습니다.',
      );
    }

    const existing = await this.quoteRepository.findOne({
      where: { serviceRequestId: requestId, workerId },
    });
    if (existing) {
      throw new BadRequestException('이미 견적을 제출했습니다.');
    }

    const quote = this.quoteRepository.create({
      serviceRequestId: requestId,
      workerId,
      price: dto.price,
      message: dto.message,
      estimatedHours: dto.estimatedHours ?? null,
    });
    return this.quoteRepository.save(quote);
  }

  async findByRequest(requestId: number): Promise<Quote[]> {
    return this.quoteRepository.find({
      where: { serviceRequestId: requestId },
      relations: { worker: true },
      order: { createdAt: 'ASC' },
    });
  }

  async accept(quoteId: number, userId: number): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const quote = await manager.findOne(Quote, {
        where: { id: quoteId },
        relations: { serviceRequest: true },
      });
      if (!quote) {
        throw new NotFoundException('견적을 찾을 수 없습니다.');
      }
      if (quote.serviceRequest.customerId !== userId) {
        throw new ForbiddenException('수락 권한이 없습니다.');
      }
      if (quote.status !== QuoteStatus.PENDING) {
        throw new BadRequestException('이미 처리된 견적입니다.');
      }

      quote.status = QuoteStatus.ACCEPTED;
      await manager.save(Quote, quote);

      quote.serviceRequest.status = ServiceRequestStatus.BOOKED;
      await manager.save(ServiceRequest, quote.serviceRequest);

      const booking = manager.create(Booking, {
        quoteId: quote.id,
        serviceRequestId: quote.serviceRequestId,
        customerId: quote.serviceRequest.customerId,
        workerId: quote.workerId,
        scheduledAt: quote.serviceRequest.preferredDate ?? new Date(),
        status: BookingStatus.CONFIRMED,
      });
      return manager.save(Booking, booking);
    });
  }

  async reject(quoteId: number, userId: number): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: { serviceRequest: true },
    });
    if (!quote) {
      throw new NotFoundException('견적을 찾을 수 없습니다.');
    }
    if (quote.serviceRequest.customerId !== userId) {
      throw new ForbiddenException('거절 권한이 없습니다.');
    }
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('이미 처리된 견적입니다.');
    }
    quote.status = QuoteStatus.REJECTED;
    return this.quoteRepository.save(quote);
  }
}
