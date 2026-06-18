import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/current-user.decorator';

@ApiTags('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('api/v1/bookings/:bookingId/reviews')
  async create(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<unknown> {
    return this.reviewsService.create(bookingId, user.sub, dto);
  }

  @Get('api/v1/users/:userId/reviews')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<unknown> {
    return this.reviewsService.findByUser(userId);
  }
}
