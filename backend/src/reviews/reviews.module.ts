import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { WorkerProfile } from '../auth/entities/worker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, WorkerProfile])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
