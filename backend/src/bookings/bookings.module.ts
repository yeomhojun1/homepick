import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { WorkerProfile } from '../auth/entities/worker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, ServiceRequest, WorkerProfile])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [TypeOrmModule],
})
export class BookingsModule {}
