import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from './entities/quote.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, ServiceRequest, Booking])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [TypeOrmModule],
})
export class QuotesModule {}
