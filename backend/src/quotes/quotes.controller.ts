import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dtos/create-quote.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/current-user.decorator';

@ApiTags('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('api/v1/service-requests/:requestId/quotes')
  async create(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQuoteDto,
  ): Promise<unknown> {
    return this.quotesService.create(requestId, user.sub, dto);
  }

  @Get('api/v1/service-requests/:requestId/quotes')
  async findByRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
  ): Promise<unknown> {
    return this.quotesService.findByRequest(requestId);
  }

  @Patch('api/v1/quotes/:id/accept')
  async accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.quotesService.accept(id, user.sub);
  }

  @Patch('api/v1/quotes/:id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.quotesService.reject(id, user.sub);
  }
}
