import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/current-user.decorator';

@ApiTags('bookings')
@Controller('api/v1/bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('my')
  async findMy(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.bookingsService.findMy(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/complete')
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.bookingsService.complete(id, user.sub);
  }
}
