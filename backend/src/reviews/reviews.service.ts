import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { WorkerProfile } from '../auth/entities/worker-profile.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(WorkerProfile)
    private readonly workerProfileRepository: Repository<WorkerProfile>,
  ) {}

  async create(
    bookingId: number,
    reviewerId: number,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('완료된 예약만 리뷰를 작성할 수 있습니다.');
    }
    if (booking.customerId !== reviewerId && booking.workerId !== reviewerId) {
      throw new ForbiddenException('리뷰 작성 권한이 없습니다.');
    }

    const existing = await this.reviewRepository.findOne({
      where: { bookingId, reviewerId },
    });
    if (existing) {
      throw new BadRequestException('이미 리뷰를 작성했습니다.');
    }

    const review = this.reviewRepository.create({
      bookingId,
      reviewerId,
      targetId: dto.targetId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    const saved = await this.reviewRepository.save(review);

    await this.updateWorkerRating(dto.targetId);

    return saved;
  }

  async findByUser(userId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { targetId: userId },
      relations: { reviewer: true },
      order: { createdAt: 'DESC' },
    });
  }

  private async updateWorkerRating(workerId: number): Promise<void> {
    const profile = await this.workerProfileRepository.findOne({ where: { userId: workerId } });
    if (!profile) return;

    const reviews = await this.reviewRepository.find({ where: { targetId: workerId } });
    const count = reviews.length;
    const avg = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    profile.rating = parseFloat(avg.toFixed(2));
    profile.reviewCount = count;
    await this.workerProfileRepository.save(profile);
  }
}
